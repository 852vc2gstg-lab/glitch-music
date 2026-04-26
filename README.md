# Music

This app keeps two separate libraries:

- Local uploads stay on each user's own PC in IndexedDB.
- Shared tracks come from a Google Drive manifest and are read-only in the app.

There is also a local admin page for you:

- Open `admin.html` in the same dev/build output.
- Use it to import many MP3 files, fill links, and export `tracks.json`.

## Local run

```bash
npm run desktop
```

For the admin panel, run:

```bash
npm run admin
```

If you only want the dev server, you can still open `http://127.0.0.1:5173/admin.html` in a browser.

## Drive-based shared catalog

Set `VITE_DRIVE_MANIFEST_URL` to a public JSON file stored in Google Drive, then start the app.

The manifest can either be a bare array of tracks or an object with a `tracks` field.

Example track shape:

```json
{
  "id": "radiohead-paranoid-android",
  "title": "Paranoid Android",
  "artist": "Radiohead",
  "audioUrl": "https://drive.google.com/uc?export=download&id=FILE_ID",
  "coverUrl": "https://drive.google.com/uc?export=download&id=FILE_ID",
  "duration": 386
}
```

## Notes

- Local uploads never leave the user's machine.
- Drive tracks can be played and added to local playlists.
- If you use Drive share links, the app will try to convert them into direct download URLs automatically.
- The admin panel can read MP3 metadata locally and export a manifest JSON for Drive.

## Auto update with GitHub Release

The app now supports update checks from GitHub Releases (for installed `.exe` builds).

1. Set environment variables:

```powershell
$env:GH_OWNER="YOUR_GITHUB_USERNAME_OR_ORG"
$env:GH_REPO="YOUR_APP_REPOSITORY"
$env:GH_TOKEN="YOUR_GITHUB_PAT_WITH_REPO_ACCESS"
```

2. Bump version in `package.json` (for example `0.4.33` -> `0.4.34`).

3. Build and publish release artifacts:

```powershell
npm run dist:github
```

This uploads installer + update metadata (`latest.yml`) to your GitHub Release.
Other installed users will receive update notifications automatically.

