import json
import pandas as pd
from typing import Dict, List, Any, Union
from abc import ABC, abstractmethod

class SleepDataLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        pass
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        pass

class JSONSleepLoader(SleepDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    
    def validate(self, data: Any) -> bool:
        if isinstance(data, list):
            return all(self._validate_sleep_entry(entry) for entry in data)
        return self._validate_sleep_entry(data)
    
    def _validate_sleep_entry(self, entry: Dict) -> bool:
        required_fields = ['date', 'sleep_hours', 'sleep_quality']
        if not all(field in entry for field in required_fields):
            return False
        return True

class CSVSleepLoader(SleepDataLoader):
    def load(self, file_path: str) -> Union[Dict, List[Dict]]:
        df = pd.read_csv(file_path)
        return self._convert_csv_to_sleep_format(df)
    
    def validate(self, data: Any) -> bool:
        if not isinstance(data, pd.DataFrame):
            return False
        required_columns = ['Date', 'SleepHours', 'SleepQuality']
        return all(col in data.columns for col in required_columns)
    
    def _convert_csv_to_sleep_format(self, df: pd.DataFrame) -> List[Dict]:
        sleep_entries = []
        for _, row in df.iterrows():
            sleep_data = {
                'date': row['Date'],
                'sleep_hours': row['SleepHours'],
                'sleep_quality': row['SleepQuality']
            }
            sleep_entries.append(sleep_data)
        return sleep_entries

class SleepLoaderFactory:
    @staticmethod
    def get_loader(file_extension: str) -> SleepDataLoader:
        if file_extension.lower() == '.json':
            return JSONSleepLoader()
        elif file_extension.lower() == '.csv':
            return CSVSleepLoader()
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}") 