from appwrite.client import Client
from appwrite.services.databases import Databases
from app.core.config import settings

client = (Client()
    .set_endpoint(settings.APPWRITE_ENDPOINT)
    .set_project(settings.APPWRITE_PROJECT_ID)
    .set_key(settings.APPWRITE_API_KEY)
)

class UserService:
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
    
    def get_user_profile(self, user_id: str):
        """Get user profile"""
        try:
            return self.databases.get_document(
                database_id='database-693c561e001f0c948b76',
                collection_id='user_details',
                document_id=user_id
            )
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None

user_service = UserService()