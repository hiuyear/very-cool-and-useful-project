#!/usr/bin/env python3
"""
scraper_service.py

Flask service that scrapes up to 10 Devpost profiles in parallel
and returns a simple HTML table of name, GitHub, LinkedIn, and location.
"""

import os
import logging
import re
from typing import Optional, List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup
from flask import Flask, request, abort, render_template_string

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
MAX_PROFILES = 10
USER_AGENT = "Mozilla/5.0 (compatible; ScraperService/1.0)"
TIMEOUT = 15  # seconds
# ─────────────────────────────────────────────────────────────────────────────

# ——— Logging setup ———
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def get_profile_info(devpost_url: str) -> Dict[str, Optional[str]]:
    """
    Scrape name, GitHub, LinkedIn, and location (with LinkedIn fallback).
    """
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = requests.get(devpost_url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        logger.error("Failed to fetch Devpost URL %s: %s", devpost_url, e)
        return {"name": None, "github": None, "linkedin": None, "location": None}

    soup = BeautifulSoup(resp.text, "html.parser")

    # 1) NAME
    name = None
    h1 = soup.find("h1")
    if h1 and (raw := h1.get_text(strip=True)):
        m = re.match(r"(.+?)\s*\(", raw)
        name = (m.group(1).strip() if m else raw)

    # 2) SOCIAL LINKS
    github = linkedin = None
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if "github.com/" in href and not github:
            github = href if href.startswith(("http://", "https://")) else f"https://{href}"
        elif "linkedin.com/" in href and not linkedin:
            linkedin = href if href.startswith(("http://", "https://")) else f"https://{href}"

    # 3) LOCATION from Devpost (map‑marker icon first)
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

    # 4) FALLBACK: LinkedIn scrape for location
    if not location and linkedin:
        try:
            location = get_linkedin_location(linkedin)
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
    ul = soup.find("ul", class_=lambda c: c and "pv-top-card--list-bullet" in c)
    if not ul:
        return None

    for li in ul.find_all("li"):
        text = li.get_text(" ", strip=True)
        if "," in text and not any(ch.isdigit() for ch in text):
            return text

    return None

@app.route("/scrapeProfiles", methods=["POST"])
def scrape_profiles():
    """
    POST JSON:
      { "urls": ["https://devpost.com/xyz", ... ] }
    Returns: text/html with a <table> of results.
    """
    payload = request.get_json(force=True, silent=True)
    if not payload or "urls" not in payload:
        abort(400, description="Must provide JSON body with 'urls' array.")
    urls = payload["urls"]
    if not isinstance(urls, list) or not 1 <= len(urls) <= MAX_PROFILES:
        abort(400, description=f"'urls' must be a list of 1–{MAX_PROFILES} URLs.")

    # Scrape in parallel
    profiles: List[Dict[str, Optional[str]]] = []
    with ThreadPoolExecutor() as pool:
        future_map = { pool.submit(get_profile_info, url): url for url in urls }
        for fut in as_completed(future_map):
            profiles.append(fut.result())

    # Build HTML table
    html = render_template_string("""
    <table border="1" cellpadding="4" cellspacing="0">
      <thead>
        <tr>
          <th>Name</th>
          <th>GitHub</th>
          <th>LinkedIn</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
      {% for p in profiles %}
        <tr>
          <td>{{ p.name or '—' }}</td>
          <td>
            {% if p.github %}
              <a href="{{ p.github }}" target="_blank">GitHub</a>
            {% else %}
              —
            {% endif %}
          </td>
          <td>
            {% if p.linkedin %}
              <a href="{{ p.linkedin }}" target="_blank">LinkedIn</a>
            {% else %}
              —
            {% endif %}
          </td>
          <td>{{ p.location or '—' }}</td>
        </tr>
      {% endfor %}
      </tbody>
    </table>
    """, profiles=profiles)

    return html, 200, {"Content-Type": "text/html"}


if __name__ == "__main__":
    # For local testing only; in prod, use Gunicorn/Uwsgi
    app.run(host="0.0.0.0", port=5000, debug=False)
