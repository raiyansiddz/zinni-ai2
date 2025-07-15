from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import json

class UserResponse(BaseModel):
    id: str
    neon_user_id: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    role: str
    current_plan: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PlanResponse(BaseModel):
    id: str
    name: str
    plan_type: str
    price_monthly: int
    price_yearly: int
    ask_limit_monthly: int
    session_limit_monthly: int
    features: Optional[List[str]] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @classmethod
    def model_validate(cls, obj):
        """Custom validation to handle UUID and JSON fields"""
        if hasattr(obj, '__dict__'):
            data = obj.__dict__.copy()
            
            # Convert UUID to string
            if 'id' in data:
                data['id'] = str(data['id'])
            
            # Parse JSON features
            if 'features' in data and isinstance(data['features'], str):
                try:
                    data['features'] = json.loads(data['features'])
                except:
                    data['features'] = None
            
            # Convert enum to string
            if 'plan_type' in data and hasattr(data['plan_type'], 'value'):
                data['plan_type'] = data['plan_type'].value
            
            return cls(**data)
        return super().model_validate(obj)
    
    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: str
    user_id: str
    session_type: str
    title: Optional[str] = None
    is_active: bool
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @classmethod
    def model_validate(cls, obj):
        """Custom validation to handle UUID fields"""
        if hasattr(obj, '__dict__'):
            data = obj.__dict__.copy()
            
            # Convert UUIDs to strings
            for field in ['id', 'user_id']:
                if field in data:
                    data[field] = str(data[field])
            
            # Convert enum to string
            if 'session_type' in data and hasattr(data['session_type'], 'value'):
                data['session_type'] = data['session_type'].value
            
            return cls(**data)
        return super().model_validate(obj)
    
    class Config:
        from_attributes = True

class AiMessageResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    prompt: str
    response: str
    screen_context: Optional[str] = None
    audio_transcript: Optional[str] = None
    ai_provider: str
    model_used: str
    tokens_used: int
    created_at: datetime
    
    @classmethod
    def model_validate(cls, obj):
        """Custom validation to handle UUID fields"""
        if hasattr(obj, '__dict__'):
            data = obj.__dict__.copy()
            
            # Convert UUIDs to strings
            for field in ['id', 'session_id', 'user_id']:
                if field in data:
                    data[field] = str(data[field])
            
            return cls(**data)
        return super().model_validate(obj)
    
    class Config:
        from_attributes = True

class AskResponse(BaseModel):
    response: str = Field(..., description="AI's response")
    provider: str = Field(..., description="AI provider used")
    model: str = Field(..., description="Model used")
    tokens_used: int = Field(..., description="Tokens consumed")
    session_id: str = Field(..., description="Session ID")
    message_id: str = Field(..., description="Message ID")

class UsageResponse(BaseModel):
    asks_used: int = Field(..., description="Number of asks used this month")
    asks_limit: int = Field(..., description="Monthly ask limit (-1 for unlimited)")
    sessions_used: int = Field(..., description="Number of sessions used this month")
    sessions_limit: int = Field(..., description="Monthly session limit (-1 for unlimited)")
    current_plan: str = Field(..., description="Current plan type")

class CheckoutResponse(BaseModel):
    checkout_url: str = Field(..., description="Stripe checkout URL")
    session_id: str = Field(..., description="Stripe session ID")

class ApiResponse(BaseModel):
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Response data")

class ErrorResponse(BaseModel):
    error: bool = Field(default=True, description="Indicates an error occurred")
    message: str = Field(..., description="Error message")
    status_code: int = Field(..., description="HTTP status code")
    details: Optional[Any] = Field(None, description="Additional error details")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Health status")
    timestamp: datetime = Field(..., description="Timestamp of health check")
    version: str = Field(..., description="API version")
    database: str = Field(..., description="Database connection status")
    ai_providers: List[str] = Field(..., description="Available AI providers")