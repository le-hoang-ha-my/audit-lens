from datasets import load_dataset
from typing import List, Dict
import json

def load_data(dataset_name: str = "AiresPucrs/stanford-encyclopedia-philosophy", split: str = 'train') -> List[Dict]:
    ds = load_dataset(dataset_name, split=split)
    
    documents = []
    for idx, item in enumerate(ds):
        document = {
            "id": str(idx),
            "title": item['category'].replace('-', ' ').title(), # human readable title
            "text": item['text'],
            'category': item['category'],
            'source_url': item['metadata'],
        }
        documents.append(document)
    
    return documents

if __name__ == "__main__":
    data = load_data()