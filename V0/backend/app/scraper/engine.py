import os
import datetime
from sqlalchemy.orm import Session
from ..models import Product, ProductPrice, ScrapeRun
from .normalizer import clean_title, extract_attributes, find_matching_product
from .parsers import parse_local_amazon, parse_local_jumia, generate_local_noon
from .live_scrapers import scrape_live_amazon_catalog, scrape_live_jumia_catalog, scrape_live_noon_catalog
from ..config import settings

SEARCH_QUERIES = ["laptop", "tablet", "smartphone", "headphones", "smartwatch", "storage"]

def run_scraper_engine(db: Session, local_mode: bool = True) -> dict:
    """
    Scraper engine orchestration.
    1. Records a ScrapeRun.
    2. Parses listings (local HTML pages or live sources).
    3. Normalizes each title and fuzzy matches against DB products.
    4. Inserts/updates catalog details and saves prices.
    """
    platforms = ["amazon", "jumia", "noon"]
    stats = {}
    
    # Audit log entry for each platform run
    run_logs = {}
    for p in platforms:
        run_log = ScrapeRun(platform=p, status="running")
        db.add(run_log)
        db.commit()
        db.refresh(run_log)
        run_logs[p] = run_log
        stats[p] = {"scraped": 0, "errors": 0}
        
    try:
        # Ingest parsed product raw list
        raw_listings = []
        
        if local_mode:
            # Local parser execution
            amazon_file = os.path.join(settings.WORKSPACE_DIR, "Amazon.html")
            jumia_file = os.path.join(settings.WORKSPACE_DIR, "Jumia.html")
            
            amazon_raw = parse_local_amazon(amazon_file)
            jumia_raw = parse_local_jumia(jumia_file)
            noon_raw = generate_local_noon(jumia_raw, amazon_raw)
            
            raw_listings = amazon_raw + jumia_raw + noon_raw
        else:
            # Live scraping mode - scrape catalog pages from each platform
            print("Live scraping mode activated...")
            amazon_raw = []
            jumia_raw = []
            noon_raw = []
            
            for query in SEARCH_QUERIES:
                print(f"Scraping Amazon for '{query}'...")
                amazon_raw.extend(scrape_live_amazon_catalog(query, max_pages=1))
                print(f"Scraping Jumia for '{query}'...")
                jumia_raw.extend(scrape_live_jumia_catalog(query, max_pages=1))
                print(f"Scraping Noon for '{query}'...")
                noon_raw.extend(scrape_live_noon_catalog(query, max_pages=1))
            
            raw_listings = amazon_raw + jumia_raw + noon_raw
            
        print(f"Engine starting catalog processing for {len(raw_listings)} listings...")
        
        for item in raw_listings:
            plat = item["platform"]
            try:
                # 1. Title cleaning
                title = item["raw_title"]
                c_title = clean_title(title)
                
                # 2. Extract brand/category attributes
                attrs = extract_attributes(title)
                
                # 3. Pull existing database products for fuzzy comparison
                existing_products = db.query(Product).all()
                existing_list = [
                    {
                        "id": p.id,
                        "title": p.title,
                        "clean_title": p.clean_title,
                        "brand": p.brand,
                        "category": p.category
                    }
                    for p in existing_products
                ]
                
                # 4. Fuzzy match normalizer matching (Threshold = 78%)
                matched_prod = find_matching_product(title, existing_list, threshold=0.78)
                
                if matched_prod:
                    # Match found! Add this price to existing canonical product
                    product_id = matched_prod["id"]
                    db_product = db.query(Product).filter(Product.id == product_id).first()
                    
                    # Update canonical image if not set yet
                    if not db_product.image_url and item["image_url"]:
                        db_product.image_url = item["image_url"]
                        
                    print(f"Matched: product mapped to existing Product ID {product_id}")
                else:
                    # No match! Create new canonical product
                    db_product = Product(
                        title=title,
                        clean_title=c_title,
                        brand=attrs["brand"],
                        category=attrs["brand"] or "electronics", # simple category tagging
                        image_url=item["image_url"]
                    )
                    db.add(db_product)
                    db.commit()
                    db.refresh(db_product)
                    product_id = db_product.id
                    print(f"Created NEW Canonical Product ID {product_id}")
                    
                # 5. Insert or Update ProductPrice record
                existing_price = db.query(ProductPrice).filter(
                    ProductPrice.product_id == product_id,
                    ProductPrice.platform == plat
                ).first()
                
                if existing_price:
                    # Update price
                    existing_price.price = item["price"]
                    existing_price.original_price_text = item["original_price_text"]
                    existing_price.source_url = item["source_url"]
                    if item["image_url"]:
                        existing_price.image_url = item["image_url"]
                    existing_price.updated_at = datetime.datetime.utcnow()
                else:
                    # Create new price record
                    new_price = ProductPrice(
                        product_id=product_id,
                        platform=plat,
                        price=item["price"],
                        original_price_text=item["original_price_text"],
                        source_url=item["source_url"],
                        raw_title=title,
                        image_url=item["image_url"]
                    )
                    db.add(new_price)
                    
                db.commit()
                stats[plat]["scraped"] += 1
                
            except Exception as e:
                print(f"Error processing listing item: {e}")
                stats[plat]["errors"] += 1
                
        # Commit all completed and log final statuses
        for p in platforms:
            run_log = run_logs[p]
            run_log.status = "success" if stats[p]["errors"] == 0 else "failed"
            run_log.finished_at = datetime.datetime.utcnow()
            run_log.products_scraped = stats[p]["scraped"]
            run_log.errors = stats[p]["errors"]
            db.commit()
            
        print("Scraper engine runs successfully completed!")
        
    except Exception as general_err:
        print(f"Scraper engine encountered fatal crash: {general_err}")
        for p in platforms:
            run_log = run_logs[p]
            run_log.status = "failed"
            run_log.finished_at = datetime.datetime.utcnow()
            db.commit()
            
    return stats

# Helper script trigger support for testing engine standalone
if __name__ == "__main__":
    import os
    import sys
    # Add parent paths for relative import support
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from backend.app.db import SessionLocal
    
    print("Standalone engine testing started...")
    db = SessionLocal()
    # Ensure database tables exist
    from backend.app.db import Base, engine
    Base.metadata.create_all(bind=engine)
    
    # Run
    stats = run_scraper_engine(db, local_mode=True)
    print(f"Standalone Test Results: {stats}")
    db.close()
