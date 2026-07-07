# Price Comparison App — Graduation Project

A mobile application that aggregates and compares product prices across multiple e-commerce platforms (Amazon, Noon, Jumia, and others) in real time, helping users find the best deal without switching between apps.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Full Project Plan — 5 Phases](#2-full-project-plan--5-phases)
3. [Tech Stack & Alternatives](#3-tech-stack--alternatives)
4. [Scraping Layer — Deep Dive](#4-scraping-layer--deep-dive)
5. [Key Risks & Mitigations](#5-key-risks--mitigations)
6. [Final Deliverables](#6-final-deliverables)

---

## 1. Project Overview

**Core feature:** Side-by-side price comparison across platforms with price history tracking.

**Platform targets (start with 2–3):** Amazon Egypt, Noon, Jumia, Carrefour Egypt, B.Tech.

**Why mobile:** Users shop on their phones. A mobile app gives native push notifications for price drops, barcode scanning potential, and a better UX than a web dashboard for this use case.

**Timeline:** ~20 weeks total.

---

## 2. Full Project Plan — 5 Phases

### Phase 1 — Research & Design (Weeks 1–3)

**Goal:** Understand users, competitors, and scope before writing a single line of code.

**Research tasks:**
- Analyze competitors: Yaoota, PriceSpy, Google Shopping — what do they do well and badly?
- Survey 10–15 potential users about their shopping habits and pain points
- Define which platforms to support first (start with 2, expand later)
- Document API availability vs scraping necessity for each platform

**Design tasks:**
- Create 2–3 user personas (student shopper, deal hunter, bulk buyer)
- Sketch key screens: search, product detail, price comparison view, price drop alerts
- Create wireframes in Figma (free) or paper prototypes
- Define MVP feature scope — write it down and freeze it

**Deliverables:** Research report (2–3 pages), wireframes/mockups, MVP feature list.

---

### Phase 2 — Setup & Learning Sprint (Weeks 4–6)

**Goal:** Get your environment running and get comfortable with the chosen tools before touching real features.

**Environment tasks:**
- Choose and install your tech stack (see [Tech Stack](#3-tech-stack--alternatives) section)
- Set up Git repository, branching strategy (main / dev / feature-x), and a project board (GitHub Projects is free)
- Build a "Hello World" app to verify the full stack works end to end
- Configure backend project with basic REST endpoints

**Learning sprint:**
- Follow one full tutorial for your chosen mobile framework (React Native or Flutter)
- Practice API calls from mobile to a test backend
- Learn basic scraping: `requests` + `BeautifulSoup` on a simple target page
- Set up CI/CD pipeline with GitHub Actions (free)

**Deliverables:** Running skeleton app, tech stack decision document.

---

### Phase 3 — Core Features (Weeks 7–13)

This is the main build phase, split into two sub-phases.

#### Data Layer (Weeks 7–9)

- Build scrapers for 2–3 platforms (see [Scraping Layer](#4-scraping-layer--deep-dive) section for full detail)
- Build the product normalizer: clean titles, extract attributes, fuzzy-match across platforms
- Schedule scrapers to run every 6–12 hours
- Populate the database with 500+ real products for testing

#### App Features (Weeks 10–13)

- Product search with filters (category, price range, rating)
- Side-by-side price comparison view across platforms
- Price history chart (sparkline) for each product
- Price drop alerts via push notification or email
- Wishlist / saved items
- Basic user accounts (register, login, JWT auth)

**Deliverables:** Working scrapers for 2+ platforms, REST API with search endpoint, mobile app with core screens, database with 500+ products.

---

### Phase 4 — Polish & Testing (Weeks 14–17)

**Quality tasks:**
- Fix bugs found during internal testing
- Performance: ensure search returns results in under 1.5 seconds
- Handle edge cases: product not found, platform down, scraper returning 0 results, no internet
- Add loading states, empty states, and meaningful error messages

**User testing:**
- Run usability tests with 5 real users (friends, family, classmates)
- Document findings and prioritize top 10 fixes
- Accessibility check: font sizes, contrast ratios, button tap targets (minimum 44px)
- Write documentation: setup guide, API docs, screenshot walkthrough

**Deliverables:** Bug-fixed tested app, usability test report, project documentation.

---

### Phase 5 — Demo & Launch (Weeks 18–20)

**Graduation demo prep:**
- Prepare slide deck: Problem → Solution → Architecture → Live Demo → Results
- Record a 3-minute video walkthrough as a backup in case of live demo issues
- Deploy backend to a free tier (Railway, Render, or Fly.io)
- Build a release APK (Android) and/or TestFlight build (iOS) for graders to install

**Final deliverables:**
- Written project report (architecture decisions, technical challenges, results)
- App store mockup (even if not submitting to production)
- Answers prepared for expected grader questions
- Optional: submit to Google Play Internal Testing track

---

## 3. Tech Stack & Alternatives

Every layer lists a recommended option and alternatives, so you can pivot if you hit a wall.

### Frontend / Mobile App

| Option | Language | When to choose |
|--------|----------|----------------|
| **React Native + Expo** ✅ | JavaScript / TypeScript | Best for beginners. One codebase for iOS + Android. Huge community, lots of tutorials, strong job market. Expo removes the complex native setup. |
| Flutter | Dart | Beautiful UI out of the box, excellent performance. Small overhead learning Dart, but the framework is very well documented. |
| Expo bare workflow | JavaScript / TypeScript | Step up from Expo managed when you need native modules but want to stay in JS. |

**Recommendation:** Start with Expo managed workflow. You can run the app on your own phone in 5 minutes via the Expo Go app.

### Backend / API

| Option | Language | When to choose |
|--------|----------|----------------|
| **FastAPI** ✅ | Python | Very fast to write, auto-generates API docs at `/docs`, shares the Python ecosystem with your scrapers. Best if your team knows Python. |
| Express.js | Node.js | Shares JavaScript with the React Native frontend. Large ecosystem. Good for a JS-only team. |
| Django REST Framework | Python | More batteries-included. Better for complex data models and admin interfaces. Slightly more setup than FastAPI. |

**Recommendation:** FastAPI. Your backend and scrapers are both Python, so they share libraries, environments, and deployment.

### Data / Scraping

| Option | Language | When to choose |
|--------|----------|----------------|
| **requests + BeautifulSoup** ✅ | Python | Simple, well-documented, fast. Use for any page where the price is in the static HTML (View Source and it's there). Start here. |
| Playwright | Python or JS | Handles JavaScript-rendered pages (SPAs). Slower (~5–10x) but handles anything a real browser can. Use when BS4 returns nothing. |
| Scrapy | Python | Full scraping framework with built-in scheduling, pipelines, and middlewares. More setup, but impressive architecture for a graduation project. |
| Official APIs (Amazon PA-API, etc.) | REST/JSON | Most reliable — no breakage when the site redesigns. Check availability before scraping. Amazon requires affiliate approval. |

**Recommendation:** Start with BS4 for static pages, add Playwright for JS-heavy ones (Noon). This covers most platforms.

### Database

| Option | Type | When to choose |
|--------|------|----------------|
| **PostgreSQL** ✅ | Relational SQL | Best for price history (time-series rows), product relations, and user data. Free hosting on Supabase or Railway. |
| MongoDB | Document / NoSQL | Flexible schema — good when product structures vary heavily between platforms. Easier to start but harder to query and relate. |
| SQLite | Embedded SQL | Zero setup. Use for local development and demos. Switch to PostgreSQL before final deployment. |

**Recommendation:** SQLite locally → PostgreSQL in production (Supabase free tier).

---

## 4. Scraping Layer — Deep Dive

The scraping layer is the most critical and most fragile part of the system. This section covers every component in detail.

### Architecture Overview

```
Platforms          Scraper Engine                    Storage / Scheduler
-----------        -------------------------         -------------------
Amazon.eg   ──►   BS4 scraper (static HTML)  ──►   PostgreSQL
Noon        ──►   Playwright (JS pages)       ──►   (products + prices)
Jumia       ──►   Product normalizer          ──►
Others      ──►   Anti-block layer            ──►   APScheduler
                  Error handler + retry             (every 6–12 hours)
```

### Tool Selection Decision

Before writing any scraper, run this check:

1. Open the product page → View Source (`Ctrl+U`)
2. Is the price visible in the raw HTML?
   - **YES** → use `requests` + `BeautifulSoup` (fast, simple)
   - **NO** → use Playwright (price is loaded by JavaScript)
3. Does the platform offer an official API?
   - **YES** → use the API first — far more stable than scraping
   - **NO** → scrape, but monitor for breakage weekly

---

### 4.1 Basic Scraper (requests + BeautifulSoup)

**Install:**
```bash
pip install requests beautifulsoup4 lxml
```

**Amazon product scraper:**
```python
import requests
from bs4 import BeautifulSoup
import time, random

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

def scrape_amazon_product(url: str) -> dict | None:
    try:
        time.sleep(random.uniform(2, 5))  # Random delay — critical

        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        title  = soup.select_one("#productTitle")
        price  = soup.select_one(".a-price .a-offscreen")
        rating = soup.select_one("#acrPopover")
        image  = soup.select_one("#landingImage")

        return {
            "title":      title.get_text(strip=True)  if title  else None,
            "price_text": price.get_text(strip=True)  if price  else None,
            "rating":     rating["title"]              if rating else None,
            "image_url":  image["src"]                 if image  else None,
            "source_url": url,
            "platform":   "amazon",
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None
```

**Parse the price string to a float:**
```python
import re

def parse_price(price_text: str) -> float | None:
    """Convert 'EGP 1,299.00' or '1,299' → 1299.0"""
    if not price_text:
        return None
    digits = re.sub(r"[^\d.]", "", price_text.replace(",", ""))
    try:
        return float(digits)
    except ValueError:
        return None
```

> **Note:** Amazon changes its HTML selectors regularly. If `price` returns `None` after a few weeks, inspect the page again and update the CSS selector.

---

### 4.2 Playwright Scraper (JavaScript-rendered pages)

**Install:**
```bash
pip install playwright
playwright install chromium
```

**Noon scraper with Playwright:**
```python
import asyncio
from playwright.async_api import async_playwright
import random

async def scrape_noon_product(url: str) -> dict | None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_selector(".priceNow", timeout=10000)

            title = await page.text_content("h1.productTitle")
            price = await page.text_content(".priceNow")
            image = await page.get_attribute(".mainImage img", "src")

            return {
                "title":      title.strip() if title else None,
                "price_text": price.strip() if price else None,
                "image_url":  image,
                "source_url": url,
                "platform":   "noon",
            }
        except Exception as e:
            print(f"Playwright error on {url}: {e}")
            return None
        finally:
            await browser.close()

result = asyncio.run(scrape_noon_product("https://www.noon.com/egypt-en/..."))
```

**Batch scraping with concurrency limit:**
```python
async def scrape_many(urls: list[str], max_concurrent: int = 3):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def scrape_with_limit(url):
        async with semaphore:
            await asyncio.sleep(random.uniform(1, 3))
            return await scrape_noon_product(url)

    tasks = [scrape_with_limit(url) for url in urls]
    return await asyncio.gather(*tasks)
```

> **Tip:** Use `headless=False` while developing so you can watch the browser and see exactly what it does. Switch to `headless=True` for production.

---

### 4.3 Anti-Blocking Techniques

Platforms detect bots by looking for: identical request timing, missing browser headers, no cookies, the same IP every request, and pages loading too fast. These five techniques counter each one.

**1 — Rotate user agents:**
```python
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
]

def get_headers():
    return {
        "User-Agent":      random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer":         "https://www.google.com/",
        "DNT":             "1",
    }
```

**2 — Random delays between requests:**
```python
import time, random

def polite_delay(min_s=2, max_s=6):
    time.sleep(random.uniform(min_s, max_s))

def scrape_list(urls):
    for i, url in enumerate(urls):
        polite_delay()
        if i > 0 and i % 10 == 0:
            print("Taking a longer break...")
            time.sleep(random.uniform(30, 60))  # Long pause every 10 requests
        yield scrape_amazon_product(url)
```

**3 — Use a Session (maintains cookies):**
```python
import requests

session = requests.Session()
session.headers.update(get_headers())

# Hit the homepage first to get cookies, then scrape
session.get("https://www.amazon.eg", timeout=10)
product_resp = session.get(product_url, timeout=10)
```

**4 — Exponential backoff on errors:**
```python
def fetch_with_retry(url, session, max_retries=3):
    for attempt in range(max_retries):
        try:
            resp = session.get(url, timeout=10)
            if resp.status_code == 429:  # Rate limited
                wait = 2 ** attempt * 10  # 10s → 20s → 40s
                print(f"Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    return None
```

**5 — If still blocked:**
- Reduce concurrency to 1 request at a time
- Increase delays to 10–30 seconds
- Consider a paid proxy service with a free tier: BrightData or Oxylabs

---

### 4.4 Product Normalizer

The same product appears differently across platforms:
- Amazon: `"Samsung Galaxy A55 5G 128GB"`
- Noon: `"Galaxy A55 5G SM-A556 128GB Blue"`
- Jumia: `"SAMSUNG A55 128/8GB"`

The normalizer cleans, extracts attributes, and fuzzy-matches them into one canonical product record.

**Step 1 — Clean the title:**
```python
import re

def clean_title(raw: str) -> str:
    t = raw.strip()
    t = re.sub(r"\s+", " ", t)        # collapse whitespace
    t = re.sub(r"[^\w\s\-/]", "", t)  # keep alphanumeric + dash/slash
    t = t.lower()
    noise = ["new", "original", "genuine", "official", "free shipping"]
    for word in noise:
        t = t.replace(word, "")
    return t.strip()
```

**Step 2 — Extract structured attributes:**
```python
def extract_attributes(title: str) -> dict:
    attrs = {}

    storage = re.search(r"(\d+)\s*(gb|tb)", title, re.I)
    if storage:
        val, unit = int(storage.group(1)), storage.group(2).lower()
        attrs["storage_gb"] = val * 1024 if unit == "tb" else val

    ram = re.search(r"(\d+)\s*gb\s*ram", title, re.I)
    if ram:
        attrs["ram_gb"] = int(ram.group(1))

    brands = ["samsung", "apple", "xiaomi", "oppo", "realme",
              "lg", "sony", "huawei", "honor", "nokia"]
    for brand in brands:
        if brand in title.lower():
            attrs["brand"] = brand
            break

    return attrs
```

**Step 3 — Fuzzy match across platforms:**
```bash
pip install rapidfuzz
```
```python
from rapidfuzz import fuzz

def find_matching_product(new_title: str, existing_products: list) -> int | None:
    cleaned = clean_title(new_title)
    best_score, best_id = 0, None

    for product in existing_products:
        score = fuzz.token_sort_ratio(cleaned, product["clean_title"])
        if score > best_score:
            best_score = score
            best_id = product["id"]

    # 85+ = same product, below = new product
    return best_id if best_score >= 85 else None
```

> **Tip:** Start with a threshold of 85. Test it on 50 real products from your platforms and adjust — phones may need 90+, accessories may work at 75+.

---

### 4.5 Scheduler

**Option A — APScheduler (recommended for graduation projects):**

Runs inside your FastAPI process. Zero extra services needed.

```bash
pip install apscheduler
```
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()

async def run_all_scrapers():
    await scrape_amazon_catalog()
    await scrape_noon_catalog()
    await scrape_jumia_catalog()

scheduler.add_job(
    run_all_scrapers,
    trigger=IntervalTrigger(hours=8),
    id="full_scrape",
    replace_existing=True,
)

# Call scheduler.start() in your FastAPI lifespan startup event
```

**Option B — Celery + Redis (production-grade, more setup):**

Use if you need distributed workers or if a single scrape run takes too long.

```bash
pip install celery redis
```
```python
from celery import Celery
from celery.schedules import crontab

app = Celery("scraper", broker="redis://localhost:6379/0")

app.conf.beat_schedule = {
    "scrape-every-8-hours": {
        "task": "scraper.tasks.run_all_scrapers",
        "schedule": crontab(minute=0, hour="0,8,16"),
    },
}
```

**Always log every scrape run in the database:**
```sql
CREATE TABLE scrape_runs (
    id               SERIAL PRIMARY KEY,
    platform         VARCHAR(50) NOT NULL,
    started_at       TIMESTAMP DEFAULT NOW(),
    finished_at      TIMESTAMP,
    products_scraped INT DEFAULT 0,
    errors           INT DEFAULT 0,
    status           VARCHAR(20) DEFAULT 'running'
    -- status: running | success | failed
);
```

When a scraper breaks (and it will), these logs tell you exactly when it started failing, how many products it got before the error, and whether the cause was a selector change or an IP block.

---

## 5. Key Risks & Mitigations

| Risk | Level | Mitigation |
|------|-------|------------|
| Platform blocks your scraper | High | Use rate-limiting, rotate user-agents, add random delays. Start with Playwright for JS-heavy sites. |
| Platform HTML structure changes | High | Write modular scrapers (one file per platform). Build alerts when scraper returns 0 results. |
| Scope creep — too many features | Medium | Define MVP in Week 1 and freeze it. New ideas go in a "v2 list" only. |
| No prior mobile experience causes delays | Medium | Allow 2 full weeks for learning sprint (Phase 2). Start with Expo for the fastest feedback loop. |
| Backend hosting costs | Low | Railway, Render, and Fly.io all offer free tiers sufficient for a graduation project. |
| Legal concerns about scraping | Low | Scraping publicly visible prices is generally accepted. Respect `robots.txt`. Do not scrape personal data. |

---

## 6. Final Deliverables

### By Phase 1–2
- Research report (2–3 pages)
- Wireframes / UI mockups
- Tech stack decision document
- Running "Hello World" mobile app

### By Phase 3
- Working scrapers for 2+ platforms
- REST API with product search endpoint
- Mobile app with core screens (search, comparison, detail)
- PostgreSQL database populated with 500+ products

### By Phase 4–5
- Bug-fixed, user-tested app
- 3-minute video demo recording
- Full project report
- Deployed backend (Railway / Render) + release APK or TestFlight build

---

## Quick Start (After Tech Stack Is Chosen)

```bash
# 1. Clone repo and set up Python environment
git clone https://github.com/your-org/price-comparison-app.git
cd price-comparison-app
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn requests beautifulsoup4 lxml playwright apscheduler rapidfuzz psycopg2-binary
playwright install chromium

# 2. Set up the database
psql -U postgres -c "CREATE DATABASE priceapp;"
# Run your migrations

# 3. Start the backend
uvicorn app.main:app --reload

# 4. Run your first scraper manually
python -m scraper.amazon --url "https://www.amazon.eg/..."

# 5. Start the mobile app (Expo)
cd mobile && npx expo start
```

---

*This document was generated as part of graduation project planning. Update it as decisions evolve — especially the scraper selectors section, which will need revisiting each time a platform updates its HTML structure.*
