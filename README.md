# Motion Lab

Turn screenshots, photos and designs into looping mockup videos, right in the browser.

Upload images, pick one of 53 motions, choose a background and a format (9:16, 4:5, 1:1, 16:9), and download an MP4, WebM or GIF that repeats without a cut. Nothing is uploaded: the images are drawn and encoded on your device.

Live: https://motion-lab-pb.netlify.app

## What it does

- 53 motions drawn on a 2D canvas, each a pure function of the loop position, so the end always matches the start.
- Backgrounds: solid, gradient (any angle), radial, your own image, with optional animation.
- Export in the browser with WebCodecs: MP4 (H.264), WebM (VP9 or AV1) and GIF. Which types appear depends on the browser.
- Your project is saved in the browser (IndexedDB) and can be saved to and opened from a `.json` file.
- Links per motion: `/editor/<motion>?format=square&speed=0.75`.
- Spanish and English, chosen from the browser language.

## Run it

```bash
npm install
npm run dev      # http://127.0.0.1:4321
npm run build    # static site in dist/
```

## Layout

| Path | What it holds |
| --- | --- |
| `src/engine/` | The animation engine: scenes, presets and drawing. No dependencies. |
| `src/editor/` | The editor: state, panels, in-browser export, saved projects, link state. |
| `src/landing.tsx`, `src/legal.tsx` | Landing page and the privacy and terms pages. |
| `src/i18n.ts`, `src/locales/en.ts` | Language switch. Spanish is what the code renders; every English string lives in `en.ts`. |
| `src/components/ui/` | shadcn-style components built on Radix. |

When you add visible text in Spanish, add its English in `src/locales/en.ts`.

## Privacy

No accounts, cookies or analytics. See `/privacy` and `/terms` in the app.

## Made by

[Painted Birds](https://paintedbirds.xyz/?utm_source=motion-lab&utm_medium=referral&utm_campaign=repo)
