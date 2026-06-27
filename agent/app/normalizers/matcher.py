"""
Embedding-based semantic matcher for service names
"""
from typing import Optional, Dict, Any, List
from sentence_transformers import SentenceTransformer
import numpy as np

from app.config import get_settings
from app.utils.database import async_session_maker

settings = get_settings()


class EmbeddingMatcher:
    """Semantic matching using sentence embeddings"""
    
    _model = None
    
    @classmethod
    def get_model(cls):
        """Get embedding model (singleton)"""
        if cls._model is None:
            print(f"📦 Loading embedding model: {settings.embedding_model}")
            cls._model = SentenceTransformer(settings.embedding_model)
            print("✅ Model loaded")
        return cls._model
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        model = self.get_model()
        text_normalized = self._normalize_text(text)
        embedding = model.encode(text_normalized, normalize_embeddings=True)
        return embedding.tolist()
    
    async def find_match(
        self,
        query: str,
        threshold: float = 0.92
    ) -> Optional[Dict[str, Any]]:
        """
        Find matching canonical service using semantic similarity.
        
        Args:
            query: Service name to match
            threshold: Minimum similarity score (0-1)
            
        Returns:
            Matching canonical service or None
        """
        from sqlalchemy import text
        
        # Generate query embedding
        query_embedding = self.generate_embedding(query)
        
        # Find similar services using pgvector
        async with async_session_maker() as session:
            sql = text("""
                SELECT 
                    id,
                    title,
                    normalized_title,
                    category,
                    1 - (embedding <=> :query_embedding) as similarity
                FROM canonical_services
                WHERE embedding IS NOT NULL
                  AND 1 - (embedding <=> :query_embedding) >= :threshold
                ORDER BY embedding <=> :query_embedding
                LIMIT 1
            """)
            
            result = await session.execute(
                sql,
                {
                    "query_embedding": query_embedding,
                    "threshold": threshold
                }
            )
            
            row = result.first()
            
            if row:
                return {
                    "id": row.id,
                    "title": row.title,
                    "normalized_title": row.normalized_title,
                    "category": row.category,
                    "similarity": row.similarity
                }
            
            return None
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for embedding"""
        # Lowercase and trim
        text = text.lower().strip()
        
        # Remove extra spaces
        text = " ".join(text.split())
        
        return text
