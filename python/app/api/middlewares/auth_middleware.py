# auth.py
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.api.core.config import SUPABASE_JWT_SECRET
from app.api.core.logger import setup_logger

security = HTTPBearer()
logger = setup_logger()

def extract_token(raw_token: str) -> str:
    """Extract the JWT from a Bearer token string."""
    raw_token = raw_token.strip('"')
    if raw_token and raw_token.startswith("Bearer "):
        try:
            return raw_token.split(" ", 1)[1]
        except IndexError:
            logger.warning("Malformed Bearer token")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
    return raw_token

async def auth_middleware(request: Request, call_next):
    """Middleware to extract access_token from cookie and inject into Authorization header."""
    public_paths = {"/api/auth/signup", "/api/auth/verify"}
    logger.debug(f"Processing request: {request.method} {request.url.path}")
    
    if request.url.path in public_paths:
        return await call_next(request)
    
    token = request.cookies.get("access_token")
    if token:
        try:
            token = extract_token(token)
            request.state.token = token
            request.headers.__dict__["_list"].append(
                (b"authorization", f"Bearer {token}".encode())
            )
            logger.debug(f"Injected token for {request.url.path}")
        except HTTPException as e:
            logger.warning(f"Invalid token for {request.url.path}: {e.detail}")
    else:
        logger.debug(f"No access_token cookie for {request.url.path}")
    
    response = await call_next(request)
    return response

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT and return user payload."""
    try:
        token = extract_token(credentials.credentials)
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            options={"verify_aud": False}
        )
        user_id = payload.get('sub')
        if user_id is None:
            logger.error("Invalid authentication credentials: Missing user_id")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        logger.info(f"Authenticated user: {user_id}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.error("Invalid JWT token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.PyJWTError as e:
        logger.error(f"Could not validate credentials: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")