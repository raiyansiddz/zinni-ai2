from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

from app.core.database import get_db, User, Plan, Session, AiMessage, UsageTracking, ApiKey, UserRole, PlanType
from app.auth.dependencies import get_current_admin_user, get_current_superadmin_user
from app.models.responses import UserResponse, PlanResponse, ApiResponse
from app.models.requests import PlanCreateRequest, PlanUpdateRequest, UserRoleUpdateRequest, ApiKeyUpdateRequest
from app.services.encryption_service import encryption_service

router = APIRouter()

# User Management
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    limit: int = 100,
    offset: int = 0,
    search: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all users (admin only)"""
    try:
        query = select(User)
        
        if search:
            query = query.where(
                User.email.ilike(f"%{search}%") |
                User.display_name.ilike(f"%{search}%")
            )
        
        query = query.order_by(desc(User.created_at)).limit(limit).offset(offset)
        
        users_result = await db.execute(query)
        users = users_result.scalars().all()
        
        return [UserResponse.model_validate(user) for user in users]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.put("/users/role", response_model=ApiResponse)
async def update_user_role(
    request: UserRoleUpdateRequest,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user role (superadmin only)"""
    try:
        # Validate role
        try:
            role_enum = UserRole(request.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.id == request.user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update role
        user.role = role_enum
        await db.commit()
        
        return ApiResponse(
            success=True,
            message=f"User role updated to {request.role}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user role: {str(e)}")

@router.delete("/users/{user_id}", response_model=ApiResponse)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user (superadmin only)"""
    try:
        # Get user
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Soft delete
        user.is_active = False
        await db.commit()
        
        return ApiResponse(
            success=True,
            message="User deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

# Plan Management
@router.post("/plans", response_model=PlanResponse)
async def create_plan(
    request: PlanCreateRequest,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new plan (superadmin only)"""
    try:
        # Validate plan type
        try:
            plan_type_enum = PlanType(request.plan_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        # Check if plan type already exists
        existing_plan = await db.execute(
            select(Plan).where(Plan.plan_type == plan_type_enum)
        )
        if existing_plan.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Plan type already exists")
        
        # Create plan
        plan = Plan(
            name=request.name,
            plan_type=plan_type_enum,
            price_monthly=request.price_monthly,
            price_yearly=request.price_yearly,
            ask_limit_monthly=request.ask_limit_monthly,
            session_limit_monthly=request.session_limit_monthly,
            features=json.dumps(request.features) if request.features else None
        )
        
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        
        return PlanResponse.model_validate(plan)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating plan: {str(e)}")

@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    request: PlanUpdateRequest,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update plan (superadmin only)"""
    try:
        # Get plan
        plan_result = await db.execute(
            select(Plan).where(Plan.id == plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Update fields
        if request.name is not None:
            plan.name = request.name
        if request.price_monthly is not None:
            plan.price_monthly = request.price_monthly
        if request.price_yearly is not None:
            plan.price_yearly = request.price_yearly
        if request.ask_limit_monthly is not None:
            plan.ask_limit_monthly = request.ask_limit_monthly
        if request.session_limit_monthly is not None:
            plan.session_limit_monthly = request.session_limit_monthly
        if request.features is not None:
            plan.features = json.dumps(request.features)
        if request.is_active is not None:
            plan.is_active = request.is_active
        
        await db.commit()
        await db.refresh(plan)
        
        return PlanResponse.model_validate(plan)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating plan: {str(e)}")

# API Key Management
@router.post("/api-keys", response_model=ApiResponse)
async def update_api_key(
    request: ApiKeyUpdateRequest,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update API key for AI provider (superadmin only)"""
    try:
        # Encrypt API key
        encrypted_key = encryption_service.encrypt(request.api_key)
        
        # Check if key already exists for this provider
        existing_key = await db.execute(
            select(ApiKey).where(ApiKey.provider == request.provider)
        )
        key_record = existing_key.scalar_one_or_none()
        
        if key_record:
            # Update existing key
            key_record.encrypted_key = encrypted_key
            key_record.is_active = True
        else:
            # Create new key
            key_record = ApiKey(
                provider=request.provider,
                encrypted_key=encrypted_key,
                created_by=current_user.id,
                is_active=True
            )
            db.add(key_record)
        
        await db.commit()
        
        return ApiResponse(
            success=True,
            message=f"API key updated for {request.provider}"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating API key: {str(e)}")

@router.get("/api-keys", response_model=ApiResponse)
async def get_api_keys(
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get API key status for all providers (superadmin only)"""
    try:
        keys_result = await db.execute(
            select(ApiKey).where(ApiKey.is_active == True)
        )
        keys = keys_result.scalars().all()
        
        providers_status = {}
        for key in keys:
            providers_status[key.provider] = {
                "has_key": True,
                "created_at": key.created_at.isoformat(),
                "last_updated": key.updated_at.isoformat() if key.updated_at else None
            }
        
        # Add providers without keys
        all_providers = ["openai", "gemini", "claude"]
        for provider in all_providers:
            if provider not in providers_status:
                providers_status[provider] = {"has_key": False}
        
        return ApiResponse(
            success=True,
            message="API keys status",
            data=providers_status
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching API keys: {str(e)}")

# System Statistics
@router.get("/stats", response_model=ApiResponse)
async def get_system_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system statistics (admin only)"""
    try:
        # Get current month/year
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # Total users
        total_users = await db.execute(select(func.count(User.id)))
        total_users_count = total_users.scalar()
        
        # Active users (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        active_users = await db.execute(
            select(func.count(User.id.distinct()))
            .select_from(User)
            .join(Session)
            .where(Session.created_at >= thirty_days_ago)
        )
        active_users_count = active_users.scalar()
        
        # Total AI messages this month
        monthly_messages = await db.execute(
            select(func.count(AiMessage.id))
            .where(
                and_(
                    func.extract('month', AiMessage.created_at) == current_month,
                    func.extract('year', AiMessage.created_at) == current_year
                )
            )
        )
        monthly_messages_count = monthly_messages.scalar()
        
        # Plan distribution
        plan_distribution = await db.execute(
            select(User.current_plan, func.count(User.id))
            .group_by(User.current_plan)
        )
        plan_stats = {plan.value: count for plan, count in plan_distribution}
        
        return ApiResponse(
            success=True,
            message="System statistics",
            data={
                "total_users": total_users_count,
                "active_users": active_users_count,
                "monthly_messages": monthly_messages_count,
                "plan_distribution": plan_stats,
                "timestamp": now.isoformat()
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")