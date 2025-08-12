import json
import pandas as pd
from typing import Dict, List, Any, Union
from abc import ABC, abstractmethod

class DataLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        pass
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        pass

class JSONWorkoutLoader(DataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    
    def validate(self, data: Any) -> bool:
        if isinstance(data, list):
            return all(self._validate_workout(workout) for workout in data)
        return self._validate_workout(data)
    
    def _validate_workout(self, workout: Dict) -> bool:
        required_fields = ['date', 'exercises']
        if not all(field in workout for field in required_fields):
            return False
        
        if not isinstance(workout['exercises'], list):
            return False
        
        for exercise in workout['exercises']:
            if not self._validate_exercise(exercise):
                return False
        
        return True
    
    def _validate_exercise(self, exercise: Dict) -> bool:
        required_fields = ['name', 'weight', 'sets']
        if not all(field in exercise for field in required_fields):
            return False
        
        if not isinstance(exercise['sets'], list):
            return False
        
        for set_data in exercise['sets']:
            if not isinstance(set_data, dict) or 'reps' not in set_data:
                return False
        
        return True

class CSVWorkoutLoader(DataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        df = pd.read_csv(file_path)
        return self._convert_csv_to_workout_format(df)
    
    def validate(self, data: Any) -> bool:
        if not isinstance(data, pd.DataFrame):
            return False
        
        required_columns = ['Date', 'Exercise', 'Weight', 'Reps', 'Sets']
        return all(col in data.columns for col in required_columns)
    
    def _convert_csv_to_workout_format(self, df: pd.DataFrame) -> List[Dict]:
        workouts = []
        current_workout = None
        
        for _, row in df.iterrows():
            date = row['Date']
            exercise = row['Exercise']
            weight = row['Weight']
            reps = row['Reps']
            sets = row['Sets']
            
            if current_workout is None or current_workout['date'] != date:
                if current_workout is not None:
                    workouts.append(current_workout)
                
                current_workout = {
                    'date': date,
                    'workout_type': 'Unknown',
                    'exercises': []
                }
            
            exercise_data = {
                'name': exercise,
                'weight': weight,
                'sets': [{'set': 1, 'reps': reps}]
            }
            
            current_workout['exercises'].append(exercise_data)
        
        if current_workout is not None:
            workouts.append(current_workout)
        
        return workouts

class DataLoaderFactory:
    @staticmethod
    def get_loader(file_extension: str) -> DataLoader:
        if file_extension.lower() == '.json':
            return JSONWorkoutLoader()
        elif file_extension.lower() == '.csv':
            return CSVWorkoutLoader()
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}") 