from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class CustomHTTPException(HTTPException):
    """Custom HTTP exception with additional context"""
    def __init__(self, status_code: int, detail: Any = None, headers: Dict[str, str] = None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class AuthenticationError(CustomHTTPException):
    """Authentication related errors"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=401, detail=detail)

class AuthorizationError(CustomHTTPException):
    """Authorization related errors"""
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(status_code=403, detail=detail)

class NotFoundError(CustomHTTPException):
    """Resource not found errors"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)

class ValidationError(CustomHTTPException):
    """Validation errors"""
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(status_code=422, detail=detail)

class RateLimitError(CustomHTTPException):
    """Rate limit exceeded errors"""
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(status_code=429, detail=detail)

class ExternalServiceError(CustomHTTPException):
    """External service errors"""
    def __init__(self, detail: str = "External service error"):
        super().__init__(status_code=503, detail=detail)

def setup_exception_handlers(app: FastAPI):
    """Setup exception handlers for the FastAPI app"""
    
    @app.exception_handler(CustomHTTPException)
    async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
        logger.error(f"Custom HTTP Exception: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.detail,
                "status_code": exc.status_code
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTP Exception: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.detail,
                "status_code": exc.status_code
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation Exception: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Validation failed",
                "details": exc.errors(),
                "status_code": 422
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unexpected Exception: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "Internal server error",
                "status_code": 500
            }
        )