from fastapi import APIRouter
from pydantic import BaseModel
from app.services.appwrite_service import appwrite_service

router = APIRouter(prefix="/farms")

class FarmCreate(BaseModel):
    farm_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    area_acres: float
    current_crop: str = ""
    soil_type: str = "loamy"

@router.post("/")
async def create_farm(farm: FarmCreate, user_id: str = "temp_user_123"):
    farm_id = appwrite_service.create_farm(user_id, farm.dict())
    return {"success": True, "farm_id": farm_id}

@router.get("/{user_id}")
async def list_farms(user_id: str):
    farms = appwrite_service.list_farms(user_id)
    return {"success": True, "farms": [f.data for f in farms]}
