# Tay Boy Interactive

One-page studio site. A single static `index.html` with no build step.

- `index.html` — the page. The wordmark is baked-in SVG; the only script cuts the color-block edges to size.
- `assets/` — Tater's photo, the Cheddar and Dailies app icons, favicons, and the share image.

The page is generated from the brand concept in the "Tay Boy Interactive" Claude project folder (`tayboy-site-concept.html` + `build-site.py`). Edit there and rebuild rather than hand-editing the baked SVG.

Open `index.html` directly or serve the folder with any static server. Pushes to `main` deploy to tayboyinteractive.com.
