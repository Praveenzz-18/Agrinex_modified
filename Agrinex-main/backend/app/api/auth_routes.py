from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.appwrite_service import appwrite_service

router = APIRouter()  # assuming you have this

class UserProfile(BaseModel):
    full_name: str
    email: str
    phone: str
    village: str
    district: str
    state: str

# ADD THESE ENDP OINTS
@router.post("/profile")
async def save_profile(profile: UserProfile, user_id: str = "temp_user_123"):
    appwrite_service.create_user_profile(user_id, profile.dict())
    return {"success": True, "message": "Profile saved!"}

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    docs = appwrite_service.documents.list(
        database_id='database-693c561e001f0c948b76',
        collection_id='user_details',
        queries=[f'equal("documentId", "{user_id}")']
    ).documents
    return {"success": True, "profile": docs[0] if docs else None}
