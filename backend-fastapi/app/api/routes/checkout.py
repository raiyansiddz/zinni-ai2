from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.core.database import get_db, User, Plan, PlanType
from app.auth.dependencies import get_current_user
from app.services.stripe_service import stripe_service
from app.models.responses import CheckoutResponse, ApiResponse
from app.models.requests import CheckoutRequest

router = APIRouter()

@router.post("/create-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe checkout session for plan upgrade"""
    try:
        # Validate plan type
        try:
            plan_type_enum = PlanType(request.plan_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        # Get plan details
        plan_result = await db.execute(
            select(Plan).where(Plan.plan_type == plan_type_enum)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Create or get Stripe customer
        if not current_user.stripe_customer_id:
            customer_id = await stripe_service.create_customer(
                email=current_user.email,
                name=current_user.display_name
            )
            
            # Update user with customer ID
            current_user.stripe_customer_id = customer_id
            await db.commit()
        else:
            customer_id = current_user.stripe_customer_id
        
        # Create checkout session
        session_data = await stripe_service.create_checkout_session(
            customer_email=current_user.email,
            plan_type=request.plan_type,
            billing_period=request.billing_period,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_id=customer_id
        )
        
        return CheckoutResponse(
            checkout_url=session_data["checkout_url"],
            session_id=session_data["session_id"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {str(e)}")

@router.post("/webhook", response_model=ApiResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Construct event
        event = stripe_service.construct_webhook_event(payload, sig_header)
        
        # Handle event types
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await handle_successful_payment(session, db)
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            await handle_subscription_cancelled(subscription, db)
            
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            await handle_payment_failed(invoice, db)
        
        return ApiResponse(
            success=True,
            message="Webhook processed successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")

async def handle_successful_payment(session: dict, db: AsyncSession):
    """Handle successful payment from Stripe"""
    try:
        customer_id = session.get('customer')
        metadata = session.get('metadata', {})
        plan_type = metadata.get('plan_type')
        
        if not customer_id or not plan_type:
            return
        
        # Find user by Stripe customer ID
        user_result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = user_result.scalar_one_or_none()
        
        if user:
            # Update user's plan
            try:
                plan_type_enum = PlanType(plan_type)
                user.current_plan = plan_type_enum
                await db.commit()
            except ValueError:
                pass  # Invalid plan type, skip
                
    except Exception as e:
        await db.rollback()
        print(f"Error handling successful payment: {str(e)}")

async def handle_subscription_cancelled(subscription: dict, db: AsyncSession):
    """Handle subscription cancellation"""
    try:
        customer_id = subscription.get('customer')
        
        if not customer_id:
            return
        
        # Find user by Stripe customer ID
        user_result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = user_result.scalar_one_or_none()
        
        if user:
            # Downgrade to free plan
            user.current_plan = PlanType.FREE
            await db.commit()
            
    except Exception as e:
        await db.rollback()
        print(f"Error handling subscription cancellation: {str(e)}")

async def handle_payment_failed(invoice: dict, db: AsyncSession):
    """Handle failed payment"""
    try:
        customer_id = invoice.get('customer')
        
        if not customer_id:
            return
        
        # Find user by Stripe customer ID
        user_result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = user_result.scalar_one_or_none()
        
        if user:
            # You might want to send an email or take other action
            # For now, just log it
            print(f"Payment failed for user: {user.email}")
            
    except Exception as e:
        print(f"Error handling payment failure: {str(e)}")