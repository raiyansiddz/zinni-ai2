from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from typing import Dict, Any, Tuple
import uuid

from app.core.database import User, Plan, UsageTracking, PlanType

class UsageService:
    """Service for tracking and managing user usage"""
    
    async def can_user_ask(self, user_id: uuid.UUID, db: AsyncSession) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can make an ask request based on their plan limits"""
        
        # Get user's current plan
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one()
        
        # Get plan details
        plan_result = await db.execute(
            select(Plan).where(Plan.plan_type == user.current_plan)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            # If no plan found, default to free limits
            ask_limit = 10  # Free plan default
        else:
            ask_limit = plan.ask_limit_monthly
        
        # If unlimited (-1), allow
        if ask_limit == -1:
            return True, {"used": 0, "limit": -1}
        
        # Count usage for current month
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        usage_result = await db.execute(
            select(func.count(UsageTracking.id))
            .where(
                and_(
                    UsageTracking.user_id == user_id,
                    UsageTracking.action_type == "ask",
                    UsageTracking.month == current_month,
                    UsageTracking.year == current_year
                )
            )
        )
        usage_count = usage_result.scalar() or 0
        
        can_ask = usage_count < ask_limit
        
        return can_ask, {"used": usage_count, "limit": ask_limit}
    
    async def track_usage(
        self,
        user_id: uuid.UUID,
        action_type: str,
        resource_used: str = None,
        quantity: int = 1,
        db: AsyncSession = None
    ):
        """Track user usage"""
        
        current_date = datetime.now()
        
        usage_record = UsageTracking(
            user_id=user_id,
            action_type=action_type,
            resource_used=resource_used,
            quantity=quantity,
            month=current_date.month,
            year=current_date.year
        )
        
        db.add(usage_record)
        # Note: Don't commit here, let the caller handle it
    
    async def get_user_usage(self, user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """Get user's current usage statistics"""
        
        # Get user's current plan
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one()
        
        # Get plan details
        plan_result = await db.execute(
            select(Plan).where(Plan.plan_type == user.current_plan)
        )
        plan = plan_result.scalar_one_or_none()
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Count asks used this month
        asks_result = await db.execute(
            select(func.count(UsageTracking.id))
            .where(
                and_(
                    UsageTracking.user_id == user_id,
                    UsageTracking.action_type == "ask",
                    UsageTracking.month == current_month,
                    UsageTracking.year == current_year
                )
            )
        )
        asks_used = asks_result.scalar() or 0
        
        # Count sessions used this month
        sessions_result = await db.execute(
            select(func.count(UsageTracking.id))
            .where(
                and_(
                    UsageTracking.user_id == user_id,
                    UsageTracking.action_type == "session_start",
                    UsageTracking.month == current_month,
                    UsageTracking.year == current_year
                )
            )
        )
        sessions_used = sessions_result.scalar() or 0
        
        # Get limits from plan
        if plan:
            asks_limit = plan.ask_limit_monthly
            sessions_limit = plan.session_limit_monthly
        else:
            # Default free plan limits
            asks_limit = 10
            sessions_limit = 5
        
        return {
            "asks_used": asks_used,
            "asks_limit": asks_limit,
            "sessions_used": sessions_used,
            "sessions_limit": sessions_limit,
            "current_plan": user.current_plan.value
        }

# Global instance
usage_service = UsageService()