from os import environ
import uuid
from fastapi import HTTPException, Response
from supabase import AuthApiError
from app.api.core.logger import setup_logger
from app.api.models import User
from app.api.core.config import supabase

logger = setup_logger()
def signup(user: User):
    try:
        auth_response = supabase.auth.sign_up({
            'email': user.email,
            'password': user.password
        })
        if not auth_response.user:
            logger.error(f"Signup failed for {user.email}")
            raise HTTPException(status_code=400, detail="Signup failed")
        
        user_id = str(uuid.UUID(auth_response.user.id))  
        logger.debug(f"Attempting to insert user with id: {user_id}, Type: {type(user_id)}")

        # Check if user already exists
        existing_user = supabase.table('user').select('*').eq('id', user_id).execute()
        if not existing_user.data:
            supabase.table('user').insert({
                'id': user_id,
                'username': user.email.split('@')[0],
                'profileimage': None
            }).execute()
            logger.info(f"New user inserted for {user.email}, user_id: {user_id}")
        else:
            logger.info(f"User already exists for {user.email}, user_id: {user_id}")

        logger.info(f"Successful signup for {user.email}, user_id: {user_id}")
        return {"message": "Signup successful", "user_id": user_id}
    except AuthApiError as e:
        logger.error(f"Signup error for {user.email}: {e.message}, Details: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Signup error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error during signup for {user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
def verify(user: User):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            'email': user.email,
            'password': user.password
        })
        if not auth_response.session or not auth_response.user:
            logger.error(f"Login failed for {user.email}: Invalid credentials")
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        access_token = auth_response.session.access_token
        refresh_token = auth_response.session.refresh_token

        response = Response(
        content='{"access_token": "' + access_token + '", "message": "Login successful"}',
        status_code=200,
        media_type="application/json"
            )
        
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            secure=False,
            samesite="Strict"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="Strict"
        )
        logger.info(f"Successful login for {user.email}")
        return response
    except AuthApiError as e:
        logger.error(f"Login error for {user.email}: {e.message}")
        raise HTTPException(status_code=400, detail=f"Login error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error during login for {user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
