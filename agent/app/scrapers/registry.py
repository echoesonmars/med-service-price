"""
Scraper registry - manages all available scrapers
"""
from typing import Dict, Type
from app.scrapers.base import BaseScraper
from app.scrapers.html_scraper import HTMLScraper


class ScraperRegistry:
    """Registry of all available scrapers"""
    
    _scrapers: Dict[str, Type[BaseScraper]] = {
        "html_generic": HTMLScraper,
        "html": HTMLScraper,  # Alias
    }
    
    @classmethod
    def register(cls, name: str, scraper_class: Type[BaseScraper]):
        """Register a new scraper"""
        cls._scrapers[name] = scraper_class
    
    @classmethod
    def get(cls, name: str) -> BaseScraper:
        """Get scraper instance by name"""
        scraper_class = cls._scrapers.get(name)
        
        if not scraper_class:
            raise ValueError(f"Unknown scraper type: {name}")
        
        return scraper_class()
    
    @classmethod
    def find_scraper_for_url(cls, url: str) -> BaseScraper:
        """Find best scraper for a given URL"""
        for scraper_class in cls._scrapers.values():
            scraper = scraper_class()
            if scraper.can_scrape(url):
                return scraper
        
        # Default to HTML scraper
        return HTMLScraper()
