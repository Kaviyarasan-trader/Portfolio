"""
Live GitHub data service.

Fetches real public data from GitHub's REST API and the public
contributions calendar page, cached briefly in Django's in-memory
cache so the portfolio stays fast and does not hammer the API.
All numbers are pulled live — nothing is hardcoded or fabricated.
"""

import json
import re
import urllib.request
from datetime import datetime

from django.core.cache import cache

API_BASE = "https://api.github.com"
USER_AGENT = "portfolio-github-activity"
CACHE_TTL = 60 * 30  # 30 minutes


def _fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _parse_count(text):
    match = re.search(r"([\d,]+)\s+contributions?", text or "")
    return int(match.group(1).replace(",", "")) if match else 0


def _fetch_user(username):
    """Public user info: repo count, followers, profile URL."""
    try:
        data = json.loads(_fetch(f"{API_BASE}/users/{username}"))
    except Exception:
        return {}
    return {
        "login": data.get("login", username),
        "public_repos": data.get("public_repos"),
        "followers": data.get("followers"),
        "profile_url": data.get("html_url") or f"https://github.com/{username}",
    }


def _fetch_contributions(username):
    """
    Parse the public contribution calendar.

    Each calendar day is a <td data-date="YYYY-MM-DD" id="contribution-day-component-...">,
    and its count is in the paired <tool-tip for="...">N contributions on ...</tool-tip>.
    Returns (total over the shown 12 months, total for the current calendar year).
    """
    try:
        html = _fetch(f"https://github.com/users/{username}/contributions")
    except Exception:
        return None, None

    days = {}
    for date, day_id in re.findall(
        r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[\w-]+)"',
        html,
    ):
        days[day_id] = date
    tips = dict(
        re.findall(
            r'<tool-tip[^>]*for="(contribution-day-component-[\w-]+)"[^>]*>([^<]*)</tool-tip>',
            html,
        )
    )
    if not days or not tips:
        return None, None

    this_year = datetime.now().year
    total_12m = 0
    year_total = 0
    for day_id, date in days.items():
        count = _parse_count(tips.get(day_id, ""))
        total_12m += count
        if date.startswith(str(this_year)):
            year_total += count
    return total_12m, year_total


def _fetch_top_language(username):
    """Most common primary language across the public repos."""
    try:
        repos = json.loads(_fetch(f"{API_BASE}/users/{username}/repos?per_page=100&sort=pushed"))
    except Exception:
        return None

    counts = {}
    for repo in repos:
        lang = repo.get("language")
        if lang:
            counts[lang] = counts.get(lang, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda kv: kv[1])[0]


def get_github_stats(username):
    """Aggregate live GitHub stats for the given username (cached)."""
    if not username:
        return {}

    cache_key = f"github_stats_{username}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    user = _fetch_user(username)
    total_12m, this_year = _fetch_contributions(username)
    top_language = _fetch_top_language(username)

    data = {
        "username": user.get("login", username),
        "public_repos": user.get("public_repos"),
        "followers": user.get("followers"),
        "profile_url": user.get("profile_url") or f"https://github.com/{username}",
        "top_language": top_language,
        "contributions_total": total_12m,
        "contributions_year": this_year,
        "heatmap_url": f"https://ghchart.rshah.org/{username}",
        "fetched_at": datetime.now().isoformat(),
    }
    cache.set(cache_key, data, CACHE_TTL)
    return data
