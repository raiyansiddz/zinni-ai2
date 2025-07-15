from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, User
from app.auth.dependencies import get_current_user
from app.models.responses import UserResponse, ApiResponse
from app.models.requests import UserUpdateRequest

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get user profile information"""
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile information"""
    try:
        # Update fields if provided
        if user_update.display_name is not None:
            current_user.display_name = user_update.display_name
        
        if user_update.email is not None:
            # Check if email already exists
            existing_user = await db.execute(
                select(User).where(User.email == user_update.email, User.id != current_user.id)
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already in use")
            
            current_user.email = user_update.email
        
        await db.commit()
        await db.refresh(current_user)
        
        return UserResponse.model_validate(current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@router.delete("/profile", response_model=ApiResponse)
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account and all associated data"""
    try:
        # Soft delete - mark as inactive
        current_user.is_active = False
        await db.commit()
        
        # TODO: In production, you might want to:
        # 1. Cancel Stripe subscriptions
        # 2. Delete related data after a grace period
        # 3. Send confirmation email
        
        return ApiResponse(
            success=True,
            message="Account deleted successfully"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")