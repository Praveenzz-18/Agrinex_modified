class UserService:
    def __init__(self):
        pass
    
    def create_user_profile(self, user_id: str, profile: dict):
        """Save/update user profile (Mocked because Firebase handles this)"""
        print(f"Mock: Saved user profile for {user_id}")
        pass
    
    def get_user_profile(self, user_id: str):
        """Get user profile (Mocked because Firebase handles this)"""
        print(f"Mock: Fetched user profile for {user_id}")
        return None

user_service = UserService()