from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login")
async def login(request: LoginRequest):
    """
    Login endpoint for user authentication
    """
    # Demo authentication - replace with actual DB lookup
    if request.email == "admin@example.com" and request.password == "password":
        return {
            "access_token": "demo_token_123",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": request.email,
                "name": "Admin User"
            }
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

@router.post("/logout")
async def logout():
    """
    Logout endpoint
    """
    return {"message": "Logged out successfully"}

@router.post("/register")
async def register(request: LoginRequest):
    """
    Register new user
    """
    return {
        "message": "User registered successfully",
        "email": request.email
    }
