# Ghxsty Music - Architecture Notes

## Stack
- Desktop shell: Electron
- UI: React + Vite
- Styling/animations: CSS + Framer Motion
- Persistence: IndexedDB (tracks) + localStorage (prefs/caches)

## Main process
- File: `electron/main.js`
- Responsibilities:
  - Window/tray/shortcuts
  - Download orchestration (yt-dlp/ffmpeg usage)
  - Dependency checks (`check:dependencies`)
  - Auto-updater wiring (`electron-updater`)
  - IPC endpoints for renderer

## Preload bridge
- File: `electron/preload.cjs`
- Exposes safe API to renderer via `window.novaPlayer`

## Renderer
- File: `src/App.jsx`
- Centralized app state for:
  - Tracks, playlists, favorites, pinned
  - Playback and queue
  - Metadata caches
  - Panels/modals (settings, notifications, downloads, add flow)

## Data model (high-level)
- Track:
  - `id`, `title`, `artist`, `album`, `duration`
  - `audioUrl` / blob-backed local references
  - `coverUrl`, `coverRemoteUrl`, `coverTone`
  - `isFavorite`, `isPinned`, `order`, `source`
- Playlist:
  - `id`, `name`, `description`, `coverUrl`, `color`
  - `trackIds[]`

## Persistence strategy
- IndexedDB:
  - Local track objects and blobs
- localStorage:
  - UI prefs
  - playlists/favorites/pinned IDs
  - cache objects (cover/album/genre/lyrics/artist profile)
- Debounced saves are used to reduce disk churn.

## Performance strategy (existing)
- Debounced persistence writes
- Cache maps and memoization for expensive lookups
- Conditional rendering batches for long track lists
- Reduced update cadence while app is backgrounded

## Dependency model (current)
- Runtime auto install is disabled.
- App checks missing tools and shows dependency modal with manual links.
- Required external tools:
  - python
  - yt-dlp
  - ffmpeg
  - ytmusicapi (python package)
