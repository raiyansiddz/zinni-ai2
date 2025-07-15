import httpx
import json
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class NeonAuthService:
    """Service for handling Neon Auth operations"""
    
    def __init__(self):
        self.project_id = settings.NEXT_PUBLIC_STACK_PROJECT_ID
        self.publishable_key = settings.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
        self.secret_key = settings.STACK_SECRET_SERVER_KEY
        self.base_url = "https://api.stack-auth.com"
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a Neon Auth token and return user data"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/auth/sessions/verify",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "session_token": token,
                        "project_id": self.project_id
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("user")
                else:
                    logger.error(f"Token verification failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None
    
    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user information from Neon Auth"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/users/{user_id}",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    },
                    params={"project_id": self.project_id}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get user info: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh a Neon Auth token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/auth/tokens/refresh",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "refresh_token": refresh_token,
                        "project_id": self.project_id
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Token refresh failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return None

# Global instance
neon_auth_service = NeonAuthService()