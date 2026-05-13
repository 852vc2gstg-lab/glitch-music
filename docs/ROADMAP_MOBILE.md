# Ghxsty Music - Mobile Roadmap

## Recommended approach
1. Keep current app as desktop source-of-truth.
2. Build a separate mobile project (React + Capacitor/React Native).
3. Reuse business rules via shared docs/spec first, then shared modules.

## What can be reused directly
- Product logic and UX rules:
  - playlists/favorites/pinned
  - queue behavior
  - metadata and cache strategy
  - settings model
- API/IPC contract ideas (adapted to mobile services)

## What must be adapted
- Electron-specific features:
  - tray, global shortcuts, desktop updater, native menus
- File system and permissions
- Background playback constraints (Android/iOS policies)
- Dependency model (`yt-dlp/ffmpeg/python`) must be redesigned for mobile

## Mobile MVP suggestion
1. Local playback + playlists + favorites
2. Search/add flow (without heavy downloader at first)
3. Lyrics + artist panels
4. Background playback + media controls

## Stability/perf target for mobile
- Virtualized lists by default
- Aggressive image caching + size caps
- Minimal interval timers in background
