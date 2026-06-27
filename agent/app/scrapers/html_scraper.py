"""
HTML scraper for generic clinic websites
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import re
import asyncio

from app.scrapers.base import BaseScraper


class HTMLScraper(BaseScraper):
    """Generic HTML scraper for price lists"""
    
    def can_scrape(self, url: str) -> bool:
        """Can scrape any HTML page"""
        return url.startswith("http")
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape HTML page and extract services.
        
        Looks for common patterns:
        - Tables with price columns
        - Lists with service names and prices
        - Structured divs with class patterns
        """
        html = asyncio.run(self.fetch_url(url))
        soup = BeautifulSoup(html, "html.parser")
        
        services = []
        
        # Try different extraction strategies
        services.extend(self._extract_from_tables(soup))
        services.extend(self._extract_from_lists(soup))
        services.extend(self._extract_from_divs(soup))
        
        return {
            "type": "html",
            "url": url,
            "services": services,
            "html": html  # Store for audit
        }
    
    def _extract_from_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from HTML tables"""
        services = []
        
        # Find tables that likely contain prices
        tables = soup.find_all("table")
        
        for table in tables:
            rows = table.find_all("tr")
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all(["td", "th"])
                
                if len(cells) < 2:
                    continue
                
                # Extract text from cells
                texts = [cell.get_text(strip=True) for cell in cells]
                
                # Try to identify service name and price
                service_name = None
                price = None
                category = None
                
                for i, text in enumerate(texts):
                    # Look for price patterns (digits with optional currency)
                    price_match = re.search(r'(\d[\d\s]*\d|\d+)', text)
                    if price_match and not service_name:
                        # Previous cell is likely the service name
                        if i > 0:
                            service_name = texts[i - 1]
                            price = int(price_match.group(1).replace(" ", ""))
                    
                    # Check for category in first cell
                    if i == 0 and not price_match:
                        category = text
                
                if service_name and price:
                    services.append({
                        "title": service_name,
                        "price": price,
                        "category": category or "Не указано",
                    })
        
        return services
    
    def _extract_from_lists(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from lists (ul/ol)"""
        services = []
        
        # Find lists
        lists = soup.find_all(["ul", "ol"])
        
        for lst in lists:
            items = lst.find_all("li")
            
            for item in items:
                text = item.get_text(strip=True)
                
                # Pattern: "Service name - 1000 тг" or "Service: 1000"
                match = re.match(r'(.+?)[\s\-:]+(\d[\d\s]*\d|\d+)', text)
                
                if match:
                    service_name = match.group(1).strip()
                    price = int(match.group(2).replace(" ", ""))
                    
                    services.append({
                        "title": service_name,
                        "price": price,
                        "category": "Не указано",
                    })
        
        return services
    
    def _extract_from_divs(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from structured divs"""
        services = []
        
        # Common class patterns for service cards
        patterns = [
            "service",
            "price-item",
            "pricelist-item",
            "analysis",
            "medical-service"
        ]
        
        for pattern in patterns:
            items = soup.find_all("div", class_=re.compile(pattern, re.I))
            
            for item in items:
                # Try to find title and price elements
                title_elem = item.find(["h3", "h4", "h5", "span", "div"], class_=re.compile("title|name", re.I))
                price_elem = item.find(["span", "div", "p"], class_=re.compile("price|cost", re.I))
                
                if title_elem and price_elem:
                    title = title_elem.get_text(strip=True)
                    price_text = price_elem.get_text(strip=True)
                    
                    price_match = re.search(r'(\d[\d\s]*\d|\d+)', price_text)
                    if price_match:
                        price = int(price_match.group(1).replace(" ", ""))
                        
                        services.append({
                            "title": title,
                            "price": price,
                            "category": "Не указано",
                        })
        
        return services
