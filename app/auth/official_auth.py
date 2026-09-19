from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth/official", tags=["official_auth"])

fake_officials_db = {}

class SignupRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/signup")
def signup(data: SignupRequest):
    if data.username in fake_officials_db:
        raise HTTPException(status_code=400, detail="Official already exists")
    fake_officials_db[data.username] = hash_password(data.password)
    return {"message": "Official registered"}

@router.post("/login")
def login(data: LoginRequest):
    hashed = fake_officials_db.get(data.username)
    if not hashed or not verify_password(data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": data.username, "role": "official"})
    return {"access_token": token, "token_type": "bearer"}