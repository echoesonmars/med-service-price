"""
Scraper registry - manages all available scrapers
"""
from typing import Dict, Type
from app.scrapers.base import BaseScraper
from app.scrapers.html_scraper import HTMLScraper
from app.scrapers.invitro_scraper import InvitroScraper
from app.scrapers.kdl_olymp_scraper import KDLOlympScraper
from app.scrapers.medcenter_scraper import MedCenterScraper


class ScraperRegistry:
    """Registry of all available scrapers"""
    
    _scrapers: Dict[str, Type[BaseScraper]] = {
        "html_generic": HTMLScraper,
        "html": HTMLScraper,  # Alias
        "invitro": InvitroScraper,
        "kdl_olymp": KDLOlympScraper,
        "medcenter": MedCenterScraper,
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
        # Try specialized scrapers first (order matters - most specific first)
        specialized = [
            KDLOlympScraper,
            InvitroScraper,
            MedCenterScraper,
        ]
        
        for scraper_class in specialized:
            scraper = scraper_class()
            if scraper.can_scrape(url):
                return scraper
        
        # Default to generic HTML scraper
        return HTMLScraper()
    
    @classmethod
    def list_scrapers(cls) -> Dict[str, Type[BaseScraper]]:
        """List all registered scrapers"""
        return cls._scrapers.copy()
