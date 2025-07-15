from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, User
from app.auth.dependencies import get_current_user, get_optional_current_user
from app.auth.neon_auth import neon_auth_service
from app.models.responses import UserResponse, ApiResponse
from app.models.requests import UserUpdateRequest

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user information"""
    return UserResponse.model_validate(current_user)

@router.post("/verify", response_model=ApiResponse)
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """Verify if the current token is valid"""
    return ApiResponse(
        success=True,
        message="Token is valid",
        data={"user_id": str(current_user.id)}
    )

@router.post("/refresh", response_model=ApiResponse)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Refresh authentication token"""
    try:
        # Use Neon Auth service to refresh token
        result = await neon_auth_service.refresh_token(refresh_token)
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        return ApiResponse(
            success=True,
            message="Token refreshed successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing token: {str(e)}")

@router.get("/status", response_model=ApiResponse)
async def auth_status(
    current_user: User = Depends(get_optional_current_user)
):
    """Check authentication status without requiring authentication"""
    if current_user:
        return ApiResponse(
            success=True,
            message="User is authenticated",
            data={
                "authenticated": True,
                "user_id": str(current_user.id),
                "email": current_user.email,
                "role": current_user.role.value
            }
        )
    else:
        return ApiResponse(
            success=True,
            message="User is not authenticated",
            data={"authenticated": False}
        )