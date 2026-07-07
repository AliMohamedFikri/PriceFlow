from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import asyncio

from .db import Base, engine, get_db, SessionLocal
from . import models, schemas, crud, auth
from .scraper.engine import run_scraper_engine

# Automatically create all SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PriceFlow API",
    description="Graduation Project - Real-time e-commerce Price Comparison App backend.",
    version="1.0.0"
)

# Enable CORS for React Native Web / Local Host development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- APScheduler Setup ---
SCHEDULER_ENABLED = False
scheduler = None

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.interval import IntervalTrigger
    scheduler = AsyncIOScheduler()
    SCHEDULER_ENABLED = True
except ImportError:
    print("APScheduler not installed. Periodic scraping disabled. Install with: pip install apscheduler")

async def scheduled_scrape_job():
    db = SessionLocal()
    try:
        print("[Scheduler] Running scheduled scrape...")
        stats = run_scraper_engine(db, local_mode=True)
        print(f"[Scheduler] Completed: {stats}")
    except Exception as e:
        print(f"[Scheduler] Error: {e}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    if SCHEDULER_ENABLED and scheduler:
        scheduler.add_job(
            scheduled_scrape_job,
            trigger=IntervalTrigger(hours=8),
            id="full_scrape",
            replace_existing=True,
        )
        scheduler.start()
        print("[Scheduler] Started - running every 8 hours")

@app.on_event("shutdown")
async def shutdown_event():
    if SCHEDULER_ENABLED and scheduler:
        scheduler.shutdown()
        print("[Scheduler] Shut down")


# --- Authentication Dependency ---
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with Bearer",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    payload = auth.verify_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = crud.get_user(db, user_id=payload.get("user_id"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found"
        )
    return user


# --- REST API Routes ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to PriceFlow API. Side-by-side e-commerce price comparison aggregator.",
        "docs": "/docs"
    }


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid credentials"
        )
        
    # Generate Token payload
    token_data = {"sub": db_user.email, "user_id": db_user.id}
    token = auth.create_access_token(data=token_data)
    
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Product Endpoints ---

@app.get("/api/products", response_model=List[schemas.ProductOut])
def read_products(
    search: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Search and fetch canonical e-commerce products with comparison details.
    """
    return crud.get_products(
        db, search=search, brand=brand, category=category, platform=platform, skip=skip, limit=limit
    )

@app.get("/api/products/{product_id}", response_model=schemas.ProductOut)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Product not found"
        )
    return db_product

@app.get("/api/products/{product_id}/price-history")
def read_product_price_history(product_id: int, db: Session = Depends(get_db)):
    """
    Generates a historical time-series list of prices for a product over the last 14 days
    to render sparklines and history trends in mobile chart views.
    """
    db_product = crud.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    prices = db_product.prices
    if not prices:
        return []
        
    history = []
    today = datetime.date.today()
    
    # Generate 14 days price history with minor mock shifts
    for i in range(14, -1, -1):
        date_str = (today - datetime.timedelta(days=i)).isoformat()
        point = {"date": date_str}
        
        # Determine slightly shifted price history for each platform listing
        for p in prices:
            # Shift pricing slightly based on date modulo index to draw realistic graph waves
            shift_factor = 1.0 + (0.01 if (i + p.id) % 3 == 0 else (-0.015 if (i + p.id) % 4 == 0 else 0))
            point[p.platform] = round(p.price * shift_factor, 2)
            
        history.append(point)
        
    return history


# --- Wishlist Endpoints ---

@app.get("/api/wishlist", response_model=List[schemas.WishlistItemOut])
def read_wishlist(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_wishlist_items(db, user_id=current_user.id)

@app.post("/api/wishlist", response_model=schemas.WishlistItemOut)
def add_to_wishlist(
    item: schemas.WishlistItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify product exists first
    product = crud.get_product(db, product_id=item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.add_wishlist_item(db, user_id=current_user.id, product_id=item.product_id)

@app.delete("/api/wishlist/{product_id}")
def delete_from_wishlist(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = crud.remove_wishlist_item(db, user_id=current_user.id, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"message": "Product removed from wishlist"}


# --- Price Alert Endpoints ---

@app.get("/api/alerts", response_model=List[schemas.PriceAlertOut])
def read_price_alerts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_price_alerts(db, user_id=current_user.id)

@app.post("/api/alerts", response_model=schemas.PriceAlertOut)
def set_price_alert(
    alert: schemas.PriceAlertCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify product exists first
    product = crud.get_product(db, product_id=alert.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.create_price_alert(db, user_id=current_user.id, alert=alert)

@app.delete("/api/alerts/{alert_id}")
def delete_price_alert(
    alert_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = crud.delete_price_alert(db, user_id=current_user.id, alert_id=alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Price alert not found")
    return {"message": "Price alert deleted"}


# --- Scraper Control Endpoints ---

@app.post("/api/scraper/trigger")
def trigger_scraper(local_mode: bool = True, db: Session = Depends(get_db)):
    """
    Manually triggers parsing/scraping to update database pricing values.
    By default runs in local_mode using local HTML files to seed comparative rows.
    """
    try:
        stats = run_scraper_engine(db, local_mode=local_mode)
        return {
            "status": "success",
            "message": "Scraper run finished successfully",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scraper run failed: {str(e)}"
        )

@app.get("/api/scraper/runs", response_model=List[schemas.ScrapeRunOut])
def read_scraper_runs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(models.ScrapeRun).order_by(models.ScrapeRun.started_at.desc()).offset(skip).limit(limit).all()

@app.get("/api/scraper/status")
def scraper_status():
    """Returns current scheduler status and last runs"""
    return {
        "scheduler_enabled": SCHEDULER_ENABLED,
        "scheduler_running": scheduler.running if SCHEDULER_ENABLED and scheduler else False,
        "scheduler_interval_hours": 8,
        "mode": "local_parser" if SCHEDULER_ENABLED else "manual_only",
    }
