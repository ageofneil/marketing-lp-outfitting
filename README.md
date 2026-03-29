# BoatExperts — Marketing Site

Static marketing site and landing page manager. Built with Jinja2 + plain HTML/CSS/JS, containerised with Docker.

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Nothing else needs to be installed locally.

---

## Install

```bash
docker compose build
```

---

## Run

**Build once:**
```bash
docker compose run --rm builder
```

**Watch mode** — rebuilds automatically on every file save:
```bash
docker compose run --rm watch
```

Output is written to `dist/`. Open `dist/index.html` in your browser to preview.

---

## CLI Commands

| Command | What it does |
|---|---|
| `docker compose run --rm builder` | Build all pages |
| `docker compose run --rm watch` | Watch for changes and rebuild automatically |
| `docker compose run --rm builder new-page` | Create a new landing page interactively |

---

## Adding a New Page

```bash
docker compose run --rm builder new-page
```

Enter a name when prompted (e.g. `outboard-repair`). This creates:

```
pages/outboard-repair.html   ← page template
pages/outboard-repair.json   ← page content and config
```

Edit the `.json` file with your content. The watcher will rebuild automatically on save.

---

## Updating an Existing Page

All page content lives in the `.json` file alongside the page template.

**Example — update the electronics page:**

Edit `pages/electronics.json` — headline, subheadline, benefits, testimonials, advisor list, etc.

If the watcher is running, `dist/electronics.html` updates on save. Otherwise run:

```bash
docker compose run --rm builder
```

To update styles, edit `css/theme.css` (brand colours/fonts) or `css/base.css` (global styles).

---

## Project Structure

```
config.json        # site-wide config (homepage)
pages/             # page templates + per-page content
css/               # styles
js/                # scripts
templates/         # shared Jinja layouts and partials
assets/            # images and static files
dist/              # build output — this is what gets deployed
```

---

## Deployment

Deployed on [Vercel](https://vercel.com), triggered automatically by pushing to GitHub.

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | https://boathelpnetwork.com |

**Workflow:**
1. Do all work and testing locally with Docker
2. Push to `main` → deploys to production

---

## Environment Variables

Set in Vercel under **Project Settings → Environment Variables** — never committed to the repo.

| Variable | Description |
|---|---|
| `KLAVIYO_API_KEY` | Klaviyo private API key — required for lead capture |
