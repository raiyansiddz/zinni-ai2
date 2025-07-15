import json
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import base64
import os

# AI Provider imports
try:
    import openai
    from openai import OpenAI
except ImportError:
    openai = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None

from app.core.config import settings
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)

class AIService:
    """Service for handling AI provider interactions"""
    
    def __init__(self):
        self.providers = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available AI providers"""
        
        # OpenAI
        if openai and settings.OPENAI_API_KEY:
            try:
                self.providers["openai"] = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {str(e)}")
        
        # Gemini
        if genai and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.providers["gemini"] = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {str(e)}")
        
        # Claude
        if Anthropic and settings.CLAUDE_API_KEY:
            try:
                self.providers["claude"] = Anthropic(api_key=settings.CLAUDE_API_KEY)
                logger.info("Claude provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Claude: {str(e)}")
        
        logger.info(f"Initialized AI providers: {list(self.providers.keys())}")
    
    def get_available_providers(self) -> List[str]:
        """Get list of available AI providers"""
        return list(self.providers.keys())
    
    async def ask_ai(
        self,
        prompt: str,
        screen_context: Optional[str] = None,
        audio_transcript: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        provider: str = "gemini",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Ask AI with context from screen, audio, and user profile
        
        Args:
            prompt: User's question or prompt
            screen_context: Base64 encoded screen capture
            audio_transcript: Speech-to-text transcript
            user_profile: User's profile information
            provider: AI provider to use (openai, gemini, claude)
            model: Specific model to use (optional)
        
        Returns:
            Dict containing response, provider, model, and token usage
        """
        
        if provider not in self.providers:
            raise ExternalServiceError(f"AI provider '{provider}' not available")
        
        try:
            # Build comprehensive prompt with context
            full_prompt = self._build_context_prompt(
                prompt, screen_context, audio_transcript, user_profile
            )
            
            # Get response from provider
            if provider == "openai":
                return await self._ask_openai(full_prompt, model)
            elif provider == "gemini":
                return await self._ask_gemini(full_prompt, model)
            elif provider == "claude":
                return await self._ask_claude(full_prompt, model)
            else:
                raise ExternalServiceError(f"Provider '{provider}' not supported")
                
        except Exception as e:
            logger.error(f"Error in AI service: {str(e)}")
            raise ExternalServiceError(f"AI service error: {str(e)}")
    
    def _build_context_prompt(
        self,
        prompt: str,
        screen_context: Optional[str] = None,
        audio_transcript: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build comprehensive prompt with all available context"""
        
        context_parts = []
        
        # User profile context
        if user_profile:
            context_parts.append(f"User Profile: {user_profile.get('display_name', 'Unknown User')}")
            if user_profile.get('email'):
                context_parts.append(f"Email: {user_profile['email']}")
        
        # Audio transcript context
        if audio_transcript:
            context_parts.append(f"Audio Transcript: {audio_transcript}")
        
        # Screen context
        if screen_context:
            context_parts.append("Screen Context: [Screen capture provided - analyze visual content]")
        
        # Build final prompt
        if context_parts:
            context_str = "\n".join(context_parts)
            full_prompt = f"""Context Information:
{context_str}

User Question: {prompt}

Please provide a helpful response based on the context and question above."""
        else:
            full_prompt = prompt
        
        return full_prompt
    
    async def _ask_openai(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Ask OpenAI"""
        client = self.providers["openai"]
        model_name = model or "gpt-3.5-turbo"
        
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                "response": response.choices[0].message.content,
                "provider": "openai",
                "model": model_name,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            logger.error(f"OpenAI error: {str(e)}")
            raise ExternalServiceError(f"OpenAI error: {str(e)}")
    
    async def _ask_gemini(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Ask Gemini"""
        model_instance = self.providers["gemini"]
        
        try:
            response = await model_instance.generate_content_async(prompt)
            
            return {
                "response": response.text,
                "provider": "gemini",
                "model": "gemini-pro",
                "tokens_used": 0  # Gemini doesn't provide token count in free tier
            }
            
        except Exception as e:
            logger.error(f"Gemini error: {str(e)}")
            raise ExternalServiceError(f"Gemini error: {str(e)}")
    
    async def _ask_claude(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Ask Claude"""
        client = self.providers["claude"]
        model_name = model or "claude-3-sonnet-20240229"
        
        try:
            response = await client.messages.create(
                model=model_name,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "response": response.content[0].text,
                "provider": "claude",
                "model": model_name,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens
            }
            
        except Exception as e:
            logger.error(f"Claude error: {str(e)}")
            raise ExternalServiceError(f"Claude error: {str(e)}")

# Global instance
ai_service = AIService()