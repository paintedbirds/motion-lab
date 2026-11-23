# Roadmap

What comes next for Motion Lab, in order. Each step is small enough to do on its own.

The idea behind the order: the 53 motions are strong at arranging many screens. What is missing is what happens
with one screen, and what similar tools already offer (Animos, Scrollio, Rotato, Mokkit, Animockup): frames,
scroll, text on top, and video as input.

## Done

- **Frames.** Every screen can sit in a browser window or a phone. Style tab, "Marco". Link key `frame`.
  It lives in one place: `place()` in `src/engine/motion.js`, so every motion gets it.
  Cards without corners (`radius: 0`) stay bare.

## 1. Scroll with stops

A long capture moves down inside its card and rests on 2 or 3 points, with a small zoom on each.
The most asked mockup video for landings, and it works with a single image.

- New scene `scroll` in `src/engine/lab.js`, group "Protagonista". Pure function of `p`, back at the top at the end.
- The scene has to draw the image itself with `frame()` and its own `crop.y`, not through the cached `tile`.
  Use a `live` card.
- First version: stops are automatic, evenly spread. Later: let the person mark them in the crop dialog.
- Raise `limits.edge` (2400) for tall images, or a long capture loses sharpness. Check memory on phones.
- With several images: each one scrolls in turn. Add `scroll` to `TURNS` in `advice()`.

## 2. Title and logo

One line of text and one logo on top of the video, with an entry and an exit.
Kept small on purpose: not a free canvas.

- Config: `title`, `titlePos` (top or bottom), `logo` (image data), drawn at the end of `draw()`.
- Text is drawn with Geist, already loaded before the app starts.
- The title must not travel in links if it can hold private text. Decide before adding it to `url-state.ts`.
- `persist.ts` checks project files: add the same image check for `logo` as for `bgImage`.

## 3. Video as input

A screen recording plays inside a card while the card moves. The most expensive step.

- Loading: `loadImages()` only knows images. A video needs frames decoded by time.
- Export: `browser-export.ts` draws frame by frame, so the video has to be seeked for every frame.
- Saving: videos are too heavy for the project file and for IndexedDB as data URLs.
- Do this only after steps 1 and 2 are in use.

## Smaller things

- **Header on phones.** At 390px wide the logo wraps and the export button is cut off (`src/editor/editor.tsx`).
- **Check the five reveal motions by eye.** `reveal()` in `src/engine/lab-profundidad.js` was rebuilt from how
  the scenes use it: Compuerta, Iris, Tajo, Persiana, Azulejos. Card size, rests and the Iris zoom are estimates.
- **Curate the list.** Consider hiding the five "Primeras pruebas" motions.
- **More frames.** Laptop and tablet, drawn in canvas like the others. Do not use photos of real devices:
  those designs belong to their makers.
- **Transparent WebM.** Animos offers it. Needs a canvas with alpha and a codec that keeps it.
