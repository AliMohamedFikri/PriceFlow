import re
import difflib

# Common noise words in Egyptian e-commerce platforms
NOISE_WORDS = [
    "new", "original", "genuine", "official", "free shipping", "brand new",
    "warranty", "eg", "egypt", "مصر", "جديد", "أصلي", "ضمان", "شحن مجاني"
]

BRANDS = [
    "samsung", "apple", "xiaomi", "oppo", "realme", "lenovo", "asus", "dell", 
    "hp", "acer", "lg", "sony", "huawei", "honor", "nokia", "toshiba", "canon",
    "sandisk", "deli", "shein"
]

def clean_title(title: str) -> str:
    """
    Cleans e-commerce title for high-quality comparison:
    - Normalizes to lowercase
    - Collapses spaces and converts slash/dashes
    - Removes common e-commerce noise terms
    """
    if not title:
        return ""
    
    t = title.strip().lower()
    
    # Replace common separators with spaces
    t = re.sub(r"[\-_|/,\+]", " ", t)
    
    # Remove characters that aren't letters, numbers or spaces
    t = re.sub(r"[^\w\s]", "", t)
    
    # Remove noise words
    for word in NOISE_WORDS:
        t = re.sub(r"\b" + re.escape(word) + r"\b", "", t)
        
    # Collapse double whitespaces
    t = re.sub(r"\s+", " ", t).strip()
    return t

def extract_attributes(title: str) -> dict:
    """
    Extracts key hardware properties from the clean title:
    - brand (e.g. lenovo, samsung)
    - storage_gb (e.g. 128, 256, 1024)
    - ram_gb (e.g. 4, 8, 16)
    """
    attrs = {
        "brand": None,
        "storage_gb": None,
        "ram_gb": None
    }
    
    title_lower = title.lower()
    
    # 1. Brand Extraction
    for b in BRANDS:
        if b in title_lower:
            attrs["brand"] = b
            break
            
    # 2. Storage Extraction (GB or TB)
    storage_match = re.search(r"(\d+)\s*(gb|tb|tera)", title_lower)
    if storage_match:
        val = int(storage_match.group(1))
        unit = storage_match.group(2)
        if unit == "tb" or unit == "tera":
            attrs["storage_gb"] = val * 1024
        else:
            # Check if this isn't RAM (e.g. "8gb ram")
            is_ram = re.search(rf"\b{val}\s*gb\s*ram", title_lower)
            if not is_ram:
                attrs["storage_gb"] = val
                
    # 3. RAM Extraction
    ram_match = re.search(r"(\d+)\s*gb\s*ram", title_lower)
    if not ram_match:
        # Alternative pattern: "128/8gb" where 8gb is RAM
        ram_match = re.search(r"\d+\s*/\s*(\d+)\s*gb", title_lower)
        
    if ram_match:
        attrs["ram_gb"] = int(ram_match.group(1))
        
    return attrs

def calculate_token_sort_ratio(s1: str, s2: str) -> float:
    """
    Simulates RapidFuzz's token_sort_ratio:
    Cleans strings, splits into words, sorts the words alphabetically,
    and calculates difflib SequenceMatcher similarity on sorted word strings.
    """
    c1 = clean_title(s1)
    c2 = clean_title(s2)
    
    tokens1 = sorted(c1.split())
    tokens2 = sorted(c2.split())
    
    sorted1 = " ".join(tokens1)
    sorted2 = " ".join(tokens2)
    
    if not sorted1 or not sorted2:
        return 0.0
        
    return difflib.SequenceMatcher(None, sorted1, sorted2).ratio()

def find_matching_product(new_title: str, existing_products: list, threshold: float = 0.78) -> dict | None:
    """
    Finds the best matching canonical product in existing_products (a list of dictionaries).
    
    Applies constraints:
    - Must share the same brand (if brand is successfully extracted in both)
    - Must share the same storage capacity (if specified in both) to avoid matching 128GB vs 256GB
    - Token sort similarity must exceed the threshold
    """
    new_attrs = extract_attributes(new_title)
    new_clean = clean_title(new_title)
    
    best_score = 0.0
    best_match = None
    
    for prod in existing_products:
        prod_title = prod.get("title", prod.get("clean_title", ""))
        prod_attrs = extract_attributes(prod_title)
        
        # Guard 1: Brand mismatch
        if new_attrs["brand"] and prod_attrs["brand"] and new_attrs["brand"] != prod_attrs["brand"]:
            continue
            
        # Guard 2: Storage mismatch
        if new_attrs["storage_gb"] and prod_attrs["storage_gb"] and new_attrs["storage_gb"] != prod_attrs["storage_gb"]:
            continue
            
        # Guard 3: RAM mismatch
        if new_attrs["ram_gb"] and prod_attrs["ram_gb"] and new_attrs["ram_gb"] != prod_attrs["ram_gb"]:
            continue
            
        # Calculate similarity score
        prod_clean = prod.get("clean_title") or clean_title(prod_title)
        score = calculate_token_sort_ratio(new_clean, prod_clean)
        
        if score > best_score:
            best_score = score
            best_match = prod
            
    if best_score >= threshold:
        return best_match
        
    return None
