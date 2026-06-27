from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from functools import lru_cache

from app.config import get_settings

settings = get_settings()


class EmbeddingService:
    """Сервис для работы с эмбеддингами (векторными представлениями текста)"""
    
    _model = None
    
    @classmethod
    def get_model(cls):
        """Получить модель (singleton)"""
        if cls._model is None:
            print(f"📦 Loading embedding model: {settings.embedding_model}")
            cls._model = SentenceTransformer(settings.embedding_model)
            print("✅ Model loaded successfully")
        return cls._model
    
    @classmethod
    def encode(cls, text: str) -> List[float]:
        """
        Создать эмбеддинг для текста.
        
        Args:
            text: Текст для кодирования
            
        Returns:
            Вектор эмбеддинга (384 размерности для multilingual-MiniLM)
        """
        model = cls.get_model()
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    
    @classmethod
    def encode_batch(cls, texts: List[str]) -> List[List[float]]:
        """
        Создать эмбеддинги для списка текстов (батч-обработка).
        
        Args:
            texts: Список текстов
            
        Returns:
            Список векторов эмбеддингов
        """
        model = cls.get_model()
        embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()
    
    @classmethod
    def cosine_similarity(cls, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Вычислить косинусное сходство между двумя эмбеддингами.
        
        Args:
            embedding1: Первый вектор
            embedding2: Второй вектор
            
        Returns:
            Сходство от 0 до 1
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Косинусное сходство
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        
        return float(similarity)
    
    @classmethod
    def normalize_text_for_embedding(cls, text: str) -> str:
        """
        Нормализовать текст перед созданием эмбеддинга.
        
        Args:
            text: Исходный текст
            
        Returns:
            Нормализованный текст
        """
        # Приведение к нижнему регистру
        text = text.lower().strip()
        
        # Удаление лишних пробелов
        text = " ".join(text.split())
        
        return text
