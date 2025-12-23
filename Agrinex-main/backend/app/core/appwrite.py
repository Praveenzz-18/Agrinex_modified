from appwrite.client import Client
from appwrite.services.databases import Databases
from app.core.config import settings

client = (Client()
    .set_endpoint(settings.APPWRITE_ENDPOINT)
    .set_project(settings.APPWRITE_PROJECT_ID)
    .set_key(settings.APPWRITE_API_KEY)
)

class AppwriteService:
    def __init__(self):
        self.databases = Databases(client)
    
    def create_user_profile(self, user_id: str, profile: dict):
        """Save/update user profile"""
        try:
            self.databases.create_document(
                database_id='database-693c561e001f0c948b76',
                collection_id='user_details',
                document_id=user_id,
                data=profile
            )
        except Exception as e:
            print(f"Error creating user profile: {e}")
    
    def create_farm(self, user_id: str, farm_data: dict):
        """Create new farm"""
        farm_data['user_id'] = user_id
        try:
            return self.databases.create_document(
                database_id='database-693c561e001f0c948b76',
                collection_id='farms',
                document_id='unique()',
                data=farm_data
            )
        except Exception as e:
            print(f"Error creating farm: {e}")
            return None
    
    def list_farms(self, user_id: str):
        """Get user's farms"""
        try:
            result = self.databases.list_documents(
                database_id='database-693c561e001f0c948b76',
                collection_id='farms',
                queries=[f'equal("user_id", "{user_id}")']
            )
            return result.get('documents', [])
        except Exception as e:
            print(f"Error listing farms: {e}")
            return []
    
    def log_irrigation(self, user_id: str, farm_id: str, log_data: dict):
        """Log irrigation decision"""
        log_data.update({'user_id': user_id, 'farm_id': farm_id})
        try:
            self.databases.create_document(
                database_id='database-693c561e001f0c948b76',
                collection_id='irrigation_logs',
                document_id='unique()',
                data=log_data
            )
        except Exception as e:
            print(f"Error logging irrigation: {e}")
    
    def log_crop_prediction(self, user_id: str, farm_id: str, pred_data: dict):
        """Log crop prediction"""
        pred_data.update({'user_id': user_id, 'farm_id': farm_id})
        try:
            self.databases.create_document(
                database_id='database-693c561e001f0c948b76',
                collection_id='crop_prediction',
                document_id='unique()',
                data=pred_data
            )
        except Exception as e:
            print(f"Error logging crop prediction: {e}")

appwrite_service = AppwriteService()
