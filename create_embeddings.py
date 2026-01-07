import json
from typing import List, Dict
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import chromadb
from chromadb.config import Settings
from tqdm import tqdm
import time
import numpy as np


class Qwen3EmbeddingModel:
    def __init__(self, model_name="Qwen/Qwen3-0.6B", device=None):
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            trust_remote_code=True
        ).to(self.device)

        self.model.eval()

    def get_embedding_dimension(self) -> int:
        return self.model.config.hidden_size  # 896 for Qwen3-0.6B

    def mean_pooling(self, model_output, attention_mask):
        """
        Averages all token embeddings weighted by attention mask.
        Returns a single vector representing the entire text.
        """
        embeddings = model_output[0]  # output dim is (batch_size, seq_len, hidden_size)
        # original mask dim is (batch_size, seq_len)
        mask = attention_mask.unsqueeze(-1).expand(embeddings.size()).float()
        sum_embeddings = torch.sum(embeddings * mask, 1)
        sum_mask = torch.clamp(mask.sum(1), min=1e-9)

        return sum_embeddings / sum_mask  # (batch_size, hidden_size)

    def encode(self, texts, batch_size=8, show_progress_bar=True, normalize=True):
        """
        Generate embeddings for a list of texts.
        Returns a numpy array of shape (len(texts), embedding_dim)
        """
        all_embeddings = []
        batches = [texts[i:i + batch_size]
                   for i in range(0, len(texts), batch_size)]

        if show_progress_bar:
            batches = tqdm(batches, desc="Encoding")

        with torch.no_grad():
            for batch in batches:
                encoded = self.tokenizer(
                    batch,
                    padding=True,
                    truncation=True,
                    max_length=512,  # context length
                    return_tensors='pt'
                ).to(self.device)

                model_output = self.model(**encoded)

                embeddings = self.mean_pooling(
                    model_output,
                    encoded['attention_mask']
                )

                if normalize:
                    embeddings = torch.nn.functional.normalize(
                        embeddings, p=2, dim=1)

                all_embeddings.append(embeddings.cpu().numpy())

        return np.concatenate(all_embeddings, axis=0)


class VectorStore:
    def __init__(self, persist_directory="./data"):
        self.embedding_model = Qwen3EmbeddingModel()
        self.client = chromadb.Client(Settings(
            persist_directory=persist_directory,
            anonymized_telemetry=False
        ))

        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name="philosophy_articles_qwen3",
            metadata={
                "description": "Stanford Encyclopedia of Philosophy",
                "embedding_model": "Qwen3-0.6B",
                "embedding_dimension": str(self.embedding_model.get_embedding_dimension())
            }
        )

    def embed_texts(self, texts, batch_size=8):
        """
        Generate embeddings for a list of texts.
        Returns a list of embedding vectors (each is a list of floats)
        """
        embeddings = self.embedding_model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize=True
        )

        return [emb.tolist() for emb in embeddings]

    def add_documents(self, documents, batch_size=50):
        """
        Add documents to the vector store in batches.
        """
        total_docs = len(documents)

        for i in tqdm(range(0, total_docs, batch_size), desc="Adding docs"):
            batch = documents[i:i + batch_size]

            ids = [doc['id'] for doc in batch]
            texts = [doc['enriched_text'] for doc in batch]

            metadatas = [
                {
                    'category': doc['category'],
                    'source_url': doc['source_url'],
                    'article_title': doc['article_title'],
                    'original_text': doc['original_text']
                }
                for doc in batch
            ]

            embeddings = self.embed_texts(texts, batch_size=8)

            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts
            )

    def search(self, query: str, n_results: int = 5) -> Dict:
        """
        Search for relevant documents.
        Returns dictionary with 'documents', 'metadatas', and 'distances'
        """
        query_embedding = self.embedding_model.encode(
            [query],
            show_progress_bar=False
        )[0].tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        return results