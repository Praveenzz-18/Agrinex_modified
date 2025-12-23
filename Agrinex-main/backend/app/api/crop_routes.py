from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.crop_service import predict_crop  # your existing service
from app.services.appwrite_service import appwrite_service

router = APIRouter(prefix="/crop", tags=["crop"])

class CropRequest(BaseModel):
    crop_name: str
    soil_type: str = "loamy"
    farm_id: str = None  # NEW - optional farm_id
    state_name: str
    district_name: str

@router.post("/predict")
async def crop_predict(request: CropRequest) -> Dict[str, Any]:
    try:
        # Get prediction (your existing logic)
        result = predict_crop(
            crop_name=request.crop_name,
            soil_type=request.soil_type,
            state_name=request.state_name,
            district_name=request.district_name
        )
        
        # Add location and farm_id to response
        result.update({
            "state": request.state_name.lower(),
            "district": request.district_name.lower(),
            "farm_id": request.farm_id
        })
        
        # Log to Appwrite
        if result["success"]:
            log_data = {
                **{k: v for k, v in result.items() if k not in ["success", "error"]},
                "crop_name": request.crop_name,
                "soil_type": request.soil_type
            }
            appwrite_service.log_crop_prediction(
                user_id="temp_user_123",  # from auth later
                farm_id=request.farm_id or "no_farm",
                pred_data=log_data
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
