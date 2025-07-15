from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
import logging

from app.core.database import get_db, User, UserRole
from app.auth.neon_auth import neon_auth_service
from app.core.exceptions import AuthenticationError, AuthorizationError

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from Neon Auth token"""
    
    if not credentials:
        raise AuthenticationError("No authorization credentials provided")
    
    token = credentials.credentials
    
    # Verify token with Neon Auth
    user_data = await neon_auth_service.verify_token(token)
    
    if not user_data:
        raise AuthenticationError("Invalid or expired token")
    
    # Get user from database
    neon_user_id = user_data.get("id")
    if not neon_user_id:
        raise AuthenticationError("Invalid user data from Neon Auth")
    
    # Find user in database
    result = await db.execute(
        select(User).where(User.neon_user_id == neon_user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user if doesn't exist
        user = User(
            neon_user_id=neon_user_id,
            email=user_data.get("email", ""),
            display_name=user_data.get("display_name", ""),
            photo_url=user_data.get("photo_url"),
            role=UserRole.USER
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Created new user: {user.email}")
    
    if not user.is_active:
        raise AuthenticationError("User account is disabled")
    
    return user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user and verify admin role"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise AuthorizationError("Admin access required")
    
    return current_user

async def get_current_superadmin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user and verify superadmin role"""
    
    if current_user.role != UserRole.SUPERADMIN:
        raise AuthorizationError("Superadmin access required")
    
    return current_user

async def get_optional_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user without requiring authentication"""
    
    try:
        # Try to get authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        
        # Verify token with Neon Auth
        user_data = await neon_auth_service.verify_token(token)
        
        if not user_data:
            return None
        
        # Get user from database
        neon_user_id = user_data.get("id")
        if not neon_user_id:
            return None
        
        result = await db.execute(
            select(User).where(User.neon_user_id == neon_user_id)
        )
        user = result.scalar_one_or_none()
        
        if user and user.is_active:
            return user
        
    except Exception as e:
        logger.error(f"Error in optional auth: {str(e)}")
    
    return None