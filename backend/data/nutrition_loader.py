import json
import pandas as pd
from typing import Dict, List, Any, Union
from abc import ABC, abstractmethod

class NutritionDataLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        pass
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        pass

class JSONNutritionLoader(NutritionDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    
    def validate(self, data: Any) -> bool:
        if isinstance(data, list):
            return all(self._validate_nutrition_entry(entry) for entry in data)
        return self._validate_nutrition_entry(data)
    
    def _validate_nutrition_entry(self, entry: Dict) -> bool:
        required_fields = ['date', 'foods']
        if not all(field in entry for field in required_fields):
            return False
        
        if not isinstance(entry['foods'], list):
            return False
        
        for food in entry['foods']:
            if not self._validate_food(food):
                return False
        
        return True
    
    def _validate_food(self, food: Dict) -> bool:
        required_fields = ['name', 'calories', 'protein', 'carbs', 'fat']
        if not all(field in food for field in required_fields):
            return False
        
        return True

class CSVNutritionLoader(NutritionDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        df = pd.read_csv(file_path)
        return self._convert_csv_to_nutrition_format(df)
    
    def validate(self, data: Any) -> bool:
        if not isinstance(data, pd.DataFrame):
            return False
        
        required_columns = ['Date', 'Food', 'Calories', 'Protein', 'Carbs', 'Fat']
        return all(col in data.columns for col in required_columns)
    
    def _convert_csv_to_nutrition_format(self, df: pd.DataFrame) -> List[Dict]:
        nutrition_entries = []
        current_entry = None
        
        for _, row in df.iterrows():
            date = row['Date']
            food = row['Food']
            calories = row['Calories']
            protein = row['Protein']
            carbs = row['Carbs']
            fat = row['Fat']
            
            if current_entry is None or current_entry['date'] != date:
                if current_entry is not None:
                    nutrition_entries.append(current_entry)
                
                current_entry = {
                    'date': date,
                    'foods': []
                }
            
            food_data = {
                'name': food,
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fat': fat
            }
            
            current_entry['foods'].append(food_data)
        
        if current_entry is not None:
            nutrition_entries.append(current_entry)
        
        return nutrition_entries

class NutritionLoaderFactory:
    @staticmethod
    def get_loader(file_extension: str) -> NutritionDataLoader:
        if file_extension.lower() == '.json':
            return JSONNutritionLoader()
        elif file_extension.lower() == '.csv':
            return CSVNutritionLoader()
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}") 