from pydantic import BaseModel

class IrrigationRequest(BaseModel):
    soil_feel: str
    application_rate: float
    farm_id: str = None  # NEW - optional farm_id

@router.post("/recommend")
async def irrigation_recommend(request: IrrigationRequest):
    # ... your existing logic ...
    
    # Log with farm_id if provided
    if result["success"]:
        appwrite_service.log_irrigation(
            user_id="temp_user_123",  # from auth later
            farm_id=request.farm_id or "no_farm",
            log_data=result
        )
    return result
