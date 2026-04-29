import { app, BrowserWindow, Menu, Tray, dialog, globalShortcut, ipcMain, nativeImage, shell } from 'electron'
import RPC from 'discord-rpc'
import updaterPkg from 'electron-updater'
import { powerSaveBlocker } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { autoUpdater } = updaterPkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const discordClientId = process.env.DISCORD_CLIENT_ID || '1493213707864510464'
const discordLargeImageKey = process.env.DISCORD_LARGE_IMAGE_KEY || 'ghxsty_music_logo'
const discordSmallImageKey = process.env.DISCORD_SMALL_IMAGE_KEY || 'ghxsty_music_note'
// Sunucusuz (webhook-only) kullanım için buraya webhook URL gömülebilir.
// Güvenlik notu: istemciye gömülen webhook herkes tarafından görülebilir.
const BUILTIN_DISCORD_ERROR_WEBHOOK_URL = 'https://discord.com/api/webhooks/1497923192415584459/HGlmjOn2xHXiqeSwnGTXw5iVJf6ctQI-hw9A4SF9AK37HTIwg4a5J0BHYam1-1iJ3EgU'
const discordErrorWebhookUrl = String(
  process.env.DISCORD_ERROR_WEBHOOK_URL || BUILTIN_DISCORD_ERROR_WEBHOOK_URL || '',
).trim()
const isAdminMode = process.env.OPEN_ADMIN === 'true'

let rpcClient = null
let mainWindow = null
let tray = null
let isQuitting = false
let closeBehavior = 'tray'
const runtimePrefsFile = path.join(app.getPath('userData'), 'runtime-prefs.json')
let resetShortcutEnabled = true
let resetShortcut = 'Ctrl+Shift+R'
let mediaToggleShortcut = ''
let registeredCustomMediaShortcut = ''
let preventSleepWhilePlayingEnabled = true
let playbackActiveForPowerSave = false
let powerSaveBlockerId = null
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

const formatUpdaterError = (error) => {
  const raw = String(error?.message || error || 'updater-error')
    .replace(/\s+/g, ' ')
    .trim()

  const normalized = raw.toLowerCase()
  if (normalized.includes('releases.atom') && normalized.includes('502')) {
    return 'GitHub gÃ¼ncelleme sunucusu geÃ§ici olarak yanÄ±t vermedi (502). LÃ¼tfen birkaÃ§ dakika sonra tekrar dene.'
  }
  if (normalized.includes('releases.atom') && normalized.includes('404')) {
    return 'GÃ¼ncelleme kaynaÄŸÄ± bulunamadÄ± (404). Repo, release veya update ayarlarÄ±nÄ± kontrol et.'
  }
  if (normalized.includes('rate limit') || normalized.includes('api rate limit')) {
    return 'GitHub rate limit sÄ±nÄ±rÄ±na ulaÅŸÄ±ldÄ±. Bir sÃ¼re sonra tekrar dene.'
  }
  if (normalized.includes('enetunreach') || normalized.includes('econnreset') || normalized.includes('etimedout')) {
    return 'AÄŸ baÄŸlantÄ±sÄ± hatasÄ± nedeniyle gÃ¼ncelleme kontrolÃ¼ yapÄ±lamadÄ±.'
  }

  // Ham HTML / header dÃ¶kÃ¼mÃ¼nÃ¼ kullanÄ±cÄ±ya gÃ¶stermeyelim.
  const compact = raw
    .replace(/data:\s*<!doctype html>.*$/i, '')
    .replace(/headers:\s*\{.*$/i, '')
    .trim()

  if (!compact) {
    return 'GÃ¼ncelleme kontrolÃ¼nde beklenmeyen bir hata oluÅŸtu.'
  }

  return compact.slice(0, 220)
}

const emitMediaControlCommand = (command) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('media-control', command)
}

const syncPlaybackPowerSaveBlocker = () => {
  const shouldBlock = Boolean(preventSleepWhilePlayingEnabled && playbackActiveForPowerSave)

  if (shouldBlock) {
    if (powerSaveBlockerId === null || !powerSaveBlocker.isStarted(powerSaveBlockerId)) {
      powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
    }
    return
  }

  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId)
  }
  powerSaveBlockerId = null
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
  autoUpdater.autoInstallOnAppQuit = false

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

    // Uygulama iÃ§i bildirim kullan: popup aÃ§madan arka planda indir.
    try {
      syncUpdaterState({ downloading: true, error: '' }, 'download-start')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      syncUpdaterState({
        downloading: false,
        error: formatUpdaterError(error),
      }, 'error')
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

  autoUpdater.on('update-downloaded', (info) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: false,
      downloaded: true,
      progressPercent: 100,
      latestVersion: String(info?.version || updaterState.latestVersion || ''),
      error: '',
    }, 'downloaded')

    // Popup aÃ§ma: bilgiyi uygulama iÃ§indeki bildirim menÃ¼sÃ¼nden gÃ¶steriyoruz.
  })

  autoUpdater.on('error', (error) => {
    syncUpdaterState({
      checking: false,
      downloading: false,
      error: formatUpdaterError(error),
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
    const message = formatUpdaterError(error)
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
  // Açılışta anında kontrol et.
  triggerUpdateCheck().catch(() => {})
  updateCheckTimer = setInterval(() => {
    triggerUpdateCheck().catch(() => {})
  }, 1000 * 60 * 60 * 6)
}

const sendDiscordErrorReport = async ({
  title = '',
  subject = '',
  description = '',
  message = '',
  context = {},
} = {}) => {
  if (!discordErrorWebhookUrl) {
    return { ok: false, reason: 'webhook-missing' }
  }

  const normalizedTitle = String(title || '').trim().slice(0, 220)
  const normalizedSubject = String(subject || '').trim().slice(0, 420)
  const normalizedDescription = String(description || message || '').trim().slice(0, 1600)
  if (!normalizedDescription) {
    return { ok: false, reason: 'empty-message' }
  }

  const safeContext = context && typeof context === 'object' ? context : {}
  const contextJson = JSON.stringify(safeContext, null, 2)
  const contextPreview = contextJson.length > 1700
    ? `${contextJson.slice(0, 1700)}…`
    : contextJson

  const payload = {
    username: 'Ghxsty Music Hata Botu',
    embeds: [
      {
        title: normalizedTitle || 'Yeni Hata Bildirimi',
        color: 0xef4444,
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: 'Konu',
            value: normalizedSubject || 'Belirtilmedi',
          },
          {
            name: 'Açıklama',
            value: normalizedDescription,
          },
          {
            name: 'Uygulama',
            value: `Music v${app.getVersion()} (${process.platform})`,
            inline: true,
          },
          {
            name: 'Kaynak',
            value: isAdminMode ? 'admin' : 'main',
            inline: true,
          },
          {
            name: 'Bağlam',
            value: `\`\`\`json\n${contextPreview || '{}'}\n\`\`\``,
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(discordErrorWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return { ok: false, reason: `webhook-http-${response.status}` }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: `webhook-network-${String(error?.message || 'failed')}` }
  }
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
resetShortcut = String(runtimePrefs.resetShortcut || 'Ctrl+Shift+R').trim()
mediaToggleShortcut = String(runtimePrefs.mediaToggleShortcut || '').trim()
preventSleepWhilePlayingEnabled = runtimePrefs.preventSleepWhilePlayingEnabled !== false
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
    const message = formatUpdaterError(error)
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

ipcMain.handle('report:issue', async (_, payload) => {
  const result = await sendDiscordErrorReport({
    title: payload?.title,
    subject: payload?.subject,
    description: payload?.description,
    message: payload?.message,
    context: payload?.context,
  })
  return result
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

const formatPresenceTime = (value) => {
  const total = Math.max(0, Math.floor(Number(value) || 0))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
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

const isLikelyDirectAudioUrl = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) {
    return false
  }
  return (
    normalized.includes('export=download') ||
    /\.(mp3|wav|flac|m4a|aac|ogg)(\?|$)/i.test(normalized)
  )
}

const isYouTubeUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim())
    const host = parsed.hostname.toLowerCase()
    return host.includes('youtube.com') || host.includes('youtu.be')
  } catch {
    return /youtube\.com|youtu\.be/i.test(String(value || ''))
  }
}

const extractYouTubePlaylistUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim())
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
      return ''
    }
    const listId = parsed.searchParams.get('list')
    if (!listId) {
      return ''
    }
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}`
  } catch {
    return ''
  }
}

const normalizeYouTubeUrl = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }
  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
      return raw
    }

    if (host.includes('youtu.be')) {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0]
      if (videoId) {
        return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      }
      return raw
    }

    const videoId =
      parsed.searchParams.get('v') ||
      (parsed.pathname.includes('/watch') ? '' : parsed.pathname.split('/').filter(Boolean).pop())
    const listId = parsed.searchParams.get('list')

    if (videoId && listId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&list=${encodeURIComponent(listId)}`
    }
    if (videoId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    }
    if (listId) {
      return `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}`
    }
    return raw
  } catch {
    return raw
  }
}

const getAvailableCookieBrowsers = () => {
  const localAppData = String(process.env.LOCALAPPDATA || '').trim()
  const appData = String(process.env.APPDATA || '').trim()
  const candidates = [
    {
      key: 'chrome',
      paths: [path.join(localAppData, 'Google', 'Chrome', 'User Data')],
    },
    {
      key: 'edge',
      paths: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data')],
    },
    {
      key: 'firefox',
      paths: [path.join(appData, 'Mozilla', 'Firefox')],
    },
    {
      key: 'brave',
      paths: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data')],
    },
  ]

  return candidates
    .filter((item) => item.paths.some((target) => target && fs.existsSync(target)))
    .map((item) => item.key)
}

const isMissingCookiesDbError = (message = '') =>
  /could not find .*cookies database/i.test(String(message || ''))

const isDpapiCookieError = (message = '') =>
  /failed to decrypt with dpapi/i.test(String(message || ''))

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

const getBundledToolPath = (fileName = '') => {
  const safeName = String(fileName || '').trim()
  if (!safeName) {
    return ''
  }

  const packagedPath = path.join(process.resourcesPath, 'bin', safeName)
  const devPath = path.join(path.resolve(__dirname, '..'), 'vendor', safeName)
  if (fs.existsSync(packagedPath)) {
    return packagedPath
  }
  if (fs.existsSync(devPath)) {
    return devPath
  }
  return ''
}

const downloadDirectUrlToLibrary = async ({ targetUrl, title = '', artist = '', fileName = '' }) => {
  const response = await fetchWithGoogleDriveFallback(targetUrl)
  if (!response.ok) {
    return { ok: false, reason: 'http-error', status: response.status }
  }
  const contentType = response.headers.get('content-type') || ''
  if (!isLikelyAudioContentType(contentType)) {
    return { ok: false, reason: 'invalid-content-type', contentType }
  }

  const data = Buffer.from(await response.arrayBuffer())
  const safeBase = sanitizeFileName(
    path.basename(String(fileName || '').trim(), path.extname(String(fileName || '').trim())) ||
      `${artist ? `${artist} - ` : ''}${title || 'track'}`,
    'track',
  )
  const extByName = fileName ? getExtensionFromName(fileName, '') : ''
  const extension =
    extByName || getExtensionFromUrl(targetUrl, '') || getExtensionFromContentType(contentType, '.mp3')

  const libraryDir = path.join(app.getPath('userData'), 'library-audio')
  await ensureDirectory(libraryDir)
  const initialPath = path.join(
    libraryDir,
    `${safeBase}${extension.startsWith('.') ? extension : `.${extension}`}`,
  )
  const filePath = await ensureUniqueFilePath(initialPath)
  await fs.promises.writeFile(filePath, data)

  return {
    ok: true,
    filePath,
    fileUrl: pathToFileURL(filePath).href,
    fileName: path.basename(filePath),
    contentType,
    extension,
    size: data.length || 0,
  }
}

const runYtDlpDownload = async ({ targetUrl, title = '', artist = '', allowPlaylist = true, signal = null }) => {
  const rawTitle = String(title || '').trim()
  const rawArtist = String(artist || '').trim()
  const safeBase = sanitizeFileName(
    `${rawArtist ? `${rawArtist} - ` : ''}${rawTitle || 'track'}`,
    'track',
  )
  const libraryDir = path.join(app.getPath('userData'), 'library-audio')
  await ensureDirectory(libraryDir)
  const hasCustomBase = Boolean(rawTitle || rawArtist)
  const dynamicSingleBase = hasCustomBase ? safeBase : '%(title)s [%(id)s]'
  const dynamicPlaylistBase = hasCustomBase
    ? `${safeBase} - %(playlist_index|NA)s - %(title)s`
    : '%(playlist_title|Playlist)s - %(playlist_index|NA)s - %(title)s [%(id)s]'

  const candidateCommands = []
  const bundledYtDlpPath = getBundledToolPath('yt-dlp.exe')

  if (bundledYtDlpPath) {
    candidateCommands.push({
      command: bundledYtDlpPath,
      args: [],
      mode: 'binary',
    })
  }

  if (!candidateCommands.length) {
    return {
      ok: false,
      reason: 'yt-dlp-binary-missing',
      usedAnyBundledBinary: false,
      error: 'Bundled yt-dlp binary not found',
    }
  }

  const moveFileAcrossVolumes = async (sourcePath, destinationPath) => {
    try {
      await fs.promises.rename(sourcePath, destinationPath)
      return
    } catch (error) {
      if (String(error?.code || '') !== 'EXDEV') {
        throw error
      }
    }
    await fs.promises.copyFile(sourcePath, destinationPath)
    await fs.promises.unlink(sourcePath)
  }

  const collectAudioFiles = async (rootDir) => {
    const files = []
    const queue = [rootDir]
    while (queue.length) {
      const current = queue.shift()
      const entries = await fs.promises.readdir(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          queue.push(fullPath)
          continue
        }
        if (/\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }
    return files
  }

  let lastError = ''
  let usedAnyBundledBinary = false
  let sawCookieAccessProblem = false
  const youtubeTarget = isYouTubeUrl(targetUrl)
  for (const candidate of candidateCommands) {
    if (candidate.mode === 'binary') {
      usedAnyBundledBinary = true
    }

    const jobDir = path.join(
      libraryDir,
      `.yt-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    )
    await ensureDirectory(jobDir)
    const outputTemplate = path.join(
      jobDir,
      allowPlaylist
        ? `${dynamicPlaylistBase}.%(ext)s`
        : `${dynamicSingleBase}.%(ext)s`,
    )

    const commonArgs = [
      '--windows-filenames',
      '--ignore-errors',
      '--write-info-json',
      '--format',
      'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
      '--no-warnings',
      '--output',
      outputTemplate,
      targetUrl,
    ]
    if (!allowPlaylist) {
      commonArgs.unshift('--no-playlist')
    } else {
      commonArgs.unshift('--yes-playlist')
    }
    // Avoid ffmpeg transcoding for lower disk usage during download.
    // We keep the original audio stream format (m4a/webm/other bestaudio).

    const availableCookieBrowsers = youtubeTarget ? getAvailableCookieBrowsers() : []
    const attemptVariants = youtubeTarget
      ? [
          { kind: 'no-cookie-default', args: [] },
          { kind: 'no-cookie-android', args: ['--extractor-args', 'youtube:player_client=android'] },
          ...availableCookieBrowsers.map((browser) => ({
            kind: 'browser-cookies',
            args: ['--cookies-from-browser', browser],
          })),
        ]
      : [{ kind: 'default', args: [] }]

    let downloadedWithThisCandidate = false
    for (const attempt of attemptVariants) {
      const fullArgs =
        candidate.mode === 'python'
          ? [...candidate.args, '-m', 'yt_dlp', ...attempt.args, ...commonArgs]
          : [...candidate.args, ...attempt.args, ...commonArgs]

      try {
        const result = await new Promise((resolve) => {
        let stdout = ''
        let stderr = ''
        let spawnFailed = false
        let aborted = false
        const child = spawn(candidate.command, fullArgs, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        const abortHandler = () => {
          aborted = true
          try {
            child.kill('SIGTERM')
          } catch {
            // ignore kill errors
          }
        }
        if (signal) {
          if (signal.aborted) {
            abortHandler()
          } else {
            signal.addEventListener('abort', abortHandler, { once: true })
          }
        }

        child.on('error', (error) => {
          spawnFailed = true
          lastError = String(error?.message || error || 'spawn-error')
        })
        child.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        child.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })
        child.on('close', (code) => {
          if (signal) {
            signal.removeEventListener('abort', abortHandler)
          }
          resolve({
            ok: !spawnFailed && !aborted && code === 0,
            aborted,
            code,
            stdout,
            stderr,
          })
        })
        })

        if (result.aborted) {
          await fs.promises.rm(jobDir, { recursive: true, force: true })
          return {
            ok: false,
            reason: 'aborted',
          }
        }

        const downloadedPaths = await collectAudioFiles(jobDir)
        if (!downloadedPaths.length && !result.ok) {
          const stderrText = String(result.stderr || '').trim()
          const stdoutText = String(result.stdout || '').trim()
          const candidateError = stderrText || stdoutText || ''
          const isCookieProblem =
            isMissingCookiesDbError(candidateError) || isDpapiCookieError(candidateError)
          if (isCookieProblem) {
            sawCookieAccessProblem = true
          } else if (candidateError) {
            lastError = candidateError
          } else if (!lastError) {
            lastError = 'yt-dlp-failed'
          }
          await fs.promises.rm(jobDir, { recursive: true, force: true })
          await ensureDirectory(jobDir)
          continue
        }

        if (!downloadedPaths.length) {
          lastError = 'yt-dlp-path-missing'
          await fs.promises.rm(jobDir, { recursive: true, force: true })
          await ensureDirectory(jobDir)
          continue
        }

        const tracks = []
        for (const sourcePath of downloadedPaths) {
          const desiredPath = path.join(libraryDir, path.basename(sourcePath))
          const finalPath = await ensureUniqueFilePath(desiredPath)
          const sourceInfoPath = sourcePath.replace(/\.[^/.]+$/, '.info.json')
          const finalInfoPath = finalPath.replace(/\.[^/.]+$/, '.info.json')
          let info = null

          try {
            const rawInfo = await fs.promises.readFile(sourceInfoPath, 'utf8')
            info = JSON.parse(rawInfo)
          } catch {
            info = null
          }

          await moveFileAcrossVolumes(sourcePath, finalPath)
          try {
            await moveFileAcrossVolumes(sourceInfoPath, finalInfoPath)
          } catch {
            // ignore missing info file
          }
          const stats = await fs.promises.stat(finalPath)

          const normalizedTitle = String(
            info?.track ||
            info?.title ||
            '',
          ).trim()
          const normalizedArtist = String(
            info?.artist ||
            info?.uploader ||
            info?.channel ||
            '',
          ).trim()
          const normalizedAlbum = String(
            info?.album ||
            info?.playlist_title ||
            '',
          ).trim()
          tracks.push({
            filePath: finalPath,
            fileUrl: pathToFileURL(finalPath).href,
            fileName: path.basename(finalPath),
            size: Number(stats.size || 0),
            title: normalizedTitle,
            artist: normalizedArtist,
            album: normalizedAlbum,
          })
        }

        await fs.promises.rm(jobDir, { recursive: true, force: true })
        downloadedWithThisCandidate = true
        return {
          ok: true,
          isPlaylist: tracks.length > 1,
          tracks,
          totalSize: tracks.reduce((sum, item) => sum + Number(item.size || 0), 0),
        }
      } catch (error) {
        lastError = String(error?.message || error || 'file-stat-error')
        await fs.promises.rm(jobDir, { recursive: true, force: true })
        await ensureDirectory(jobDir)
      }
    }

    if (!downloadedWithThisCandidate) {
      await fs.promises.rm(jobDir, { recursive: true, force: true })
    }
  }

  return {
    ok: false,
    reason: 'yt-dlp-unavailable-or-failed',
    usedAnyBundledBinary,
    error:
      lastError ||
      (sawCookieAccessProblem
        ? 'Tarayıcı çerezlerine erişilemedi (DPAPI). Çerezsiz denemeler de başarısız oldu.'
        : ''),
  }
}

const runYtDlpSearch = async ({ query = '', limit = 10 }) => {
  const searchQuery = String(query || '').trim()
  if (!searchQuery) {
    return { ok: false, reason: 'empty-query', items: [] }
  }

  const safeLimit = Math.max(1, Math.min(25, Number(limit || 10)))
  const bundledYtDlpPath = getBundledToolPath('yt-dlp.exe')
  if (!bundledYtDlpPath) {
    return { ok: false, reason: 'yt-dlp-binary-missing', items: [] }
  }

  const args = [
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    '--playlist-end',
    String(safeLimit),
    `ytsearch${safeLimit}:${searchQuery}`,
  ]

  try {
    const result = await new Promise((resolve) => {
      let stdout = ''
      let stderr = ''
      let spawnFailed = false
      const child = spawn(bundledYtDlpPath, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child.on('error', (error) => {
        spawnFailed = true
        stderr = String(error?.message || error || 'spawn-error')
      })
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString()
      })
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString()
      })
      child.on('close', (code) => {
        resolve({
          ok: !spawnFailed && code === 0,
          stdout,
          stderr,
        })
      })
    })

    if (!result.ok) {
      return {
        ok: false,
        reason: 'yt-dlp-search-failed',
        error: String(result.stderr || result.stdout || '').trim(),
        items: [],
      }
    }

    const parsed = JSON.parse(String(result.stdout || '{}'))
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : []
    const items = entries
      .map((entry) => {
        const id = String(entry?.id || '').trim()
        if (!id) {
          return null
        }
        const duration = Number(entry?.duration || 0)
        return {
          id,
          title: String(entry?.title || '').trim(),
          artist: String(entry?.uploader || entry?.channel || '').trim(),
          duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail: String(entry?.thumbnail || '').trim(),
        }
      })
      .filter(Boolean)

    return { ok: true, items }
  } catch (error) {
    return {
      ok: false,
      reason: 'yt-dlp-search-error',
      error: String(error?.message || error || 'search-error'),
      items: [],
    }
  }
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
    buttons: ['Ä°ptal', 'Devam et'],
    defaultId: 1,
    cancelId: 0,
    title: 'DÄ±ÅŸa aktar',
    message: 'MÃ¼zikler ve kapaklar dÄ±ÅŸa aktarÄ±lsÄ±n mÄ±?',
    detail: `${tracks.length} parÃ§a seÃ§ildi. KlasÃ¶r seÃ§tikten sonra dosyalar kaydedilecek.`,
    noLink: true,
  })

  if (confirm.response !== 1) {
    return { ok: false, reason: 'cancelled' }
  }

  const pick = await dialog.showOpenDialog(mainWindow, {
    title: 'Kaydetme klasÃ¶rÃ¼ seÃ§',
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
    const title = track?.title || `ParÃ§a ${index + 1}`
    const artist = track?.artist || 'Bilinmeyen SanatÃ§Ä±'
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

ipcMain.removeAllListeners('presence:update')
ipcMain.on('presence:update', (_, presence) => {
  playbackActiveForPowerSave = Boolean(presence?.track && presence?.isPlaying)
  syncPlaybackPowerSaveBlocker()

  if (!rpcClient) {
    return
  }

  if (!presence?.track) {
    rpcClient.clearActivity().catch(() => {})
    return
  }

  const title = String(presence.track.title || '').trim() || 'Bilinmeyen Sarki'
  const artist = String(presence.track.artist || '').trim() || 'Music'
  const collection = String(presence.track.collection || '').trim() || 'Muzik'
  const album = String(presence.track.album || '').trim()
  const coverUrl = String(presence.track.coverUrl || '').trim()
  const duration = Number(presence.track.duration || 0) || 0
  const currentProgress = Math.max(0, Number(presence.progress || 0) || 0)
  const clampedProgress = duration > 0 ? Math.min(currentProgress, duration) : currentProgress

  const startTimestamp = presence.isPlaying ? new Date(Date.now() - clampedProgress * 1000) : undefined
  const endTimestamp = presence.isPlaying && duration && startTimestamp
    ? new Date(startTimestamp.getTime() + duration * 1000)
    : undefined

  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`.trim())}`
  const progressLabel = duration > 0
    ? `${formatPresenceTime(clampedProgress)} / ${formatPresenceTime(duration)}`
    : 'Canli'
  const sourceLabel = album || collection
  const stateText = `${artist} • ${progressLabel}`
  const baseActivity = {
    details: title,
    state: stateText,
    ...(startTimestamp ? { startTimestamp } : {}),
    ...(endTimestamp ? { endTimestamp } : {}),
    largeImageText: `${artist} • ${sourceLabel}`,
    smallImageKey: discordSmallImageKey,
    smallImageText: presence.isPlaying ? `Caliyor • ${progressLabel}` : `Duraklatildi • ${progressLabel}`,
    buttons: [{ label: "YouTube'da ara", url: youtubeSearch }],
    instance: false,
  }

  // Try cover URL first; if Discord rejects it, gracefully fallback to static app asset.
  const activityWithCover = coverUrl
    ? { ...baseActivity, largeImageKey: coverUrl }
    : { ...baseActivity, largeImageKey: discordLargeImageKey }

  rpcClient
    .setActivity(activityWithCover)
    .catch(() =>
      rpcClient.setActivity({
        ...baseActivity,
        largeImageKey: discordLargeImageKey,
      }),
    )
    .catch(() => {})
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

  if (Object.prototype.hasOwnProperty.call(settings || {}, 'resetShortcut')) {
    const nextResetShortcut = String(settings?.resetShortcut || 'Ctrl+Shift+R').trim()
    if (nextResetShortcut !== resetShortcut) {
      resetShortcut = nextResetShortcut
      writeRuntimePrefs({
        ...readRuntimePrefs(),
        resetShortcut,
      })
      
      try {
        globalShortcut.unregisterAll()
      } catch {
        // ignore
      }
      registerMediaShortcuts()
    }
  }

  if (Object.prototype.hasOwnProperty.call(settings || {}, 'mediaToggleShortcut')) {
    mediaToggleShortcut = String(settings?.mediaToggleShortcut || '').trim()
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      mediaToggleShortcut,
    })
    syncCustomMediaShortcut()
  }

  if (typeof settings?.preventSleepWhilePlayingEnabled === 'boolean') {
    preventSleepWhilePlayingEnabled = settings.preventSleepWhilePlayingEnabled
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      preventSleepWhilePlayingEnabled,
    })
    syncPlaybackPowerSaveBlocker()
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

ipcMain.handle('library:download-link-to-library', async (_, payload) => {
  const inputUrl = String(payload?.url || '').trim()
  const normalizedInputUrl = normalizeYouTubeUrl(inputUrl)
  const forcedPlaylistUrl = extractYouTubePlaylistUrl(normalizedInputUrl)
  const targetUrl = forcedPlaylistUrl || normalizedInputUrl || inputUrl
  const title = String(payload?.title || '').trim()
  const artist = String(payload?.artist || '').trim()
  const requestId = String(payload?.requestId || '').trim()

  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  if (requestId) {
    const controller = new AbortController()
    libraryDownloadControls.set(requestId, {
      controller,
      status: 'downloading',
      title,
      artist,
    })
    emitLibraryDownloadProgress({
      requestId,
      status: 'starting',
      receivedBytes: 0,
      totalBytes: 0,
      title: title || 'Bağlantı',
      artist: artist || 'İndiriliyor',
    })
    emitLibraryDownloadProgress({
      requestId,
      status: 'downloading',
      receivedBytes: 0,
      totalBytes: 0,
      title: title || 'Bağlantı',
      artist: artist || 'İndiriliyor',
    })
  }

  try {
    if (isGoogleDriveUrl(targetUrl) || isLikelyDirectAudioUrl(targetUrl)) {
      const directResult = await downloadDirectUrlToLibrary({
        targetUrl,
        title,
        artist,
        fileName: String(payload?.fileName || '').trim(),
      })
      if (requestId) {
        emitLibraryDownloadProgress({
          requestId,
          status: directResult.ok ? 'completed' : 'failed',
          receivedBytes: Number(directResult.size || 0),
          totalBytes: Number(directResult.size || 0),
          title: title || 'Bağlantı',
          artist: artist || 'İndiriliyor',
          filePath: String(directResult.filePath || ''),
        })
      }
      return directResult
    }

    const control = requestId ? libraryDownloadControls.get(requestId) : null
    const downloadResult = await runYtDlpDownload({
      targetUrl,
      title,
      artist,
      allowPlaylist: true,
      signal: control?.controller?.signal || null,
    })

    if (!downloadResult.ok) {
      if (requestId) {
        emitLibraryDownloadProgress({
          requestId,
          status: downloadResult.reason === 'aborted' ? 'cancelled' : 'failed',
          receivedBytes: 0,
          totalBytes: 0,
          title: title || 'Bağlantı',
          artist: artist || 'İndiriliyor',
        })
      }
      return downloadResult
    }

    const downloadedTracks = Array.isArray(downloadResult.tracks) ? downloadResult.tracks : []
    const firstTrack = downloadedTracks[0] || null
    if (requestId) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'completed',
        receivedBytes: Number(downloadResult.totalSize || 0),
        totalBytes: Number(downloadResult.totalSize || 0),
        title:
          title ||
          (downloadResult.isPlaylist ? `Playlist (${downloadedTracks.length} şarkı)` : firstTrack?.fileName || 'Bağlantı'),
        artist: artist || (downloadResult.isPlaylist ? 'Playlist indirildi' : 'İndirildi'),
        filePath: String(firstTrack?.filePath || ''),
      })
    }

      return {
        ok: true,
      isPlaylist: Boolean(downloadResult.isPlaylist),
      tracks: downloadedTracks.map((track) => ({
        filePath: String(track.filePath || ''),
        fileUrl: String(track.fileUrl || ''),
        fileName: String(track.fileName || ''),
        extension: getExtensionFromName(track.fileName || '', '.mp3'),
        size: Number(track.size || 0),
        title: String(track.title || ''),
        artist: String(track.artist || ''),
        album: String(track.album || ''),
      })),
      filePath: String(firstTrack?.filePath || ''),
      fileUrl: String(firstTrack?.fileUrl || ''),
      fileName: String(firstTrack?.fileName || ''),
      extension: getExtensionFromName(firstTrack?.fileName || '', '.mp3'),
      size: Number(firstTrack?.size || 0),
      totalSize: Number(downloadResult.totalSize || 0),
      sourceUrl: targetUrl,
    }
  } finally {
    if (requestId) {
      libraryDownloadControls.delete(requestId)
    }
  }
})

ipcMain.handle('library:search-youtube', async (_, payload) => {
  const query = String(payload?.query || '').trim()
  const limit = Number(payload?.limit || 10)
  return runYtDlpSearch({ query, limit })
})

ipcMain.handle('library:resolve-local-track-urls', async (_, payload) => {
  try {
    const items = Array.isArray(payload?.tracks) ? payload.tracks : []
    if (!items.length) {
      return { ok: true, resolved: {} }
    }

    const libraryDir = path.join(app.getPath('userData'), 'library-audio')
    const resolved = {}

    for (const item of items) {
      const id = String(item?.id || '').trim()
      if (!id) {
        continue
      }

      const existingAudioUrl = String(item?.audioUrl || '').trim()
      if (/^file:\/\//i.test(existingAudioUrl)) {
        resolved[id] = existingAudioUrl
        continue
      }

      const rawFileName = String(item?.fileName || '').trim()
      const fileName = path.basename(rawFileName)
      if (!fileName || fileName === '.' || fileName === '..') {
        continue
      }

      const localPath = path.join(libraryDir, fileName)
      if (fs.existsSync(localPath)) {
        resolved[id] = pathToFileURL(localPath).href
      }
    }

    return { ok: true, resolved }
  } catch (error) {
    return {
      ok: false,
      reason: String(error?.message || error || 'resolve-local-track-urls-failed'),
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
      // Arka plandayken renderer döngülerini kısarak CPU/RAM kullanımını düşür.
      backgroundThrottling: true,
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
      { label: 'Göster', click: () => mainWindow?.show() },
      { label: 'Gizle', click: () => mainWindow?.hide() },
      { type: 'separator' },
      {
        label: 'Çıkış',
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
  playbackActiveForPowerSave = false
  syncPlaybackPowerSaveBlocker()
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
