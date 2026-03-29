#!/usr/bin/env python3
"""
BoatExperts — build script.

Usage:
    python build.py           # build all pages
    python build.py new-page  # create a new landing page interactively
"""

import json
import shutil
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, TemplateNotFound

BASE_DIR    = Path(__file__).parent.resolve()
PAGES_DIR   = BASE_DIR / "pages"
TEMPLATES_DIR = BASE_DIR / "templates"
CSS_DIR     = BASE_DIR / "css"
JS_DIR      = BASE_DIR / "js"
ASSETS_DIR  = BASE_DIR / "assets"
DIST_DIR    = BASE_DIR / "dist"
CONFIG_FILE = BASE_DIR / "config.json"


def load_config(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def copy_dir(src: Path, dest: Path) -> None:
    if not src.exists():
        return
    dest.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        target = dest / item.name
        if item.is_dir():
            shutil.copytree(item, target, dirs_exist_ok=True)
        else:
            shutil.copy2(item, target)


def build() -> None:
    site_config = load_config(CONFIG_FILE)
    print(f"Building: {site_config.get('site_name', 'BoatExperts')}\n")

    DIST_DIR.mkdir(exist_ok=True)

    # Copy static assets
    for src, name in [(CSS_DIR, "css"), (JS_DIR, "js"), (ASSETS_DIR, "assets")]:
        copy_dir(src, DIST_DIR / name)
        print(f"  Copied {name}/")

    # Jinja environment — templates/ first, then pages/ (for extends/includes)
    env = Environment(
        loader=FileSystemLoader([str(TEMPLATES_DIR), str(PAGES_DIR)]),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    # Render each page
    pages = sorted(PAGES_DIR.glob("*.html"))
    if not pages:
        print("No pages found in pages/")
        return

    print()
    for page_path in pages:
        stem = page_path.stem
        page_config_path = PAGES_DIR / f"{stem}.json"

        if page_config_path.exists():
            page_config = load_config(page_config_path)
            label = f"{page_path.name} (using {stem}.json)"
        else:
            page_config = site_config
            label = page_path.name

        try:
            template = env.get_template(page_path.name)
        except TemplateNotFound:
            print(f"  ERROR: template not found for {page_path.name}, skipping.")
            continue

        rendered = template.render(config=page_config)
        out = DIST_DIR / page_path.name
        out.write_text(rendered, encoding="utf-8")
        print(f"  Built: {label}")

    print("\nDone.")


def new_page() -> None:
    name = input("Page name (e.g. outboard-repair): ").strip().lower().replace(" ", "-")
    if not name:
        print("ERROR: name cannot be empty.")
        sys.exit(1)

    dest_html = PAGES_DIR / f"{name}.html"
    dest_json = PAGES_DIR / f"{name}.json"

    if dest_html.exists():
        print(f"ERROR: pages/{name}.html already exists.")
        sys.exit(1)

    template_html = PAGES_DIR / "electronics.html"
    template_json = PAGES_DIR / "electronics.json"

    if not template_html.exists():
        print("ERROR: pages/electronics.html not found — cannot use as template.")
        sys.exit(1)

    shutil.copy(template_html, dest_html)
    if template_json.exists():
        shutil.copy(template_json, dest_json)

    print(f"\nCreated:")
    print(f"  pages/{name}.html")
    print(f"  pages/{name}.json")
    print(f"\nEdit pages/{name}.json with your content, then rebuild:")
    print(f"  docker compose run --rm builder")


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else None

    if cmd == "new-page":
        new_page()
    else:
        build()


if __name__ == "__main__":
    main()
