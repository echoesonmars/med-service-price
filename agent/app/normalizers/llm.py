"""
LLM-based service normalization
"""
from typing import Dict, Any
import json
import google.generativeai as genai
from app.config import get_settings

settings = get_settings()


class LLMNormalizer:
    """Normalize service names using LLM"""
    
    def __init__(self):
        self.provider = settings.llm_provider
        self.model_name = settings.llm_model
        
        if self.provider == "google":
            genai.configure(api_key=settings.google_api_key)
            self.model = genai.GenerativeModel(self.model_name)
    
    async def normalize(self, raw_service: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a raw service name using LLM.
        
        Args:
            raw_service: Dict with 'title', 'price', etc.
            
        Returns:
            Normalized service dict with:
            - title: Canonical title
            - normalized_title: Lowercase normalized
            - category: Medical category
            - description: Optional description
            - parameters: JSON with parameters (contrast, anesthesia, etc.)
        """
        title = raw_service.get("title", "")
        
        prompt = f"""Ты - эксперт по медицинским услугам в Казахстане. Нормализуй название медицинской услуги.

Исходное название: "{title}"

Задачи:
1. Определи каноническое название услуги (стандартизированное, как в медицинских справочниках)
2. Определи категорию услуги (анализы, узи, мрт, кт, прием_врача, диагностика, стоматология, лаборатория)
3. Выдели параметры услуги:
   - with_contrast: есть ли контраст (для МРТ/КТ)
   - with_anesthesia: есть ли наркоз/анестезия
   - body_part: часть тела (для МРТ/КТ/УЗИ)
4. Добавь краткое описание (1-2 предложения)

Верни JSON:
{{
  "title": "Каноническое название",
  "normalized_title": "нормализованное название (lowercase)",
  "category": "категория",
  "description": "Описание услуги",
  "parameters": {{
    "with_contrast": true/false,
    "with_anesthesia": true/false,
    "body_part": "часть тела или null"
  }}
}}

Отвечай только JSON, без дополнительного текста."""

        try:
            if self.provider == "google":
                response = self.model.generate_content(prompt)
                response_text = response.text
            else:
                raise ValueError(f"Unsupported LLM provider: {self.provider}")
            
            # Parse JSON from response
            # Clean response (remove markdown code blocks if present)
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            normalized = json.loads(response_text.strip())
            
            # Ensure normalized_title is lowercase
            if "normalized_title" not in normalized:
                normalized["normalized_title"] = normalized["title"].lower()
            
            # Convert parameters to JSON string
            if "parameters" in normalized:
                normalized["parameters"] = json.dumps(normalized["parameters"])
            
            return normalized
            
        except Exception as e:
            print(f"❌ LLM normalization failed: {e}")
            
            # Fallback: basic normalization
            return {
                "title": title,
                "normalized_title": title.lower(),
                "category": raw_service.get("category", "Не указано"),
                "description": None,
                "parameters": json.dumps({})
            }
