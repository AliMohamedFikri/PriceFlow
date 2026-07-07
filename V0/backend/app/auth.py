import hmac
import hashlib
import base64
import json
import datetime
from .config import settings

def get_password_hash(password: str) -> str:
    """
    Hashes a password using PBKDF2 with SHA-256 and a random salt.
    Format: 'pbkdf2:sha256:100000$salt$hash'
    """
    salt = base64.b64encode(hashlib.sha256(str(random_salt()).encode()).digest()[:16]).decode()
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt.encode('utf-8'), 
        100000
    )
    hashed = base64.b64encode(key).decode()
    return f"pbkdf2:sha256:100000${salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored pbkdf2 hash.
    """
    try:
        if not hashed_password or not hashed_password.startswith("pbkdf2:sha256:"):
            return False
            
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
            
        salt = parts[1]
        stored_hash = parts[2]
        
        key = hashlib.pbkdf2_hmac(
            'sha256', 
            plain_password.encode('utf-8'), 
            salt.encode('utf-8'), 
            100000
        )
        computed_hash = base64.b64encode(key).decode()
        
        return hmac.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False

def random_salt() -> str:
    """Generates a random salt string using current timestamp and system randomness."""
    import random
    import time
    seed = f"{time.time()}{random.random()}"
    return hashlib.sha256(seed.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: datetime.timedelta = None) -> str:
    """
    Creates a signed access token.
    Equivalent to a HS256 JWT, built using python standard libraries:
    token format: base64_payload.hex_signature
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire.isoformat()})
    
    # Encode payload to base64
    payload_json = json.dumps(to_encode, ensure_ascii=False)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    
    # Calculate HMAC signature
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload_b64}.{signature}"

def verify_access_token(token: str) -> dict | None:
    """
    Verifies an HMAC-signed access token, checking the signature and expiration time.
    Returns the payload dictionary if valid, or None if invalid/expired.
    """
    try:
        if not token or "." not in token:
            return None
            
        parts = token.split(".")
        if len(parts) != 2:
            return None
            
        payload_b64, signature = parts[0], parts[1]
        
        # Verify signature
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            print("Token signature mismatch")
            return False
            
        # Decode payload
        # Restore base64 padding
        padding = '=' * (4 - len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiration
        exp_str = payload.get("exp")
        if not exp_str:
            return None
            
        exp_time = datetime.datetime.fromisoformat(exp_str)
        if datetime.datetime.utcnow() > exp_time:
            print("Token expired")
            return None
            
        return payload
    except Exception as e:
        print(f"Token verification error: {e}")
        return None
