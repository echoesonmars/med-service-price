"""
Scraper for iTeka Kazakhstan (i-teka.kz)
Integrates with existing parser from /agent/parse/iteka_parser.py
"""
from typing import Dict, Any, List
import sys
import os

from app.scrapers.base import BaseScraper

# Add parse directory to Python path
_parse_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../parse"))
if _parse_dir not in sys.path:
    sys.path.insert(0, _parse_dir)

# Try to import iteka parser functions
try:
    from iteka_parser import (
        fetch_drug_list,
        parse_drug_list_html,
        fetch_drug_page,
        parse_drug_page_html,
        has_next_page,
        ITEKA_DEFAULT_CITY,
    )
    _parser_available = True
except Exception as e:
    print(f"Warning: Could not import iTeka parser: {e}")
    fetch_drug_list = None
    parse_drug_list_html = None
    fetch_drug_page = None
    parse_drug_page_html = None
    has_next_page = None
    ITEKA_DEFAULT_CITY = "astana"
    _parser_available = False


class ITekaScraper(BaseScraper):
    """Scraper for iTeka online pharmacy (medication/drug prices)"""
    
    BASE_URL = "https://i-teka.kz"
    
    def can_scrape(self, url: str) -> bool:
        """Check if URL is from i-teka.kz"""
        return "i-teka.kz" in url or "iteka.kz" in url
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape iTeka medication catalog.
        
        Expected URL format:
        - https://i-teka.kz/{city}/medicamentsalphabetically
        - https://i-teka.kz/{city}/medicaments/{slug}
        """
        if not _parser_available:
            raise ImportError("iTeka parser modules not available")
        
        # Extract city from URL
        city = self._extract_city_from_url(url)
        
        try:
            # Scrape catalog pages (paginated)
            all_drugs = []
            page = 1
            max_pages = 50  # Safety limit
            
            while page <= max_pages:
                print(f"📄 Scraping iTeka catalog page {page} for {city}...")
                
                html = fetch_drug_list(city, page)
                drugs = parse_drug_list_html(html, city)
                
                if not drugs:
                    print(f"✅ No more drugs on page {page}, stopping")
                    break
                
                all_drugs.extend(drugs)
                
                # Check if there's a next page
                if not has_next_page(html):
                    print(f"✅ Reached last page at page {page}")
                    break
                
                page += 1
            
            print(f"✅ Scraped {len(all_drugs)} medications from iTeka {city}")
            
            # Convert DrugListItem dataclass instances to our dict format
            services = []
            for drug in all_drugs:
                # For catalog listing, we don't have prices yet
                # We'd need to scrape individual drug pages for that
                # For now, just list the medications
                services.append({
                    "title": drug.name,
                    "price": None,  # Not available in catalog listing
                    "category": "Медикаменты" if not drug.prescription_required else "Рецептурные медикаменты",
                    "prescription_required": drug.prescription_required,
                    "pharmacy_count": drug.pharmacy_count,
                    "drug_id": drug.drug_id,
                    "url": drug.url,
                })
            
            return {
                "type": "iteka",
                "url": url,
                "services": services,
                "clinic_name": f"iTeka Аптеки - {city.title()}",
                "city": city,
                "total_medications": len(services),
            }
            
        except Exception as e:
            print(f"Error scraping iTeka: {e}")
            import traceback
            traceback.print_exc()
            return {
                "type": "iteka",
                "url": url,
                "services": [],
                "error": str(e)
            }
    
    def _extract_city_from_url(self, url: str) -> str:
        """Extract city from iTeka URL"""
        # URL format: https://i-teka.kz/{city}/medicamentsalphabetically
        parts = url.rstrip("/").split("/")
        
        # Find the city - it's usually the first path segment after domain
        for i, part in enumerate(parts):
            if "i-teka.kz" in part or "iteka.kz" in part:
                if i + 1 < len(parts) and parts[i + 1]:
                    return parts[i + 1]
        
        # Default to Astana
        return ITEKA_DEFAULT_CITY
