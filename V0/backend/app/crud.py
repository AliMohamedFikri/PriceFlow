from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas, auth

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(
    db: Session, 
    search: str = None, 
    brand: str = None, 
    category: str = None,
    platform: str = None,
    skip: int = 0, 
    limit: int = 50
):
    query = db.query(models.Product)
    
    # Apply keyword search
    if search:
        search_clean = search.lower().strip()
        query = query.filter(models.Product.clean_title.contains(search_clean))
        
    # Apply brand filter
    if brand:
        query = query.filter(models.Product.brand == brand.lower().strip())
        
    # Apply category filter
    if category:
        query = query.filter(models.Product.category == category.lower().strip())
        
    # Apply platform specific filters by joining with ProductPrice
    if platform:
        query = query.join(models.Product.prices).filter(models.ProductPrice.platform == platform.lower().strip())
        
    return query.offset(skip).limit(limit).all()


# --- Wishlist CRUD ---
def get_wishlist_items(db: Session, user_id: int):
    return db.query(models.WishlistItem).filter(models.WishlistItem.user_id == user_id).all()

def add_wishlist_item(db: Session, user_id: int, product_id: int):
    # Check if already exists in wishlist
    existing = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id
    ).first()
    
    if existing:
        return existing
        
    db_item = models.WishlistItem(user_id=user_id, product_id=product_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def remove_wishlist_item(db: Session, user_id: int, product_id: int) -> bool:
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id
    ).first()
    
    if not item:
        return False
        
    db.delete(item)
    db.commit()
    return True


# --- Price Alert CRUD ---
def get_price_alerts(db: Session, user_id: int):
    return db.query(models.PriceAlert).filter(models.PriceAlert.user_id == user_id).all()

def create_price_alert(db: Session, user_id: int, alert: schemas.PriceAlertCreate):
    # Delete existing active alerts for the same product to overwrite
    db.query(models.PriceAlert).filter(
        models.PriceAlert.user_id == user_id,
        models.PriceAlert.product_id == alert.product_id
    ).delete()
    
    db_alert = models.PriceAlert(
        user_id=user_id,
        product_id=alert.product_id,
        target_price=alert.target_price,
        is_active=True
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def delete_price_alert(db: Session, user_id: int, alert_id: int) -> bool:
    alert = db.query(models.PriceAlert).filter(
        models.PriceAlert.user_id == user_id,
        models.PriceAlert.id == alert_id
    ).first()
    
    if not alert:
        return False
        
    db.delete(alert)
    db.commit()
    return True
