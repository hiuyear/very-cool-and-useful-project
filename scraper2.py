#!/usr/bin/env python3
"""
scraper.py

Just set the `URL` variable below (or inject it from your backend)
and run: python scraper.py
"""

import logging
import re
from typing import Optional

import requests
from bs4 import BeautifulSoup

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURE THIS URL to the Devpost profile you want to scrape
URL = "https://devpost.com/nitin-rn-nag"
# ─────────────────────────────────────────────────────────────────────────────

# ——— Logging setup ———
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def get_profile_info(devpost_url: str) -> dict:
    """
    Scrape name, github, linkedin, and location (with LinkedIn fallback).
    """
    headers = {"User-Agent": "Mozilla/5.0 (compatible; Scraper/1.0)"}
    try:
        resp = requests.get(devpost_url, headers=headers, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        logger.error("Failed to fetch Devpost URL %s: %s", devpost_url, e)
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")

    # 1) NAME
    name = None
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        raw = h1.get_text(strip=True)
        m = re.match(r"(.+?)\s*\(", raw)
        name = m.group(1).strip() if m else raw
    logger.info("Parsed name: %s", name)

    # 2) SOCIAL LINKS
    github = linkedin = None
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href:
            continue
        if "github.com/" in href and not github:
            github = href if href.startswith(("http://","https://")) else f"https://{href}"
        elif "linkedin.com/" in href and not linkedin:
            linkedin = href if href.startswith(("http://","https://")) else f"https://{href}"
    logger.info("Parsed github: %s, linkedin: %s", github, linkedin)

    # 3) LOCATION from Devpost (look for map‑marker icon first)
    location = None
    if h1:
        ul = h1.find_next_sibling("ul")
        if ul:
            # (a) exact marker icon
            for li in ul.find_all("li"):
                icon = li.find("i", class_=lambda c: c and "map-marker" in c)
                if icon:
                    location = li.get_text(" ", strip=True)
                    break
            # (b) fallback: first <li> with no <a> and no digits
            if not location:
                for li in ul.find_all("li"):
                    if not li.find("a"):
                        txt = li.get_text(strip=True)
                        if txt and not any(ch.isdigit() for ch in txt):
                            location = txt
                            break
    logger.info("Parsed Devpost location: %s", location)

    # 4) FALLBACK: LinkedIn scrape for location (if still None)
    if not location and linkedin:
        try:
            location = get_linkedin_location(linkedin)
            logger.info("Parsed LinkedIn location: %s", location)
        except ImportError:
            logger.warning("Playwright not installed; skipping LinkedIn fallback")
        except Exception as e:
            logger.warning("Error scraping LinkedIn for location: %s", e)

    return {
        "name":     name,
        "github":   github,
        "linkedin": linkedin,
        "location": location
    }


def get_linkedin_location(linkedin_url: str) -> Optional[str]:
    """
    Uses Playwright to fetch a public LinkedIn profile and
    scrape the 'bullet' list at the top for a city/country string.
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(linkedin_url, timeout=30_000)
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")
    # LinkedIn often uses a <ul class="pv-top-card--list-bullet"> for bullets
    ul = soup.find("ul", class_=lambda c: c and "pv-top-card--list-bullet" in c)
    if not ul:
        return None

    for li in ul.find_all("li"):
        text = li.get_text(" ", strip=True)
        # heuristics: contains a comma, no digits
        if "," in text and not any(ch.isdigit() for ch in text):
            return text

    return None


if __name__ == "__main__":
    info = get_profile_info(URL)
    if not info:
        logger.error("No info scraped.")
    else:
        print(info)
