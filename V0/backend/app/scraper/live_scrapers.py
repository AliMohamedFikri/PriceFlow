import time
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9,ar-EG;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Referer": "https://www.google.com/",
        "DNT": "1",
    }

def polite_delay(min_s=2, max_s=5):
    time.sleep(random.uniform(min_s, max_s))

def fetch_with_retry(url: str, session: requests.Session = None, max_retries: int = 3) -> requests.Response | None:
    s = session or requests.Session()
    for attempt in range(max_retries):
        try:
            polite_delay()
            headers = get_headers()
            resp = s.get(url, headers=headers, timeout=15)
            if resp.status_code == 429:
                wait_time = (2 ** attempt) * 10
                print(f"Rate limited on {url}. Backing off for {wait_time}s...")
                time.sleep(wait_time)
                continue
            resp.raise_for_status()
            return resp
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Failed fetching {url} after {max_retries} attempts: {e}")
                return None
            time.sleep(2 ** attempt)
    return None

def parse_price(price_text: str) -> float | None:
    if not price_text:
        return None
    t = price_text.upper().replace(",", "").strip()
    parts = [p.strip() for p in t.split("EGP") if p.strip()]
    if not parts:
        parts = [p.strip() for p in t.split("جنيه") if p.strip()]
    if not parts:
        parts = [p.strip() for p in t.split("LE") if p.strip()]
    if not parts:
        parts = [t]
    num_str = "".join(c for c in parts[0] if c.isdigit() or c == ".")
    try:
        val = float(num_str)
        s_val = str(parts[0]).strip()
        half_len = len(s_val) // 2
        if len(s_val) >= 4 and len(s_val) % 2 == 0 and s_val[:half_len] == s_val[half_len:]:
            val = float(s_val[:half_len])
        return val
    except ValueError:
        return None

# --- Amazon Live Scraping ---

def scrape_live_amazon_product(url: str) -> dict | None:
    try:
        session = requests.Session()
        session.get("https://www.amazon.eg", headers=get_headers(), timeout=10)
        resp = fetch_with_retry(url, session=session)
        if not resp:
            return None
        soup = BeautifulSoup(resp.text, "lxml")
        title = soup.select_one("#productTitle")
        price = soup.select_one(".a-price .a-offscreen")
        image = soup.select_one("#landingImage")
        return {
            "raw_title": title.get_text(strip=True) if title else None,
            "price_text": price.get_text(strip=True) if price else None,
            "image_url": image["src"] if image else None,
            "source_url": url,
            "platform": "amazon"
        }
    except Exception as e:
        print(f"Error live scraping Amazon {url}: {e}")
        return None

def scrape_live_amazon_catalog(search_query: str = "laptop", max_pages: int = 2) -> list[dict]:
    products = []
    session = requests.Session()
    session.get("https://www.amazon.eg", headers=get_headers(), timeout=10)
    for page in range(1, max_pages + 1):
        url = f"https://www.amazon.eg/s?k={search_query}&page={page}"
        resp = fetch_with_retry(url, session=session)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, "lxml")
        for card in soup.select("[data-component-type='s-search-result']"):
            title_el = card.select_one("h2 a span")
            price_el = card.select_one(".a-price .a-offscreen")
            img_el = card.select_one("img.s-image")
            link_el = card.select_one("h2 a")
            link = urljoin("https://www.amazon.eg", link_el["href"]) if link_el else None
            raw_title = title_el.get_text(strip=True) if title_el else None
            raw_price = price_el.get_text(strip=True) if price_el else None
            image = img_el["src"] if img_el else None
            if raw_title and raw_price:
                price_val = parse_price(raw_price)
                if price_val:
                    products.append({
                        "raw_title": raw_title,
                        "price": price_val,
                        "original_price_text": raw_price,
                        "image_url": image,
                        "source_url": link or url,
                        "platform": "amazon"
                    })
        polite_delay(4, 8)
    seen = set()
    dedup = []
    for p in products:
        key = p["raw_title"].lower().strip()
        if key not in seen:
            seen.add(key)
            dedup.append(p)
    print(f"Scraped {len(dedup)} Amazon products for query '{search_query}'")
    return dedup

# --- Jumia Live Scraping ---

def scrape_live_jumia_product(url: str) -> dict | None:
    try:
        resp = fetch_with_retry(url)
        if not resp:
            return None
        soup = BeautifulSoup(resp.text, "lxml")
        title = soup.select_one("h1")
        price = soup.select_one(".prc")
        image = soup.select_one(".img img")
        return {
            "raw_title": title.get_text(strip=True) if title else None,
            "price_text": price.get_text(strip=True) if price else None,
            "image_url": image.get("data-src") or image.get("src") if image else None,
            "source_url": url,
            "platform": "jumia"
        }
    except Exception as e:
        print(f"Error live scraping Jumia {url}: {e}")
        return None

def scrape_live_jumia_catalog(search_query: str = "laptop", max_pages: int = 2) -> list[dict]:
    products = []
    for page in range(1, max_pages + 1):
        url = f"https://www.jumia.com.eg/catalog/?q={search_query}&page={page}"
        resp = fetch_with_retry(url)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, "lxml")
        for article in soup.select("article.prd"):
            title_el = article.select_one("h3.name")
            price_el = article.select_one(".prc")
            img_el = article.select_one("img.img")
            link_el = article.select_one("a.core")
            link = urljoin("https://www.jumia.com.eg", link_el["href"]) if link_el else None
            raw_title = title_el.get_text(strip=True) if title_el else None
            raw_price = price_el.get_text(strip=True) if price_el else None
            image = (img_el.get("data-src") or img_el.get("src")) if img_el else None
            if raw_title and raw_price:
                price_val = parse_price(raw_price)
                if price_val:
                    products.append({
                        "raw_title": raw_title,
                        "price": price_val,
                        "original_price_text": raw_price,
                        "image_url": image,
                        "source_url": link or url,
                        "platform": "jumia"
                    })
        polite_delay(3, 6)
    seen = set()
    dedup = []
    for p in products:
        key = p["raw_title"].lower().strip()
        if key not in seen:
            seen.add(key)
            dedup.append(p)
    print(f"Scraped {len(dedup)} Jumia products for query '{search_query}'")
    return dedup

# --- Noon Live Scraping (via Playwright) ---

def scrape_live_noon_catalog(search_query: str = "laptop", max_pages: int = 1) -> list[dict]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Install with: pip install playwright && playwright install chromium")
        return []
    products = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            for page_num in range(1, max_pages + 1):
                url = f"https://www.noon.com/egypt-en/search?q={search_query}&page={page_num}"
                page = context.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(3000)
                    cards = page.query_selector_all(".product")
                    for card in cards:
                        title_el = card.query_selector("h3")
                        price_el = card.query_selector(".priceNow")
                        img_el = card.query_selector("img")
                        link_el = card.query_selector("a")
                        link = urljoin("https://www.noon.com", link_el.get_attribute("href")) if link_el else None
                        raw_title = title_el.inner_text().strip() if title_el else None
                        raw_price = price_el.inner_text().strip() if price_el else None
                        image = img_el.get_attribute("src") if img_el else None
                        if raw_title and raw_price:
                            price_val = parse_price(raw_price)
                            if price_val:
                                products.append({
                                    "raw_title": raw_title,
                                    "price": price_val,
                                    "original_price_text": raw_price,
                                    "image_url": image,
                                    "source_url": link or url,
                                    "platform": "noon"
                                })
                except Exception as e:
                    print(f"Noon catalog page {page_num} error: {e}")
                finally:
                    page.close()
                time.sleep(random.uniform(2, 4))
            browser.close()
    except Exception as e:
        print(f"Noon live scraping failed: {e}")
    seen = set()
    dedup = []
    for p in products:
        key = p["raw_title"].lower().strip()
        if key not in seen:
            seen.add(key)
            dedup.append(p)
    print(f"Scraped {len(dedup)} Noon products for query '{search_query}'")
    return dedup
