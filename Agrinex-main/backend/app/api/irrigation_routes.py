from pydantic import BaseModel

class IrrigationRequest(BaseModel):
    soil_feel: str
    application_rate: float
    farm_id: str = None  # NEW - optional farm_id

@router.post("/recommend")
async def irrigation_recommend(request: IrrigationRequest):
    # ... your existing logic ...
    return result
