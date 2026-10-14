# Drum Tuner Helper

A single-file web app that overlays drum lug markers on your camera feed and walks you through a star tightening pattern.

## Usage

1. Open `index.html` in a mobile browser (camera access requires HTTPS or localhost; it falls back to a virtual drumhead if the camera is unavailable).
2. Tap each lug on screen, or use an Auto 6/8/10-lug preset.
3. Press **Start Tuning**. Follow the numbered sequence, tapping **Tightened ✓** (or the active lug itself) after each lug.
4. When the star is complete, start another pass.

## Changes in this version

- Corrected the star tightening order for even lug counts (4, 6, 8, 10, 12) to the standard cross-tightening patterns. The previous ordering could visit adjacent lugs in sequence.
- Lug positions are stored relative to the drum centre, so markers stay aligned after rotating the phone.
- Disabled page scrolling/zoom gestures over the tuning area.
- Removed unused variables and state.
