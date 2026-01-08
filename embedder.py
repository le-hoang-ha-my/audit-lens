import torch
from transformers import AutoTokenizer, AutoModel
from typing import List
import numpy as np
from tqdm import tqdm


class Qwen3Embedder:
    """
    Generates embeddings.
    """

    def __init__(self, model_name: str = "Qwen/Qwen3-0.6B", device: str = None):
        self.device = device or (
            'cuda' if torch.cuda.is_available() else 'cpu')

        print(f"Using {self.device}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True
        )

        self.model = AutoModel.from_pretrained(
            model_name,
            trust_remote_code=True
        ).to(self.device)

        self.model.eval()
        self.hidden_size = self.model.config.hidden_size  # 1024 for Qwen3-0.6B

    def mean_pooling(
        self,
        model_output: torch.Tensor,
        attention_mask: torch.Tensor
    ) -> torch.Tensor:
        """
        Convert token embeddings into sentence embedding via mean pooling.
        """
        token_embeddings = model_output[0]  # (batch, seq_len, hidden_size)
        mask_expanded = attention_mask.unsqueeze(
            -1).expand(token_embeddings.size()).float()

        sum_embeddings = torch.sum(token_embeddings * mask_expanded, dim=1)
        sum_mask = torch.clamp(mask_expanded.sum(dim=1), min=1e-9)

        return sum_embeddings / sum_mask  # (batch, hidden_size)

    def encode(
        self,
        texts: List[str],
        batch_size: int = 8,
        show_progress: bool = True,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Generate embeddings for texts.
        """
        embeddings_list = []
        
        batches = [texts[i:i + batch_size] for i in range(0, len(texts), batch_size)]
        
        if show_progress:
            batches = tqdm(batches, desc="Generating embeddings")
        
        with torch.no_grad():
            for batch in batches:
                encoded = self.tokenizer(
                    batch,
                    padding=True,
                    return_tensors='pt'
                ).to(self.device)
                
                model_output = self.model(**encoded)
                
                embeddings = self.mean_pooling(model_output, encoded['attention_mask'])
                
                if normalize:
                    embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
                
                embeddings_list.append(embeddings.cpu().numpy())
        
        return np.concatenate(embeddings_list, axis=0)

    def get_dimension(self) -> int:
        return self.hidden_size


if __name__ == "__main__":
    embedder = Qwen3Embedder()

    texts = ["What is the categorical imperative?",
             "Kant's ethics focuses on duty and moral law."]

    embeddings = embedder.encode(texts, show_progress=False)
    print(f"Embeddings shape: {embeddings.shape}")  # (2, 1024)
    print(f"Normalized? {np.allclose(np.linalg.norm(embeddings, axis=1), 1.0)}")
