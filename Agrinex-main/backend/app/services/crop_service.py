import joblib
import os
from typing import Dict

from .weather_service import get_openmeteo_weather, map_location_to_coords

# Load pre-trained crop model
# This file is at: backend/app/services/crop_service.py
# We need to go up 3 levels to backend/, then into models/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CROP_MODEL_PATH = os.path.join(BASE_DIR, "models", "crop_recommender_pipeline.pkl")
crop_model = joblib.load(CROP_MODEL_PATH)


class CropService:
    SOIL_QUALITY_MAP = {
        "Poor": {"N": 10, "P": 5, "K": 10},
        "Medium": {"N": 35, "P": 15, "K": 25},
        "Rich": {"N": 70, "P": 35, "K": 40},
    }

    SOIL_TYPE_MAP = {
        "Sandy": 6.5,
        "Loam": 7.0,
        "Clay": 7.5,
        "Red": 6.0,           # Red soil (acidic, iron-rich)
        "Black": 8.0,         # Black soil (alkaline, cotton soil)
        "Laterite": 5.5,      # Laterite soil (very acidic)
        "Alluvial": 7.2,      # Alluvial soil (fertile, neutral)
        "Mixed": 6.8,         # Mixed soil (average pH)
    }

    STATE_BASE_RAINFALL = {
        "karnataka": 900.0,
        "tamil nadu": 850.0,
        "maharashtra": 750.0,
        "punjab": 650.0,
        "haryana": 650.0,
        "west bengal": 1200.0,
        "kerala": 1400.0,
        "gujarat": 700.0,
        "rajasthan": 550.0,
        "andhra pradesh": 850.0,
        "telangana": 800.0,
        "uttar pradesh": 850.0,
        "bihar": 1000.0,
        "odisha": 1100.0,
        "chhattisgarh": 1000.0,
        "madhya pradesh": 850.0,
        "assam": 1300.0,
        "goa": 1500.0,
    }

    @staticmethod
    def recommend_crops(
        soil_type: str,
        soil_quality: str,
        state_name: str,
        district_name: str,
        n_value: float = None,
        p_value: float = None,
        k_value: float = None,
        ph_value: float = None,
        latitude: float = None,
        longitude: float = None,
    ) -> Dict:
        """
        Recommend crops based on soil + location + weather.
        """
        try:
            # 1. Map soil inputs to numeric values or use custom ones
            npk = CropService.SOIL_QUALITY_MAP.get(
                soil_quality, CropService.SOIL_QUALITY_MAP["Medium"]
            )
            n = float(n_value) if n_value is not None else float(npk["N"])
            p = float(p_value) if p_value is not None else float(npk["P"])
            k = float(k_value) if k_value is not None else float(npk["K"])
            ph_val = float(ph_value) if ph_value is not None else float(CropService.SOIL_TYPE_MAP.get(soil_type, 7.0))

            # 2. Fetch weather from Open-Meteo
            if latitude is not None and longitude is not None:
                lat, lon = latitude, longitude
            else:
                lat, lon = map_location_to_coords(state_name, district_name)
            
            weather = get_openmeteo_weather(lat, lon)
            temp = weather["temperature"]
            humidity = weather["humidity"]
            rain_24h = max(weather["rain_24h"], 0.0)

            # Convert 24-hour precipitation to seasonal rainfall (mm) expected by the ML model
            st_key = (state_name or "").strip().lower()
            base_rainfall = CropService.STATE_BASE_RAINFALL.get(st_key, 800.0)
            rainfall_mm = base_rainfall + (rain_24h * 10.0)

            # 3. Build feature dict for model
            #    Must match training feature names exactly!
            sample = {
                "N_req_kg_per_ha": n,
                "P_req_kg_per_ha": p,
                "K_req_kg_per_ha": k,
                "Temperature_C": temp,
                "Humidity_%": humidity,
                "pH": ph_val,
                "Rainfall_mm": rainfall_mm,
                "State Name": state_name,
            }

            # 4. Convert dict to DataFrame for pipeline
            import pandas as pd
            df_sample = pd.DataFrame([sample])

            # 5. Get predictions
            proba = crop_model.predict_proba(df_sample)
            proba = proba[0]
            classes = crop_model.classes_

            crop_probs = [
                {"crop": cls, "probability": float(p_val)}
                for cls, p_val in zip(classes, proba)
            ]
            crop_probs.sort(key=lambda x: x["probability"], reverse=True)

            return {
                "success": True,
                "recommended_crops": crop_probs[:5],
                "soil_params": {
                    "soil_type": soil_type,
                    "soil_quality": soil_quality,
                    "N_req_kg_per_ha": n,
                    "P_req_kg_per_ha": p,
                    "K_req_kg_per_ha": k,
                    "pH": ph_val,
                },
                "weather": weather,
                "state": state_name,
                "district": district_name,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Crop recommendation failed: {str(e)}",
            }
