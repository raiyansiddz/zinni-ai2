from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db, User, Plan
from app.auth.dependencies import get_current_user
from app.services.usage_service import usage_service
from app.models.responses import PlanResponse, UsageResponse, ApiResponse

router = APIRouter()

@router.get("/", response_model=List[PlanResponse])
async def get_available_plans(
    db: AsyncSession = Depends(get_db)
):
    """Get all available plans"""
    try:
        plans_result = await db.execute(
            select(Plan).where(Plan.is_active == True).order_by(Plan.price_monthly)
        )
        plans = plans_result.scalars().all()
        
        return [PlanResponse.model_validate(plan) for plan in plans]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching plans: {str(e)}")

@router.get("/current", response_model=PlanResponse)
async def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's current plan"""
    try:
        plan_result = await db.execute(
            select(Plan).where(Plan.plan_type == current_user.current_plan)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(status_code=404, detail="Current plan not found")
        
        return PlanResponse.model_validate(plan)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current plan: {str(e)}")

@router.get("/usage", response_model=UsageResponse)
async def get_usage_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's current usage information"""
    try:
        usage_data = await usage_service.get_user_usage(current_user.id, db)
        
        return UsageResponse(
            asks_used=usage_data["asks_used"],
            asks_limit=usage_data["asks_limit"],
            sessions_used=usage_data["sessions_used"],
            sessions_limit=usage_data["sessions_limit"],
            current_plan=usage_data["current_plan"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching usage: {str(e)}")