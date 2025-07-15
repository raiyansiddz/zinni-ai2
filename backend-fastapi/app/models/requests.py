from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class AskRequest(BaseModel):
    prompt: str = Field(..., description="User's question or prompt")
    screen_context: Optional[str] = Field(None, description="Base64 encoded screen capture")
    audio_transcript: Optional[str] = Field(None, description="Speech-to-text transcript")
    session_id: Optional[str] = Field(None, description="Session ID for conversation context")
    provider: str = Field(default="gemini", description="AI provider to use")
    model: Optional[str] = Field(None, description="Specific model to use")

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, description="User's display name")
    email: Optional[EmailStr] = Field(None, description="User's email address")

class SessionCreateRequest(BaseModel):
    title: Optional[str] = Field(None, description="Session title")
    session_type: str = Field(default="ask", description="Session type (ask, listen, meeting)")

class TrackingRequest(BaseModel):
    action_type: str = Field(..., description="Type of action being tracked")
    resource_used: Optional[str] = Field(None, description="Resource used (tokens, api_calls, etc.)")
    quantity: int = Field(default=1, description="Quantity of resource used")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class CheckoutRequest(BaseModel):
    plan_type: str = Field(..., description="Plan type to purchase")
    billing_period: str = Field(default="monthly", description="Billing period (monthly, yearly)")
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect after cancelled payment")

class PlanCreateRequest(BaseModel):
    name: str = Field(..., description="Plan name")
    plan_type: str = Field(..., description="Plan type identifier")
    price_monthly: int = Field(..., description="Monthly price in cents")
    price_yearly: int = Field(..., description="Yearly price in cents")
    ask_limit_monthly: int = Field(default=-1, description="Monthly ask limit (-1 for unlimited)")
    session_limit_monthly: int = Field(default=-1, description="Monthly session limit (-1 for unlimited)")
    features: Optional[List[str]] = Field(None, description="List of features")

class PlanUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Plan name")
    price_monthly: Optional[int] = Field(None, description="Monthly price in cents")
    price_yearly: Optional[int] = Field(None, description="Yearly price in cents")
    ask_limit_monthly: Optional[int] = Field(None, description="Monthly ask limit")
    session_limit_monthly: Optional[int] = Field(None, description="Monthly session limit")
    features: Optional[List[str]] = Field(None, description="List of features")
    is_active: Optional[bool] = Field(None, description="Whether plan is active")

class UserRoleUpdateRequest(BaseModel):
    user_id: str = Field(..., description="User ID to update")
    role: str = Field(..., description="New role (user, admin, superadmin)")

class ApiKeyUpdateRequest(BaseModel):
    provider: str = Field(..., description="AI provider (openai, gemini, claude)")
    api_key: str = Field(..., description="API key")