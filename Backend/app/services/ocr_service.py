from ..shared import extract_all_text
from PIL import Image

def process_ocr(image):
    try:
        # Ensure RGB mode
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract all text
        result = extract_all_text(image)
        
        return {
            "success": True,
            "raw_text": result['raw_text'],
            "cleaned_text": result['cleaned_text'],
            "markdown": convert_to_markdown(result['cleaned_text'])
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "raw_text": "",
            "cleaned_text": ""
        }

def convert_to_markdown(text):
    """Convert raw text to basic markdown format"""
    # Preserve paragraphs
    markdown = text.replace('\n\n', '\n\n')
    
    # Detect and format potential headings
    lines = []
    for line in markdown.split('\n'):
        if len(line) > 0 and line.isupper() and not line.isdigit():
            lines.append(f"## {line}")
        else:
            lines.append(line)
    
    return '\n'.join(lines)