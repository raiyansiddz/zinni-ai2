import stripe
from typing import Dict, Any, Optional
from fastapi import HTTPException
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class StripeService:
    """Service for handling Stripe payments"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_TEST_SECRET_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    async def create_checkout_session(
        self,
        customer_email: str,
        plan_type: str,
        billing_period: str,
        success_url: str,
        cancel_url: str,
        customer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session"""
        
        try:
            # Map plan types to Stripe price IDs (you'll need to create these in Stripe)
            price_ids = {
                "basic": {
                    "monthly": "price_basic_monthly",  # Replace with actual Stripe price ID
                    "yearly": "price_basic_yearly"
                },
                "pro": {
                    "monthly": "price_pro_monthly",    # Replace with actual Stripe price ID
                    "yearly": "price_pro_yearly"
                },
                "enterprise": {
                    "monthly": "price_enterprise_monthly",  # Replace with actual Stripe price ID
                    "yearly": "price_enterprise_yearly"
                }
            }
            
            if plan_type not in price_ids:
                raise HTTPException(status_code=400, detail="Invalid plan type")
            
            if billing_period not in price_ids[plan_type]:
                raise HTTPException(status_code=400, detail="Invalid billing period")
            
            price_id = price_ids[plan_type][billing_period]
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                customer=customer_id,
                metadata={
                    'plan_type': plan_type,
                    'billing_period': billing_period
                }
            )
            
            return {
                'checkout_url': session.url,
                'session_id': session.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error creating checkout session: {str(e)}")
    
    async def create_customer(self, email: str, name: str = None) -> str:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name
            )
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    
    async def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get customer information"""
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return customer
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving customer: {str(e)}")
            return None
    
    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription"""
        try:
            stripe.Subscription.delete(subscription_id)
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {str(e)}")
            return False
    
    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Construct webhook event for verification"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
            
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")

# Global instance
stripe_service = StripeService()