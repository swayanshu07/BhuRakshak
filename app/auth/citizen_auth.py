from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth/citizen", tags=["citizen_auth"])

# temp in-memory store, replace with DB later
fake_citizens_db = {}

class SignupRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/signup")
def signup(data: SignupRequest):
    if data.username in fake_citizens_db:
        raise HTTPException(status_code=400, detail="User already exists")
    fake_citizens_db[data.username] = hash_password(data.password)
    return {"message": "Citizen registered"}

@router.post("/login")
def login(data: LoginRequest):
    hashed = fake_citizens_db.get(data.username)
    if not hashed or not verify_password(data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": data.username, "role": "citizen"})
    return {"access_token": token, "token_type": "bearer"}