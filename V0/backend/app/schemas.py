from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- ProductPrice Schemas ---
class ProductPriceBase(BaseModel):
    platform: str
    price: float
    original_price_text: Optional[str] = None
    source_url: str
    raw_title: str
    image_url: Optional[str] = None

class ProductPriceOut(ProductPriceBase):
    id: int
    product_id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Product Schemas ---
class ProductBase(BaseModel):
    title: str
    clean_title: str
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    created_at: datetime.datetime
    prices: List[ProductPriceOut] = []

    class Config:
        from_attributes = True


# --- PriceAlert Schemas ---
class PriceAlertBase(BaseModel):
    target_price: float
    is_active: bool = True

class PriceAlertCreate(BaseModel):
    product_id: int
    target_price: float

class PriceAlertOut(PriceAlertBase):
    id: int
    user_id: int
    product_id: int
    created_at: datetime.datetime
    product: ProductOut

    class Config:
        from_attributes = True


# --- WishlistItem Schemas ---
class WishlistItemCreate(BaseModel):
    product_id: int

class WishlistItemOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: datetime.datetime
    product: ProductOut

    class Config:
        from_attributes = True


# --- ScrapeRun Schemas ---
class ScrapeRunOut(BaseModel):
    id: int
    platform: str
    started_at: datetime.datetime
    finished_at: Optional[datetime.datetime] = None
    products_scraped: int
    errors: int
    status: str

    class Config:
        from_attributes = True
