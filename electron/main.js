import { app, BrowserWindow, Menu, Tray, dialog, globalShortcut, ipcMain, nativeImage, shell } from 'electron'
import RPC from 'discord-rpc'
import { autoUpdater } from 'electron-updater'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const discordClientId = process.env.DISCORD_CLIENT_ID || '1493213707864510464'
const discordLargeImageKey = process.env.DISCORD_LARGE_IMAGE_KEY || 'ghxsty_music_logo'
const discordSmallImageKey = process.env.DISCORD_SMALL_IMAGE_KEY || 'ghxsty_music_note'
const isAdminMode = process.env.OPEN_ADMIN === 'true'

let rpcClient = null
let mainWindow = null
let tray = null
let isQuitting = false
let closeBehavior = 'tray'
const runtimePrefsFile = path.join(app.getPath('userData'), 'runtime-prefs.json')
let resetShortcutEnabled = true
let mediaToggleShortcut = ''
let registeredCustomMediaShortcut = ''
const libraryDownloadControls = new Map()
const updaterState = {
  checking: false,
  updateAvailable: false,
  downloading: false,
  downloaded: false,
  progressPercent: 0,
  latestVersion: '',
  error: '',
}
let updateCheckTimer = null

const emitMediaControlCommand = (command) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('media-control', command)
}

const emitLibraryDownloadProgress = (payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('library:download-progress', payload)
}

const emitUpdaterState = (event = 'state') => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('updater:event', {
    event,
    ...updaterState,
  })
}

const syncUpdaterState = (patch = {}, event = 'state') => {
  Object.assign(updaterState, patch)
  emitUpdaterState(event)
}

const resetUpdaterState = () => {
  syncUpdaterState({
    checking: false,
    updateAvailable: false,
    downloading: false,
    downloaded: false,
    progressPercent: 0,
    latestVersion: '',
    error: '',
  }, 'reset')
}

const isUpdaterSupported = () => app.isPackaged && !isAdminMode

const setupAutoUpdater = () => {
  if (!isUpdaterSupported()) {
    return
  }

  try {
    const genericFeedUrl = String(process.env.UPDATER_FEED_URL || '').trim()
    if (genericFeedUrl) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: genericFeedUrl.endsWith('/') ? genericFeedUrl : `${genericFeedUrl}/`,
      })
    }
  } catch (error) {
    console.warn('Updater feed setup failed:', error?.message || error)
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    syncUpdaterState({
      checking: true,
      error: '',
    }, 'checking')
  })

  autoUpdater.on('update-available', async (info) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: false,
      downloaded: false,
      progressPercent: 0,
      latestVersion: String(info?.version || ''),
      error: '',
    }, 'available')

    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Later', 'Download'],
      defaultId: 1,
      cancelId: 0,
      title: 'Yeni sürüm bulundu',
      message: `Yeni sürüm mevcut: v${info?.version || '?'}`,
      detail: 'Şimdi indirilsin mi?',
      noLink: true,
    })

    if (result.response === 1) {
      try {
        syncUpdaterState({ downloading: true, error: '' }, 'download-start')
        await autoUpdater.downloadUpdate()
      } catch (error) {
        syncUpdaterState({
          downloading: false,
          error: String(error?.message || 'download-failed'),
        }, 'error')
      }
    }
  })

  autoUpdater.on('update-not-available', () => {
    syncUpdaterState({
      checking: false,
      updateAvailable: false,
      downloading: false,
      downloaded: false,
      progressPercent: 0,
      error: '',
    }, 'not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: true,
      downloaded: false,
      progressPercent: Number(progress?.percent || 0),
      error: '',
    }, 'progress')
  })

  autoUpdater.on('update-downloaded', async (info) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: false,
      downloaded: true,
      progressPercent: 100,
      latestVersion: String(info?.version || updaterState.latestVersion || ''),
      error: '',
    }, 'downloaded')

    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Later', 'Restart and Install'],
      defaultId: 1,
      cancelId: 0,
      title: 'Güncelleme hazır',
      message: `v${info?.version || updaterState.latestVersion || ''} indirildi.`,
      detail: 'Kurulum için uygulama yeniden başlatılsın mı?',
      noLink: true,
    })

    if (result.response === 1) {
      isQuitting = true
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (error) => {
    syncUpdaterState({
      checking: false,
      downloading: false,
      error: String(error?.message || error || 'updater-error'),
    }, 'error')
  })
}

const triggerUpdateCheck = async () => {
  if (!isUpdaterSupported()) {
    return { ok: false, reason: 'unsupported' }
  }
  try {
    syncUpdaterState({ checking: true, error: '' }, 'manual-check')
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch (error) {
    const message = String(error?.message || 'check-failed')
    syncUpdaterState({ checking: false, error: message }, 'error')
    return { ok: false, reason: message }
  }
}

const scheduleUpdateChecks = () => {
  if (!isUpdaterSupported()) {
    return
  }
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
  }
  setTimeout(() => {
    triggerUpdateCheck().catch(() => {})
  }, 20_000)
  updateCheckTimer = setInterval(() => {
    triggerUpdateCheck().catch(() => {})
  }, 1000 * 60 * 60 * 6)
}

const registerMediaShortcuts = () => {
  const shortcutMap = new Map([
    ['MediaPlayPause', 'play-pause'],
    ['MediaNextTrack', 'next-track'],
    ['MediaPreviousTrack', 'previous-track'],
    ['MediaStop', 'stop'],
  ])

  for (const [accelerator, command] of shortcutMap.entries()) {
    try {
      globalShortcut.register(accelerator, () => {
        emitMediaControlCommand(command)
      })
    } catch (error) {
      console.warn(`Global shortcut register failed (${accelerator}):`, error?.message || error)
    }
  }
  syncCustomMediaShortcut()
}

const syncCustomMediaShortcut = () => {
  const accelerator = String(mediaToggleShortcut || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/control/gi, 'Ctrl')
    .replace(/commandorcontrol/gi, 'CommandOrControl')
    .replace(/command/gi, 'Command')
    .replace(/option/gi, 'Alt')

  if (accelerator && registeredCustomMediaShortcut === accelerator) {
    return
  }

  if (!accelerator) {
    if (registeredCustomMediaShortcut) {
      try {
        globalShortcut.unregister(registeredCustomMediaShortcut)
      } catch {
        // ignore unregister failures
      }
      registeredCustomMediaShortcut = ''
    }
    return
  }

  try {
    const ok = globalShortcut.register(accelerator, () => {
      emitMediaControlCommand('play-pause')
    })
    if (ok) {
      if (registeredCustomMediaShortcut && registeredCustomMediaShortcut !== accelerator) {
        try {
          globalShortcut.unregister(registeredCustomMediaShortcut)
        } catch {
          // ignore unregister failures
        }
      }
      registeredCustomMediaShortcut = accelerator
    } else {
      console.warn(`Global shortcut register rejected (${accelerator})`)
    }
  } catch (error) {
    console.warn(`Custom media shortcut register failed (${accelerator}):`, error?.message || error)
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
}

app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
})

const performAppReset = () => {
  try {
    isQuitting = true
    app.relaunch()
    app.exit(0)
  } catch (error) {
    console.error('App reset failed:', error)
  }
}

const readRuntimePrefs = () => {
  try {
    const raw = fs.readFileSync(runtimePrefsFile, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeRuntimePrefs = (prefs = {}) => {
  try {
    fs.mkdirSync(path.dirname(runtimePrefsFile), { recursive: true })
    fs.writeFileSync(runtimePrefsFile, JSON.stringify(prefs, null, 2), 'utf8')
  } catch {
    // ignore write failures
  }
}

const runtimePrefs = readRuntimePrefs()
let hardwareAccelerationEnabled = runtimePrefs.hardwareAccelerationEnabled !== false
resetShortcutEnabled = runtimePrefs.resetShortcutEnabled !== false
mediaToggleShortcut = String(runtimePrefs.mediaToggleShortcut || '').trim()
if (!hardwareAccelerationEnabled) {
  app.disableHardwareAcceleration()
}

const getLogoPath = () => {
  const buildIcon = path.join(__dirname, '..', 'build', 'logo.ico')
  const publicIcon = path.join(__dirname, '..', 'public', 'logo.ico')
  const buildLogo = path.join(__dirname, '..', 'build', 'logo.png')
  const publicLogo = path.join(__dirname, '..', 'public', 'logo.png')

  if (fs.existsSync(buildIcon)) return buildIcon
  if (fs.existsSync(publicIcon)) return publicIcon
  if (fs.existsSync(buildLogo)) return buildLogo
  return publicLogo
}

const createTrayIcon = () => {
  const logoPath = getLogoPath()
  if (fs.existsSync(logoPath)) {
    return nativeImage.createFromPath(logoPath)
  }

  return nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#000"/>
      <circle cx="32" cy="32" r="18" fill="#fff"/>
      <path d="M28 22v20a6 6 0 1 0 4 5.6V29l12-2v-5l-16 4z" fill="#000"/>
    </svg>
  `)}`)
}

const setupDiscordRichPresence = async () => {
  if (!discordClientId) {
    return
  }

  rpcClient = new RPC.Client({ transport: 'ipc' })

  rpcClient.on('ready', () => {
    console.log('Discord Rich Presence connected')
  })

  try {
    await rpcClient.login({ clientId: discordClientId })
  } catch (error) {
    console.warn('Discord Rich Presence unavailable:', error?.message || error)
    rpcClient = null
  }
}

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url)
})

ipcMain.handle('window:set-fullscreen', async (_, nextState) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }

  const enabled = Boolean(nextState)
  mainWindow.setBackgroundColor(enabled ? '#000000' : '#0a1119')
  mainWindow.setFullScreen(enabled)
  return mainWindow.isFullScreen()
})

const getWindowLayoutState = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return {
      isFullScreen: false,
      isMaximized: false,
    }
  }

  return {
    isFullScreen: mainWindow.isFullScreen(),
    isMaximized: mainWindow.isMaximized(),
  }
}

const emitWindowLayoutState = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('window:layout-state', getWindowLayoutState())
}

ipcMain.handle('window:get-layout-state', async () => getWindowLayoutState())

ipcMain.handle('window:minimize', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }
  mainWindow.minimize()
  return true
})

ipcMain.handle('window:toggle-maximize', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, isMaximized: false }
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }

  return { ok: true, isMaximized: mainWindow.isMaximized() }
})

ipcMain.handle('window:close', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }
  mainWindow.close()
  return true
})

ipcMain.handle('updater:get-state', async () => ({
  ...updaterState,
  supported: isUpdaterSupported(),
}))

ipcMain.handle('updater:check', async () => triggerUpdateCheck())

ipcMain.handle('updater:download', async () => {
  if (!isUpdaterSupported()) {
    return { ok: false, reason: 'unsupported' }
  }
  try {
    syncUpdaterState({ downloading: true, error: '' }, 'download-start')
    await autoUpdater.downloadUpdate()
    return { ok: true }
  } catch (error) {
    const message = String(error?.message || 'download-failed')
    syncUpdaterState({ downloading: false, error: message }, 'error')
    return { ok: false, reason: message }
  }
})

ipcMain.handle('updater:install', async () => {
  if (!isUpdaterSupported() || !updaterState.downloaded) {
    return { ok: false, reason: 'not-ready' }
  }
  isQuitting = true
  autoUpdater.quitAndInstall()
  return { ok: true }
})

ipcMain.handle('app:reset', async () => {
  performAppReset()
  return { ok: true }
})

const sanitizeFileName = (value = '', fallback = 'track') => {
  const cleaned = String(value)
    .normalize('NFKD')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  return cleaned || fallback
}

const getExtensionFromName = (name = '', fallback = '.mp3') => {
  const ext = path.extname(String(name || '')).toLowerCase()
  if (ext && ext.length <= 8) {
    return ext
  }
  return fallback
}

const getExtensionFromUrl = (value = '', fallback = '.mp3') => {
  try {
    const parsed = new URL(value)
    const last = parsed.pathname.split('/').pop() || ''
    return getExtensionFromName(last, fallback)
  } catch {
    return fallback
  }
}

const getExtensionFromContentType = (contentType = '', fallback = '.mp3') => {
  const normalized = String(contentType || '').toLowerCase()
  if (normalized.includes('audio/mpeg')) return '.mp3'
  if (normalized.includes('audio/wav') || normalized.includes('audio/x-wav')) return '.wav'
  if (normalized.includes('audio/flac')) return '.flac'
  if (normalized.includes('audio/mp4') || normalized.includes('audio/m4a')) return '.m4a'
  if (normalized.includes('audio/aac')) return '.aac'
  if (normalized.includes('audio/ogg')) return '.ogg'
  return fallback
}

const isGoogleDriveUrl = (value = '') => {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host.includes('drive.google.com') || host.includes('drive.usercontent.google.com')
  } catch {
    return /drive\.google\.com|drive\.usercontent\.google\.com/i.test(String(value || ''))
  }
}

const isHtmlLikeContentType = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  return normalized.includes('text/html')
}

const isLikelyAudioContentType = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) return true
  if (normalized.includes('audio/')) return true
  if (normalized.includes('application/octet-stream')) return true
  if (normalized.includes('binary/octet-stream')) return true
  return false
}

const decodeHtmlEntities = (value = '') =>
  String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')

const extractDriveConfirmUrl = (html = '') => {
  const source = String(html || '')
  const hrefMatch =
    source.match(/href="(\/uc\?export=download[^"]*confirm=[^"]*)"/i) ||
    source.match(/href="(https:\/\/drive\.google\.com\/uc\?export=download[^"]*confirm=[^"]*)"/i)
  if (hrefMatch?.[1]) {
    const decoded = decodeHtmlEntities(hrefMatch[1].trim())
    if (/^https?:\/\//i.test(decoded)) {
      return decoded
    }
    return `https://drive.google.com${decoded.startsWith('/') ? '' : '/'}${decoded}`
  }

  const formMatch =
    source.match(/<form[^>]+id="download-form"[^>]+action="([^"]+)"/i) ||
    source.match(/<form[^>]+action="(https:\/\/drive\.google\.com\/uc\?export=download[^"]+)"/i)
  if (formMatch?.[1]) {
    return decodeHtmlEntities(formMatch[1].trim())
  }

  return ''
}

const fetchWithGoogleDriveFallback = async (targetUrl, options = {}) => {
  let response = await fetch(targetUrl, options)
  if (!response.ok || !isGoogleDriveUrl(targetUrl)) {
    return response
  }

  const initialType = String(response.headers.get('content-type') || '')
  if (!isHtmlLikeContentType(initialType)) {
    return response
  }

  const html = await response.text()
  const confirmUrl = extractDriveConfirmUrl(html)
  if (!confirmUrl) {
    const fallbackIdMatch =
      String(targetUrl).match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      String(targetUrl).match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fallbackIdMatch?.[1]) {
      const directUrl = `https://drive.usercontent.google.com/download?id=${fallbackIdMatch[1]}&export=download&confirm=t`
      response = await fetch(directUrl, options)
      return response
    }
    const error = new Error('drive-confirm-required')
    error.code = 'drive-confirm-required'
    throw error
  }

  return fetch(confirmUrl, options)
}

const ensureDirectory = async (target) => {
  await fs.promises.mkdir(target, { recursive: true })
}

const ensureUniqueFilePath = async (filePath) => {
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)
  let attempt = 0
  let candidate = filePath
  while (attempt < 300) {
    try {
      await fs.promises.access(candidate, fs.constants.F_OK)
      attempt += 1
      candidate = path.join(dir, `${base} (${attempt})${ext}`)
    } catch {
      return candidate
    }
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`)
}

ipcMain.handle('library:export', async (_, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, reason: 'window-missing' }
  }

  const tracks = Array.isArray(payload?.tracks) ? payload.tracks : []
  if (!tracks.length) {
    return { ok: false, reason: 'empty' }
  }

  const confirm = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['İptal', 'Devam et'],
    defaultId: 1,
    cancelId: 0,
    title: 'Dışa aktar',
    message: 'Müzikler ve kapaklar dışa aktarılsın mı?',
    detail: `${tracks.length} parça seçildi. Klasör seçtikten sonra dosyalar kaydedilecek.`,
    noLink: true,
  })

  if (confirm.response !== 1) {
    return { ok: false, reason: 'cancelled' }
  }

  const pick = await dialog.showOpenDialog(mainWindow, {
    title: 'Kaydetme klasörü seç',
    properties: ['openDirectory', 'createDirectory'],
  })

  if (pick.canceled || !pick.filePaths?.[0]) {
    return { ok: false, reason: 'cancelled' }
  }

  const baseDir = pick.filePaths[0]
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const exportRoot = path.join(baseDir, `Ghxsty-Music-Export-${stamp}`)
  const audioDir = path.join(exportRoot, 'audio')
  const coverDir = path.join(exportRoot, 'covers')
  await ensureDirectory(audioDir)
  await ensureDirectory(coverDir)

  const manifest = {
    exportedAt: new Date().toISOString(),
    app: 'Music',
    tracks: [],
  }

  let successCount = 0
  let coverCount = 0

  for (const [index, track] of tracks.entries()) {
    const title = track?.title || `Parça ${index + 1}`
    const artist = track?.artist || 'Bilinmeyen Sanatçı'
    const baseName = sanitizeFileName(`${artist} - ${title}`, `track-${index + 1}`)
    const entry = {
      id: track?.id || `track-${index + 1}`,
      title,
      artist,
      duration: Number(track?.duration || 0),
      source: track?.source || 'local',
      audioFile: '',
      coverFile: '',
      audioUrl: track?.audio?.kind === 'url' ? track.audio.url : '',
      coverUrl: track?.cover?.kind === 'url' ? track.cover.url : '',
    }

    try {
      let audioBuffer = null
      let audioExt = '.mp3'

      if (track?.audio?.kind === 'buffer' && track.audio.bytes) {
        audioBuffer = Buffer.from(track.audio.bytes)
        audioExt = getExtensionFromName(track.audio.name || '', '.mp3')
      } else if (track?.audio?.kind === 'url' && track.audio.url) {
        const response = await fetch(track.audio.url)
        if (!response.ok) {
          throw new Error('audio-download-failed')
        }
        const data = await response.arrayBuffer()
        audioBuffer = Buffer.from(data)
        audioExt = getExtensionFromUrl(track.audio.url, '.mp3')
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('audio-empty')
      }

      const audioFile = `${baseName}${audioExt}`
      await fs.promises.writeFile(path.join(audioDir, audioFile), audioBuffer)
      entry.audioFile = `audio/${audioFile}`
      successCount += 1
    } catch {
      entry.audioFile = ''
    }

    try {
      let coverBuffer = null
      let coverExt = '.jpg'

      if (track?.cover?.kind === 'buffer' && track.cover.bytes) {
        coverBuffer = Buffer.from(track.cover.bytes)
        coverExt = getExtensionFromName(track.cover.name || '', '.jpg')
      } else if (track?.cover?.kind === 'url' && track.cover.url) {
        const response = await fetch(track.cover.url)
        if (response.ok) {
          const data = await response.arrayBuffer()
          coverBuffer = Buffer.from(data)
          coverExt = getExtensionFromUrl(track.cover.url, '.jpg')
        }
      }

      if (coverBuffer && coverBuffer.length) {
        const coverFile = `${baseName}${coverExt}`
        await fs.promises.writeFile(path.join(coverDir, coverFile), coverBuffer)
        entry.coverFile = `covers/${coverFile}`
        coverCount += 1
      }
    } catch {
      entry.coverFile = ''
    }

    manifest.tracks.push(entry)
  }

  await fs.promises.writeFile(
    path.join(exportRoot, 'tracks-export.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )

  return {
    ok: true,
    exportRoot,
    successCount,
    coverCount,
    total: tracks.length,
  }
})

ipcMain.on('presence:update', (_, presence) => {
  if (!rpcClient) {
    return
  }

  if (!presence?.track) {
    rpcClient.clearActivity().catch(() => {})
    return
  }

  const title = presence.track.title || 'Bilinmeyen Şarkı'
  const artist = presence.track.artist || 'Music'
  const collection = presence.track.collection || 'Müzik'
  const duration = presence.track.duration || 0
  const progress = presence.progress || 0

  const startTimestamp = presence.startTimestamp ? new Date(presence.startTimestamp) : undefined
  const endTimestamp = duration && startTimestamp
    ? new Date(startTimestamp.getTime() + duration * 1000)
    : undefined

  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`.trim())}`

  rpcClient.setActivity({
    details: title,
    state: `${artist} • ${collection}`,
    startTimestamp,
    endTimestamp,
    largeImageKey: discordLargeImageKey,
    largeImageText: `${artist} - ${title}`,
    smallImageKey: discordSmallImageKey,
    smallImageText: presence.isPlaying ? 'Çalıyor' : 'Duraklatıldı',
    buttons: [{ label: "YouTube'da ara", url: youtubeSearch }],
    instance: false,
  }).catch(() => {})
})

ipcMain.on('settings:update', async (_, settings) => {
  if (settings?.closeBehavior === 'quit' || settings?.closeBehavior === 'tray') {
    closeBehavior = settings.closeBehavior
  }

  if (typeof settings?.resetShortcutEnabled === 'boolean') {
    resetShortcutEnabled = settings.resetShortcutEnabled
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      resetShortcutEnabled,
    })
  }

  if (Object.prototype.hasOwnProperty.call(settings || {}, 'mediaToggleShortcut')) {
    mediaToggleShortcut = String(settings?.mediaToggleShortcut || '').trim()
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      mediaToggleShortcut,
    })
    syncCustomMediaShortcut()
  }

  if (typeof settings?.hardwareAccelerationEnabled === 'boolean') {
    const nextValue = settings.hardwareAccelerationEnabled
    if (nextValue !== hardwareAccelerationEnabled) {
      hardwareAccelerationEnabled = nextValue
      writeRuntimePrefs({
        ...readRuntimePrefs(),
        hardwareAccelerationEnabled: nextValue,
      })

      if (mainWindow && !mainWindow.isDestroyed()) {
        const result = await dialog.showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Later', 'Restart now'],
          defaultId: 1,
          cancelId: 0,
          title: 'Restart required',
          message: 'Hardware acceleration setting will apply after restart.',
          detail: 'Do you want to restart the app now?',
          noLink: true,
        })

        if (result.response === 1) {
          isQuitting = true
          app.relaunch()
          app.exit(0)
        }
      }
    }
  }
})

ipcMain.handle('library:download-remote', async (_, payload) => {
  const targetUrl = String(payload?.url || '').trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  try {
    const response = await fetchWithGoogleDriveFallback(targetUrl)
    if (!response.ok) {
      return { ok: false, reason: 'http-error', status: response.status }
    }
    const contentType = response.headers.get('content-type') || ''
    if (!isLikelyAudioContentType(contentType)) {
      return { ok: false, reason: 'invalid-content-type', contentType }
    }

    const data = await response.arrayBuffer()
    const bytes = Array.from(new Uint8Array(data))
    const fileName = String(payload?.fileName || '').trim()
    const extByName = fileName ? getExtensionFromName(fileName, '') : ''
    const extension =
      extByName ||
      getExtensionFromUrl(targetUrl, '') ||
      getExtensionFromContentType(contentType, '.mp3')

    return {
      ok: true,
      bytes,
      contentType,
      extension,
    }
  } catch (error) {
    if (error?.code === 'drive-confirm-required') {
      return { ok: false, reason: 'drive-confirm-required' }
    }
    return { ok: false, reason: 'network-error' }
  }
})

ipcMain.handle('library:download-remote-to-library', async (_, payload) => {
  const targetUrl = String(payload?.url || '').trim()
  const requestId = String(payload?.requestId || '').trim()
  const title = String(payload?.title || '').trim()
  const artist = String(payload?.artist || '').trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  try {
    if (requestId) {
      const controller = new AbortController()
      libraryDownloadControls.set(requestId, {
        controller,
        status: 'downloading',
        title,
        artist,
      })
    }

    emitLibraryDownloadProgress({
      requestId,
      status: 'starting',
      receivedBytes: 0,
      totalBytes: 0,
      title,
      artist,
    })

    const response = await fetchWithGoogleDriveFallback(targetUrl, {
      signal: requestId ? libraryDownloadControls.get(requestId)?.controller?.signal : undefined,
    })
    if (!response.ok) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'http-error', status: response.status }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!isLikelyAudioContentType(contentType)) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'invalid-content-type', contentType }
    }

    const totalBytes = Number(response.headers.get('content-length') || 0) || 0
    let data = Buffer.alloc(0)
    let receivedBytes = 0

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader()
      const chunks = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        if (value) {
          const chunk = Buffer.from(value)
          chunks.push(chunk)
          receivedBytes += chunk.length
          emitLibraryDownloadProgress({
            requestId,
            status: 'downloading',
            receivedBytes,
            totalBytes,
            title,
            artist,
          })
        }
      }
      data = Buffer.concat(chunks)
    } else {
      data = Buffer.from(await response.arrayBuffer())
      receivedBytes = data.length
      emitLibraryDownloadProgress({
        requestId,
        status: 'downloading',
        receivedBytes,
        totalBytes: totalBytes || receivedBytes,
        title,
        artist,
      })
    }

    const inputName = String(payload?.fileName || '').trim()
    const safeBase = sanitizeFileName(path.basename(inputName, path.extname(inputName)) || 'track')
    const extByName = inputName ? getExtensionFromName(inputName, '') : ''
    const extension =
      extByName ||
      getExtensionFromUrl(targetUrl, '') ||
      getExtensionFromContentType(contentType, '.mp3')

    const libraryDir = path.join(app.getPath('userData'), 'library-audio')
    await ensureDirectory(libraryDir)
    const initialPath = path.join(libraryDir, `${safeBase}${extension.startsWith('.') ? extension : `.${extension}`}`)
    const filePath = await ensureUniqueFilePath(initialPath)
    await fs.promises.writeFile(filePath, data)

    emitLibraryDownloadProgress({
      requestId,
      status: 'completed',
      receivedBytes: data.length || receivedBytes,
      totalBytes: totalBytes || data.length || receivedBytes,
      title,
      artist,
      filePath,
    })

    return {
      ok: true,
      filePath,
      fileUrl: pathToFileURL(filePath).href,
      contentType,
      extension,
      size: data.length || 0,
    }
  } catch (error) {
    const isAbort = error?.name === 'AbortError'
    if (isAbort && requestId) {
      const control = libraryDownloadControls.get(requestId)
      const abortedStatus = control?.status === 'paused' ? 'paused' : 'cancelled'
      emitLibraryDownloadProgress({
        requestId,
        status: abortedStatus,
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return {
        ok: false,
        reason: 'aborted',
        status: abortedStatus,
      }
    }
    if (error?.code === 'drive-confirm-required') {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'drive-confirm-required' }
    }
    emitLibraryDownloadProgress({
      requestId,
      status: 'failed',
      receivedBytes: 0,
      totalBytes: 0,
      title,
      artist,
    })
    return { ok: false, reason: 'network-or-write-error' }
  } finally {
    if (requestId) {
      libraryDownloadControls.delete(requestId)
    }
  }
})

ipcMain.handle('library:control-download', async (_, payload) => {
  const requestId = String(payload?.requestId || '').trim()
  const action = String(payload?.action || '').trim().toLowerCase()
  if (!requestId || (action !== 'pause' && action !== 'cancel')) {
    return { ok: false, reason: 'invalid-params' }
  }

  const control = libraryDownloadControls.get(requestId)
  if (!control?.controller) {
    return { ok: false, reason: 'not-active' }
  }

  control.status = action === 'pause' ? 'paused' : 'cancelled'
  try {
    control.controller.abort()
  } catch {
    // ignore abort errors
  }

  emitLibraryDownloadProgress({
    requestId,
    status: control.status,
    receivedBytes: 0,
    totalBytes: 0,
    title: control.title || '',
    artist: control.artist || '',
  })

  return { ok: true, status: control.status }
})

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    center: true,
    backgroundColor: '#0a1119',
    title: isAdminMode ? 'Ghxsty Manifest Studio' : 'Music',
    icon: getLogoPath(),
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  })

  // Remove native app menu so Alt key does not reveal "File" menu on Windows.
  Menu.setApplicationMenu(null)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()

  const syncWindowLayoutState = () => {
    emitWindowLayoutState()
  }

  mainWindow.on('maximize', syncWindowLayoutState)
  mainWindow.on('unmaximize', syncWindowLayoutState)
  mainWindow.on('enter-full-screen', syncWindowLayoutState)
  mainWindow.on('leave-full-screen', syncWindowLayoutState)
  mainWindow.on('resize', syncWindowLayoutState)



  mainWindow.on('close', (event) => {
    if (isQuitting || isAdminMode || closeBehavior === 'quit') {
      return
    }

    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded')
    emitWindowLayoutState()
  })

  mainWindow.webContents.on('did-fail-load', (_, code, description, validatedURL) => {
    console.error('Main window failed to load:', code, description, validatedURL)
  })

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!resetShortcutEnabled) {
      return
    }

    const isResetShortcut =
      input?.type === 'keyDown' &&
      Boolean(input?.control) &&
      Boolean(input?.shift) &&
      String(input?.key || '').toLowerCase() === 'r'

    if (!isResetShortcut) {
      return
    }

    event.preventDefault()
    performAppReset()
  })

  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      const targetUrl = new URL(isAdminMode ? '/admin.html' : '/', process.env.VITE_DEV_SERVER_URL)
      await mainWindow.loadURL(targetUrl.href)
    } else {
      await mainWindow.loadFile(path.join(__dirname, '..', 'build', isAdminMode ? 'admin.html' : 'index.html'))
    }
  } catch (error) {
    console.error('Window load failed:', error)
    await mainWindow.loadURL('data:text/html;charset=utf-8,<html><body style="background:#0a1119;color:white;font-family:sans-serif;padding:24px;">Uygulama yuklenemedi. Terminal ciktisini kontrol et.</body></html>')
  }

  if (!mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  }
}

const createAppTray = () => {
  tray = new Tray(createTrayIcon())
  tray.setToolTip('Music')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '   𝐆ö𝐬𝐭𝐞𝐫   ', click: () => mainWindow?.show() },
      { label: '   𝐆𝐢𝐳𝐥𝐞   ', click: () => mainWindow?.hide() },
      { type: 'separator' },
      {
        label: '   Çıkış   ',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

app.whenReady().then(async () => {
  await setupDiscordRichPresence().catch(() => {})
  await createWindow()
  createAppTray()
  registerMediaShortcuts()
  setupAutoUpdater()
  resetUpdaterState()
  scheduleUpdateChecks()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}).catch((error) => {
  console.error('App startup failed:', error)
})

app.on('window-all-closed', () => {
  if (closeBehavior === 'quit' || isAdminMode) {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
  }
  try {
    globalShortcut.unregisterAll()
  } catch {
    // ignore global shortcut cleanup issues
  }
})




