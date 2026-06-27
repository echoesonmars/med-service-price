"""
Scraper for generic medical clinic websites in Kazakhstan
Supports multiple medical service providers
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import re
import asyncio

from app.scrapers.base import BaseScraper


class MedCenterScraper(BaseScraper):
    """Generic scraper for Kazakh medical centers"""
    
    # Common medical centers in Kazakhstan
    SUPPORTED_DOMAINS = [
        "interteach.kz",
        "mediker.kz",
        "emc.kz",
        "smdoctor.kz",
        "nurlyadent.kz",
        "europeanmedicalcenter.kz",
        "viva.kz",
        "kazmedcentr.kz",
    ]
    
    def can_scrape(self, url: str) -> bool:
        """Check if URL is from supported medical centers"""
        return any(domain in url for domain in self.SUPPORTED_DOMAINS)
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape medical center price list.
        Uses heuristics to detect service cards and price tables.
        """
        html = asyncio.run(self.fetch_url(url))
        soup = BeautifulSoup(html, "html.parser")
        
        services = []
        
        # Try multiple extraction strategies
        services.extend(self._extract_from_service_blocks(soup))
        services.extend(self._extract_from_tables(soup))
        services.extend(self._extract_from_lists(soup))
        
        # Deduplicate
        seen = set()
        unique_services = []
        for service in services:
            key = (service["title"], service["price"])
            if key not in seen:
                seen.add(key)
                unique_services.append(service)
        
        return {
            "type": "medical_center",
            "url": url,
            "services": unique_services,
        }
    
    def _extract_from_service_blocks(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from structured blocks/cards"""
        services = []
        
        # Common patterns for service blocks
        patterns = [
            "service",
            "price-item",
            "price-card",
            "analysis",
            "medical-service",
            "procedure",
            "usluga",
        ]
        
        for pattern in patterns:
            blocks = soup.find_all(["div", "article", "section"], 
                                  class_=re.compile(pattern, re.I))
            
            for block in blocks:
                service = self._extract_service_from_block(block)
                if service:
                    services.append(service)
        
        return services
    
    def _extract_service_from_block(self, block) -> Dict[str, Any] | None:
        """Extract service info from a block element"""
        # Find title
        title_elem = block.find(["h3", "h4", "h5", "h6", "a", "span", "div"], 
                               class_=re.compile(r"title|name|heading", re.I))
        
        if not title_elem:
            # Try data attributes
            title_elem = block.find(attrs={"data-name": True}) or \
                        block.find(attrs={"data-title": True})
        
        # Find price
        price_elem = block.find(["span", "div", "p", "strong"], 
                               class_=re.compile(r"price|cost|summ|стоимост", re.I))
        
        if not price_elem:
            # Try data attributes
            price_elem = block.find(attrs={"data-price": True}) or \
                        block.find(attrs={"data-cost": True})
        
        if title_elem and price_elem:
            title = title_elem.get_text(strip=True)
            price_text = price_elem.get("data-price") or \
                        price_elem.get("data-cost") or \
                        price_elem.get_text(strip=True)
            
            # Extract numeric price
            price_match = re.search(r'(\d[\d\s]*\d|\d+)', str(price_text))
            if price_match and title:
                price = int(price_match.group(1).replace(" ", ""))
                
                # Try to find category
                category = "Не указано"
                category_elem = block.find(["span", "div", "p"], 
                                          class_=re.compile(r"category|type|группа", re.I))
                if category_elem:
                    category = category_elem.get_text(strip=True)
                
                return {
                    "title": title,
                    "price": price,
                    "category": category,
                }
        
        return None
    
    def _extract_from_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from price tables"""
        services = []
        
        tables = soup.find_all("table")
        
        for table in tables:
            # Check if this looks like a price table
            table_text = table.get_text(strip=True).lower()
            if not any(kw in table_text for kw in ["цена", "стоимость", "тг", "₸", "тенге"]):
                continue
            
            rows = table.find_all("tr")
            current_category = "Не указано"
            
            for row in rows:
                cells = row.find_all(["td", "th"])
                
                if len(cells) == 0:
                    continue
                
                # Single cell might be category header
                if len(cells) == 1:
                    text = cells[0].get_text(strip=True)
                    # Category headers usually don't contain numbers
                    if text and not re.search(r'\d{2,}', text):
                        current_category = text
                    continue
                
                # Multiple cells: extract service and price
                texts = [cell.get_text(strip=True) for cell in cells]
                
                # First cell is usually service name
                service_name = texts[0]
                
                # Find price in remaining cells
                price = None
                for text in texts[1:]:
                    price_match = re.search(r'(\d[\d\s]*\d|\d+)', text)
                    if price_match:
                        try:
                            price = int(price_match.group(1).replace(" ", ""))
                            break
                        except ValueError:
                            continue
                
                if service_name and price and price > 0:
                    services.append({
                        "title": service_name,
                        "price": price,
                        "category": current_category,
                    })
        
        return services
    
    def _extract_from_lists(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from list elements"""
        services = []
        
        lists = soup.find_all(["ul", "ol"])
        
        for lst in lists:
            # Check if this is a price list
            list_text = lst.get_text(strip=True).lower()
            if not any(kw in list_text for kw in ["тг", "₸", "тенге", "цена"]):
                continue
            
            items = lst.find_all("li")
            
            for item in items:
                text = item.get_text(strip=True)
                
                # Pattern: "Service name - 1000 тг" or "Service: 1000"
                match = re.match(r'(.+?)[\s\-:–]+(\d[\d\s]*\d|\d+)', text)
                
                if match:
                    service_name = match.group(1).strip()
                    try:
                        price = int(match.group(2).replace(" ", ""))
                        
                        services.append({
                            "title": service_name,
                            "price": price,
                            "category": "Не указано",
                        })
                    except ValueError:
                        continue
        
        return services
