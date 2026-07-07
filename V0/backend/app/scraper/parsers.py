import os
import re
import lxml.html

def parse_price(price_text: str) -> float | None:
    """
    Cleans e-commerce price strings and handles edge cases:
    - Jumia: '500.00 جنيه' -> 500.0
    - Amazon: 'EGP10,699EGP10,699' -> 10699.0
    """
    if not price_text:
        return None
        
    t = price_text.upper().replace(",", "").strip()
    
    # Split by currency codes to isolate the value
    parts = [p.strip() for p in re.split(r'EGP|جنيه|LE|L\.E\.', t) if p.strip()]
    if not parts:
        # Fallback to general number extraction
        parts = [t]
        
    num_str = re.sub(r"[^\d.]", "", parts[0])
    try:
        val = float(num_str)
        # If the price repeats itself (like 1069910699 due to markup overlap in text_content)
        # We check if it is divisible by a split
        s_val = str(parts[0]).strip()
        half_len = len(s_val) // 2
        if len(s_val) >= 4 and len(s_val) % 2 == 0 and s_val[:half_len] == s_val[half_len:]:
            val = float(s_val[:half_len])
        return val
    except ValueError:
        return None

def parse_local_amazon(filepath: str) -> list[dict]:
    """
    Parses local Amazon.html file and returns a list of product dictionaries.
    """
    if not os.path.exists(filepath):
        print(f"Amazon parse file not found at {filepath}")
        return []
        
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
        
    tree = lxml.html.fromstring(html)
    blocks = tree.xpath("//div[contains(@class, 'acsProductBlockV2')]")
    products = []
    
    for block in blocks:
        title_el = block.xpath(".//span[contains(@class, 'title') or contains(@class, 'name') or @class='a-size-base'] | .//a[contains(@class, 'a-link-normal')]//span")
        price_el = block.xpath(".//span[contains(@class, 'a-price')]//span[contains(@class, 'a-offscreen')] | .//span[contains(@class, 'price')]")
        img_el = block.xpath(".//img")
        link_el = block.xpath(".//a[contains(@class, 'a-link-normal')]")
        
        titles = [t.text_content().strip() for t in title_el if t.text_content().strip()]
        prices = [p.text_content().strip() for p in price_el if p.text_content().strip()]
        images = [img.get("src") for img in img_el if img.get("src")]
        links = [lnk.get("href") for lnk in link_el if lnk.get("href")]
        
        raw_title = titles[0] if titles else None
        raw_price = prices[0] if prices else None
        image = images[0] if images else None
        link = links[0] if links else ""
        
        if link and not link.startswith("http"):
            link = "https://www.amazon.eg" + link
            
        if raw_title and raw_price:
            price_val = parse_price(raw_price)
            if price_val:
                products.append({
                    "raw_title": raw_title,
                    "price": price_val,
                    "original_price_text": raw_price,
                    "image_url": image,
                    "source_url": link,
                    "platform": "amazon"
                })
                
    # Deduplicate by raw_title
    seen = set()
    dedup = []
    for p in products:
        if p["raw_title"] not in seen:
            seen.add(p["raw_title"])
            dedup.append(p)
            
    print(f"Parsed {len(dedup)} unique products from local Amazon.html")
    return dedup

def parse_local_jumia(filepath: str) -> list[dict]:
    """
    Parses local Jumia.html file and returns a list of product dictionaries.
    """
    if not os.path.exists(filepath):
        print(f"Jumia parse file not found at {filepath}")
        return []
        
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
        
    tree = lxml.html.fromstring(html)
    items = tree.xpath("//article[contains(@class, 'prd')] | //div[contains(@class, 'prd')]")
    products = []
    
    for item in items:
        title_el = item.xpath(".//h3[contains(@class, 'name')] | .//span[contains(@class, 'name')] | .//div[contains(@class, 'name')]")
        price_el = item.xpath(".//div[contains(@class, 'prc')] | .//span[contains(@class, 'prc')]")
        img_el = item.xpath(".//img[contains(@class, 'img')]")
        link_el = item.xpath(".//a[contains(@class, 'core')] | .//a")
        
        raw_title = title_el[0].text_content().strip() if title_el else None
        raw_price = price_el[0].text_content().strip() if price_el else None
        image = (img_el[0].get("data-src") or img_el[0].get("src")) if img_el else None
        link = link_el[0].get("href") if link_el else ""
        
        if link and not link.startswith("http"):
            link = "https://www.jumia.com.eg" + link
            
        if raw_title and raw_price:
            price_val = parse_price(raw_price)
            if price_val:
                products.append({
                    "raw_title": raw_title,
                    "price": price_val,
                    "original_price_text": raw_price,
                    "image_url": image,
                    "source_url": link,
                    "platform": "jumia"
                })
                
    # Deduplicate by raw_title
    seen = set()
    dedup = []
    for p in products:
        if p["raw_title"] not in seen:
            seen.add(p["raw_title"])
            dedup.append(p)
            
    print(f"Parsed {len(dedup)} unique products from local Jumia.html")
    return dedup

def generate_local_noon(jumia_products: list[dict], amazon_products: list[dict]) -> list[dict]:
    """
    Generates Noon products to match products in Jumia and Amazon.
    This simulates side-by-side pricing for our demo using minor price deltas.
    """
    import random
    products = []
    
    # We will generate a Noon listing for a subset of Jumia & Amazon products
    all_source_products = jumia_products + amazon_products
    
    for idx, p in enumerate(all_source_products):
        # We'll match ~80% of products to create perfect comparisons
        if idx % 10 == 0:
            continue  # Leave some unmatched for realism
            
        # Noon price has a minor delta (within -5% to +4%)
        price_delta = random.choice([-0.05, -0.03, -0.01, 0.0, 0.02, 0.04])
        noon_price = round(p["price"] * (1 + price_delta), 2)
        
        # Clean title slightly to mimic different platform catalog names
        raw_t = p["raw_title"]
        if "ar" in p.get("source_url", ""):
            # Jumia arabic title, let's keep it
            noon_title = raw_t
        else:
            # Let's adjust word order slightly or append standard Noon markers
            noon_title = f"{raw_t} - Egypt Version" if idx % 2 == 0 else raw_t
            
        slug = re.sub(r"[^\w\s]", "", noon_title.lower()).replace(" ", "-")[:40]
        noon_link = f"https://www.noon.com/egypt-en/product/{slug}/N{random.randint(10000000, 99999999)}A/p"
        
        products.append({
            "raw_title": noon_title,
            "price": noon_price,
            "original_price_text": f"EGP {noon_price}",
            "image_url": p["image_url"],
            "source_url": noon_link,
            "platform": "noon"
        })
        
    print(f"Generated {len(products)} matchable Noon product listings for seeding side-by-side prices")
    return products
