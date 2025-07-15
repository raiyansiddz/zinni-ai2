import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.core.database import async_session_factory, Plan, PlanType, User, UserRole
from app.services.encryption_service import encryption_service

async def seed_database():
    """Seed the database with initial data"""
    async with async_session_factory() as session:
        await seed_plans(session)
        await seed_admin_user(session)
        await session.commit()

async def seed_plans(session: AsyncSession):
    """Seed initial plans"""
    
    # Check if plans already exist
    existing_plans = await session.execute(select(Plan))
    if existing_plans.scalars().first():
        print("Plans already exist, skipping seeding...")
        return
    
    plans_data = [
        {
            "name": "Free Plan",
            "plan_type": PlanType.FREE,
            "price_monthly": 0,
            "price_yearly": 0,
            "ask_limit_monthly": 10,
            "session_limit_monthly": 5,
            "features": ["Basic AI chat", "Limited screen capture", "5 sessions/month"]
        },
        {
            "name": "Basic Plan",
            "plan_type": PlanType.BASIC,
            "price_monthly": 999,  # $9.99 in cents
            "price_yearly": 9999,  # $99.99 in cents
            "ask_limit_monthly": 100,
            "session_limit_monthly": 50,
            "features": ["Unlimited AI chat", "Screen capture", "Audio transcription", "50 sessions/month"]
        },
        {
            "name": "Pro Plan",
            "plan_type": PlanType.PRO,
            "price_monthly": 1999,  # $19.99 in cents
            "price_yearly": 19999,  # $199.99 in cents
            "ask_limit_monthly": -1,  # Unlimited
            "session_limit_monthly": -1,  # Unlimited
            "features": ["Everything in Basic", "Unlimited sessions", "Priority support", "Advanced AI models"]
        },
        {
            "name": "Enterprise Plan",
            "plan_type": PlanType.ENTERPRISE,
            "price_monthly": 4999,  # $49.99 in cents
            "price_yearly": 49999,  # $499.99 in cents
            "ask_limit_monthly": -1,  # Unlimited
            "session_limit_monthly": -1,  # Unlimited
            "features": ["Everything in Pro", "Custom integrations", "Dedicated support", "Admin dashboard"]
        }
    ]
    
    for plan_data in plans_data:
        features_json = json.dumps(plan_data.pop("features"))
        
        plan = Plan(
            **plan_data,
            features=features_json,
            is_active=True
        )
        session.add(plan)
    
    print("✅ Plans seeded successfully")

async def seed_admin_user(session: AsyncSession):
    """Seed initial admin user (for development)"""
    
    # Check if admin user already exists
    existing_admin = await session.execute(
        select(User).where(User.role == UserRole.SUPERADMIN)
    )
    if existing_admin.scalars().first():
        print("Admin user already exists, skipping seeding...")
        return
    
    # Create admin user
    admin_user = User(
        neon_user_id="admin_dev_user",
        email="admin@glass.dev",
        display_name="Super Admin",
        role=UserRole.SUPERADMIN,
        current_plan=PlanType.ENTERPRISE,
        is_active=True
    )
    
    session.add(admin_user)
    print("✅ Admin user seeded successfully")
    print("📧 Admin email: admin@glass.dev")

if __name__ == "__main__":
    asyncio.run(seed_database())