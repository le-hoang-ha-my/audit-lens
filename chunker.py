from typing import List, Dict
from transformers import AutoTokenizer
import spacy

class TextChunker:
    def __init__(
        self,
        tokenizer_name: str = "Qwen/Qwen3-0.6B",
        chunk_size: int = 400,
        overlap: int = 50
    ):
        self.tokenizer = AutoTokenizer.from_pretrained(
            tokenizer_name,
            trust_remote_code=True
        )
        self.chunk_size = chunk_size
        self.overlap = overlap
        
        try:
            self.nlp = spacy.load("en_core_web_sm", disable=["ner", "parser", "lemmatizer"])
            self.nlp.enable_pipe("senter") # enable sentencizer (full parser is better but slower)
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm", disable=["ner", "parser", "lemmatizer"])
            self.nlp.enable_pipe("senter")
            
    def split_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences.
        """
        doc = self.nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents]
        sentences = [s for s in sentences if s]
        
        return sentences
    
    def count_tokens(self, text: str) -> int:
        return len(self.tokenizer.encode(text, add_special_tokens=True))
    
    def chunk(self, text: str, metadata: Dict = None) -> List[Dict]:
        """
        Chunk text into overlapping segments.
        """
        total_tokens = self.count_tokens(text)
        
        if total_tokens <= self.chunk_size:
            return [{
                'text': text,
                'metadata': metadata or {},
                'chunk_index': 0,
                'total_chunks': 1,
                'tokens': total_tokens
            }]
        
        sentences = self.split_sentences(text)
        
        if not sentences: # no sentences found
            return [{
                'text': text,
                'metadata': metadata or {},
                'chunk_index': 0,
                'total_chunks': 1,
                'tokens': total_tokens
            }]
        
        chunks = []
        curr_sentences = []
        curr_tokens = 0
        
        for sentence in sentences:
            sentence_tokens = self.count_tokens(sentence)
            
            # very long sentence, put in its own chunk
            if sentence_tokens > self.chunk_size:
                if curr_sentences: # finish current chunk first
                    chunks.append({
                        'sentences': curr_sentences[:],
                        'tokens': curr_tokens
                    })
                    curr_sentences = []
                    curr_tokens = 0
                
                chunks.append({
                    'sentences': [sentence],
                    'tokens': sentence_tokens
                })
                continue
            
            # check if adding this sentence would exceed chunk limit
            if curr_tokens + sentence_tokens > self.chunk_size and curr_sentences:
                chunks.append({
                    'sentences': curr_sentences[:],
                    'tokens': curr_tokens
                })
                
                overlap_sentences = []
                overlap_tokens = 0
                
                # Add sentences from end of previous chunk for overlap
                for prev in reversed(curr_sentences):
                    prev_tokens = self.count_tokens(prev)
                    if overlap_tokens + prev_tokens <= self.overlap:
                        overlap_sentences.insert(0, prev)
                        overlap_tokens += prev_tokens
                    else:
                        break
                
                curr_sentences = overlap_sentences
                curr_tokens = overlap_tokens
            
            curr_sentences.append(sentence)
            curr_tokens += sentence_tokens
        
        if curr_sentences:
            chunks.append({
                'sentences': curr_sentences,
                'tokens': curr_tokens
            })
        
        formatted_chunks = []
        for i, chunk in enumerate(chunks):
            formatted_chunks.append({
                'text': ' '.join(chunk['sentences']),
                'metadata': metadata or {},
                'chunk_index': i,
                'total_chunks': len(chunks),
                'tokens': chunk['tokens']
            })
        
        return formatted_chunks


if __name__ == "__main__":
    chunker = TextChunker(chunk_size=100, overlap=20)
    text = " ".join([f"This is sentence number {i}." for i in range(50)])
    chunks = chunker.chunk(text)
    
    print(f"Num tokens: {chunker.count_tokens(text)}")
    print(f"Num chunks: {len(chunks)}")
    for chunk in chunks:
        print(f"Chunk {chunk['chunk_index']}: {chunk['tokens']} tokens")