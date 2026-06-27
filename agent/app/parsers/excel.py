"""
Excel parser for price lists
"""
from typing import Dict, Any, List
import openpyxl
import re


class ExcelParser:
    """Parse Excel price lists"""
    
    def parse(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse Excel file from raw_data.
        
        Args:
            raw_data: Dict with 'file_path' key
            
        Returns:
            List of service dicts
        """
        file_path = raw_data.get("file_path")
        if not file_path:
            return []
        
        return self.parse_file(file_path)
    
    def parse_file(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse Excel file.
        
        Expects columns: Service Name, Price, Category (optional)
        """
        services = []
        
        try:
            workbook = openpyxl.load_workbook(file_path, read_only=True)
            sheet = workbook.active
            
            # Skip header row
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row or len(row) < 2:
                    continue
                
                title = str(row[0]).strip() if row[0] else None
                price_text = str(row[1]).strip() if row[1] else None
                category = str(row[2]).strip() if len(row) > 2 and row[2] else "Не указано"
                
                if not title or not price_text:
                    continue
                
                # Extract price (handle various formats)
                price_match = re.search(r'(\d[\d\s]*\d|\d+)', price_text)
                if price_match:
                    price = int(price_match.group(1).replace(" ", ""))
                    
                    services.append({
                        "title": title,
                        "price": price,
                        "category": category,
                    })
            
            workbook.close()
            
        except Exception as e:
            print(f"❌ Failed to parse Excel: {e}")
        
        return services
