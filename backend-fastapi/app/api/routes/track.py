from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from typing import List, Dict, Any

from app.core.database import get_db, User, Session, UsageTracking
from app.auth.dependencies import get_current_user
from app.services.usage_service import usage_service
from app.models.responses import ApiResponse, SessionResponse
from app.models.requests import TrackingRequest, SessionCreateRequest

router = APIRouter()

@router.post("/", response_model=ApiResponse)
async def track_usage(
    request: TrackingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track user usage/activity"""
    try:
        await usage_service.track_usage(
            user_id=current_user.id,
            action_type=request.action_type,
            resource_used=request.resource_used,
            quantity=request.quantity,
            db=db
        )
        
        await db.commit()
        
        return ApiResponse(
            success=True,
            message="Usage tracked successfully"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error tracking usage: {str(e)}")

@router.post("/session", response_model=SessionResponse)
async def create_session(
    request: SessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new session"""
    try:
        session = Session(
            user_id=current_user.id,
            session_type=request.session_type,
            title=request.title
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Track session creation
        await usage_service.track_usage(
            user_id=current_user.id,
            action_type="session_start",
            resource_used="session",
            quantity=1,
            db=db
        )
        
        await db.commit()
        
        return SessionResponse.model_validate(session)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@router.get("/sessions", response_model=List[SessionResponse])
async def get_user_sessions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's sessions"""
    try:
        sessions_result = await db.execute(
            select(Session)
            .where(Session.user_id == current_user.id)
            .order_by(Session.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        sessions = sessions_result.scalars().all()
        
        return [SessionResponse.model_validate(session) for session in sessions]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}")

@router.put("/session/{session_id}/end", response_model=ApiResponse)
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """End a session"""
    try:
        session_result = await db.execute(
            select(Session).where(
                and_(Session.id == session_id, Session.user_id == current_user.id)
            )
        )
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session.is_active = False
        session.ended_at = datetime.utcnow()
        
        await db.commit()
        
        return ApiResponse(
            success=True,
            message="Session ended successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")