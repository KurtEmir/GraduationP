import logging
import sys
import json

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.init_db import init_db

# Create database tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(settings.PROJECT_NAME)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    """Initialize the database with default data on startup"""
    logger.info("Starting up the application...")
    try:
        db = SessionLocal()
        init_db(db)
        db.close()
        logger.info("Database initialization completed successfully!")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise e

# Custom RequestValidationError handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"FastAPI Request Validation Error: {exc.errors()}")
    logger.error(f"Request details: URL={request.url}, Method={request.method}, Headers={request.headers}")
    try:
        body = await request.json()
        logger.error(f"Request body: {body}")
    except json.JSONDecodeError:
        logger.error("Request body: Could not decode JSON or body is empty/not JSON")
    except Exception as e:
        logger.error(f"Request body: Error reading body: {e}")
    
    # You can customize the response, but for debugging, let's include the errors
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": "See server logs for more details on validation error"},
    )

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # Use settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Remote Health Monitoring System API"} 