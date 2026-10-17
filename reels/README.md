# AZMIN premium reels (Remotion)

Motion-graphics reels coded in React with [Remotion](https://www.remotion.dev) (free for companies up to 3 people).

```
cd reels && npm install
# clips go in public/ (e.g. Flow clips collected from Telegram: media/inbox/*.mp4)
npx remotion render src/index.ts DemoReel out/reel.mp4 --codec=h264 --crf=18
```
In cloud sessions pass `--browser-executable` pointing to the pre-installed Chromium headless shell.

- `src/DemoReel.tsx` — v1 demo: Veo hero clip + kinetic type → real client site in 3D phone → services → logo/CTA.
- Brand colours in `src/brand.ts`; fonts/logo/screenshots copied into `public/`.
