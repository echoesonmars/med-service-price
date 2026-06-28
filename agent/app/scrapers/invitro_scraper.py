"""
Scraper for Invitro Kazakhstan (invitro.kz)
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import re
import asyncio

from app.scrapers.base import BaseScraper


class InvitroScraper(BaseScraper):
    """Scraper for Invitro medical laboratories"""
    
    BASE_URL = "https://invitro.kz"
    
    def can_scrape(self, url: str) -> bool:
        """Check if URL is from invitro.kz"""
        return "invitro.kz" in url
    
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape Invitro price list.
        
        Expected URL formats:
        - https://invitro.kz/analizes/
        - https://invitro.kz/prices/
        """
        html = asyncio.run(self.fetch_url(url))
        soup = BeautifulSoup(html, "html.parser")
        
        services = []
        
        # Invitro uses different layouts, try multiple strategies
        services.extend(self._extract_from_analysis_cards(soup))
        services.extend(self._extract_from_price_tables(soup))
        
        return {
            "type": "invitro",
            "url": url,
            "services": services,
            "clinic_name": "Invitro",
        }
    
    def _extract_from_analysis_cards(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from analysis cards"""
        services = []
        
        # Look for the new 'analyzes-item' class used by invitro.kz
        items = soup.select(".analyzes-item")
        
        if items:
            for item in items:
                title_elem = item.select_one(".analyzes-item__title")
                price_elem = item.select_one(".analyzes-item__total--price")
                category = "Лабораторная диагностика" # Default category
                
                # Check category from the preceding subtitle section
                section = item.find_previous(class_="item_section_card")
                if section:
                    subtitle = section.find_previous(class_="result-list__subtitle")
                    if subtitle:
                        category = subtitle.get_text(strip=True)
                
                if title_elem and price_elem:
                    title = title_elem.get_text(strip=True)
                    price_text = price_elem.get_text(strip=True)
                    
                    price_match = re.search(r'(\d[\d\s]*\d|\d+)', price_text)
                    if price_match and title:
                        price = int(price_match.group(1).replace(" ", ""))
                        services.append({
                            "title": title,
                            "price": price,
                            "category": category,
                        })
            return services
            
        # Fallback for old layouts
        cards = soup.find_all(["div", "article"], class_=re.compile(r"analysis|service|price-item", re.I))
        
        for card in cards:
            title_elem = card.find(["h3", "h4", "h5", "a", "span"], class_=re.compile(r"title|name|analysis", re.I))
            if not title_elem:
                title_elem = card.find("a")
            
            price_elem = card.find(["span", "div", "p"], class_=re.compile(r"price|cost|summ", re.I))
            
            if title_elem and price_elem:
                title = title_elem.get_text(strip=True)
                price_text = price_elem.get_text(strip=True)
                
                price_match = re.search(r'(\d[\d\s]*\d|\d+)', price_text)
                if price_match and title:
                    price = int(price_match.group(1).replace(" ", ""))
                    
                    category = "Лабораторная диагностика"
                    category_elem = card.find(["span", "div"], class_=re.compile(r"category|type", re.I))
                    if category_elem:
                        category = category_elem.get_text(strip=True)
                    
                    services.append({
                        "title": title,
                        "price": price,
                        "category": category,
                    })
        
        return services
    
    def _extract_from_price_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract services from price tables"""
        services = []
        
        tables = soup.find_all("table")
        
        for table in tables:
            # Check if this is a price table
            headers = table.find_all("th")
            header_texts = [h.get_text(strip=True).lower() for h in headers]
            
            if not any(keyword in " ".join(header_texts) for keyword in ["цена", "стоимость", "price", "анализ"]):
                continue
            
            rows = table.find_all("tr")
            current_category = "Не указано"
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all(["td", "th"])
                
                if len(cells) < 2:
                    # Might be a category header
                    if len(cells) == 1:
                        text = cells[0].get_text(strip=True)
                        if text and not re.search(r'\d', text):
                            current_category = text
                    continue
                
                texts = [cell.get_text(strip=True) for cell in cells]
                
                # First cell usually has the service name
                service_name = texts[0]
                
                # Find price in remaining cells
                price = None
                for text in texts[1:]:
                    price_match = re.search(r'(\d[\d\s]*\d|\d+)', text)
                    if price_match:
                        price = int(price_match.group(1).replace(" ", ""))
                        break
                
                if service_name and price:
                    services.append({
                        "title": service_name,
                        "price": price,
                        "category": current_category,
                    })
        
        return services
