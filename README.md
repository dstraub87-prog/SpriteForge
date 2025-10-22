# # SpriteForge v1 (32×32)

Static HTML sprite-sheet editor demo, ready for GitHub Pages.

## What you get
- Layered 32×32 sprite composer (Knight, Mage, Rogue, Healer presets).
- Embedded placeholder assets (SVG data URIs) so it runs immediately.
- Export PNG sprite-sheet (single row, configurable columns).

## How to use
1. Put the project in a repo or local folder.
2. Optional: replace embedded assets by editing `config/manifest.json` to point at `/assets/...png`.
3. Upload to GitHub and enable Pages (or host on Hugging Face static Space).

## To replace assets
- Add PNGs under `assets/<category>/file.png`.
- Update `config/manifest.json` arrays to reference the relative paths.
- Refresh the page.

## Licensing
Placeholder assets are simple SVG shapes for demo. Replace with LPC or other open assets for production.

Enjoy — you can now iterate and later swap in high-quality LPC sprites or AI-generated layers.