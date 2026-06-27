"""
Celery tasks for parsing scraped documents
"""
from typing import Dict, Any, List
import asyncio

from app.main import celery_app
from app.parsers.html import HTMLParser
from app.parsers.excel import ExcelParser
from app.parsers.pdf import PDFParser


@celery_app.task(name="app.tasks.parser.parse_price_list")
def parse_price_list(clinic_id: str, raw_data: Dict[str, Any]):
    """
    Parse raw price list data.
    
    Args:
        clinic_id: Clinic ID
        raw_data: Raw scraped data with format info
    """
    from app.tasks.normalizer import normalize_service
    
    print(f"📄 Parsing price list for clinic {clinic_id}")
    
    try:
        data_type = raw_data.get("type", "html")
        
        # Select parser based on type
        if data_type == "html":
            parser = HTMLParser()
        elif data_type == "excel":
            parser = ExcelParser()
        elif data_type == "pdf":
            parser = PDFParser()
        else:
            raise ValueError(f"Unknown data type: {data_type}")
        
        # Parse
        services = parser.parse(raw_data)
        
        print(f"✅ Parsed {len(services)} services from clinic {clinic_id}")
        
        # Send each service to normalization
        for service in services:
            normalize_service.delay(clinic_id, service)
        
        return {
            "status": "success",
            "clinic_id": clinic_id,
            "services_count": len(services)
        }
        
    except Exception as e:
        print(f"❌ Failed to parse clinic {clinic_id}: {e}")
        return {
            "status": "error",
            "clinic_id": clinic_id,
            "error": str(e)
        }


@celery_app.task(name="app.tasks.parser.parse_document")
def parse_document(document_path: str, document_type: str) -> List[Dict[str, Any]]:
    """
    Parse a document file (Excel/PDF).
    
    Args:
        document_path: Path to document
        document_type: 'excel' or 'pdf'
        
    Returns:
        List of parsed services
    """
    print(f"📑 Parsing {document_type} document: {document_path}")
    
    try:
        if document_type == "excel":
            parser = ExcelParser()
        elif document_type == "pdf":
            parser = PDFParser()
        else:
            raise ValueError(f"Unsupported document type: {document_type}")
        
        services = parser.parse_file(document_path)
        
        print(f"✅ Parsed {len(services)} services from document")
        
        return services
        
    except Exception as e:
        print(f"❌ Failed to parse document: {e}")
        raise
