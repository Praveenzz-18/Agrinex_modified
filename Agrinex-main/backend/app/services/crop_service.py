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
        "Poor": {"N": 20, "P": 10, "K": 10},
        "Medium": {"N": 50, "P": 25, "K": 25},
        "Rich": {"N": 90, "P": 40, "K": 40},
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


    @staticmethod
    def recommend_crops(
        soil_type: str,
        soil_quality: str,
        state_name: str,
        district_name: str,
    ) -> Dict:
        """
        Recommend crops based on soil + location + weather.
        """
        try:
            # 1. Map soil inputs to numeric values
            npk = CropService.SOIL_QUALITY_MAP.get(
                soil_quality, CropService.SOIL_QUALITY_MAP["Medium"]
            )
            ph_val = CropService.SOIL_TYPE_MAP.get(soil_type, 7.0)

            # 2. Fetch weather from Open-Meteo
            lat, lon = map_location_to_coords(state_name, district_name)
            weather = get_openmeteo_weather(lat, lon)
            temp = weather["temperature"]
            humidity = weather["humidity"]
            rainfall_mm = max(weather["rain_24h"], 0.0)

            # 3. Build feature dict for model
            #    Must match training feature names exactly!
            sample = {
                "N_req_kg_per_ha": npk["N"],
                "P_req_kg_per_ha": npk["P"],
                "K_req_kg_per_ha": npk["K"],
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
                {"crop": cls, "probability": float(p)}
                for cls, p in zip(classes, proba)
            ]
            crop_probs.sort(key=lambda x: x["probability"], reverse=True)

            return {
                "success": True,
                "recommended_crops": crop_probs[:5],
                "soil_params": {
                    "soil_type": soil_type,
                    "soil_quality": soil_quality,
                    "N_req_kg_per_ha": npk["N"],
                    "P_req_kg_per_ha": npk["P"],
                    "K_req_kg_per_ha": npk["K"],
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
