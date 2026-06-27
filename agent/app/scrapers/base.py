"""
Base scraper class
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import time
import aiohttp
from app.config import get_settings

settings = get_settings()


class BaseScraper(ABC):
    """Base class for all scrapers"""
    
    def __init__(self):
        self.user_agent = settings.user_agent
        self.delay = settings.scraping_delay
        self.timeout = settings.scraping_timeout
        self.last_request_time = 0
    
    def respect_rate_limit(self):
        """Ensure minimum delay between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self.last_request_time = time.time()
    
    async def fetch_url(self, url: str) -> str:
        """
        Fetch URL with rate limiting and error handling.
        
        Args:
            url: URL to fetch
            
        Returns:
            HTML content
        """
        self.respect_rate_limit()
        
        headers = {
            "User-Agent": self.user_agent,
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                response.raise_for_status()
                return await response.text()
    
    @abstractmethod
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape a URL and return structured data.
        
        Args:
            url: URL to scrape
            
        Returns:
            Dict with 'type', 'services', and other metadata
        """
        pass
    
    @abstractmethod
    def can_scrape(self, url: str) -> bool:
        """
        Check if this scraper can handle the given URL.
        
        Args:
            url: URL to check
            
        Returns:
            True if scraper can handle this URL
        """
        pass
