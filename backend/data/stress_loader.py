import json
import pandas as pd
from typing import Dict, List, Any, Union
from abc import ABC, abstractmethod

class StressDataLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        pass
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        pass

class JSONStressLoader(StressDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    
    def validate(self, data: Any) -> bool:
        if isinstance(data, list):
            return all(self._validate_stress_entry(entry) for entry in data)
        return self._validate_stress_entry(data)
    
    def _validate_stress_entry(self, entry: Dict) -> bool:
        required_fields = ['date', 'stress_level', 'stress_factors']
        if not all(field in entry for field in required_fields):
            return False
        return True

class CSVStressLoader(StressDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        df = pd.read_csv(file_path)
        return self._convert_csv_to_stress_format(df)
    
    def validate(self, data: Any) -> bool:
        if not isinstance(data, pd.DataFrame):
            return False
        required_columns = ['Date', 'StressLevel', 'StressFactors']
        return all(col in data.columns for col in required_columns)
    
    def _convert_csv_to_stress_format(self, df: pd.DataFrame) -> List[Dict]:
        stress_entries = []
        for _, row in df.iterrows():
            stress_data = {
                'date': row['Date'],
                'stress_level': row['StressLevel'],
                'stress_factors': row['StressFactors']
            }
            stress_entries.append(stress_data)
        return stress_entries

class StressLoaderFactory:
    @staticmethod
    def get_loader(file_extension: str) -> StressDataLoader:
        if file_extension.lower() == '.json':
            return JSONStressLoader()
        elif file_extension.lower() == '.csv':
            return CSVStressLoader()
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}") 