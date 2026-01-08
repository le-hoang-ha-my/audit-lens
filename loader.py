from datasets import load_dataset
from typing import List, Dict


class DataLoader:
    """
    Loads dataset.
    """
    
    def __init__(self, dataset_name: str = "AiresPucrs/stanford-encyclopedia-philosophy"):
        self.dataset_name = dataset_name
    
    def load(self, split: str = 'train') -> List[Dict]:
        ds = load_dataset(self.dataset_name, split=split)
        
        documents = []
        skipped = 0
        
        for idx, item in enumerate(ds):
            if not item.get('text') or not item.get('category'):
                skipped += 1
                continue
            
            title = item['category'].replace('-', ' ').title()
            
            doc = {
                'id': f"doc_{idx}",
                'text': f"Article: {title}\n{item['text']}",
                'category': item['category'],
                'article_title': title,
                'source_url': item.get('metadata', ''),
            }
            
            documents.append(doc)
                
        return documents

if __name__ == "__main__":
    loader = DataLoader()
    docs = loader.load()
    doc = docs[0]
    print(f"{doc['article_title']}")
    print(f"{doc['category']}")
    print(f"{doc['text']}")