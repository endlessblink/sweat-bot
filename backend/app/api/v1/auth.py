"""
Authentication endpoints and dependencies
Handles user authentication, registration, and JWT tokens
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
import secrets
import logging

from app.core.database import get_db
from app.models.models import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Security scheme
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    preferred_language: str = "he"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    preferred_language: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# JWT helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # Default 7 days
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# Dependency functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )
    
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current authenticated user and check for admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_user

async def get_current_user_ws(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user for WebSocket connections"""
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Get user from database
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

# Authentication endpoints
@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    
    # Check if username already exists
    query = select(User).where(User.username == user_data.username)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        preferred_language=user_data.preferred_language,
        password_hash=hashed_password,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )
    
    logger.info(f"New user registered: {user_data.username}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds()),
        user={
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "preferred_language": new_user.preferred_language
        }
    )

@router.post("/login", response_model=Token)
async def login_user(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login user with username and password"""
    
    # Get user by username
    query = select(User).where(User.username == user_credentials.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User logged in: {user.username}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds()),
        user={
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "preferred_language": user.preferred_language
        }
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        preferred_language=current_user.preferred_language,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user)
):
    """Refresh access token"""
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds()),
        user={
            "id": str(current_user.id),
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "preferred_language": current_user.preferred_language
        }
    )

@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should discard token)"""
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Successfully logged out"}

# Guest/demo endpoints
class GuestUserRequest(BaseModel):
    device_id: Optional[str] = None

@router.post("/guest", response_model=Token)
async def create_guest_user(
    request: GuestUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create or retrieve temporary guest user based on device ID"""

    device_id = request.device_id if request and request.device_id else None

    # If device_id provided, check for existing guest user
    if device_id:
        guest_email = f"{device_id}@guest.sweatbot.com"

        # Query for existing user by email first
        query = select(User).where(User.email == guest_email)
        result = await db.execute(query)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            # Check if it's a guest user
            if existing_user.is_guest:
                logger.info(f"[AUTH] Returning existing guest user: {existing_user.username} (device_id: {device_id[:8]})")
                guest_user = existing_user
            else:
                # Email exists but not a guest - this is an error
                logger.error(f"[AUTH] Email {guest_email} exists but is_guest={existing_user.is_guest}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use by non-guest account"
                )
        else:
            # Create new guest with device ID
            guest_username = f"guest_{device_id[:8]}"
            logger.info(f"[AUTH] Creating new guest user: {guest_username} (device_id: {device_id[:8]})")

            guest_user = User(
                username=guest_username,
                email=guest_email,
                full_name="Guest User",
                preferred_language="he",
                password_hash=hash_password(secrets.token_hex(16)),
                is_active=True,
                is_guest=True
            )

            try:
                db.add(guest_user)
                await db.commit()
                await db.refresh(guest_user)
                logger.info(f"[AUTH] ✅ Guest user created successfully: {guest_username}")
            except Exception as e:
                await db.rollback()
                logger.error(f"[AUTH] ❌ Failed to create guest user: {str(e)}")

                # Try to fetch again in case of race condition
                result = await db.execute(select(User).where(User.email == guest_email))
                existing_user = result.scalar_one_or_none()

                if existing_user and existing_user.is_guest:
                    logger.warning(f"[AUTH] Race condition detected - using existing guest user")
                    guest_user = existing_user
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create guest user: {str(e)}"
                    )
    else:
        # Fallback: create random guest user (legacy behavior)
        guest_id = secrets.token_hex(8)
        guest_username = f"guest_{guest_id}"
        guest_email = f"{guest_username}@guest.sweatbot.com"

        logger.info(f"[AUTH] Creating legacy guest user: {guest_username}")

        guest_user = User(
            username=guest_username,
            email=guest_email,
            full_name="Guest User",
            preferred_language="he",
            password_hash=hash_password(secrets.token_hex(16)),
            is_active=True,
            is_guest=True
        )

        try:
            db.add(guest_user)
            await db.commit()
            await db.refresh(guest_user)
            logger.info(f"[AUTH] ✅ Legacy guest user created: {guest_username}")
        except Exception as e:
            await db.rollback()
            logger.error(f"[AUTH] ❌ Failed to create legacy guest: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create guest user: {str(e)}"
            )
    
    # Create short-lived token for guest (1 day)
    access_token_expires = timedelta(days=1)
    access_token = create_access_token(
        data={"sub": str(guest_user.id)},
        expires_delta=access_token_expires
    )
    
    logger.info(f"Guest user created: {guest_username}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds()),
        user={
            "id": str(guest_user.id),
            "username": guest_user.username,
            "email": guest_user.email,
            "full_name": guest_user.full_name,
            "preferred_language": guest_user.preferred_language,
            "is_guest": True
        }
    )

@router.get("/health")
async def auth_health_check():
    """Health check for auth service"""
    return {
        "status": "healthy",
        "service": "authentication",
        "timestamp": datetime.utcnow().isoformat()
    }