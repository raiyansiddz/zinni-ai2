from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List
import uuid

from app.core.database import get_db, User, Session, AiMessage, UsageTracking, SessionType
from app.auth.dependencies import get_current_user
from app.services.ai_service import ai_service
from app.models.responses import AskResponse, AiMessageResponse, ApiResponse
from app.models.requests import AskRequest
from app.services.usage_service import usage_service

router = APIRouter()

@router.post("/", response_model=AskResponse)
async def ask_ai(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ask AI with context from screen, audio, and user profile"""
    try:
        # Check user's usage limits
        can_ask, limit_info = await usage_service.can_user_ask(current_user.id, db)
        
        if not can_ask:
            raise HTTPException(
                status_code=429,
                detail=f"Monthly ask limit exceeded. Used: {limit_info['used']}, Limit: {limit_info['limit']}"
            )
        
        # Get or create session
        session_id = request.session_id
        if session_id:
            # Validate session belongs to user
            session_result = await db.execute(
                select(Session).where(
                    and_(Session.id == session_id, Session.user_id == current_user.id)
                )
            )
            session = session_result.scalar_one_or_none()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            session = Session(
                user_id=current_user.id,
                session_type=SessionType.ASK,
                title=request.prompt[:50] + "..." if len(request.prompt) > 50 else request.prompt
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
            session_id = str(session.id)
        
        # Prepare user profile for context
        user_profile = {
            "display_name": current_user.display_name,
            "email": current_user.email,
            "plan": current_user.current_plan.value
        }
        
        # Get AI response
        ai_response = await ai_service.ask_ai(
            prompt=request.prompt,
            screen_context=request.screen_context,
            audio_transcript=request.audio_transcript,
            user_profile=user_profile,
            provider=request.provider,
            model=request.model
        )
        
        # Save AI message to database
        ai_message = AiMessage(
            session_id=session.id,
            user_id=current_user.id,
            prompt=request.prompt,
            response=ai_response["response"],
            screen_context=request.screen_context,
            audio_transcript=request.audio_transcript,
            ai_provider=ai_response["provider"],
            model_used=ai_response["model"],
            tokens_used=ai_response["tokens_used"]
        )
        db.add(ai_message)
        
        # Track usage
        await usage_service.track_usage(
            user_id=current_user.id,
            action_type="ask",
            resource_used="tokens",
            quantity=ai_response["tokens_used"],
            db=db
        )
        
        await db.commit()
        await db.refresh(ai_message)
        
        return AskResponse(
            response=ai_response["response"],
            provider=ai_response["provider"],
            model=ai_response["model"],
            tokens_used=ai_response["tokens_used"],
            session_id=session_id,
            message_id=str(ai_message.id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing AI request: {str(e)}")

@router.get("/messages", response_model=List[AiMessageResponse])
async def get_ai_messages(
    session_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI messages for a session"""
    try:
        # Validate session belongs to user
        session_result = await db.execute(
            select(Session).where(
                and_(Session.id == session_id, Session.user_id == current_user.id)
            )
        )
        session = session_result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get AI messages
        messages_result = await db.execute(
            select(AiMessage)
            .where(AiMessage.session_id == session_id)
            .order_by(AiMessage.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        messages = messages_result.scalars().all()
        
        return [AiMessageResponse.model_validate(msg) for msg in messages]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")

@router.get("/providers", response_model=ApiResponse)
async def get_available_providers():
    """Get list of available AI providers"""
    try:
        providers = ai_service.get_available_providers()
        return ApiResponse(
            success=True,
            message="Available AI providers",
            data={"providers": providers}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching providers: {str(e)}")