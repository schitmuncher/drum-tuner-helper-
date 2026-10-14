# Drum Tuner Helper

A single-file web app that overlays drum lug markers on your camera feed, walks you through a star tightening pattern, and can measure each lug's pitch with the phone microphone to show how even the head is.

## Usage

1. Open `index.html` in a mobile browser. Camera and microphone access need HTTPS or localhost. The camera is off by default: the app works as a virtual drumhead, and you can turn the camera on with the **📷 Camera** button in the header.
2. Tap each lug on screen, or use an Auto 6/8/10-lug preset.
3. Press **Start Tuning**. Follow the numbered sequence, tapping **Tightened ✓** (or the active lug itself) after each lug. **◀ Back** returns to the previous lug.
4. Optional: press **🎙 Measure pitch**, then tap the head with a stick after tightening each lug. Each reading shows the pitch in Hz and how far it sits from the ring's median in cents.
5. When the star is complete, the status line reports the spread between lugs and which lug to tighten. Start another pass to keep going.

## Features

- Star (cross-tightening) order for 4–12 lugs, plus a standard order for odd counts.
- Auto-ring presets, plus free placement by tapping.
- Pass counter, haptic buzz on each step where the device supports it.
- The last layout you started tuning with is saved on the device and can be restored.
- Pitch measuring from the microphone: autocorrelation pitch detection, 60–400 Hz, with cents spread and a hint for the lowest lug.
- Lug layout is stored relative to the drum centre, so markers stay aligned when the phone rotates.

## Limits

- Pitch measuring works best in a quiet room with the phone close to the drum. Ring-out from other drums or background noise can throw readings off.
- Readings are a guide to evenness, not an absolute tuning target. Use them to balance the lugs against each other.

## Testing

`tests/logic-test.js` runs with `node tests/logic-test.js` (no build step). The logic (star order, pitch detection, cents and spread) was checked with Node against synthetic tones and ring layouts. Final behaviour should be checked on a real phone and drum.
