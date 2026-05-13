# Ghxsty Music - Storage Keys

## Primary localStorage keys
- `nova-player-ui`
- `nova-player-playlists`
- `nova-player-favorites`
- `nova-player-pinned`
- `nova-player-play-stats`
- `nova-player-artist-facts`
- `nova-player-cover-cache`
- `nova-player-album-cache`
- `nova-player-genre-cache`
- `nova-player-cover-tone-cache`
- `nova-player-lyrics-cache`
- `nova-player-artist-profile-yt-cache`
- `nova-player-ytm-search-cache`
- `nova-player-ytm-album-tracks-cache`
- `nova-player-first-run-onboarding-v1`
- `nova-player-dependency-notice-v2`

## IndexedDB
- DB name: `nova-player-db`
- Store: `tracks`

## Notes
- Keep key names stable for migration compatibility.
- If key renames are needed, add migration code at startup.
