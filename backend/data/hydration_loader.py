import json
import pandas as pd
from typing import Dict, List, Any, Union
from abc import ABC, abstractmethod

class HydrationDataLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        pass
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        pass

class JSONHydrationLoader(HydrationDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    
    def validate(self, data: Any) -> bool:
        if isinstance(data, list):
            return all(self._validate_hydration_entry(entry) for entry in data)
        return self._validate_hydration_entry(data)
    
    def _validate_hydration_entry(self, entry: Dict) -> bool:
        required_fields = ['date', 'water_intake', 'hydration_quality']
        if not all(field in entry for field in required_fields):
            return False
        return True

class CSVHydrationLoader(HydrationDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        df = pd.read_csv(file_path)
        return self._convert_csv_to_hydration_format(df)
    
    def validate(self, data: Any) -> bool:
        if not isinstance(data, pd.DataFrame):
            return False
        required_columns = ['Date', 'WaterIntake', 'HydrationQuality']
        return all(col in data.columns for col in required_columns)
    
    def _convert_csv_to_hydration_format(self, df: pd.DataFrame) -> List[Dict]:
        hydration_entries = []
        for _, row in df.iterrows():
            hydration_data = {
                'date': row['Date'],
                'water_intake': row['WaterIntake'],
                'hydration_quality': row['HydrationQuality']
            }
            hydration_entries.append(hydration_data)
        return hydration_entries

class HydrationLoaderFactory:
    @staticmethod
    def get_loader(file_extension: str) -> HydrationDataLoader:
        if file_extension.lower() == '.json':
            return JSONHydrationLoader()
        elif file_extension.lower() == '.csv':
            return CSVHydrationLoader()
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}") 