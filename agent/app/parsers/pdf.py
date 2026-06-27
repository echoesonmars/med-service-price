"""
PDF parser for price lists
"""
from typing import Dict, Any, List
import PyPDF2
import re


class PDFParser:
    """Parse PDF price lists"""
    
    def parse(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse PDF file from raw_data.
        
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
        Parse PDF file.
        
        Extracts text and looks for patterns like:
        "Service name .... 1000 тг"
        """
        services = []
        
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                for page in reader.pages:
                    text = page.extract_text()
                    
                    # Look for service + price patterns
                    # Pattern: "Service name ... 1000" or "Service name 1000 тг"
                    lines = text.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        
                        # Match patterns like "Service ... 1000" or "Service 1000 тг"
                        match = re.search(r'(.+?)[\s.]+(\d[\d\s]*\d|\d+)\s*(?:тг|₸)?', line)
                        
                        if match:
                            title = match.group(1).strip()
                            price = int(match.group(2).replace(" ", ""))
                            
                            # Filter out likely false positives
                            if len(title) > 5 and price > 0:
                                services.append({
                                    "title": title,
                                    "price": price,
                                    "category": "Не указано",
                                })
        
        except Exception as e:
            print(f"❌ Failed to parse PDF: {e}")
        
        return services
