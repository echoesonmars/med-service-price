"""
HTML parser for price lists
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import re


class HTMLParser:
    """Parse HTML price lists"""
    
    def parse(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse HTML from raw_data.
        
        Args:
            raw_data: Dict with 'html' key containing HTML content
            
        Returns:
            List of service dicts
        """
        html = raw_data.get("html", "")
        services = raw_data.get("services", [])
        
        # If services already extracted by scraper, return them
        if services:
            return services
        
        # Otherwise parse HTML
        soup = BeautifulSoup(html, "html.parser")
        return self._extract_services(soup)
    
    def _extract_services(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from HTML"""
        services = []
        
        # Try to find service items
        # This is a generic implementation, can be extended
        
        # Pattern 1: Tables
        for table in soup.find_all("table"):
            services.extend(self._parse_table(table))
        
        return services
    
    def _parse_table(self, table) -> List[Dict[str, Any]]:
        """Parse a price table"""
        services = []
        rows = table.find_all("tr")
        
        for row in rows[1:]:  # Skip header
            cells = row.find_all(["td", "th"])
            
            if len(cells) >= 2:
                title = cells[0].get_text(strip=True)
                price_text = cells[-1].get_text(strip=True)
                
                # Extract price
                price_match = re.search(r'(\d[\d\s]*\d|\d+)', price_text)
                if price_match:
                    price = int(price_match.group(1).replace(" ", ""))
                    
                    services.append({
                        "title": title,
                        "price": price,
                        "category": "Не указано",
                    })
        
        return services
