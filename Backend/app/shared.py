import pytesseract
from PIL import Image
import cv2
import numpy as np

def preprocess_image(image):
    """Universal image preprocessing for optimal OCR"""
    # Convert to OpenCV format
    img = np.array(image)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Adaptive thresholding
    processed = cv2.adaptiveThreshold(
        gray, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 15, 10
    )
    
    # Denoising
    processed = cv2.fastNlMeansDenoising(processed, h=20)
    
    return Image.fromarray(processed)

def extract_all_text(image):
    """Extract ALL text from ANY image with optimal settings"""
    # Preprocess
    processed_img = preprocess_image(image)
    
    # OCR with multi-language support and layout analysis
    text = pytesseract.image_to_string(
        processed_img,
        config=(
            r'--oem 3 --psm 11 '
            r'-c preserve_interword_spaces=1 '
            r'-c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZéèêëàâäîïôöùûüçÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ.,;:!?()[]{}|/\-_@#$%&*+=<> '
            r'-l eng+fra+deu+spa+ita+por'
        )
    )
    
    return {
        'raw_text': text,
        'cleaned_text': clean_text(text)
    }

def clean_text(text):
    """Clean and normalize extracted text"""
    # Remove excessive line breaks
    text = '\n'.join([line.strip() for line in text.split('\n') if line.strip()])
    
    # Fix common OCR errors
    replacements = {
        '|]': ']',
        '|}': '}',
        '[[': '[',
        ']]': ']'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
        
    return text