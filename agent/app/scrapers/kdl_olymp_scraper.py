"""
Scraper for KDL Olymp (kdlolymp.kz)
Integrates with existing parser from /agent/parse/parser.py
"""
from typing import Dict, Any, List
import sys
import os

from app.scrapers.base import BaseScraper

# Add parse directory to Python path
_parse_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../parse"))
if _parse_dir not in sys.path:
    sys.path.insert(0, _parse_dir)

# Try to import parser functions
try:
    from parser import fetch_pricelist_html, parse_pricelist_html, extract_clinic_snapshot
    _parser_available = True
except Exception as e:
    print(f"Warning: Could not import KDL parser: {e}")
    fetch_pricelist_html = None
    parse_pricelist_html = None
    extract_clinic_snapshot = None
    _parser_available = False


class KDLOlympScraper(BaseScraper):
    """Scraper for KDL Olymp medical laboratories"""
    
    BASE_URL = "https://www.kdlolymp.kz"
    
    def can_scrape(self, url: str) -> bool:
        """Check if URL is from kdlolymp.kz"""
        return "kdlolymp.kz" in url
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape KDL Olymp price list using existing parser.
        
        Expected URL format:
        - https://www.kdlolymp.kz/pricelist/{city}
        """
        if not _parser_available:
            raise ImportError("KDL Olymp parser modules not available")
        
        # Extract city from URL
        city = self._extract_city_from_url(url)
        
        try:
            # Use existing parser
            payload = fetch_pricelist_html(city)
            items = parse_pricelist_html(payload.html)
            clinic_snapshot = extract_clinic_snapshot(payload.html, city, payload.source_url)
            
            # Convert ServiceItem dataclass instances to our dict format
            services = []
            for item in items:
                # ServiceItem.price is a string like "1 000 ₸" or None
                price = None
                if item.price:
                    price_str = item.price.replace("₸", "").replace(" ", "").strip()
                    try:
                        price = int(price_str)
                    except ValueError:
                        continue
                
                services.append({
                    "title": item.title,
                    "price": price,
                    "category": item.category or "Не указано",
                    "duration": item.duration,
                })
            
            return {
                "type": "kdl_olymp",
                "url": url,
                "services": services,
                "clinic_name": clinic_snapshot.clinic_name,
                "city": clinic_snapshot.city,
                "address": clinic_snapshot.address,
                "phone": clinic_snapshot.phone,
                "working_hours": clinic_snapshot.working_hours,
                "rating": clinic_snapshot.rating,
                "latitude": clinic_snapshot.latitude,
                "longitude": clinic_snapshot.longitude,
            }
            
        except Exception as e:
            print(f"Error scraping KDL Olymp: {e}")
            return {
                "type": "kdl_olymp",
                "url": url,
                "services": [],
                "error": str(e)
            }
    
    def _extract_city_from_url(self, url: str) -> str:
        """Extract city from KDL Olymp URL"""
        # URL format: https://www.kdlolymp.kz/pricelist/{city}
        parts = url.rstrip("/").split("/")
        if "pricelist" in parts:
            idx = parts.index("pricelist")
            if idx + 1 < len(parts):
                return parts[idx + 1]
        
        # Default to Shymkent
        return "shymkent"

