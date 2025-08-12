import os
from typing import Dict, Any

class Settings:
    DEFAULT_OPENAI_MODEL = "gpt-4"
    DEFAULT_MAX_TOKENS = 3000
    DEFAULT_TEMPERATURE = 0.3
    
    SUPPORTED_FILE_FORMATS = ['.json', '.csv']
    
    WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Full Body', 'Cardio', 'Rest']
    
    @classmethod
    def get_openai_config(cls) -> Dict[str, Any]:
        return {
            'model': os.getenv('OPENAI_MODEL', cls.DEFAULT_OPENAI_MODEL),
            'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', cls.DEFAULT_MAX_TOKENS)),
            'temperature': float(os.getenv('OPENAI_TEMPERATURE', cls.DEFAULT_TEMPERATURE))
        }
    
    @classmethod
    def get_supported_formats(cls) -> list:
        return cls.SUPPORTED_FILE_FORMATS.copy()
    
    @classmethod
    def get_workout_types(cls) -> list:
        return cls.WORKOUT_TYPES.copy() 