from datetime import datetime, timedelta
from jose import JWTError, ExpiredSignatureError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Request
from dotenv import load_dotenv
from typing import Any, Union, Optional
from uuid import UUID
import os

load_dotenv()

ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

secret_key = os.getenv("JWT_SECRET_KEY")
refresh_key = os.getenv("JWT_REFRESH_KEY")
if not secret_key or len(secret_key) < 32:
    raise ValueError("JWT_SECRET_KEY must be set and at least 32 characters long")
if not refresh_key or len(refresh_key) < 32:
    raise ValueError("JWT_REFRESH_KEY must be set and at least 32 characters long")

hass_password = CryptContext(schemes=['bcrypt'], bcrypt__rounds=12, deprecated='auto')

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    return hass_password.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed version."""
    return hass_password.verify(plain_password, hashed_password)

def create_access_token(user_id: UUID, subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token for the given user."""
    if not user_id or not isinstance(user_id, UUID):
        raise ValueError("Invalid user_id: must be a valid UUID")
    if not subject:
        raise ValueError("Subject cannot be empty")

    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {'user_id': str(user_id), 'exp': expire, 'sub': str(subject)}  # Convert UUID to string
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    if not subject:
        raise ValueError("Subject cannot be empty")

    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)

    to_encode = {'exp': expire, 'sub': str(subject)}
    encoded_jwt = jwt.encode(to_encode, refresh_key, algorithm=ALGORITHM)
    return encoded_jwt

def decode_jwt(token: str, is_refresh_token: bool = False) -> dict:
    """Decode and validate a JWT token."""
    key = refresh_key if is_refresh_token else secret_key
    try:
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=403, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token")

class JWT_Bearer(HTTPBearer):
    """Custom HTTPBearer for JWT authentication."""
    def __init__(self, auto_error: bool = True):
        super(JWT_Bearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request, is_refresh_token: bool = False) -> dict:
        """Validate the Bearer token in the request."""
        credentials: HTTPAuthorizationCredentials = await super(JWT_Bearer, self).__call__(request)
        if credentials:
            if credentials.scheme != "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme")
            payload = self.verify_jwt(credentials.credentials, is_refresh_token)
            return payload
        raise HTTPException(status_code=403, detail="Invalid authorization code")

    def verify_jwt(self, jwtoken: str, is_refresh_token: bool = False) -> dict:
        """Verify a JWT token and return its payload."""
        try:
            payload = decode_jwt(jwtoken, is_refresh_token)
            return payload
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=403, detail="Invalid token")

jwt_bearer = JWT_Bearer()