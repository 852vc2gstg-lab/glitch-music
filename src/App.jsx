import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  BarChart3,
  Bell,
  Check,
  Download,
  FileUp,
  Edit3,
  Settings,
  Forward,
  Heart,
  ImageIcon,
  Mic2,
  Repeat,
  ListMusic,
  ListOrdered,
  Link2,
  Lock,
  MoreVertical,
  GripVertical,
  Pause,
  Play,
  Plus,
  Shuffle,
  Rewind,
  Save,
  Trash2,
  Upload,
  RefreshCw,
  Youtube,
  UserRound,
  Volume2,
  Maximize2,
  Minimize2,
  Minus,
  Square,
  ChevronUp,
  X,
} from 'lucide-react'
import './App.css'

const gradients = [
  'linear-gradient(135deg, #ff8a65 0%, #ff5e7a 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
]

const playlistColors = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f87171',
  '#fca5a5',
  '#f97316',
  '#fb923c',
  '#fbbd08',
  '#eab308',
  '#facc15',
  '#fcd34d',
  '#84cc16',
  '#a3e635',
  '#bfdbfe',
  '#22c55e',
  '#4ade80',
  '#86efac',
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#14b8a6',
  '#2dd4bf',
  '#5eead4',
  '#06b6d4',
  '#22d3ee',
  '#67e8f9',
  '#0ea5e9',
  '#38bdf8',
  '#7dd3fc',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#6366f1',
  '#818cf8',
  '#c7d2fe',
  '#8b5cf6',
  '#a78bfa',
  '#ddd6fe',
  '#a855f7',
  '#c084fc',
  '#e9d5ff',
  '#d946ef',
  '#f0abfc',
  '#f5d0fe',
  '#ec4899',
  '#f472b6',
  '#fbbbf9',
  '#f43f5e',
  '#fb7185',
  '#fb91cf',
]

const equalizerBands = [
  { key: 'bass', label: 'Bas', type: 'lowshelf', frequency: 110, q: 0.7 },
  { key: 'lowMid', label: 'Alt', type: 'peaking', frequency: 340, q: 1.0 },
  { key: 'mid', label: 'Orta', type: 'peaking', frequency: 1200, q: 1.0 },
  { key: 'highMid', label: 'Net', type: 'peaking', frequency: 3200, q: 1.0 },
  { key: 'treble', label: 'Tiz', type: 'highshelf', frequency: 10500, q: 0.7 },
]

const DB_NAME = 'nova-player-db'
const DB_VERSION = 1
const STORE_NAME = 'tracks'
const TRACK_SWITCH_COOLDOWN_MS = 1000
const TRACK_SWITCH_FADE_MS = 180
const UI_KEY = 'nova-player-ui'
const PLAYLISTS_KEY = 'nova-player-playlists'
const ARTIST_FACTS_KEY = 'nova-player-artist-facts'
const FAVORITES_KEY = 'nova-player-favorites'
const PLAY_STATS_KEY = 'nova-player-play-stats'
const DRIVE_MANIFEST_URL = import.meta.env.VITE_DRIVE_MANIFEST_URL?.trim() || ''
const DEFAULT_SHARED_MANIFEST_URL =
  'https://raw.githubusercontent.com/852vc2gstg-lab/ghxsty-music-pool/main/tracks.json'
const POOL_ADMIN_PASSWORD = 'ab56AB56!'
const API_BASE = import.meta.env.VITE_API_BASE?.trim() || 'http://127.0.0.1:8787'
const appLogo = `${import.meta.env.BASE_URL}logo.png`
const APP_NAME = __APP_NAME__
const APP_VERSION = __APP_VERSION__
const UI_LANGUAGES = ['tr', 'en']
const UI_TEXT = {
  tr: {
    library: 'Kütüphane',
    tracks: 'Parçalar',
    add: 'Ekle',
    playlists: 'Playlistler',
    create: 'Oluştur',
    allTracks: 'Tüm parçalar',
    favorites: 'Favoriler',
    serverTracks: 'Sunucudakiler',
    publicPool: 'Müzik Havuzu',
    noPlaylistYet: 'Henüz playlist yok',
    totalTracksReady: 'Toplam {count} şarkı hazır. Dosya veya bağlantı eklemek için Ekle butonunu kullan.',
    noTracksYet: 'Henüz parça yok',
    noTracksHint: 'Dosya ya da link ekleyince burada temiz bir liste halinde görünecek.',
    noResults: 'Sonuç bulunamadı',
    noResultsHint: 'Arama veya indirilebilir filtresini değiştirip tekrar dene.',
    searchPlaceholder: 'Şarkı, sanatçı veya albüm ara',
    onlyDownloadable: 'Sadece indirilebilir şarkıları göster',
    sharedSongs: 'Ortak şarkılar',
    remoteManifestLoaded: '{count} ortak şarkı uzak manifest dosyasından çekiliyor.',
    remoteManifestMissing: 'Henüz uzak manifest URL girilmedi.',
    importAllToLibrary: 'Tümünü kütüphaneme ekle',
    uploadToPool: 'Müzik Havuzu\'na Yükle',
    uploadToPoolHint: 'Şarkını kütüphanede başkalarının bulup indireceği havuza yükle.',
    poolFileName: 'Şarkı dosyası',
    poolCoverImage: 'Kapak resmi (isteğe bağlı)',
    settings: 'Ayarlar',
    appSettings: 'Uygulama ayarları',
    close: 'Kapat',
    audioOutput: 'Ses çıkışı',
    audioOutputHint: 'Buradan hoparlör, kulaklık ya da sanal çıkış aygıtını seçebilirsin.',
    outputNotSupported: 'Bu cihazda desteklenmiyor',
    outputNotFound: 'Çıkış aygıtı bulunamadı',
    equalizer: 'Ekolayzer',
    equalizerHint: 'Frekansları hafifçe yükseltip azaltarak sesi şekillendirebilirsin.',
    reset: 'Sıfırla',
    theme: 'Tema',
    themeHint: 'Arayüz görünümünü seç.',
    dark: 'Koyu',
    gray: 'Grimsi',
    light: 'Açık',
    transparent: 'Şeffaf',
    options: 'Ayarlar',
    optionsHint: 'Kullanım seçeneklerini buradan açıp kapat.',
    monoAudio: 'Sesi mono olarak çal',
    spaceShortcut: 'Boşluk tuşu ile çal/duraklat',
    arrowShortcut: 'Ok tuşlarıyla 5 sn ileri/geri sar',
    resetShortcut: 'Acil reset kısayolu (Ctrl + Shift + R)',
    mediaShortcut: 'Global çal/duraklat kısayolu',
    mediaShortcutHint: 'Örnek: Ctrl+Alt+P. Boş bırakırsan kapalı olur.',
    closeMode: 'Kapatma',
    closeModeHint: 'Kapat tuşuna basınca uygulamanın ne yapacağını seç.',
    closeTray: 'Arka planda kalsın',
    closeQuit: 'Tamamen kapansın',
    export: 'Dışa aktarma',
    exportHint: 'Tüm şarkıları ve mevcut kapakları klasöre indir.',
    exportStart: 'Müzikleri ve kapakları indir',
    exporting: 'Hazırlanıyor...',
    resetCache: 'Önbelleği sıfırla',
    resetCacheHint: 'Kapak, albüm, söz ve sanatçı bilgisini temizler. Şarkıların silinmez.',
    resetCacheDone: 'Önbellek temizlendi.',
    sharedSource: 'Ortak kaynak',
    sharedSourceHint: 'Yan bilgisayardaki tracks.json linkini gir. Buradaki şarkılar herkes tarafından görülebilir.',
    remoteManifestUrl: 'Uzak manifest URL',
    remoteManifestExample: 'Örnek: ağda açtığın küçük bir HTTP sunucu üzerinden tracks.json.',
    remoteManifestRelative: 'Manifest içinde audioFile/coverFile kullanırsan URL yazmadan dosya yoluyla ekleyebilirsin. (Örn: songs/parca.mp3)',
    notes: 'Not',
    noteLocal: 'Playlist ve favori durumları yerelde saklanır.',
    noteResume: 'Uygulama son çalınan parçayı ve konumu hatırlar.',
    language: 'Dil',
    languageHint: 'Arayüz dilini değiştir.',
    turkish: 'Türkçe',
    english: 'English',
    hardwareAcceleration: 'Donanım hızlandırma',
    hardwareAccelerationHint: 'Kapattığında uygulama yeniden başlatma ister.',
    fullscreenEffects: 'Tam ekran efektleri',
    fullscreenEffectsHint: 'Gradyan, animasyon ve görsel efektleri aç/kapat.',
    appearanceOptions: 'Görünüm seçenekleri',
    appearanceOptionsHint: 'Görünüm ve kaydırma tercihlerini tek yerden yönet.',
    reduceAnimations: 'Animasyonları azalt',
    reduceAnimationsHint: 'Arayüz geçişlerini ve hareketli efektleri sadeleştirir.',
    lowPowerMode: 'Performans modu',
    lowPowerModeHint: 'Blur, gölge ve cam efektlerini azaltarak daha stabil çalıştırır.',
    compactList: 'Kompakt liste görünümü',
    compactListHint: 'Şarkı satırlarını daha sıkı göstererek ekrana daha fazla parça sığdırır.',
    showScrollbars: 'Kaydırma çubuğunu göster',
    showScrollbarsHint: 'Kapalıyken kaydırma çubukları gizlenir, açıkken görünür olur.',
    notifications: 'Bildirimler',
    clearAllNotifications: 'Tümünü temizle',
    noNotifications: 'Henüz bildirim yok',
    backgroundStyle: 'Arka plan stili',
    backgroundStyleHint: 'Arka planı düz renk veya gradyan olarak ayarlayabilirsin.',
    backgroundSolid: 'Düz renk',
    backgroundGradient: 'Gradyan',
    backgroundColor1: 'Renk 1',
    backgroundColor2: 'Renk 2',
    coverBasedBackground: 'Kapak rengine göre arka plan',
    coverBasedBackgroundHint: 'Açıkken arka plan gradyanı çalan şarkının kapak tonundan üretilir.',
    noteShared: 'Müzik havuzu yalnızca Yenile tuşuna bastığında güncellenir.',
    noteExport: 'Dışa aktarma, ses ve kapakları tek klasörde yedekler.',
    noteResetShortcut: 'Acil reset kısayolu: Ctrl + Shift + R',
    noteAppVersion: '{app} sürümü: v{version}',
    confirmDeleteTrackTitle: 'Şarkıyı sil',
    confirmDeleteTrackBody: '"{name}" parçasını silmek istediğine emin misin?',
    confirmDeletePlaylistTitle: 'Playlisti sil',
    confirmDeletePlaylistBody: '"{name}" playlistini silmek istediğine emin misin?',
    confirmResetCacheTitle: 'Önbelleği sıfırla',
    confirmResetCacheBody: 'Önbelleği temizlemek istediğine emin misin? Şarkılar silinmez.',
    deleteAction: 'Sil',
    cancelAction: 'Vazgeç',
    resetAction: 'Sıfırla',
  },
  en: {
    library: 'Library',
    tracks: 'Tracks',
    add: 'Add',
    playlists: 'Playlists',
    create: 'Create',
    allTracks: 'All tracks',
    favorites: 'Favorites',
    serverTracks: 'Server tracks',
    publicPool: 'Music Pool',
    noPlaylistYet: 'No playlist yet',
    totalTracksReady: '{count} tracks ready. Use Add to include files or links.',
    noTracksYet: 'No tracks yet',
    noTracksHint: 'Once you add a file or link, tracks will appear here.',
    noResults: 'No results found',
    noResultsHint: 'Try changing your search or downloadable filter.',
    searchPlaceholder: 'Search by track, artist, or album',
    onlyDownloadable: 'Show only downloadable tracks',
    sharedSongs: 'Shared songs',
    remoteManifestLoaded: '{count} shared songs loaded from remote manifest.',
    remoteManifestMissing: 'No remote manifest URL provided yet.',
    importAllToLibrary: 'Add all to my library',
    uploadToPool: 'Upload to Music Pool',
    uploadToPoolHint: 'Upload your song to the pool so others can find and download it.',
    poolFileName: 'Song file',
    poolCoverImage: 'Cover image (optional)',
    settings: 'Settings',
    appSettings: 'App settings',
    close: 'Close',
    audioOutput: 'Audio output',
    audioOutputHint: 'Choose speaker, headset, or virtual output.',
    outputNotSupported: 'Not supported on this device',
    outputNotFound: 'No output device found',
    equalizer: 'Equalizer',
    equalizerHint: 'Shape the sound by boosting or lowering frequencies.',
    reset: 'Reset',
    theme: 'Theme',
    themeHint: 'Choose the interface look.',
    dark: 'Dark',
    gray: 'Gray',
    light: 'Light',
    transparent: 'Transparent',
    options: 'Options',
    optionsHint: 'Toggle app behavior options.',
    monoAudio: 'Play audio in mono',
    spaceShortcut: 'Space to play/pause',
    arrowShortcut: 'Arrow keys seek 5 seconds',
    resetShortcut: 'Emergency reset shortcut (Ctrl + Shift + R)',
    mediaShortcut: 'Global play/pause shortcut',
    mediaShortcutHint: 'Example: Ctrl+Alt+P. Leave empty to disable.',
    closeMode: 'On close',
    closeModeHint: 'Choose what happens when you close the app.',
    closeTray: 'Keep running in background',
    closeQuit: 'Quit completely',
    export: 'Export',
    exportHint: 'Export all tracks and covers to a folder.',
    exportStart: 'Export music and covers',
    exporting: 'Preparing...',
    resetCache: 'Reset cache',
    resetCacheHint: 'Clears cover, album, lyrics and artist caches. Tracks are kept.',
    resetCacheDone: 'Cache cleared.',
    sharedSource: 'Shared source',
    sharedSourceHint: 'Paste the tracks.json URL from your other PC. Everyone can access these songs.',
    remoteManifestUrl: 'Remote manifest URL',
    remoteManifestExample: 'Example: tracks.json served by a local HTTP server.',
    remoteManifestRelative: 'You can use audioFile/coverFile in manifest to avoid writing full URLs. (e.g. songs/track.mp3)',
    notes: 'Notes',
    noteLocal: 'Playlist and favorite state is stored locally.',
    noteResume: 'The app remembers last track and position.',
    language: 'Language',
    languageHint: 'Change interface language.',
    turkish: 'Türkçe',
    english: 'English',
    hardwareAcceleration: 'Hardware acceleration',
    hardwareAccelerationHint: 'Changing this may require an app restart.',
    fullscreenEffects: 'Fullscreen effects',
    fullscreenEffectsHint: 'Toggle gradients, animation and visual effects.',
    appearanceOptions: 'Appearance options',
    appearanceOptionsHint: 'Manage appearance and scrolling preferences in one place.',
    reduceAnimations: 'Reduce animations',
    reduceAnimationsHint: 'Simplifies motion effects and interface transitions.',
    lowPowerMode: 'Performance mode',
    lowPowerModeHint: 'Reduces blur, shadows and glass effects for smoother usage.',
    compactList: 'Compact list view',
    compactListHint: 'Makes track rows denser so more songs fit on screen.',
    showScrollbars: 'Show scrollbars',
    showScrollbarsHint: 'When off, scrollbars stay hidden; when on, they are visible.',
    notifications: 'Notifications',
    clearAllNotifications: 'Clear all',
    noNotifications: 'No notifications yet',
    backgroundStyle: 'Background style',
    backgroundStyleHint: 'Set the app background as a solid color or gradient.',
    backgroundSolid: 'Solid',
    backgroundGradient: 'Gradient',
    backgroundColor1: 'Color 1',
    backgroundColor2: 'Color 2',
    coverBasedBackground: 'Cover-based background',
    coverBasedBackgroundHint: 'When enabled, the background gradient is generated from the current track cover tone.',
    noteShared: 'Pool tracks refresh only when you press the Refresh button.',
    noteExport: 'Export creates a backup folder with audio and cover files.',
    noteResetShortcut: 'Emergency reset shortcut: Ctrl + Shift + R',
    noteAppVersion: '{app} version: v{version}',
    confirmDeleteTrackTitle: 'Delete track',
    confirmDeleteTrackBody: 'Are you sure you want to delete "{name}"?',
    confirmDeletePlaylistTitle: 'Delete playlist',
    confirmDeletePlaylistBody: 'Are you sure you want to delete "{name}"?',
    confirmResetCacheTitle: 'Reset cache',
    confirmResetCacheBody: 'Are you sure you want to clear cache? Tracks will be kept.',
    deleteAction: 'Delete',
    cancelAction: 'Cancel',
    resetAction: 'Reset',
  },
}

const formatTime = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatListenDuration = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 dk'
  }

  const total = Math.floor(value)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return `${hours} sa ${minutes.toString().padStart(2, '0')} dk`
  }

  if (minutes > 0) {
    return `${minutes} dk ${seconds.toString().padStart(2, '0')} sn`
  }

  return `${seconds} sn`
}

const formatCollectionDuration = (value, language = 'tr') => {
  if (!Number.isFinite(value) || value <= 0) {
    return language === 'en' ? '0 min 0 sec' : '0 dakika 0 saniye'
  }

  const total = Math.floor(value)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  if (language === 'en') {
    return `${minutes} min ${seconds} sec`
  }

  return `${minutes} dakika ${seconds} saniye`
}

const formatBytes = (value) => {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB'
  }

  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(mb >= 100 ? 0 : mb >= 10 ? 1 : 2)} MB`
}

const getTrackSortValue = (track, fallbackIndex = 0) =>
  Number.isFinite(track?.order)
    ? track.order
    : Number.isFinite(track?.createdAt)
      ? track.createdAt
      : fallbackIndex

const sortTracksByOrder = (list) =>
  list
    .map((track, index) => ({ track, index }))
    .sort(
      (left, right) =>
        getTrackSortValue(left.track, left.index) - getTrackSortValue(right.track, right.index),
    )
    .map(({ track }) => track)

const LEADING_TRACK_TOKEN_PATTERN =
  /^(?:\d{1,3}|cd\s*\d{1,2}|disc\s*\d{1,2}|track\s*\d{1,3}|trk\s*\d{1,3}|side\s*[ab])$/i

const stripLeadingTrackTokens = (tokens = []) => {
  const cleaned = [...tokens]
  while (cleaned.length > 1 && LEADING_TRACK_TOKEN_PATTERN.test(String(cleaned[0] || '').trim())) {
    cleaned.shift()
  }
  return cleaned
}

const cleanFilenameTrackTitle = (value = '') =>
  sanitizeDisplayText(value)
    .replace(/\[(official|lyrics?|lyric video|audio|video|clip|music video|hq|hd|remaster(?:ed)?(?:\s*\d{2,4})?)\]/gi, '')
    .replace(/\((official|lyrics?|lyric video|audio|video|clip|music video|hq|hd|remaster(?:ed)?(?:\s*\d{2,4})?)\)/gi, '')
    .replace(/\b(official|lyrics?|lyric video|audio|video|clip|music video|hq|hd)\b/gi, '')
    .replace(/\s*[-–—_]+\s*/g, ' ')
    .replace(/^[\s\-_.:]+/, '')
    .replace(/[\s\-_.:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

const stripLeadingTrackNumbers = (value = '') =>
  String(value || '')
    .replace(/^\s*(?:\d{1,3}(?:\s*[-._]\s*\d{1,3}){0,4}|track\s*\d{1,3}|trk\s*\d{1,3}|cd\s*\d{1,2}|disc\s*\d{1,2})\s*[-._:\s]+\s*/i, '')
    .trim()

const parseTrackName = (fileName) => {
  const cleanName = sanitizeDisplayText(String(fileName || '').replace(/\.[^/.]+$/, ''))
  const withoutTrackNumbers = stripLeadingTrackNumbers(cleanName)
  const normalizedName = withoutTrackNumbers || cleanName

  if (!normalizedName) {
    return {
      artist: 'Yerel Koleksiyon',
      title: 'Bilinmeyen parça',
    }
  }

  const explicitParts = normalizedName
    .split(/\s+[-–—]\s+/)
    .map((part) => sanitizeDisplayText(part))
    .filter(Boolean)
  const normalizedExplicit = stripLeadingTrackTokens(explicitParts)

  const seemsLikeArtistName = (value = '') => {
    const cleaned = sanitizeDisplayText(value)
    if (!cleaned) {
      return false
    }
    if (/\d/.test(cleaned)) {
      return false
    }
    const words = cleaned.split(/\s+/).filter(Boolean)
    return words.length >= 1 && words.length <= 5
  }

  const seemsLikeTrackTitle = (value = '') => {
    const raw = String(value || '')
    const cleaned = sanitizeDisplayText(raw)
    if (!cleaned) {
      return false
    }
    return /[,!?()[\]]/.test(raw) || /\d/.test(raw)
  }

  if (normalizedExplicit.length >= 2) {
    const firstPart = normalizedExplicit[0]
    const secondPart = normalizedExplicit.slice(1).join(' - ')
    const shouldSwapOrder =
      seemsLikeTrackTitle(firstPart) &&
      seemsLikeArtistName(secondPart) &&
      !seemsLikeTrackTitle(secondPart)

    return {
      artist: shouldSwapOrder ? sanitizeDisplayText(secondPart) : sanitizeDisplayText(firstPart),
      title: cleanFilenameTrackTitle(shouldSwapOrder ? firstPart : secondPart),
    }
  }

  const compactTokens = normalizedName
    .split(/[-_]+/)
    .map((part) => sanitizeDisplayText(part))
    .filter(Boolean)
  const normalizedCompact = stripLeadingTrackTokens(compactTokens)

  if (normalizedCompact.length >= 2) {
    return {
      artist: normalizedCompact[0],
      title: cleanFilenameTrackTitle(normalizedCompact.slice(1).join(' - ')),
    }
  }

  const titleCandidate = cleanFilenameTrackTitle(normalizedName)
  return {
    artist: 'Yerel Koleksiyon',
    title: titleCandidate || normalizedName,
  }
}

const inferTrackIdentityFromTitle = async (title = '') => {
  const cleanTitle = normalizeCoverMatchText(title)
  if (!cleanTitle) {
    return null
  }

  const titleTokens = cleanTitle.split(' ').filter((token) => token.length >= 3)
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=music&entity=song&limit=50`,
  )
  if (!response.ok) {
    return null
  }

  const json = await response.json()
  const results = Array.isArray(json?.results) ? json.results : []
  let best = null
  let bestScore = -1

  for (const item of results) {
    const rawTrackName = String(item?.trackName || '').trim()
    const rawArtistName = String(item?.artistName || '').trim()
    if (!rawTrackName || !rawArtistName) {
      continue
    }

    const normalizedTrack = normalizeCoverMatchText(rawTrackName)
    if (!normalizedTrack) {
      continue
    }

    let score = 0
    if (normalizedTrack === cleanTitle) {
      score += 140
    }
    if (normalizedTrack.startsWith(cleanTitle) || cleanTitle.startsWith(normalizedTrack)) {
      score += 85
    }

    const tokenMatches = titleTokens.filter((token) => normalizedTrack.includes(token)).length
    score += tokenMatches * 20

    if (tokenMatches === 0 && titleTokens.length > 0) {
      continue
    }

    if (/\b(live|karaoke|instrumental|remix|sped up|slowed)\b/i.test(rawTrackName)) {
      score -= 35
    }

    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  if (!best || bestScore < 35) {
    return null
  }

  return {
    title: cleanFilenameTrackTitle(String(best.trackName || '').trim()),
    artist: String(best.artistName || '').trim(),
    album: String(best.collectionName || '').trim(),
    coverUrl: best.artworkUrl100 ? best.artworkUrl100.replace(/100x100bb\./, '300x300bb.') : '',
  }
}

const readDuration = (url) =>
  new Promise((resolve) => {
    const probe = document.createElement('audio')
    const finalize = (duration = 0) => {
      probe.src = ''
      resolve(duration)
    }

    probe.preload = 'metadata'
    probe.onloadedmetadata = () => finalize(probe.duration)
    probe.onerror = () => finalize(0)
    probe.src = url
  })

const formatWikiDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  if (expanded.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`
  }

  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const normalizeArtistQuery = (value) =>
  value
    .replace(/^\s*\d{1,3}\s*[\.\-:)\]]\s*/i, '')
    .replace(/\s*\((feat\.?|ft\.?|with|remix|live|official).*$/i, '')
    .replace(/\s*(feat\.?|ft\.?|with|x|vs\.)\s+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

const extractArtistCandidates = (value = '') => {
  const cleaned = String(value || '')
    .replace(/^\s*\d{1,3}\s*[\.\-:)\]]\s*/i, '')
    .trim()

  const rawTokens = cleaned.split(/\s*(?:,|&|\/|\\|\+|;|\bx\b|\band\b)\s*/i)
  const normalized = rawTokens
    .map((token) => normalizeArtistQuery(token))
    .filter(
      (token) =>
        token &&
        token.toLowerCase() !== 'yerel koleksiyon' &&
        token.toLowerCase() !== 'various artists',
    )

  return Array.from(new Set(normalized))
}

const sanitizeDisplayText = (text) =>
  String(text || '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const getFullscreenTitlePresentation = (text, singleLineLimit = 28) => {
  const value = sanitizeDisplayText(text)
  const length = value.length
  const keepSingleLine = length > 0 && length <= singleLineLimit

  let fontSize = 'clamp(2rem, 5vw, 4rem)'
  if (length > 28 && length <= 40) {
    fontSize = 'clamp(1.9rem, 4.6vw, 3.4rem)'
  } else if (length > 40) {
    fontSize = 'clamp(1.55rem, 3.9vw, 2.7rem)'
  } else if (length > 20) {
    fontSize = 'clamp(1.95rem, 4.8vw, 3.7rem)'
  }

  return {
    text: value,
    className: keepSingleLine ? 'fullscreen-title-single' : 'fullscreen-title-wrap',
    style: {
      fontSize,
    },
  }
}

const hashSeed = (value) => {
  let hash = 2166136261
  const input = String(value || '')
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed) => {
  let state = (seed >>> 0) || 1
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const deterministicShuffleTracks = (trackList, seedKey) => {
  const items = [...trackList].sort((left, right) => String(left?.id || '').localeCompare(String(right?.id || '')))
  if (items.length <= 1) {
    return items
  }

  const random = createSeededRandom(hashSeed(seedKey))
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }
  return items
}

const getGenreShapeVariant = (seed = '') => Math.abs(hashSeed(seed)) % 7

const readTrackMetadata = async (file) => {
  try {
    const { parseBlob } = await import('music-metadata-browser')
    const metadata = await parseBlob(file)
    const title = metadata?.common?.title?.trim() || ''
    const artist =
      metadata?.common?.artists?.filter(Boolean).join(', ')?.trim() ||
      metadata?.common?.artist?.trim() ||
      ''
    const album = metadata?.common?.album?.trim() || ''
    const genre = normalizeGenreName(metadata?.common?.genre?.find(Boolean) || '')

    return {
      title,
      artist,
      album,
      genre,
    }
  } catch {
    return null
  }
}

const pickGradient = (seed = '') => {
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return gradients[Math.abs(value) % gradients.length]
}

const normalizeDriveUrl = (value = '') => {
  const url = value.trim()
  if (!url) {
    return ''
  }

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
  if (fileMatch?.[1]) {
    return `https://drive.usercontent.google.com/download?id=${fileMatch[1]}&export=download&confirm=t`
  }

  const openMatch = url.match(/[?&]id=([^&]+)/i)
  if (url.includes('drive.google.com') && openMatch?.[1]) {
    return `https://drive.usercontent.google.com/download?id=${openMatch[1]}&export=download&confirm=t`
  }

  return url
}

const getFileNameFromUrl = (value = '') => {
  const url = String(value || '').trim()
  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)
    const nameParam =
      parsed.searchParams.get('filename') ||
      parsed.searchParams.get('file') ||
      parsed.searchParams.get('name') ||
      ''
    if (nameParam) {
      return decodeURIComponent(nameParam.replace(/\+/g, ' ')).trim()
    }

    const lastSegment = parsed.pathname.split('/').pop() || ''
    return decodeURIComponent(lastSegment).trim()
  } catch {
    const clean = url.split('?')[0] || ''
    const lastSegment = clean.split('/').pop() || ''
    try {
      return decodeURIComponent(lastSegment).trim()
    } catch {
      return lastSegment.trim()
    }
  }
}

const resolveRemoteAssetUrl = (manifestUrl = '', assetValue = '') => {
  const raw = String(assetValue || '').trim()
  if (!raw) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return normalizeDriveUrl(raw)
  }

  try {
    return normalizeDriveUrl(new URL(raw, manifestUrl).href)
  } catch {
    return normalizeDriveUrl(raw)
  }
}

const isTrackDownloadable = (track) => {
  if (!track?.audioUrl) {
    return false
  }

  if (track.source === 'local' || track.source === 'link') {
    return true
  }

  const normalized = String(track.audioUrl || '').toLowerCase()
  return (
    normalized.includes('export=download') ||
    /\.(mp3|wav|flac|m4a|aac|ogg)(\?|$)/i.test(normalized)
  )
}

const normalizeDriveTrack = (track, sourceTag = 'drive', manifestUrl = '') => {
  const trackObject =
    typeof track === 'string'
      ? { downloadUrl: track }
      : track && typeof track === 'object'
        ? track
        : {}
  const rawAudioValue =
    trackObject.audioUrl ||
    trackObject.downloadUrl ||
    trackObject.directUrl ||
    trackObject.mp3Url ||
    trackObject.streamUrl ||
    trackObject.url ||
    trackObject.audioFile ||
    trackObject.audioPath ||
    trackObject.file ||
    ''
  const rawCoverValue =
    trackObject.coverUrl || trackObject.coverFile || trackObject.coverPath || trackObject.image || ''
  const audioUrl = resolveRemoteAssetUrl(manifestUrl, rawAudioValue)
  const coverUrl = resolveRemoteAssetUrl(manifestUrl, rawCoverValue)
  const inferredFromUrl = parseTrackName(getFileNameFromUrl(audioUrl || rawAudioValue))
  const normalizedTitle =
    cleanFilenameTrackTitle(String(trackObject.title || '').trim()) ||
    cleanFilenameTrackTitle(inferredFromUrl.title || '') ||
    'Bilinmeyen parça'
  const normalizedArtist =
    String(trackObject.artist || '').trim() || inferredFromUrl.artist || 'Yerel Koleksiyon'
  const rawId =
    trackObject.id ||
    trackObject.driveId ||
    rawAudioValue ||
    `${normalizedTitle || 'track'}-${normalizedArtist || 'artist'}`
  const normalizedId = `${sourceTag}:${encodeURIComponent(String(rawId))}`

  return {
    ...trackObject,
    id: normalizedId,
    source: sourceTag,
    title: normalizedTitle,
    artist: normalizedArtist,
    album: String(trackObject.album || '').trim() || 'Single',
    genre: normalizeGenreName(trackObject.genre || ''),
    duration: Number(trackObject.duration || 0) || 0,
    audioUrl,
    coverUrl,
    gradient: trackObject.gradient || pickGradient(trackObject.id || normalizedTitle || normalizedArtist || ''),
  }
}

const normalizeCoverMatchText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s*(feat\.?|ft\.?|with)\s+.*$/i, '')
    .replace(/[^a-z0-9\u00c0-\u024f\u0400-\u04ff\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeGenreName = (value = '') => {
  const normalized = sanitizeDisplayText(String(value || '')).replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return ''
  }

  const lowered = normalized.toLocaleLowerCase('tr-TR')
  if (lowered === 'single' || lowered === 'unknown' || lowered === 'unknown genre') {
    return ''
  }

  return normalized
}

const isSingleOrEpAlbumName = (value = '') => {
  const normalized = normalizeCoverMatchText(value)
  if (!normalized) {
    return false
  }

  return (
    /\bsingle\b/i.test(normalized) ||
    /\bep\b/i.test(normalized) ||
    /\be p\b/i.test(normalized)
  )
}

const fetchRemoteTrackMeta = async (title, artist, options = {}) => {
  const cleanTitle = normalizeCoverMatchText(title)
  const cleanArtist = normalizeCoverMatchText(artist)
  const normalizedPreferredAlbum = normalizeCoverMatchText(options?.preferredAlbum || '')
  const cleanAlbum = isSingleOrEpAlbumName(normalizedPreferredAlbum) ? '' : normalizedPreferredAlbum
  const preferredDuration = Number(options?.preferredDuration || 0)
  if (!cleanTitle || !cleanArtist) {
    return { coverUrl: '', album: '', genre: '' }
  }

  const titleTokens = cleanTitle.split(' ').filter((token) => token.length >= 3)
  const artistCandidates = Array.from(
    new Set(
      [cleanArtist, ...extractArtistCandidates(artist).map((name) => normalizeCoverMatchText(name))]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
  const artistTokensByCandidate = artistCandidates.map((candidate) =>
    candidate.split(' ').filter((token) => token.length >= 3),
  )
  const albumTokens = cleanAlbum.split(' ').filter((token) => token.length >= 3)
  const queryTerms = Array.from(
    new Set(
      [
        [artist, title].filter(Boolean).join(' ').trim(),
        [title, artist].filter(Boolean).join(' ').trim(),
        [artist, title, options?.preferredAlbum || ''].filter(Boolean).join(' ').trim(),
      ].filter(Boolean),
    ),
  )

  const normalizeMillisToSeconds = (millis) => {
    const value = Number(millis || 0)
    if (!Number.isFinite(value) || value <= 0) {
      return 0
    }
    return value / 1000
  }

  const isTitleStrictMatch = (titleValue = '') => {
    const trackName = normalizeCoverMatchText(titleValue)
    if (!trackName) {
      return false
    }
    if (
      trackName === cleanTitle ||
      trackName.includes(cleanTitle) ||
      cleanTitle.includes(trackName)
    ) {
      return true
    }

    if (!titleTokens.length) {
      return false
    }

    const tokenMatches = titleTokens.filter((token) => trackName.includes(token)).length
    if (titleTokens.length === 1) {
      return tokenMatches === 1
    }
    return (
      tokenMatches >= Math.min(2, titleTokens.length) &&
      tokenMatches / titleTokens.length >= 0.66
    )
  }

  const isArtistStrictMatch = (artistValue = '') => {
    const artistName = normalizeCoverMatchText(artistValue)
    if (!artistName) {
      return false
    }

    for (let index = 0; index < artistCandidates.length; index += 1) {
      const candidate = artistCandidates[index]
      if (
        artistName === candidate ||
        artistName.includes(candidate) ||
        candidate.includes(artistName)
      ) {
        return true
      }

      const tokens = artistTokensByCandidate[index] || []
      if (tokens.length < 2) {
        continue
      }

      const tokenMatches = tokens.filter((token) => artistName.includes(token)).length
      if (tokenMatches >= Math.min(2, tokens.length)) {
        return true
      }
    }

    return false
  }

  const isAlbumMatch = (albumValue = '') => {
    if (!cleanAlbum) {
      return true
    }

    const albumName = normalizeCoverMatchText(albumValue)
    if (!albumName) {
      return false
    }

    return (
      albumName === cleanAlbum ||
      albumName.includes(cleanAlbum) ||
      cleanAlbum.includes(albumName) ||
      (albumTokens.length > 0 && albumTokens.every((token) => albumName.includes(token)))
    )
  }

  const scoreCandidate = (item) => {
    const trackName = normalizeCoverMatchText(item.trackName || item.collectionName || '')
    const artistName = normalizeCoverMatchText(item.artistName || '')
    const albumName = normalizeCoverMatchText(item.collectionName || '')
    const hasAlbumMatch = isAlbumMatch(item.collectionName || '')
    const trackDuration = normalizeMillisToSeconds(item.trackTimeMillis)

    if (!isTitleStrictMatch(trackName) || !isArtistStrictMatch(artistName)) {
      return null
    }
    if (cleanAlbum && !hasAlbumMatch) {
      return null
    }

    let score = 0

    if (trackName === cleanTitle) {
      score += 46
    } else if (trackName.startsWith(cleanTitle) || cleanTitle.startsWith(trackName)) {
      score += 36
    } else {
      const titleTokenMatches = titleTokens.filter((token) => trackName.includes(token)).length
      score += Math.min(20, titleTokenMatches * 7)
      if (trackName.includes(cleanTitle) || cleanTitle.includes(trackName)) {
        score += 10
      }
    }

    if (artistName === cleanArtist) {
      score += 34
    } else if (artistName.includes(cleanArtist) || cleanArtist.includes(artistName)) {
      score += 24
    } else {
      score += 15
    }

    if (cleanAlbum) {
      if (hasAlbumMatch) {
        score += 18
      } else {
        score -= 28
      }
    }

    if (preferredDuration > 0 && trackDuration > 0) {
      const diff = Math.abs(trackDuration - preferredDuration)
      if (diff <= 2) {
        score += 12
      } else if (diff <= 5) {
        score += 8
      } else if (diff <= 10) {
        score += 3
      } else if (diff > 18) {
        score -= 10
      }
    }

    const collectionType = String(item.collectionType || '').toLowerCase()
    if (collectionType === 'album') {
      score += 5
    }

    if (isSingleOrEpAlbumName(albumName)) {
      score -= 10
    } else if (albumName) {
      score += 4
    }

    const confidence = Math.max(0, Math.min(100, Math.round(score)))
    return {
      item,
      confidence,
    }
  }

  const combinedResults = []
  const seenResultKeys = new Set()
  for (const term of queryTerms) {
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`,
      )
      if (!response.ok) {
        continue
      }
      const json = await response.json()
      const results = Array.isArray(json?.results) ? json.results : []
      for (const item of results) {
        const resultKey =
          String(item?.trackId || '').trim() ||
          `${normalizeCoverMatchText(item?.artistName || '')}|${normalizeCoverMatchText(item?.trackName || '')}|${normalizeCoverMatchText(item?.collectionName || '')}`
        if (!resultKey || seenResultKeys.has(resultKey)) {
          continue
        }
        seenResultKeys.add(resultKey)
        combinedResults.push(item)
      }
    } catch {
      // ignore source errors and continue
    }
  }

  const results = combinedResults
  let best = null
  let bestConfidence = -1

  for (const item of results) {
    if (!item?.artworkUrl100) {
      continue
    }
    const scored = scoreCandidate(item)
    if (!scored) {
      continue
    }
    if (scored.confidence > bestConfidence) {
      bestConfidence = scored.confidence
      best = scored.item
    }
  }

  const minimumConfidence = cleanAlbum ? 70 : 58
  if (best?.artworkUrl100 && bestConfidence >= minimumConfidence) {
    return {
      coverUrl: best.artworkUrl100.replace(/100x100bb\./, '300x300bb.'),
      album: String(best.collectionName || '').trim(),
      genre: normalizeGenreName(best.primaryGenreName || ''),
      confidence: bestConfidence,
      source: 'itunes',
    }
  }

  try {
    const mbQuery = `recording:"${String(title || '').trim()}" AND artist:"${String(artist || '').trim()}"`
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(mbQuery)}&fmt=json&limit=12`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )
    if (mbResponse.ok) {
      const mbJson = await mbResponse.json()
      const recordings = Array.isArray(mbJson?.recordings) ? mbJson.recordings : []
      let mbBest = null
      let mbBestScore = -1
      for (const recording of recordings) {
        const recordingTitle = String(recording?.title || '').trim()
        if (!isTitleStrictMatch(recordingTitle)) {
          continue
        }

        const credit = Array.isArray(recording?.['artist-credit'])
          ? recording['artist-credit'].map((item) => String(item?.name || '').trim()).filter(Boolean).join(', ')
          : ''
        if (!isArtistStrictMatch(credit)) {
          continue
        }

        const releases = Array.isArray(recording?.releases) ? recording.releases : []
        const release = releases.find((item) => String(item?.id || '').trim()) || releases[0] || null
        const albumName = String(release?.title || '').trim()
        const releaseId = String(release?.id || '').trim()
        let score = Number(recording?.score || 0)
        if (albumName && !isSingleOrEpAlbumName(albumName)) {
          score += 8
        }
        if (cleanAlbum && isAlbumMatch(albumName)) {
          score += 18
        }
        if (score > mbBestScore) {
          mbBestScore = score
          mbBest = {
            album: albumName,
            releaseId,
          }
        }
      }

      if (mbBest) {
        let coverUrl = ''
        if (mbBest.releaseId) {
          const candidateUrl = `https://coverartarchive.org/release/${mbBest.releaseId}/front-500`
          try {
            const head = await fetch(candidateUrl, { method: 'HEAD' })
            if (head.ok) {
              coverUrl = candidateUrl
            }
          } catch {
            // ignore cover archive check errors
          }
        }

        if (coverUrl || (mbBest.album && mbBest.album.toLowerCase() !== 'single')) {
          return {
            coverUrl,
            album: mbBest.album,
            genre: '',
            confidence: Math.max(52, Math.min(92, mbBestScore)),
            source: 'musicbrainz',
          }
        }
      }
    }
  } catch {
    // ignore MusicBrainz fallback errors
  }

  return { coverUrl: '', album: '', genre: '' }
}

const mediaShortcutFromKeyboardEvent = (event) => {
  const ctrl = Boolean(event?.ctrlKey)
  const alt = Boolean(event?.altKey)
  const shift = Boolean(event?.shiftKey)
  const meta = Boolean(event?.metaKey)
  const key = String(event?.key || '')
  const code = String(event?.code || '')

  const modifiers = []
  if (ctrl) modifiers.push('Ctrl')
  if (alt) modifiers.push('Alt')
  if (shift) modifiers.push('Shift')
  if (meta) modifiers.push('Super')

  const isModifierOnlyKey =
    key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta'

  const codeMap = {
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Tab: 'Tab',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
  }

  let main = ''
  if (codeMap[code]) {
    main = codeMap[code]
  } else if (/^Key[A-Z]$/.test(code)) {
    main = code.slice(3).toUpperCase()
  } else if (/^Digit[0-9]$/.test(code)) {
    main = code.slice(5)
  } else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) {
    main = key.toUpperCase()
  } else if (!isModifierOnlyKey && key.length === 1) {
    main = key.toUpperCase()
  }

  if (!main) {
    if (isModifierOnlyKey) {
      return modifiers.join('+')
    }
    return modifiers.join('+')
  }

  if (modifiers.includes(main)) {
    return modifiers.join('+')
  }
  return modifiers.length ? `${modifiers.join('+')}+${main}` : main
}

const areArtistsCompatible = (leftArtist = '', rightArtist = '') => {
  const left = normalizeArtistQuery(leftArtist).toLowerCase()
  const right = normalizeArtistQuery(rightArtist).toLowerCase()
  if (!left || !right) {
    return false
  }
  if (left === right || left.includes(right) || right.includes(left)) {
    return true
  }

  const leftVariants = Array.from(
    new Set([left, ...extractArtistCandidates(leftArtist).map((name) => normalizeArtistQuery(name).toLowerCase())]),
  ).filter(Boolean)
  const rightVariants = Array.from(
    new Set([right, ...extractArtistCandidates(rightArtist).map((name) => normalizeArtistQuery(name).toLowerCase())]),
  ).filter(Boolean)

  return leftVariants.some((leftVariant) =>
    rightVariants.some(
      (rightVariant) =>
        leftVariant === rightVariant ||
        leftVariant.includes(rightVariant) ||
        rightVariant.includes(leftVariant),
    ),
  )
}

const fetchRemoteCoverArt = async (title, artist) => {
  const remoteMeta = await fetchRemoteTrackMeta(title, artist)
  return remoteMeta.coverUrl || ''
}

const fetchRemoteTrackMetaSmart = async (title, artist, options = {}) => {
  const primary = await fetchRemoteTrackMeta(title, artist, options)
  const primaryConfidence = Number(primary?.confidence || 0)
  let best = primary
  let swapped = false

  const cleanTitle = cleanFilenameTrackTitle(title || '')
  const cleanArtist = sanitizeDisplayText(artist || '')
  if (!cleanTitle || !cleanArtist || options?.disableSwapCheck) {
    return { ...best, swapped }
  }

  if (primary?.coverUrl && primaryConfidence >= 72) {
    return { ...best, swapped }
  }

  try {
    const swappedMeta = await fetchRemoteTrackMeta(cleanArtist, cleanTitle, {
      ...options,
      disableSwapCheck: true,
    })
    const swappedConfidence = Number(swappedMeta?.confidence || 0)
    if (
      swappedMeta?.coverUrl &&
      swappedConfidence >= Math.max(primaryConfidence + 10, 70)
    ) {
      best = swappedMeta
      swapped = true
    }
  } catch {
    // ignore swapped lookup errors
  }

  return { ...best, swapped }
}

const fetchAlbumInsights = async ({ artist = '', album = '', title = '' }) => {
  const cleanArtist = normalizeCoverMatchText(artist)
  const cleanAlbum = normalizeCoverMatchText(album)
  const cleanTitle = normalizeCoverMatchText(title)
  const term = [artist, album || title].filter(Boolean).join(' ').trim()
  if (!term) {
    return null
  }

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=album&limit=35`,
  )
  if (!response.ok) {
    return null
  }

  const json = await response.json()
  const results = Array.isArray(json?.results) ? json.results : []
  let best = null
  let bestScore = -1

  for (const item of results) {
    const artistName = normalizeCoverMatchText(item?.artistName || '')
    const albumName = normalizeCoverMatchText(item?.collectionName || '')
    if (!albumName) {
      continue
    }

    let score = 0
    if (cleanArtist) {
      if (artistName === cleanArtist) {
        score += 45
      } else if (artistName.includes(cleanArtist) || cleanArtist.includes(artistName)) {
        score += 30
      } else {
        continue
      }
    }

    if (cleanAlbum) {
      if (albumName === cleanAlbum) {
        score += 55
      } else if (albumName.includes(cleanAlbum) || cleanAlbum.includes(albumName)) {
        score += 36
      } else {
        score -= 20
      }
    } else if (cleanTitle && (albumName.includes(cleanTitle) || cleanTitle.includes(albumName))) {
      score += 12
    }

    const trackCount = Number(item?.trackCount || 0)
    score += Math.min(trackCount, 20)
    if (isSingleOrEpAlbumName(albumName)) {
      score -= 25
    } else {
      score += 8
    }

    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  if (!best) {
    return null
  }

  return {
    album: String(best.collectionName || album || '').trim(),
    artist: String(best.artistName || artist || '').trim(),
    releaseDate: String(best.releaseDate || '').trim(),
    coverUrl: best.artworkUrl100 ? best.artworkUrl100.replace(/100x100bb\./, '600x600bb.') : '',
  }
}

const upgradeCoverUrl = (url = '', size = '100x100bb') => {
  if (!url) {
    return ''
  }

  return url.replace(/\/\d+x\d+bb\./, `/${size}.`).replace(/100x100bb\./, `${size}.`)
}

const getTrackDisplayUrl = (track, mode = 'thumb', pendingCover = null) => {
  const url = pendingCover?.coverUrl || track?.coverUrl || track?.coverRemoteUrl || ''
  if (!url) {
    return ''
  }

  if (url.includes('itunes.apple.com') || url.includes('mzstatic.com')) {
    return upgradeCoverUrl(url, mode === 'hero' ? '600x600bb' : '100x100bb')
  }

  return url
}

const getTrackCoverUrl = (track, pendingCover = null) =>
  getTrackDisplayUrl(track, 'hero', pendingCover)

const getTrackSignature = (track) => {
  const title = normalizeArtistQuery(track?.title || '').toLowerCase()
  const artist = normalizeArtistQuery(track?.artist || '').toLowerCase()
  const size = track?.size || ''
  const durationBucket = Number.isFinite(track?.duration) ? Math.round(track.duration) : ''
  const sourceKey =
    track?.source === 'link' ? normalizeDriveUrl(track?.audioUrl || '') : ''
  return `${title}|${artist}|${size}|${durationBucket}|${sourceKey}`
}

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image-load-failed'))
    image.src = src
  })

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('file-read-failed'))
    reader.readAsDataURL(file)
  })

const extractDominantColor = async (src) => {
  if (!src) {
    return ''
  }

  let objectUrl = src
  let shouldRevoke = false

  try {
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      const response = await fetch(src)
      if (!response.ok) {
        return ''
      }

      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      shouldRevoke = true
    }

    const image = await loadImageElement(objectUrl)
    const canvas = document.createElement('canvas')
    const size = 24
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) {
      return ''
    }

    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    const buckets = new Map()

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]
      if (alpha < 180) {
        continue
      }

      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }

    let dominant = ''
    let dominantCount = 0
    buckets.forEach((count, key) => {
      if (count > dominantCount) {
        dominant = key
        dominantCount = count
      }
    })

    if (!dominant) {
      return ''
    }

    const [r, g, b] = dominant.split(',').map(Number)
    return `rgb(${r}, ${g}, ${b})`
  } catch {
    return ''
  } finally {
    if (shouldRevoke) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

const getReadableCoverColors = (background) => {
  const rgb = parseColorToRgb(background)
  if (!rgb) {
    return {
      fg: '#ffffff',
      fgSoft: 'rgba(255, 255, 255, 0.72)',
      fgMuted: 'rgba(255, 255, 255, 0.58)',
    }
  }

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000

  if (brightness >= 180) {
    return {
      fg: '#111111',
      fgSoft: 'rgba(17, 17, 17, 0.72)',
      fgMuted: 'rgba(17, 17, 17, 0.58)',
    }
  }

  return {
    fg: '#ffffff',
    fgSoft: 'rgba(255, 255, 255, 0.72)',
    fgMuted: 'rgba(255, 255, 255, 0.58)',
  }
}

const parseColorToRgb = (value = '') => {
  const text = String(value || '').trim()
  const rgbMatch = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    return {
      r: Math.max(0, Math.min(255, Number(rgbMatch[1]))),
      g: Math.max(0, Math.min(255, Number(rgbMatch[2]))),
      b: Math.max(0, Math.min(255, Number(rgbMatch[3]))),
    }
  }

  const hexTokenMatch = text.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i)
  const hex = (hexTokenMatch ? hexTokenMatch[1] : text.replace('#', '')).trim()
  if (hex.length === 3 || hex.length === 6) {
    const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    }
  }

  return null
}

const mixRgbColor = (left, right, ratio = 0.5) => {
  const t = Math.max(0, Math.min(1, Number(ratio) || 0))
  return {
    r: Math.round(left.r + (right.r - left.r) * t),
    g: Math.round(left.g + (right.g - left.g) * t),
    b: Math.round(left.b + (right.b - left.b) * t),
  }
}

const rgbToRgbaCss = (rgb, alpha = 1) =>
  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`

const getClaimString = (claims, propertyId) => {
  const value = claims?.[propertyId]?.[0]?.mainsnak?.datavalue?.value || ''
  if (typeof value === 'string') {
    return value
  }
  if (value?.text) {
    return value.text
  }
  return ''
}

const getClaimDate = (claims, propertyId) => {
  const raw = claims?.[propertyId]?.[0]?.mainsnak?.datavalue?.value?.time
  if (!raw) {
    return ''
  }

  return formatWikiDate(raw.replace(/^\+/, '').split('T')[0])
}

const getClaimEntityIds = (claims, propertyId) =>
  (claims?.[propertyId] || [])
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)

const fetchArtistFacts = async (artistName) => {
  const searchQueries = Array.from(
    new Set([normalizeArtistQuery(artistName), artistName].map((query) => query.trim()).filter(Boolean)),
  )

  let entityId = ''
  for (const query of searchQueries) {
    const searchResponse = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        query,
      )}&language=en&format=json&formatversion=2&origin=*&limit=5`,
    )
    const searchJson = await searchResponse.json()
    entityId = searchJson?.search?.[0]?.id || ''
    if (entityId) {
      break
    }
  }

  if (!entityId) {
    return null
  }

  const entityResponse = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels|descriptions|claims|sitelinks&languages=en&languagefallback=1&format=json&formatversion=2&origin=*`,
  )
  const entityJson = await entityResponse.json()
  const entity = entityJson?.entities?.[entityId]
  if (!entity) {
    return null
  }

  const claims = entity.claims || {}
  const memberIds = getClaimEntityIds(claims, 'P527').slice(0, 8)

  let memberNames = []
  if (memberIds.length) {
    const membersResponse = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${memberIds.join(
        '|',
      )}&props=labels&languages=en&languagefallback=1&format=json&formatversion=2&origin=*`,
    )
    const membersJson = await membersResponse.json()
    memberNames = memberIds
      .map((id) => membersJson?.entities?.[id]?.labels?.en?.value)
      .filter(Boolean)
  }

  const wikiTitle = entity?.sitelinks?.enwiki?.title || ''
  let summary = entity?.descriptions?.en?.value || ''
  let photoUrl = ''

  if (wikiTitle) {
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
    )
    if (summaryResponse.ok) {
      const summaryJson = await summaryResponse.json()
      summary = summaryJson?.extract || summary
      photoUrl = summaryJson?.thumbnail?.source || ''
    }
  }

  return {
    name: entity?.labels?.en?.value || artistName,
    summary,
    realName: getClaimString(claims, 'P1477'),
    formedAt: getClaimDate(claims, 'P571'),
    birthDate: getClaimDate(claims, 'P569'),
    members: memberNames,
    photoUrl,
  }
}

let dbPromise = null

const openTracksDb = () => {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

const getStoredTracks = async () => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

const putStoredTracks = async (records) => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.clear()
    records.forEach((record) => {
      store.put(record)
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const deleteStoredTrack = async (id) => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const loadUiPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY) || '{}')
  } catch {
    return {}
  }
}

const saveUiPrefs = (prefs) => {
  localStorage.setItem(UI_KEY, JSON.stringify(prefs))
}

const normalizeHexColor = (value, fallback) => {
  const raw = String(value || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const [_, r, g, b] = raw
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return fallback
}

const getDefaultBackgroundPalette = (mode) => {
  if (mode === 'light') {
    return { color1: '#eef1f6', color2: '#dde3ea' }
  }
  if (mode === 'transparent') {
    return { color1: '#18181b', color2: '#0f0f11' }
  }
  if (mode === 'gray') {
    return { color1: '#101317', color2: '#1a2028' }
  }
  return { color1: '#000000', color2: '#111827' }
}

const getUiThemeVars = (mode) => {
  if (mode === 'light') {
    return {
      '--app-bg': 'radial-gradient(120% 120% at 8% 6%, #eef1f6 0%, #e7ebf1 48%, #dde3ea 100%)',
      '--surface-bg': '#f4f7fb',
      '--surface-bg-strong': '#eff3f8',
      '--surface-border': 'rgba(15, 23, 42, 0.10)',
      '--text-primary': '#0f172a',
      '--text-secondary': 'rgba(15, 23, 42, 0.66)',
      '--text-muted': 'rgba(15, 23, 42, 0.52)',
      '--control-bg': '#e7edf4',
      '--control-bg-hover': '#dbe4ee',
      '--control-strong-bg': '#0f172a',
      '--control-strong-fg': '#ffffff',
      '--control-border': 'rgba(15, 23, 42, 0.10)',
      '--range-track': 'rgba(15, 23, 42, 0.2)',
      '--range-thumb': '#0f172a',
      '--range-progress': 'linear-gradient(90deg, #0f172a, rgba(15, 23, 42, 0.42))',
    }
  }

  if (mode === 'gray') {
    return {
      '--app-bg': 'radial-gradient(120% 120% at 10% 8%, #1b1b1d 0%, #141416 52%, #101011 100%)',
      '--surface-bg': '#1c1c1e',
      '--surface-bg-strong': '#222224',
      '--surface-border': 'rgba(255, 255, 255, 0.1)',
      '--text-primary': '#f2f2f3',
      '--text-secondary': 'rgba(242, 242, 243, 0.66)',
      '--text-muted': 'rgba(242, 242, 243, 0.48)',
      '--control-bg': '#2b2b2e',
      '--control-bg-hover': '#343438',
      '--control-strong-bg': '#f2f2f3',
      '--control-strong-fg': '#121214',
      '--control-border': 'rgba(255, 255, 255, 0.08)',
      '--range-track': 'rgba(255, 255, 255, 0.2)',
      '--range-thumb': '#ffffff',
      '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.38))',
    }
  }

  if (mode === 'transparent') {
    return {
      '--app-bg': 'radial-gradient(130% 130% at 10% 8%, #1a1a1d 0%, #121216 52%, #0e0e11 100%)',
      '--surface-bg': 'rgba(168, 208, 255, 0.10)',
      '--surface-bg-strong': 'rgba(176, 214, 255, 0.14)',
      '--surface-border': 'rgba(255, 255, 255, 0.22)',
      '--text-primary': '#ffffff',
      '--text-secondary': 'rgba(255, 255, 255, 0.76)',
      '--text-muted': 'rgba(255, 255, 255, 0.58)',
      '--control-bg': 'rgba(196, 224, 255, 0.12)',
      '--control-bg-hover': 'rgba(209, 231, 255, 0.20)',
      '--control-strong-bg': 'rgba(220, 237, 255, 0.24)',
      '--control-strong-fg': '#ffffff',
      '--control-border': 'rgba(255, 255, 255, 0.24)',
      '--range-track': 'rgba(255, 255, 255, 0.24)',
      '--range-thumb': '#ffffff',
      '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.46))',
    }
  }

  return {
    '--app-bg': '#000000',
    '--surface-bg': '#0d0d0d',
    '--surface-bg-strong': '#121212',
    '--surface-border': 'rgba(255, 255, 255, 0.08)',
    '--text-primary': '#ffffff',
    '--text-secondary': 'rgba(255, 255, 255, 0.58)',
    '--text-muted': 'rgba(255, 255, 255, 0.46)',
    '--control-bg': '#1f1f1f',
    '--control-bg-hover': '#2a2a2a',
    '--control-strong-bg': '#ffffff',
    '--control-strong-fg': '#000000',
    '--control-border': 'rgba(255, 255, 255, 0.08)',
    '--range-track': 'rgba(255, 255, 255, 0.12)',
    '--range-thumb': '#ffffff',
    '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.35))',
  }
}

const loadArtistFactsCache = () => {
  try {
    return JSON.parse(localStorage.getItem(ARTIST_FACTS_KEY) || '{}')
  } catch {
    return {}
  }
}

let artistFactsSaveTimerId = null
let pendingArtistFactsCache = null

const saveArtistFactsCache = (cache) => {
  pruneCacheEntries(cache, MAX_ARTIST_FACTS_CACHE_ENTRIES)
  pendingArtistFactsCache = cache
  if (artistFactsSaveTimerId) {
    return
  }

  artistFactsSaveTimerId = window.setTimeout(() => {
    artistFactsSaveTimerId = null
    if (pendingArtistFactsCache === null) {
      return
    }
    localStorage.setItem(ARTIST_FACTS_KEY, JSON.stringify(pendingArtistFactsCache))
  }, 2200)
}

const loadJsonCache = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

const createPoolEditorTrack = (track = {}) => ({
  id: String(track.id || `pool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  title: cleanFilenameTrackTitle(String(track.title || '').trim()) || '',
  artist: sanitizeDisplayText(String(track.artist || '').trim()) || '',
  downloadUrl: String(track.audioUrl || track.downloadUrl || '').trim(),
  coverUrl: String(track.coverUrl || track.image || '').trim(),
})

const normalizePoolManifestTrack = (track = {}) => {
  if (typeof track === 'string') {
    const directUrl = normalizeDriveUrl(track)
    if (!directUrl) {
      return null
    }
    return {
      title: '',
      artist: '',
      downloadUrl: directUrl,
      coverUrl: '',
    }
  }

  const title = cleanFilenameTrackTitle(String(track.title || '').trim())
  const artist = sanitizeDisplayText(String(track.artist || '').trim())
  const downloadUrl = normalizeDriveUrl(String(track.downloadUrl || track.audioUrl || '').trim())
  const coverUrl = normalizeDriveUrl(String(track.coverUrl || track.image || '').trim())
  if (!downloadUrl) {
    return null
  }
  return {
    title,
    artist,
    downloadUrl,
    coverUrl,
  }
}

const poolManifestTrackKey = (track = {}) =>
  `${normalizeCoverMatchText(track.artist || '')}|||${normalizeCoverMatchText(track.title || '')}|||${normalizeDriveUrl(
    track.downloadUrl || track.audioUrl || '',
  ).toLowerCase()}`

const parsePoolManifestTracks = (payload) => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.tracks)
      ? payload.tracks
      : Array.isArray(payload?.items)
        ? payload.items
        : []
  return source.map((item) => normalizePoolManifestTrack(item)).filter(Boolean)
}

const doesArtistMatch = (trackArtist = '', targetArtist = '') => {
  const target = normalizeArtistQuery(targetArtist).toLowerCase()
  if (!target) {
    return false
  }

  const variants = Array.from(
    new Set([
      normalizeArtistQuery(trackArtist).toLowerCase(),
      ...extractArtistCandidates(trackArtist).map((item) => normalizeArtistQuery(item).toLowerCase()),
    ].filter(Boolean)),
  )

  return variants.some((variant) => variant === target || variant.includes(target) || target.includes(variant))
}

const cacheWriteTimers = new Map()
const cacheWritePayloads = new Map()
const MAX_COVER_CACHE_ENTRIES = 1200
const MAX_ALBUM_CACHE_ENTRIES = 1200
const MAX_GENRE_CACHE_ENTRIES = 1200
const MAX_LYRICS_CACHE_ENTRIES = 800
const MAX_ARTIST_FACTS_CACHE_ENTRIES = 600
const TRACK_RENDER_BATCH_INITIAL = 120
const TRACK_RENDER_BATCH_STEP = 80

const pruneCacheEntries = (cache, maxEntries) => {
  if (!cache || typeof cache !== 'object') {
    return
  }
  const keys = Object.keys(cache)
  if (keys.length <= maxEntries) {
    return
  }
  const removeCount = keys.length - maxEntries
  for (let index = 0; index < removeCount; index += 1) {
    delete cache[keys[index]]
  }
}

const getLruCacheValue = (cache, key) => {
  if (!cache || !key || !Object.prototype.hasOwnProperty.call(cache, key)) {
    return undefined
  }
  const value = cache[key]
  delete cache[key]
  cache[key] = value
  return value
}

const setLruCacheValue = (cache, key, value, maxEntries) => {
  if (!cache || !key) {
    return
  }
  if (Object.prototype.hasOwnProperty.call(cache, key)) {
    delete cache[key]
  }
  cache[key] = value
  pruneCacheEntries(cache, maxEntries)
}

const saveJsonCache = (key, value) => {
  cacheWritePayloads.set(key, value)
  if (cacheWriteTimers.has(key)) {
    return
  }

  const flush = () => {
    cacheWriteTimers.delete(key)
    const payload = cacheWritePayloads.get(key)
    if (payload === undefined) {
      return
    }
    cacheWritePayloads.delete(key)
    localStorage.setItem(key, JSON.stringify(payload))
  }

  const timerId = setTimeout(flush, 2200)
  cacheWriteTimers.set(key, timerId)
}

const scheduleIdle = (task) => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(() => task())
  }

  return window.setTimeout(task, 32)
}

const COVER_ART_CACHE_KEY = 'nova-player-cover-art-cache'
const ALBUM_CACHE_KEY = 'nova-player-album-cache'
const GENRE_CACHE_KEY = 'nova-player-genre-cache'
const COVER_TONE_CACHE_KEY = 'nova-player-cover-tone-cache'
const LYRICS_CACHE_KEY = 'nova-player-lyrics-cache'

const cleanTrackTitleForLyrics = (value = '') =>
  value
    .replace(/\s*\((feat\.?|ft\.?|with|remix|live|official|video).*?\)\s*/gi, ' ')
    .replace(/\s*\[(feat\.?|ft\.?|with|remix|live|official|video).*?\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeLyricsText = (value = '') => String(value || '').replace(/\r\n/g, '\n').trim()

const fetchLyricsFromMakeItPersonal = async (artist, title) => {
  const response = await fetch(
    `https://makeitpersonal.co/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
  )
  if (!response.ok) {
    return ''
  }

  const text = normalizeLyricsText(await response.text())
  if (
    !text ||
    /sorry/i.test(text) ||
    /not found/i.test(text) ||
    /rate limit/i.test(text)
  ) {
    return ''
  }
  return text
}

const fetchLyricsFromPopcat = async (artist, title) => {
  const query = `${artist} ${title}`.trim()
  const response = await fetch(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(query)}`)
  if (!response.ok) {
    return ''
  }

  const json = await response.json()
  const text = normalizeLyricsText(json?.lyrics)
  return text || ''
}

const fetchLyricsForTrack = async (track) => {
  const titleVariants = Array.from(
    new Set([cleanTrackTitleForLyrics(track?.title || ''), track?.title || ''].filter(Boolean)),
  )
  const artistVariants = Array.from(
    new Set([
      normalizeArtistQuery(track?.artist || '').split(/[,&/]/)[0]?.trim(),
      track?.artist || '',
    ].filter(Boolean)),
  )

  for (const artist of artistVariants) {
    for (const title of titleVariants) {
      try {
        const response = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        )
        if (!response.ok) {
          continue
        }

        const json = await response.json()
        const lyricText = normalizeLyricsText(json?.lyrics)
        if (lyricText) {
          return lyricText
        }
      } catch {
        // try next source
      }

      try {
        const response = await fetch(
          `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
            artist,
          )}&track_name=${encodeURIComponent(title)}`,
        )
        if (!response.ok) {
          continue
        }

        const json = await response.json()
        const lyricText = normalizeLyricsText(json?.plainLyrics || json?.syncedLyrics)
        if (lyricText) {
          return lyricText
        }
      } catch {
        // try next source
      }

      try {
        const response = await fetch(
          `https://lrclib.net/api/search?artist_name=${encodeURIComponent(
            artist,
          )}&track_name=${encodeURIComponent(title)}`,
        )
        if (response.ok) {
          const json = await response.json()
          const item = Array.isArray(json) ? json[0] : null
          const lyricText = normalizeLyricsText(item?.plainLyrics || item?.syncedLyrics)
          if (lyricText) {
            return lyricText
          }
        }
      } catch {
        // try next source
      }

      try {
        const lyricText = await fetchLyricsFromMakeItPersonal(artist, title)
        if (lyricText) {
          return lyricText
        }
      } catch {
        // try next source
      }

      try {
        const lyricText = await fetchLyricsFromPopcat(artist, title)
        if (lyricText) {
          return lyricText
        }
      } catch {
        // try next source
      }
    }
  }

  return ''
}

const materializeTrack = (record, urlsRef) => {
  if (!record?.audioBlob) {
    return record
  }

  const audioUrl = URL.createObjectURL(record.audioBlob)
  urlsRef.current.push(audioUrl)

  let coverUrl = ''
  if (record.coverBlob) {
    coverUrl = URL.createObjectURL(record.coverBlob)
    urlsRef.current.push(coverUrl)
  }

  return {
    ...record,
    audioUrl,
    coverUrl,
  }
}

const serializeTrack = (track) => {
  if (track?.source === 'link') {
    const { audioBlob: _audioBlob, coverBlob: _coverBlob, isFavorite: _isFavorite, ...rest } = track
    return {
      ...rest,
      audioUrl: normalizeDriveUrl(track.audioUrl || ''),
      coverUrl: normalizeDriveUrl(track.coverUrl || ''),
    }
  }

  const { audioUrl: _audioUrl, coverUrl: _coverUrl, isFavorite: _isFavorite, ...rest } = track
  return rest
}

const applyFavoriteFlags = (tracks, favoriteIds = []) => {
  const favoriteSet = new Set(favoriteIds)
  return tracks.map((track) => ({
    ...track,
    isFavorite: favoriteSet.has(track.id),
  }))
}

const encodeUtf8ToBase64 = (value = '') => {
  const bytes = new TextEncoder().encode(String(value))
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

const decodeUtf8FromBase64 = (value = '') => {
  const binary = atob(String(value || '').replace(/\s+/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const MotionDiv = motion.div
const MotionSection = motion.section
const MotionAside = motion.aside
const MotionFooter = motion.footer
const SCROLL_TOP_TARGET_SELECTOR =
  '.playlist-rail, .track-column, .pool-browser-main, .pool-artist-list, .pool-tracks-scroll, .track-list, .artist-profile-track-list, .artist-profile-about, .album-info-content, .pool-admin-grid, .settings-content, .settings-menu'

function App() {
  const savedUi = loadUiPrefs()
  const inputRef = useRef(null)
  const coverInputRef = useRef(null)
  const poolAdminPasswordInputRef = useRef(null)
  const poolAdminGridRef = useRef(null)
  const initialPoolRefreshDoneRef = useRef(false)
  const lyricsFileInputRef = useRef(null)
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioSourceRef = useRef(null)
  const audioGainRef = useRef(null)
  const audioAnalyserRef = useRef(null)
  const monoRoutingNodesRef = useRef(null)
  const equalizerFiltersRef = useRef([])
  const assetUrlsRef = useRef([])
  const artistFactsCacheRef = useRef(loadArtistFactsCache())
  const coverArtCacheRef = useRef(loadJsonCache(COVER_ART_CACHE_KEY))
  const albumCacheRef = useRef(loadJsonCache(ALBUM_CACHE_KEY))
  const genreCacheRef = useRef(loadJsonCache(GENRE_CACHE_KEY))
  const coverToneCacheRef = useRef(loadJsonCache(COVER_TONE_CACHE_KEY))
  const lyricsCacheRef = useRef(loadJsonCache(LYRICS_CACHE_KEY))
  const restoreSeekRef = useRef(null)
  const restoreTrackIdRef = useRef(null)
  const spaceToggleLockUntilRef = useRef(0)
  const coverStageRef = useRef(null)
  const bottomDockRef = useRef(null)
  const dockHideTimerRef = useRef(null)
  const scrollTopTargetRef = useRef(null)
  const trackListViewportRef = useRef(null)
  const trackListSentinelRef = useRef(null)
  const previousCollectionIdRef = useRef(savedUi.selectedCollectionId || 'all')
  const playlistDockRef = useRef(null)
  const playlistDockDragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  })
  const suppressPlaylistDockClickRef = useRef(false)
  const lastUpdaterNoticeRef = useRef('')
  const [tracks, setTracks] = useState([])
  const [serverTracks, setServerTracks] = useState([])
  const [favoriteTrackIds, setFavoriteTrackIds] = useState(() => loadJson(FAVORITES_KEY, []))
  const favoriteTrackIdsRef = useRef(favoriteTrackIds)
  const [playlists, setPlaylists] = useState(() => loadJson(PLAYLISTS_KEY, []))
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    savedUi.selectedCollectionId || 'all',
  )
  const [language, setLanguage] = useState(
    UI_LANGUAGES.includes(savedUi.language) ? savedUi.language : 'tr',
  )
  const [sharedManifestUrl, setSharedManifestUrl] = useState(
    savedUi.sharedManifestUrl || DEFAULT_SHARED_MANIFEST_URL,
  )
  const [themeMode, setThemeMode] = useState(savedUi.themeMode || 'dark')
  const defaultBackgroundPalette = getDefaultBackgroundPalette(savedUi.themeMode || 'dark')
  const [backgroundStyle, setBackgroundStyle] = useState(
    savedUi.backgroundStyle === 'solid' ? 'solid' : 'gradient',
  )
  const [coverBasedBackgroundEnabled, setCoverBasedBackgroundEnabled] = useState(
    Boolean(savedUi.coverBasedBackgroundEnabled),
  )
  const [backgroundColor1, setBackgroundColor1] = useState(
    normalizeHexColor(savedUi.backgroundColor1, defaultBackgroundPalette.color1),
  )
  const [backgroundColor2, setBackgroundColor2] = useState(
    normalizeHexColor(savedUi.backgroundColor2, defaultBackgroundPalette.color2),
  )
  const [closeBehavior, setCloseBehavior] = useState(savedUi.closeBehavior || 'tray')
  const [hardwareAccelerationEnabled, setHardwareAccelerationEnabled] = useState(
    savedUi.hardwareAccelerationEnabled !== false,
  )
  const [fullscreenEffectsEnabled, setFullscreenEffectsEnabled] = useState(
    savedUi.fullscreenEffectsEnabled !== false,
  )
  const [reduceAnimationsEnabled, setReduceAnimationsEnabled] = useState(
    Boolean(savedUi.reduceAnimationsEnabled),
  )
  const [lowPowerModeEnabled, setLowPowerModeEnabled] = useState(
    Boolean(savedUi.lowPowerModeEnabled),
  )
  const [compactListEnabled, setCompactListEnabled] = useState(
    Boolean(savedUi.compactListEnabled),
  )
  const [showScrollbars, setShowScrollbars] = useState(Boolean(savedUi.showScrollbars))
  const [showScrollTopButton, setShowScrollTopButton] = useState(false)
  const [scrollTopButtonLeft, setScrollTopButtonLeft] = useState(null)
  const [spaceKeyPlaybackEnabled, setSpaceKeyPlaybackEnabled] = useState(
    savedUi.spaceKeyPlaybackEnabled !== false,
  )
  const [arrowSeekEnabled, setArrowSeekEnabled] = useState(savedUi.arrowSeekEnabled !== false)
  const [resetShortcutEnabled, setResetShortcutEnabled] = useState(
    savedUi.resetShortcutEnabled !== false,
  )
  const [mediaToggleShortcut, setMediaToggleShortcut] = useState(
    typeof savedUi.mediaToggleShortcut === 'string' ? savedUi.mediaToggleShortcut : '',
  )
  const [sidebarPlayerExpanded, setSidebarPlayerExpanded] = useState(
    savedUi.sidebarPlayerExpanded !== false,
  )
  const [windowCanUseSidebarPlayer, setWindowCanUseSidebarPlayer] = useState(false)
  const [windowIsMaximized, setWindowIsMaximized] = useState(false)
  const [shuffleEnabled, setShuffleEnabled] = useState(savedUi.shuffleEnabled || false)
  const [repeatEnabled, setRepeatEnabled] = useState(savedUi.repeatEnabled || false)
  const [currentTrackId, setCurrentTrackId] = useState(null)
  const [editTargetId, setEditTargetId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditDrafts, setBulkEditDrafts] = useState([])
  const [bulkEditSaving, setBulkEditSaving] = useState(false)
  const [bulkCoverMenuTrackId, setBulkCoverMenuTrackId] = useState(null)
  const [bulkCoverTargetTrackId, setBulkCoverTargetTrackId] = useState(null)
  const [pendingCover, setPendingCover] = useState(null)
  const [coverMenuOpen, setCoverMenuOpen] = useState(false)
  const [coverRemovalRequested, setCoverRemovalRequested] = useState(false)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [playlistNameDraft, setPlaylistNameDraft] = useState('')
  const [playlistDescriptionDraft, setPlaylistDescriptionDraft] = useState('')
  const [playlistColorDraft, setPlaylistColorDraft] = useState(playlistColors[0])
  const [playlistCoverDraft, setPlaylistCoverDraft] = useState('')
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [playlistEditDraft, setPlaylistEditDraft] = useState('')
  const [playlistEditDescriptionDraft, setPlaylistEditDescriptionDraft] = useState('')
  const [playlistEditColorDraft, setPlaylistEditColorDraft] = useState(playlistColors[0])
  const [playlistEditCoverDraft, setPlaylistEditCoverDraft] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [dockFavoritePulseId, setDockFavoritePulseId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(typeof savedUi.volume === 'number' ? savedUi.volume : 0.85)
  const [monoAudioEnabled, setMonoAudioEnabled] = useState(Boolean(savedUi.monoAudioEnabled))
  const [equalizerGains, setEqualizerGains] = useState(() => Array.isArray(savedUi.equalizerGains) ? savedUi.equalizerGains.slice(0, equalizerBands.length) : Array(equalizerBands.length).fill(0))
  const equalizerGainsRef = useRef(equalizerGains)
  const [audioOutputs, setAudioOutputs] = useState([])
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(savedUi.audioOutputId || 'default')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('audio')
  const [statsOpen, setStatsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [notificationsPanelPosition, setNotificationsPanelPosition] = useState({
    top: 80,
    left: 16,
    width: 420,
  })
  const [downloadsOpen, setDownloadsOpen] = useState(false)
  const [downloadJobs, setDownloadJobs] = useState([])
  const [downloadsPanelPosition, setDownloadsPanelPosition] = useState({
    top: 80,
    left: 16,
    width: 460,
  })
  const [fullscreenTrackOpen, setFullscreenTrackOpen] = useState(false)
  const [fullscreenQueueOpen, setFullscreenQueueOpen] = useState(false)
  const [fullscreenAudioLevel, setFullscreenAudioLevel] = useState(0)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [dockPointerInside, setDockPointerInside] = useState(false)
  const [dockProximityVisible, setDockProximityVisible] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState('artist')
  const [artistProfileOpen, setArtistProfileOpen] = useState(false)
  const [artistProfileName, setArtistProfileName] = useState('')
  const [artistProfileFacts, setArtistProfileFacts] = useState(null)
  const [artistProfileFactsLoading, setArtistProfileFactsLoading] = useState(false)
  const [albumInfoOpen, setAlbumInfoOpen] = useState(false)
  const [albumInfoLoading, setAlbumInfoLoading] = useState(false)
  const [albumInfo, setAlbumInfo] = useState(null)
  const [coverTransitionWashVisible, setCoverTransitionWashVisible] = useState(false)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [lyricsText, setLyricsText] = useState('')
  const [lyricsError, setLyricsError] = useState('')
  const [fullscreenControlsVisible, setFullscreenControlsVisible] = useState(false)
  const fullscreenControlsTimerRef = useRef(null)
  const notificationsButtonRef = useRef(null)
  const downloadsButtonRef = useRef(null)
  const [trackMenuId, setTrackMenuId] = useState(null)
  const [trackMenuPosition, setTrackMenuPosition] = useState(null)
  const [playlistContextMenuId, setPlaylistContextMenuId] = useState(null)
  const [playlistContextMenuPosition, setPlaylistContextMenuPosition] = useState(null)
  const [pendingDeleteTrackId, setPendingDeleteTrackId] = useState(null)
  const [pendingDeletePlaylistId, setPendingDeletePlaylistId] = useState(null)
  const [pendingResetCache, setPendingResetCache] = useState(false)
  const [draggedTrackId, setDraggedTrackId] = useState(null)
  const [dragOverTrackId, setDragOverTrackId] = useState(null)
  const [queueDraggedTrackId, setQueueDraggedTrackId] = useState(null)
  const [queueDragOverTrackId, setQueueDragOverTrackId] = useState(null)
  const [dockPlaylistMenuOpen, setDockPlaylistMenuOpen] = useState(false)
  const [artistFactsLoading, setArtistFactsLoading] = useState(false)
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState(null)
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState(null)
  const [queuedNextTrackIds, setQueuedNextTrackIds] = useState([])
  const queuedNextTrackIdsRef = useRef([])
  const [shuffleOrderIds, setShuffleOrderIds] = useState([])
  const shuffleOrderIdsRef = useRef([])
  const shuffleSeedRef = useRef(`${Date.now()}-${Math.random()}`)
  const [artistFacts, setArtistFacts] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [playlistAddOpen, setPlaylistAddOpen] = useState(false)
  const [trackListLayoutVersion, setTrackListLayoutVersion] = useState(0)
  const [renderedTrackCount, setRenderedTrackCount] = useState(TRACK_RENDER_BATCH_INITIAL)
  const [appBackgrounded, setAppBackgrounded] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  )
  const [playStats, setPlayStats] = useState(() =>
    loadJson(PLAY_STATS_KEY, {
      totalSeconds: 0,
      trackSeconds: {},
      trackPlayCount: {},
    }),
  )
  const playStatsRef = useRef(playStats)
  const poolAdminLoadRequestRef = useRef(0)
  const dragCounterRef = useRef(0)
  const addFilesToLibraryRef = useRef(null)
  const switchTrackRef = useRef(null)
  const trackSwitchCooldownUntilRef = useRef(0)
  const trackSwitchFadeUntilRef = useRef(0)
  const lastSavedUiPrefsRef = useRef('')
  const lastSavedPlaylistsRef = useRef('')
  const lastSavedFavoritesRef = useRef('')
  const lastPersistedTracksSignatureRef = useRef('')
  const progressAnimFrameRef = useRef(null)
  const playbackSequenceRef = useRef(null)
  const playbackSequenceDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  })
  const fullscreenAudioRafRef = useRef(null)
  const isPlayingRef = useRef(isPlaying)
  const serverMetaAttemptedAtRef = useRef({})
  const serverMetaInFlightRef = useRef(new Set())
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [exportingLibrary, setExportingLibrary] = useState(false)
  const [addMode, setAddMode] = useState('choose')
  const [linkDraft, setLinkDraft] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    coverUrl: '',
  })
  const [poolDraft, setPoolDraft] = useState({
    title: '',
    artist: '',
    audioFile: null,
    coverFile: null,
  })
  const [poolAdminOpen, setPoolAdminOpen] = useState(false)
  const [poolAdminUnlocked, setPoolAdminUnlocked] = useState(false)
  const [poolAdminPasswordInput, setPoolAdminPasswordInput] = useState('')
  const [poolAdminAuthError, setPoolAdminAuthError] = useState('')
  const [poolAdminTracks, setPoolAdminTracks] = useState([])
  const [poolAdminNotice, setPoolAdminNotice] = useState('')
  const [poolAdminLoading, setPoolAdminLoading] = useState(false)
  const [poolAdminSearchQuery, setPoolAdminSearchQuery] = useState('')
  const [poolGithubOwner, setPoolGithubOwner] = useState(savedUi.poolGithubOwner || '')
  const [poolGithubRepo, setPoolGithubRepo] = useState(savedUi.poolGithubRepo || '')
  const [poolGithubBranch, setPoolGithubBranch] = useState(savedUi.poolGithubBranch || 'main')
  const [poolGithubPath, setPoolGithubPath] = useState(savedUi.poolGithubPath || 'tracks.json')
  const [poolGithubToken, setPoolGithubToken] = useState(savedUi.poolGithubToken || '')
  const [poolGithubSaving, setPoolGithubSaving] = useState(false)
  const textSet = UI_TEXT[language] || UI_TEXT.tr
  const t = useCallback(
    (key, fallback = '') => {
      const value = textSet[key]
      return typeof value === 'string' ? value : fallback
    },
    [textSet],
  )
  const tf = useCallback(
    (key, vars = {}, fallback = '') => {
      const template = t(key, fallback)
      return Object.entries(vars).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        template,
      )
    },
    [t],
  )
  const [trackSearchQuery, setTrackSearchQuery] = useState('')
  const [hideDownloadedPoolTracks, setHideDownloadedPoolTracks] = useState(false)
  const [poolArtistFilter, setPoolArtistFilter] = useState('all')
  const [poolDownloadingTrackId, setPoolDownloadingTrackId] = useState(null)
  const [poolBulkDownloading, setPoolBulkDownloading] = useState(false)
  const [poolSelectedTrackIds, setPoolSelectedTrackIds] = useState([])
  const poolSelectionAnchorIdRef = useRef(null)
  const [poolRefreshing, setPoolRefreshing] = useState(false)
  const [playbackCollectionId, setPlaybackCollectionId] = useState('all')

  const getScrollableScrollTopTargets = useCallback(() => {
    if (typeof document === 'undefined') {
      return []
    }
    return Array.from(document.querySelectorAll(SCROLL_TOP_TARGET_SELECTOR)).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false
      }
      if (element.offsetParent === null) {
        return false
      }
      if (element.scrollHeight <= element.clientHeight + 24) {
        return false
      }
      return element.scrollTop > 120
    })
  }, [])

  const getScrollTopButtonLeftForTarget = useCallback((element) => {
    if (typeof window === 'undefined' || !(element instanceof HTMLElement)) {
      return null
    }
    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const targetCenter = rect.left + rect.width / 2
    const safeCenter = Math.min(Math.max(targetCenter, 96), Math.max(96, viewportWidth - 96))
    return `${Math.round(safeCenter)}px`
  }, [])

  const updateScrollTopButtonVisibility = useCallback((sourceTarget = null) => {
    const targets = getScrollableScrollTopTargets()
    if (!targets.length) {
      scrollTopTargetRef.current = null
      setShowScrollTopButton(false)
      setScrollTopButtonLeft(null)
      return
    }

    let nextTarget = null
    if (sourceTarget instanceof HTMLElement) {
      const closestTarget = sourceTarget.closest(SCROLL_TOP_TARGET_SELECTOR)
      if (closestTarget instanceof HTMLElement && targets.includes(closestTarget)) {
        nextTarget = closestTarget
      } else if (targets.includes(sourceTarget)) {
        nextTarget = sourceTarget
      }
    }

    if (!nextTarget && scrollTopTargetRef.current && targets.includes(scrollTopTargetRef.current)) {
      nextTarget = scrollTopTargetRef.current
    }

    if (!nextTarget) {
      nextTarget = targets.reduce(
        (highest, element) => (element.scrollTop > highest.scrollTop ? element : highest),
        targets[0],
      )
    }

    scrollTopTargetRef.current = nextTarget
    setScrollTopButtonLeft(getScrollTopButtonLeftForTarget(nextTarget))
    setShowScrollTopButton(true)
  }, [getScrollTopButtonLeftForTarget, getScrollableScrollTopTargets])

  const scrollAllListsToTop = useCallback(() => {
    const target = scrollTopTargetRef.current
    if (target instanceof HTMLElement && target.scrollTop > 0) {
      target.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        updateScrollTopButtonVisibility(target)
      }, 320)
      return
    }

    updateScrollTopButtonVisibility()
  }, [updateScrollTopButtonVisibility])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let rafId = null
    let pendingTarget = null
    const handleScroll = (event) => {
      pendingTarget =
        event && 'target' in event && event.target instanceof HTMLElement ? event.target : null
      if (rafId) {
        return
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        updateScrollTopButtonVisibility(pendingTarget)
        pendingTarget = null
      })
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [updateScrollTopButtonVisibility])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined
    }

    const updateBackgroundState = () => {
      const hidden = document.hidden || document.visibilityState === 'hidden'
      setAppBackgrounded(hidden)
    }

    updateBackgroundState()
    document.addEventListener('visibilitychange', updateBackgroundState)
    window.addEventListener('blur', updateBackgroundState)
    window.addEventListener('focus', updateBackgroundState)
    return () => {
      document.removeEventListener('visibilitychange', updateBackgroundState)
      window.removeEventListener('blur', updateBackgroundState)
      window.removeEventListener('focus', updateBackgroundState)
    }
  }, [])

  useEffect(() => {
    if (!coverMenuOpen || typeof window === 'undefined') {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('.editor-cover-wrap')) {
        return
      }
      setCoverMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [coverMenuOpen])

  useEffect(() => {
    if (!bulkCoverMenuTrackId || typeof window === 'undefined') {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('.bulk-edit-cover-wrap')) {
        return
      }
      setBulkCoverMenuTrackId(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [bulkCoverMenuTrackId])
  const persistStateRef = useRef({
    selectedCollectionId,
    currentTrackId,
    progress,
    volume,
    isPlaying,
    equalizerGains,
  })
  const playlistCoverInputRef = useRef(null)
  const playlistEditCoverInputRef = useRef(null)
  const bulkCoverInputRef = useRef(null)
  const dockFavoritePulseTimerRef = useRef(null)
  const canSelectAudioOutput =
    typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype

  const allTracks = useMemo(() => [...tracks, ...serverTracks], [tracks, serverTracks])
  const genreCollections = useMemo(() => {
    const genreBuckets = new Map()
    for (const track of tracks) {
      const genreName = normalizeGenreName(track.genre || '')
      if (!genreName) {
        continue
      }
      const normalizedKey = normalizeCoverMatchText(genreName)
      if (!normalizedKey) {
        continue
      }
      if (!genreBuckets.has(normalizedKey)) {
        genreBuckets.set(normalizedKey, {
          id: `genre:${encodeURIComponent(normalizedKey)}`,
          key: normalizedKey,
          name: genreName,
          description: `${genreName} türündeki şarkılar`,
          color: playlistColors[(hashSeed(normalizedKey) % playlistColors.length + playlistColors.length) % playlistColors.length],
          coverUrl: '',
          trackIds: [],
          isGeneratedGenre: true,
        })
      }

      const bucket = genreBuckets.get(normalizedKey)
      bucket.trackIds.push(track.id)
      if (!bucket.coverUrl) {
        bucket.coverUrl = getTrackDisplayUrl(track, 'thumb') || ''
      }
    }

    return Array.from(genreBuckets.values())
      .filter((item) => item.trackIds.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name, 'tr-TR'))
  }, [tracks])
  const currentTrack = allTracks.find((track) => track.id === currentTrackId) || null
  const editingTrack = allTracks.find((track) => track.id === editTargetId) || null
  const currentPlaylist = playlists.find((playlist) => playlist.id === selectedCollectionId) || null
  const currentGenreCollection =
    genreCollections.find((collection) => collection.id === selectedCollectionId) || null
  const activePlaylistCollection = currentPlaylist || currentGenreCollection || null
  const pendingDeleteTrack = tracks.find((track) => track.id === pendingDeleteTrackId) || null
  const pendingDeletePlaylist = playlists.find((playlist) => playlist.id === pendingDeletePlaylistId) || null
  const currentCoverUrl = getTrackCoverUrl(currentTrack)
  const currentCoverTone = currentTrack?.coverTone || currentTrack?.gradient || gradients[0]
  const currentCoverColors = getReadableCoverColors(currentCoverTone)
  const fullscreenBaseRgb = parseColorToRgb(currentCoverTone)
  const fullscreenBackgroundIsBright = fullscreenBaseRgb
    ? ((fullscreenBaseRgb.r * 299 + fullscreenBaseRgb.g * 587 + fullscreenBaseRgb.b * 114) / 1000) > 172
    : false
  const fullscreenUseDarkReadability =
    !fullscreenEffectsEnabled &&
    (fullscreenBackgroundIsBright || currentCoverColors.fg === '#111111' || currentCoverColors.fg === '#0f172a')
  const fullscreenCoverColors = fullscreenUseDarkReadability
    ? {
        fg: '#0f172a',
        fgSoft: 'rgba(15, 23, 42, 0.82)',
        fgMuted: 'rgba(15, 23, 42, 0.68)',
      }
    : {
        fg: '#ffffff',
        fgSoft: 'rgba(255, 255, 255, 0.78)',
        fgMuted: 'rgba(255, 255, 255, 0.64)',
      }
  const fullscreenControlBg = fullscreenUseDarkReadability
    ? 'rgba(15, 23, 42, 0.16)'
    : 'rgba(255, 255, 255, 0.16)'
  const fullscreenControlBorder = fullscreenUseDarkReadability
    ? 'rgba(15, 23, 42, 0.22)'
    : 'rgba(255, 255, 255, 0.18)'
  const currentThemeColor =
    selectedCollectionId === 'favorites'
      ? '#ef4444'
      : selectedCollectionId === 'server'
        ? '#06b6d4'
      : activePlaylistCollection?.color || '#60a5fa'
  const fullscreenGradient = useMemo(() => {
    const base = parseColorToRgb(currentCoverTone) || parseColorToRgb(currentThemeColor) || { r: 22, g: 24, b: 30 }
    const accent = parseColorToRgb(currentThemeColor) || { r: 85, g: 140, b: 255 }
    const mid = mixRgbColor(base, accent, 0.32)
    const glow = mixRgbColor(accent, { r: 255, g: 255, b: 255 }, 0.18)
    const deep = mixRgbColor(base, { r: 5, g: 8, b: 14 }, 0.62)
    return {
      background: `
        radial-gradient(120% 140% at 12% 10%, ${rgbToRgbaCss(glow, 0.34)} 0%, transparent 42%),
        radial-gradient(120% 120% at 88% 14%, ${rgbToRgbaCss(mid, 0.30)} 0%, transparent 48%),
        linear-gradient(160deg, ${rgbToRgbaCss(mid, 0.94)} 0%, ${rgbToRgbaCss(deep, 0.98)} 65%, rgba(7, 10, 15, 0.99) 100%)
      `,
      orbA: rgbToRgbaCss(glow, 0.42),
      orbB: rgbToRgbaCss(mid, 0.35),
      orbC: rgbToRgbaCss(base, 0.3),
    }
  }, [currentCoverTone, currentThemeColor])
  const coverBasedBackground = useMemo(() => {
    const base = parseColorToRgb(currentCoverTone)
    if (!base) {
      return null
    }
    const deep = mixRgbColor(base, { r: 6, g: 9, b: 14 }, 0.58)
    const glow = mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.14)
    return {
      color1: `rgb(${base.r}, ${base.g}, ${base.b})`,
      color2: `rgb(${deep.r}, ${deep.g}, ${deep.b})`,
      gradient: `radial-gradient(130% 130% at 12% 10%, ${rgbToRgbaCss(glow, 0.26)} 0%, transparent 42%), linear-gradient(145deg, rgb(${base.r}, ${base.g}, ${base.b}) 0%, rgb(${deep.r}, ${deep.g}, ${deep.b}) 100%)`,
    }
  }, [currentCoverTone])
  const effectiveBackgroundColor1 = coverBasedBackgroundEnabled && coverBasedBackground
    ? coverBasedBackground.color1
    : backgroundColor1
  const effectiveAppBackground = coverBasedBackgroundEnabled && coverBasedBackground
    ? coverBasedBackground.gradient
    : backgroundStyle === 'solid'
      ? backgroundColor1
      : `linear-gradient(145deg, ${backgroundColor1} 0%, ${backgroundColor2} 100%)`
  const brightGradientReadabilityVars = useMemo(() => {
    if (themeMode !== 'transparent') {
      return null
    }

    const first = parseColorToRgb(effectiveBackgroundColor1)
    if (!first) {
      return null
    }

    const brightness = (rgb) => (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    const firstBrightness = brightness(first)
    if (firstBrightness < 176) {
      return null
    }

    return {
      '--text-primary': '#0f172a',
      '--text-secondary': 'rgba(15, 23, 42, 0.68)',
      '--text-muted': 'rgba(15, 23, 42, 0.56)',
    }
  }, [effectiveBackgroundColor1, themeMode])
  const themeVars = {
    ...getUiThemeVars(themeMode),
    ...(brightGradientReadabilityVars || {}),
    '--app-bg': effectiveAppBackground,
    '--theme-accent': hexToRgba(currentThemeColor, 0.24),
    '--theme-accent-soft': hexToRgba(currentThemeColor, 0.08),
  }
  const runtimeLowPowerEnabled = lowPowerModeEnabled || reduceAnimationsEnabled || appBackgrounded
  const appShellClassName = `app-shell theme-${themeMode} ${brightGradientReadabilityVars ? 'bright-gradient' : ''} ${reduceAnimationsEnabled ? 'motion-reduced' : ''} ${runtimeLowPowerEnabled ? 'low-power' : ''} ${compactListEnabled ? 'compact-list' : ''} ${showScrollbars ? 'scrollbars-visible' : ''}`.trim()
  const sidebarPlayerActive = sidebarPlayerExpanded && windowCanUseSidebarPlayer
  const bottomDockVisible =
    dockPointerInside || dockProximityVisible || dockPlaylistMenuOpen || queueOpen || lyricsOpen
  const appShellLayoutClass = `${appShellClassName} ${sidebarPlayerActive ? 'sidebar-player-expanded' : 'sidebar-player-collapsed'}`
  const activeCollectionLabel =
    selectedCollectionId === 'favorites'
      ? t('favorites', 'Favoriler')
      : selectedCollectionId === 'pool'
        ? t('publicPool', 'Müzik Havuzu')
        : selectedCollectionId === 'server'
          ? t('serverTracks', 'Sunucudakiler')
          : activePlaylistCollection?.name || t('allTracks', 'Tüm parçalar')
  const activeCollectionDescription =
    selectedCollectionId === 'favorites'
      ? 'Beğendiğin şarkılar'
      : selectedCollectionId === 'pool'
        ? 'Havuzdaki parçalar'
        : selectedCollectionId === 'server'
          ? 'Sunucu kaynaklı parçalar'
        : selectedCollectionId === 'all'
          ? 'Tüm kütüphane'
            : String(activePlaylistCollection?.description || '').trim() || 'Playlist açıklaması yok'
  const activeCollectionCover =
    activePlaylistCollection?.coverUrl || (currentTrack ? getTrackDisplayUrl(currentTrack, 'thumb') : '')
  const activeCollectionColor = activePlaylistCollection?.color || currentThemeColor
  const isCustomPlaylistSelected = Boolean(currentPlaylist)
  const isPlaylistCollectionSelected = Boolean(activePlaylistCollection)
  const progressBucket = Math.floor(progress / 5)
  const currentTrackPresenceId = currentTrack?.id || null
  const currentTrackPresenceTitle = currentTrack?.title || ''
  const currentTrackPresenceArtist = currentTrack?.artist || ''
  const currentTrackDisplayTitle = sanitizeDisplayText(currentTrack?.title || '') || 'Bir parça seç'
  const artistProfileLibraryTracks = useMemo(
    () => sortTracksByOrder(tracks.filter((track) => doesArtistMatch(track.artist || '', artistProfileName))),
    [artistProfileName, tracks],
  )
  const artistProfilePoolTracks = useMemo(
    () => sortTracksByOrder(serverTracks.filter((track) => doesArtistMatch(track.artist || '', artistProfileName))),
    [artistProfileName, serverTracks],
  )
  const artistProfileTracks = useMemo(
    () => [...artistProfileLibraryTracks, ...artistProfilePoolTracks],
    [artistProfileLibraryTracks, artistProfilePoolTracks],
  )
  const artistProfileAlbums = useMemo(() => {
    const groups = new Map()
    for (const track of artistProfileTracks) {
      const albumName = String(track.album || '').trim() || 'Single'
      const key = albumName.toLocaleLowerCase('tr-TR')
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          album: albumName,
          coverTrack: track,
        })
      } else {
        const bucket = groups.get(key)
        if (!getTrackDisplayUrl(bucket.coverTrack, 'thumb') && getTrackDisplayUrl(track, 'thumb')) {
          bucket.coverTrack = track
        }
      }
    }

    return Array.from(groups.values()).sort((a, b) => a.album.localeCompare(b.album, 'tr-TR'))
  }, [artistProfileTracks])
  const artistProfilePhotoUrl =
    String(artistProfileFacts?.photoUrl || '').trim() ||
    getTrackDisplayUrl(artistProfileLibraryTracks[0], 'cover') ||
    getTrackDisplayUrl(artistProfilePoolTracks[0], 'cover') ||
    ''
  const artistProfileAboutLine = artistProfileFacts
    ? [
        artistProfileFacts.realName ? `Gerçek ad: ${artistProfileFacts.realName}` : '',
        artistProfileFacts.formedAt ? `Kuruluş: ${artistProfileFacts.formedAt}` : '',
        artistProfileFacts.birthDate ? `Doğum: ${artistProfileFacts.birthDate}` : '',
        artistProfileFacts.members?.length ? `Üyeler: ${artistProfileFacts.members.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' • ')
    : ''
  const fullscreenTitle = getFullscreenTitlePresentation(currentTrack?.title || '', 28)
  const artistFactLine = artistFacts
    ? [
        artistFacts.realName ? `Gerçek ad: ${artistFacts.realName}` : '',
        artistFacts.formedAt ? `Kuruluş: ${artistFacts.formedAt}` : '',
        artistFacts.birthDate ? `Doğum: ${artistFacts.birthDate}` : '',
        artistFacts.members?.length ? `Üyeler: ${artistFacts.members.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' • ')
    : ''
  const applyQueuedNextTracks = (nextQueue) => {
    queuedNextTrackIdsRef.current = nextQueue
    setQueuedNextTrackIds(nextQueue)
  }

  const applyShuffleOrderIds = (nextOrder) => {
    shuffleOrderIdsRef.current = nextOrder
    setShuffleOrderIds(nextOrder)
  }

  function sanitizeQueue(queueList) {
    const seen = new Set()
    return queueList.filter((trackId) => {
      if (trackId === currentTrackId || seen.has(trackId)) {
        return false
      }

      const exists = allTracks.some((track) => track.id === trackId)
      if (!exists) {
        return false
      }

      seen.add(trackId)
      return true
    })
  }

  const peekQueuedNextTrack = () => {
    const sanitized = sanitizeQueue(queuedNextTrackIdsRef.current)
    if (sanitized.length !== queuedNextTrackIdsRef.current.length) {
      applyQueuedNextTracks(sanitized)
    }

    if (!sanitized.length) {
      return null
    }

    return allTracks.find((track) => track.id === sanitized[0]) || null
  }

  const consumeQueuedNextTrack = () => {
    const sanitized = sanitizeQueue(queuedNextTrackIdsRef.current)
    if (!sanitized.length) {
      if (queuedNextTrackIdsRef.current.length) {
        applyQueuedNextTracks([])
      }
      return null
    }

    const [nextId, ...rest] = sanitized
    applyQueuedNextTracks(rest)
    return allTracks.find((track) => track.id === nextId) || null
  }

  const applyAudioChannelMode = useCallback((useMono) => {
    const context = audioContextRef.current
    const outputGain = audioGainRef.current
    const analyser = audioAnalyserRef.current
    const routeStart = analyser || outputGain
    if (!context || !outputGain || !routeStart) {
      return
    }

    const previous = monoRoutingNodesRef.current
    if (previous) {
      Object.values(previous).forEach((node) => {
        try {
          node?.disconnect?.()
        } catch {
          // ignore disconnection errors
        }
      })
      monoRoutingNodesRef.current = null
    }

    try {
      routeStart.disconnect()
    } catch {
      // ignore disconnect errors
    }

    if (!useMono) {
      routeStart.connect(context.destination)
      return
    }

    const splitter = context.createChannelSplitter(2)
    const sumLeft = context.createGain()
    const sumRight = context.createGain()
    sumLeft.gain.value = 0.5
    sumRight.gain.value = 0.5

    const monoMerger = context.createChannelMerger(1)
    const monoSplitter = context.createChannelSplitter(1)
    const stereoMerger = context.createChannelMerger(2)

    routeStart.connect(splitter)
    splitter.connect(sumLeft, 0)
    splitter.connect(sumRight, 1)
    sumLeft.connect(monoMerger, 0, 0)
    sumRight.connect(monoMerger, 0, 0)
    monoMerger.connect(monoSplitter, 0, 0)
    monoSplitter.connect(stereoMerger, 0, 0)
    monoSplitter.connect(stereoMerger, 0, 1)
    stereoMerger.connect(context.destination)

    monoRoutingNodesRef.current = {
      splitter,
      sumLeft,
      sumRight,
      monoMerger,
      monoSplitter,
      stereoMerger,
    }
  }, [])

  const topTrackStats = useMemo(() => {
    const entries = Object.entries(playStats?.trackSeconds || {})
      .filter(([, seconds]) => Number.isFinite(seconds) && seconds > 0)
      .sort((left, right) => right[1] - left[1])

    const topEntry = entries[0] || null
    const topTrack = topEntry ? allTracks.find((track) => track.id === topEntry[0]) || null : null
    const artistTotals = new Map()
    const albumTotals = new Map()
    const albumTopTrackBySeconds = new Map()

    entries.forEach(([trackId, seconds]) => {
      const track = allTracks.find((item) => item.id === trackId)
      if (!track) {
        return
      }

      const artistNames = extractArtistCandidates(track.artist || '')
      const normalizedArtists = artistNames.length
        ? artistNames
        : [track.artist?.trim() || 'Bilinmeyen sanatçı']
      const albumName = track.album?.trim() || 'Single'

      normalizedArtists.forEach((artistName) => {
        artistTotals.set(artistName, Number(artistTotals.get(artistName) || 0) + Number(seconds || 0))
      })
      albumTotals.set(albumName, Number(albumTotals.get(albumName) || 0) + Number(seconds || 0))

      const currentTop = albumTopTrackBySeconds.get(albumName)
      if (!currentTop || Number(seconds || 0) > currentTop.seconds) {
        albumTopTrackBySeconds.set(albumName, {
          trackId,
          seconds: Number(seconds || 0),
        })
      }
    })

    const topArtistEntry = Array.from(artistTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null
    const topAlbumEntry = Array.from(albumTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null
    const topAlbumTrackMeta = topAlbumEntry
      ? albumTopTrackBySeconds.get(topAlbumEntry[0]) || null
      : null
    const topAlbumTrack = topAlbumTrackMeta
      ? allTracks.find((track) => track.id === topAlbumTrackMeta.trackId) || null
      : null

    const topList = entries.slice(0, 6).map(([trackId, seconds]) => {
      const track = allTracks.find((item) => item.id === trackId)
      return {
        trackId,
        seconds,
        title: track?.title || 'Bilinmeyen parça',
        artist: track?.artist || 'Bilinmeyen sanatçı',
      }
    })

    return {
      topTrack,
      topSeconds: topEntry?.[1] || 0,
      topArtist: topArtistEntry
        ? { name: topArtistEntry[0], seconds: topArtistEntry[1] }
        : null,
      topAlbum: topAlbumEntry
        ? { name: topAlbumEntry[0], seconds: topAlbumEntry[1], track: topAlbumTrack }
        : null,
      topList,
    }
  }, [allTracks, playStats])

  const getNextTrack = (options = {}) => {
    const { consumeQueue = false, ignoreShuffle = false } = options

    if (repeatEnabled && currentTrack) {
      return currentTrack
    }

    const queuedTrack = consumeQueue ? consumeQueuedNextTrack() : peekQueuedNextTrack()
    if (queuedTrack) {
      return queuedTrack
    }

    if (!playbackTracks.length) {
      return null
    }

    if (shuffleEnabled && !ignoreShuffle) {
      const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
      const orderedIds = shuffleOrderIdsRef.current.filter((id) => visibleById.has(id))
      const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
      const source = orderedTracks.length ? orderedTracks : playbackTracks
      const activeIndex = source.findIndex((track) => track.id === currentTrackId)
      const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % source.length : 0
      return source[nextIndex] || null
    }

    const activeIndex = playbackTracks.findIndex((track) => track.id === currentTrackId)
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % playbackTracks.length : 0
    return playbackTracks[nextIndex] || null
  }

  const getTracksByCollectionId = useCallback(
    (collectionId) => {
      if (collectionId === 'favorites') {
        return sortTracksByOrder(allTracks.filter((track) => track.isFavorite))
      }

      if (collectionId === 'pool' || collectionId === 'server') {
        return sortTracksByOrder(serverTracks)
      }

      if (collectionId && collectionId !== 'all') {
        const playlist = playlists.find((item) => item.id === collectionId)
        if (playlist) {
          return sortTracksByOrder(allTracks.filter((track) => playlist.trackIds.includes(track.id)))
        }

        const genreCollection = genreCollections.find((item) => item.id === collectionId)
        if (genreCollection) {
          return sortTracksByOrder(tracks.filter((track) => genreCollection.trackIds.includes(track.id)))
        }
      }

      return sortTracksByOrder(tracks)
    },
    [allTracks, genreCollections, playlists, serverTracks, tracks],
  )

  const visibleTracks = useMemo(() => {
    return getTracksByCollectionId(selectedCollectionId)
  }, [getTracksByCollectionId, selectedCollectionId])

  const selectedCollectionDuration = useMemo(
    () => visibleTracks.reduce((sum, track) => sum + (track.duration || 0), 0),
    [visibleTracks],
  )

  const playbackCollectionScopeId =
    playbackCollectionId === 'pool' || playbackCollectionId === 'server'
      ? 'all'
      : playbackCollectionId ||
        (selectedCollectionId === 'pool' || selectedCollectionId === 'server'
          ? 'all'
          : selectedCollectionId)

  const playbackTracks = useMemo(
    () => getTracksByCollectionId(playbackCollectionScopeId),
    [getTracksByCollectionId, playbackCollectionScopeId],
  )

  const displayedTracks = useMemo(() => {
    const poolFiltered =
      selectedCollectionId === 'pool' && poolArtistFilter !== 'all'
        ? visibleTracks.filter(
            (track) => doesArtistMatch(track.artist || '', poolArtistFilter),
          )
        : visibleTracks

    const normalizedQuery = trackSearchQuery.trim().toLocaleLowerCase('tr-TR')
    const searched = normalizedQuery
      ? poolFiltered.filter((track) => {
          const title = String(track.title || '').toLocaleLowerCase('tr-TR')
          const artist = String(track.artist || '').toLocaleLowerCase('tr-TR')
          const album = String(track.album || '').toLocaleLowerCase('tr-TR')
          return (
            title.includes(normalizedQuery) ||
            artist.includes(normalizedQuery) ||
            album.includes(normalizedQuery)
          )
        })
      : poolFiltered

    if (selectedCollectionId !== 'pool' || !hideDownloadedPoolTracks) {
      return searched
    }

    const localLibraryKeys = new Set()
    const localLibraryPoolSourceUrls = new Set()
    tracks.forEach((item) => {
      const titleKey = normalizeCoverMatchText(item?.title || '')
      const artistKey = normalizeCoverMatchText(item?.artist || '')
      if (titleKey && artistKey) {
        localLibraryKeys.add(`${artistKey}|||${titleKey}`)
      }
      const poolSourceUrl = normalizeDriveUrl(String(item?.poolSourceAudioUrl || '').trim())
      if (poolSourceUrl) {
        localLibraryPoolSourceUrls.add(poolSourceUrl)
      }
    })

    return searched.filter((track) => {
      const poolSourceCandidate = normalizeDriveUrl(String(track?.audioUrl || track?.downloadUrl || '').trim())
      if (poolSourceCandidate && localLibraryPoolSourceUrls.has(poolSourceCandidate)) {
        return false
      }
      const titleKey = normalizeCoverMatchText(track?.title || '')
      const artistKey = normalizeCoverMatchText(track?.artist || '')
      if (!titleKey || !artistKey) {
        return true
      }
      return !localLibraryKeys.has(`${artistKey}|||${titleKey}`)
    })
  }, [
    hideDownloadedPoolTracks,
    poolArtistFilter,
    selectedCollectionId,
    trackSearchQuery,
    tracks,
    visibleTracks,
  ])

  const renderedTracks = useMemo(() => displayedTracks, [displayedTracks])
  const hasMoreRenderedTracks = false

  const getLocalLibraryMatchKey = useCallback((track) => {
    const titleKey = normalizeCoverMatchText(track?.title || '')
    const artistKey = normalizeCoverMatchText(track?.artist || '')
    if (!titleKey || !artistKey) {
      return ''
    }
    return `${artistKey}|||${titleKey}`
  }, [])

  const localLibraryTrackByKey = useMemo(() => {
    const map = new Map()
    for (const track of tracks) {
      const key = getLocalLibraryMatchKey(track)
      if (!key || map.has(key)) {
        continue
      }
      map.set(key, track)
    }
    return map
  }, [getLocalLibraryMatchKey, tracks])

  const localLibraryTrackKeySet = useMemo(() => {
    const keys = new Set()
    for (const track of tracks) {
      const key = getLocalLibraryMatchKey(track)
      if (!key) {
        continue
      }
      keys.add(key)
    }
    return keys
  }, [getLocalLibraryMatchKey, tracks])

  const localLibraryPoolSourceUrlSet = useMemo(() => {
    const urls = new Set()
    for (const track of tracks) {
      const poolSourceUrl = normalizeDriveUrl(String(track?.poolSourceAudioUrl || '').trim())
      if (poolSourceUrl) {
        urls.add(poolSourceUrl)
      }
    }
    return urls
  }, [tracks])

  const isTrackInLocalLibrary = useCallback(
    (track) => {
      const poolSourceCandidate = normalizeDriveUrl(String(track?.audioUrl || track?.downloadUrl || '').trim())
      if (poolSourceCandidate && localLibraryPoolSourceUrlSet.has(poolSourceCandidate)) {
        return true
      }

      const key = getLocalLibraryMatchKey(track)
      if (!key) {
        return false
      }
      return localLibraryTrackKeySet.has(key)
    },
    [getLocalLibraryMatchKey, localLibraryPoolSourceUrlSet, localLibraryTrackKeySet],
  )

  const poolSelectedTrackIdSet = useMemo(
    () => new Set(poolSelectedTrackIds),
    [poolSelectedTrackIds],
  )

  useEffect(() => {
    setRenderedTrackCount(TRACK_RENDER_BATCH_INITIAL)
  }, [selectedCollectionId, trackSearchQuery, poolArtistFilter, hideDownloadedPoolTracks])

  useEffect(() => {
    if (renderedTrackCount >= displayedTracks.length) {
      return
    }
    const activeIndex = displayedTracks.findIndex((track) => track.id === currentTrackId)
    if (activeIndex >= renderedTrackCount - 1) {
      setRenderedTrackCount((prev) =>
        Math.min(displayedTracks.length, Math.max(prev + TRACK_RENDER_BATCH_STEP, activeIndex + TRACK_RENDER_BATCH_STEP)),
      )
    }
  }, [currentTrackId, displayedTracks, renderedTrackCount])

  useEffect(() => {
    const sentinel = trackListSentinelRef.current
    if (!sentinel || !hasMoreRenderedTracks || typeof window === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }
          setRenderedTrackCount((prev) => Math.min(displayedTracks.length, prev + TRACK_RENDER_BATCH_STEP))
        })
      },
      {
        root: trackListViewportRef.current || null,
        rootMargin: '900px 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayedTracks.length, hasMoreRenderedTracks, trackListLayoutVersion])

  useEffect(() => {
    if (selectedCollectionId !== 'pool') {
      if (poolSelectedTrackIds.length) {
        setPoolSelectedTrackIds([])
      }
      poolSelectionAnchorIdRef.current = null
      return
    }

    const visibleIdSet = new Set(displayedTracks.map((track) => track.id))
    setPoolSelectedTrackIds((prev) => {
      const filtered = prev.filter((id) => visibleIdSet.has(id))
      return filtered.length === prev.length ? prev : filtered
    })

    if (poolSelectionAnchorIdRef.current && !visibleIdSet.has(poolSelectionAnchorIdRef.current)) {
      poolSelectionAnchorIdRef.current = null
    }
  }, [displayedTracks, poolSelectedTrackIds.length, selectedCollectionId])

  const selectablePoolTracks = useMemo(
    () =>
      selectedCollectionId === 'pool'
        ? displayedTracks.filter((track) => {
            if (!poolSelectedTrackIdSet.has(track.id)) {
              return false
            }
            if (!track.audioUrl) {
              return false
            }
            return !isTrackInLocalLibrary(track)
          })
        : [],
    [displayedTracks, isTrackInLocalLibrary, poolSelectedTrackIdSet, selectedCollectionId],
  )

  const activeDownloadCount = useMemo(
    () =>
      downloadJobs.filter((item) => item.status === 'starting' || item.status === 'downloading')
        .length,
    [downloadJobs],
  )

  const poolArtists = useMemo(() => {
    const counts = new Map()
    for (const track of serverTracks) {
      const artistNames = extractArtistCandidates(track.artist || '')
      const normalizedArtists = artistNames.length
        ? artistNames
        : [String(track.artist || '').trim() || 'Bilinmeyen sanatçı']

      normalizedArtists.forEach((artist) => {
        const previous = counts.get(artist) || { count: 0, addedCount: 0 }
        counts.set(artist, {
          count: previous.count + 1,
          addedCount: previous.addedCount + (isTrackInLocalLibrary(track) ? 1 : 0),
        })
      })
    }
    return Array.from(counts.entries())
      .map(([name, stats]) => ({ name, count: stats.count, addedCount: stats.addedCount }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
  }, [isTrackInLocalLibrary, serverTracks])

  useEffect(() => {
    if (selectedCollectionId !== 'pool') {
      setPoolArtistFilter('all')
    }
  }, [selectedCollectionId])

  useEffect(() => {
    const previousCollectionId = previousCollectionIdRef.current
    previousCollectionIdRef.current = selectedCollectionId
    if (selectedCollectionId !== 'pool' || previousCollectionId === 'pool') {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const normalizePoolScroll = () => {
      const listViewport = trackListViewportRef.current
      const poolMain = listViewport?.closest('.pool-browser-main')
      const trackColumn = listViewport?.closest('.track-column')

      if (poolMain instanceof HTMLElement) {
        poolMain.scrollTop = 0
      }
      if (trackColumn instanceof HTMLElement) {
        trackColumn.scrollTop = 0
      }
      if (listViewport instanceof HTMLElement) {
        const maxScroll = Math.max(0, listViewport.scrollHeight - listViewport.clientHeight)
        listViewport.scrollTop = Math.min(listViewport.scrollTop, maxScroll)
        if (maxScroll < 12) {
          listViewport.scrollTop = 0
        }
      }
    }

    const raf1 = window.requestAnimationFrame(() => {
      normalizePoolScroll()
      window.requestAnimationFrame(normalizePoolScroll)
    })

    return () => {
      window.cancelAnimationFrame(raf1)
    }
  }, [selectedCollectionId])

  const upcomingPlaybackTracks = useMemo(() => {
    if (repeatEnabled && currentTrack) {
      return Array.from({ length: 30 }, () => currentTrack)
    }

    const queued = sanitizeQueue(queuedNextTrackIds)
      .map((id) => allTracks.find((track) => track.id === id))
      .filter(Boolean)
    const queuedSet = new Set(queued.map((track) => track.id))

    const orderedVisible = (() => {
      if (!playbackTracks.length) {
        return []
      }

      if (shuffleEnabled) {
        const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
        const orderedIds = shuffleOrderIds.filter((id) => visibleById.has(id))
        const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
        const missingTracks = playbackTracks.filter((track) => !orderedIds.includes(track.id))
        const merged = [...orderedTracks, ...missingTracks]
        if (!currentTrackId) {
          return merged
        }
        const activeIndex = merged.findIndex((track) => track.id === currentTrackId)
        if (activeIndex < 0) {
          return merged
        }
        return [...merged.slice(activeIndex + 1), ...merged.slice(0, activeIndex + 1)]
      }

      const activeIndex = playbackTracks.findIndex((track) => track.id === currentTrackId)
      if (activeIndex < 0) {
        return playbackTracks.slice()
      }

      return [...playbackTracks.slice(activeIndex + 1), ...playbackTracks.slice(0, activeIndex + 1)]
    })()

    let fallback = orderedVisible.filter(
      (track) => track.id !== currentTrackId && !queuedSet.has(track.id),
    )

    return [...queued, ...fallback].slice(0, 30)
  }, [
    allTracks,
    currentTrack,
    currentTrackId,
    queuedNextTrackIds,
    repeatEnabled,
    playbackCollectionId,
    shuffleOrderIds,
    shuffleEnabled,
    playbackTracks,
  ])

  const previousPlaybackTracks = useMemo(() => {
    if (!currentTrack) {
      return []
    }

    if (repeatEnabled) {
      return Array.from({ length: 4 }, () => currentTrack)
    }

    if (!playbackTracks.length) {
      return []
    }

    const orderedVisible = (() => {
      if (!shuffleEnabled) {
        return playbackTracks.slice()
      }

      const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
      const orderedIds = shuffleOrderIds.filter((id) => visibleById.has(id))
      const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
      const missingTracks = playbackTracks.filter((track) => !orderedIds.includes(track.id))
      return [...orderedTracks, ...missingTracks]
    })()

    const activeIndex = orderedVisible.findIndex((track) => track.id === currentTrackId)
    if (activeIndex < 0) {
      return []
    }

    const history = []
    for (let offset = 1; offset <= Math.min(4, orderedVisible.length - 1); offset += 1) {
      const index = (activeIndex - offset + orderedVisible.length) % orderedVisible.length
      const track = orderedVisible[index]
      if (track?.id && track.id !== currentTrackId) {
        history.push(track)
      }
    }
    return history
  }, [currentTrack, currentTrackId, repeatEnabled, shuffleEnabled, shuffleOrderIds, playbackTracks])

  const playbackPreviewTracks = useMemo(() => {
    const prev = previousPlaybackTracks.slice(0, 3).reverse()
    const next = upcomingPlaybackTracks.slice(0, 3)
    return [...prev, ...(currentTrack ? [currentTrack] : []), ...next]
  }, [currentTrack, previousPlaybackTracks, upcomingPlaybackTracks])

  const centerPlaybackSequence = useCallback((behavior = 'smooth') => {
    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    const activeItem = container.querySelector('.playback-sequence-item.active')
    if (!(activeItem instanceof HTMLElement)) {
      return
    }

    const targetScrollLeft =
      activeItem.offsetLeft - container.clientWidth / 2 + activeItem.clientWidth / 2

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior,
    })
  }, [])

  useEffect(() => {
    centerPlaybackSequence('smooth')
  }, [centerPlaybackSequence, currentTrackId, playbackPreviewTracks])

  useEffect(() => {
    const handleResize = () => centerPlaybackSequence('auto')
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [centerPlaybackSequence])

  const handlePlaybackSequencePointerDown = (event) => {
    if (event.button !== 0) {
      return
    }

    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    playbackSequenceDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      moved: false,
    }
  }

  const handlePlaybackSequencePointerMove = (event) => {
    const dragState = playbackSequenceDragRef.current
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    if (!dragState.moved && Math.abs(deltaX) > 4) {
      dragState.moved = true
    }

    container.scrollLeft = dragState.startScrollLeft - deltaX
  }

  const handlePlaybackSequencePointerEnd = (event) => {
    const dragState = playbackSequenceDragRef.current
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    dragState.active = false
    dragState.pointerId = null

    window.setTimeout(() => {
      dragState.moved = false
    }, 0)
  }

  const updateTrack = (trackId, updates) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)),
    )
    setServerTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)),
    )
  }

  const applyBulkTrackUpdates = (updatesList) => {
    if (!Array.isArray(updatesList) || !updatesList.length) {
      return
    }
    const updatesMap = new Map(updatesList.map((item) => [item.id, item.updates]))
    setTracks((prev) =>
      prev.map((track) => (updatesMap.has(track.id) ? { ...track, ...updatesMap.get(track.id) } : track)),
    )
    setServerTracks((prev) =>
      prev.map((track) => (updatesMap.has(track.id) ? { ...track, ...updatesMap.get(track.id) } : track)),
    )
  }

  const openEditor = (track) => {
    setEditTargetId(track.id)
    setEditDraft({ title: track.title, artist: track.artist, album: track.album || 'Single' })
    setPendingCover(null)
    setCoverMenuOpen(false)
    setCoverRemovalRequested(false)
  }

  const openBulkEditor = () => {
    const drafts = sortTracksByOrder(tracks).map((track) => ({
      id: track.id,
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || 'Single',
      coverPreviewUrl: track.coverUrl || track.coverRemoteUrl || '',
      coverBlob: null,
      coverName: '',
      removeCover: false,
    }))
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setBulkCoverMenuTrackId(null)
    setBulkCoverTargetTrackId(null)
    setBulkEditDrafts(drafts)
    setBulkEditOpen(true)
  }

  const closeBulkEditor = () => {
    if (bulkEditSaving) {
      return
    }
    setBulkEditOpen(false)
    setBulkEditDrafts([])
    setBulkCoverMenuTrackId(null)
    setBulkCoverTargetTrackId(null)
  }

  const handleBulkEditChange = (trackId, field, value) => {
    setBulkEditDrafts((prev) =>
      prev.map((item) => (item.id === trackId ? { ...item, [field]: value } : item)),
    )
  }

  const openBulkCoverPicker = (trackId) => {
    if (!trackId) {
      return
    }
    setBulkCoverTargetTrackId(trackId)
    setBulkCoverMenuTrackId(null)
    bulkCoverInputRef.current?.click()
  }

  const removeBulkCover = (trackId) => {
    setBulkEditDrafts((prev) =>
      prev.map((item) =>
        item.id === trackId
          ? {
              ...item,
              coverBlob: null,
              coverName: '',
              coverPreviewUrl: '',
              removeCover: true,
            }
          : item,
      ),
    )
    setBulkCoverMenuTrackId(null)
  }

  const handleBulkCoverSelect = (event) => {
    const file = event.target.files?.[0]
    const targetTrackId = bulkCoverTargetTrackId
    if (!file || !targetTrackId) {
      event.target.value = ''
      return
    }

    const coverUrl = URL.createObjectURL(file)
    assetUrlsRef.current.push(coverUrl)
    setBulkEditDrafts((prev) =>
      prev.map((item) =>
        item.id === targetTrackId
          ? {
              ...item,
              coverBlob: file,
              coverName: file.name,
              coverPreviewUrl: coverUrl,
              removeCover: false,
            }
          : item,
      ),
    )
    setBulkCoverTargetTrackId(null)
    event.target.value = ''
  }

  const closeEditor = () => {
    setEditTargetId(null)
    setEditDraft(null)
    setPendingCover(null)
    setCoverMenuOpen(false)
    setCoverRemovalRequested(false)
  }

  const openPlaylistCreator = () => {
    setPlaylistNameDraft('')
    setPlaylistDescriptionDraft('')
    setPlaylistColorDraft(playlistColors[playlists.length % playlistColors.length])
    setPlaylistCoverDraft('')
    setCreatingPlaylist(true)
  }

  const closePlaylistCreator = () => {
    setCreatingPlaylist(false)
    setPlaylistNameDraft('')
    setPlaylistDescriptionDraft('')
    setPlaylistCoverDraft('')
  }

  const openPlaylistAddModal = () => {
    if (!currentPlaylist) {
      return
    }
    setPlaylistAddOpen(true)
  }

  const closePlaylistAddModal = () => {
    setPlaylistAddOpen(false)
  }

  const openPlaylistEditor = (playlist) => {
    setEditingPlaylistId(playlist.id)
    setPlaylistEditDraft(playlist.name)
    setPlaylistEditDescriptionDraft(String(playlist.description || ''))
    setPlaylistEditColorDraft(playlist.color || playlistColors[0])
    setPlaylistEditCoverDraft(playlist.coverUrl || '')
  }

  const closePlaylistEditor = () => {
    setEditingPlaylistId(null)
    setPlaylistEditDraft('')
    setPlaylistEditDescriptionDraft('')
    setPlaylistEditCoverDraft('')
  }

  const closeMenus = () => {
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    setDockPlaylistMenuOpen(false)
    setPlaylistMenuTrackId(null)
    setPlaylistMenuPosition(null)
    setSettingsOpen(false)
    setStatsOpen(false)
    setNotificationsOpen(false)
    setDownloadsOpen(false)
    setLyricsOpen(false)
    setQueueOpen(false)
    setPlaylistAddOpen(false)
  }

  const openPlaylistContextMenu = (playlistId, pointer) => {
    const horizontalPadding = 12
    const verticalPadding = 12
    const menuEstimatedHeight = 196
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const menuWidth = 220
    const left = Math.min(
      Math.max(pointer.x, horizontalPadding),
      Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
    )
    const top = Math.min(
      Math.max(pointer.y, verticalPadding),
      Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
    )

    setPlaylistContextMenuId(playlistId)
    setPlaylistContextMenuPosition({
      position: 'fixed',
      top,
      left,
      width: menuWidth,
    })
  }

  const handleCollectionSelect = useCallback((collectionId) => {
    const fallbackWindow = typeof window !== 'undefined' ? window : null
    const previousTop = fallbackWindow?.scrollY ?? 0
    const previousLeft = fallbackWindow?.scrollX ?? 0
    const activeElement = typeof document !== 'undefined' ? document.activeElement : null
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    setSelectedCollectionId(collectionId)
    setTrackSearchQuery('')

    if (!fallbackWindow) {
      return
    }

    const restore = () => {
      fallbackWindow.scrollTo({
        top: previousTop,
        left: previousLeft,
        behavior: 'auto',
      })
    }

    fallbackWindow.requestAnimationFrame(() => {
      restore()
      fallbackWindow.requestAnimationFrame(restore)
    })
  }, [])

  const reorderTracksByDrag = (draggedId, droppedOnId) => {
    if (!draggedId || !droppedOnId || draggedId === droppedOnId) {
      return
    }

    const reorderableVisibleIds = visibleTracks
      .filter((track) => track.source !== 'drive' && track.source !== 'shared')
      .map((track) => track.id)
    if (!reorderableVisibleIds.includes(draggedId) || !reorderableVisibleIds.includes(droppedOnId)) {
      return
    }

    const nextVisibleOrder = [...reorderableVisibleIds]
    const fromIndex = nextVisibleOrder.indexOf(draggedId)
    const toIndex = nextVisibleOrder.indexOf(droppedOnId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const [moved] = nextVisibleOrder.splice(fromIndex, 1)
    nextVisibleOrder.splice(toIndex, 0, moved)

    setTracks((prev) => {
      const localTracks = prev.filter((track) => track.source !== 'drive' && track.source !== 'shared')
      if (!localTracks.length) {
        return prev
      }

      const localSorted = sortTracksByOrder(localTracks)
      const movedSet = new Set(nextVisibleOrder)
      const mergedLocalIds = []
      let inserted = false

      for (const track of localSorted) {
        if (!movedSet.has(track.id)) {
          mergedLocalIds.push(track.id)
          continue
        }

        if (!inserted) {
          mergedLocalIds.push(...nextVisibleOrder)
          inserted = true
        }
      }

      if (!inserted) {
        mergedLocalIds.push(...nextVisibleOrder)
      }

      const nextOrderById = new Map(mergedLocalIds.map((id, index) => [id, index]))
      return prev.map((track) =>
        track.source === 'drive'
          ? track
          : {
              ...track,
              order: nextOrderById.get(track.id) ?? getTrackSortValue(track),
            },
      )
    })
  }

  const setAppFullscreen = useCallback((nextState) => {
    if (typeof window !== 'undefined' && window.novaPlayer?.setWindowFullscreen) {
      window.novaPlayer.setWindowFullscreen(nextState)
    }
  }, [])

  const revealFullscreenControls = useCallback(() => {
    setFullscreenControlsVisible(true)

    if (fullscreenControlsTimerRef.current) {
      window.clearTimeout(fullscreenControlsTimerRef.current)
    }

    fullscreenControlsTimerRef.current = window.setTimeout(() => {
      setFullscreenControlsVisible(false)
      fullscreenControlsTimerRef.current = null
    }, 2200)
  }, [])

  const hideFullscreenControls = useCallback(() => {
    if (fullscreenControlsTimerRef.current) {
      window.clearTimeout(fullscreenControlsTimerRef.current)
      fullscreenControlsTimerRef.current = null
    }

    setFullscreenControlsVisible(false)
  }, [])

  const openFullscreenTrack = useCallback(() => {
    if (currentTrack) {
      setFullscreenTrackOpen(true)
      setFullscreenQueueOpen(false)
      setAppFullscreen(true)
      revealFullscreenControls()
    }
  }, [currentTrack, revealFullscreenControls, setAppFullscreen])

  const closeFullscreenTrack = useCallback(() => {
    setFullscreenTrackOpen(false)
    setFullscreenQueueOpen(false)
    setAppFullscreen(false)
    hideFullscreenControls()
  }, [hideFullscreenControls, setAppFullscreen])

  const seekBySeconds = useCallback((deltaSeconds) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const activeDuration = Number.isFinite(audio.duration) ? audio.duration : duration
    const nextTime = (audio.currentTime || 0) + deltaSeconds
    const clampedTime = Number.isFinite(activeDuration) && activeDuration > 0
      ? Math.max(0, Math.min(nextTime, activeDuration))
      : Math.max(0, nextTime)

    audio.currentTime = clampedTime
    setProgress(clampedTime)
    restoreSeekRef.current = clampedTime
  }, [duration])

  useEffect(() => {
    if (!fullscreenTrackOpen) {
      hideFullscreenControls()
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeFullscreenTrack()
      }
    }

    revealFullscreenControls()
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      hideFullscreenControls()
    }
  }, [fullscreenTrackOpen, closeFullscreenTrack, hideFullscreenControls, revealFullscreenControls])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const html = document.documentElement
    const body = document.body
    const className = 'fullscreen-track-open'

    if (fullscreenTrackOpen) {
      html?.classList.add(className)
      body?.classList.add(className)
    } else {
      html?.classList.remove(className)
      body?.classList.remove(className)
    }

    return () => {
      html?.classList.remove(className)
      body?.classList.remove(className)
    }
  }, [fullscreenTrackOpen])

  useEffect(() => {
    const handleArrowSeek = (event) => {
      if (!arrowSeekEnabled || event.defaultPrevented || !currentTrack) {
        return
      }

      const activeElement = document.activeElement
      const tagName = activeElement?.tagName?.toLowerCase()
      const isTypingTarget =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        Boolean(activeElement?.isContentEditable)
      const isInteractiveTarget =
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'summary' ||
        activeElement?.getAttribute?.('role') === 'button'

      if (isTypingTarget || isInteractiveTarget || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        seekBySeconds(5)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seekBySeconds(-5)
      }
    }

    window.addEventListener('keydown', handleArrowSeek)
    return () => {
      window.removeEventListener('keydown', handleArrowSeek)
    }
  }, [arrowSeekEnabled, currentTrack, seekBySeconds])

  const updateAppSettings = (nextSettings) => {
    if (typeof window !== 'undefined' && window.novaPlayer?.updateAppSettings) {
      window.novaPlayer.updateAppSettings(nextSettings)
    }
  }

  const openUploadPicker = () => {
    openAddModal()
  }

  const toArrayBuffer = async (blob, fallbackUrl = '') => {
    if (blob instanceof Blob) {
      return blob.arrayBuffer()
    }

    if (fallbackUrl?.startsWith('blob:') || fallbackUrl?.startsWith('data:')) {
      try {
        const response = await fetch(fallbackUrl)
        if (response.ok) {
          return response.arrayBuffer()
        }
      } catch {
        return null
      }
    }

    return null
  }

  const showUploadNotice = (message) => {
    const text = String(message || '').trim()
    if (!text) {
      return
    }

    const nextNotice = {
      id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message: text,
      createdAt: Date.now(),
      read: false,
    }
    setNotifications((prev) => [nextNotice, ...prev].slice(0, 120))
    setHasUnreadNotifications(true)
  }

  const upsertDownloadJob = useCallback((payload = {}) => {
    const requestId = String(payload.requestId || '').trim()
    if (!requestId) {
      return
    }

    const now = Date.now()
    setDownloadJobs((prev) => {
      const index = prev.findIndex((item) => item.requestId === requestId)
      const nextItem = {
        requestId,
        title: String(payload.title || '').trim(),
        artist: String(payload.artist || '').trim(),
        status: String(payload.status || 'downloading').trim() || 'downloading',
        receivedBytes: Number(payload.receivedBytes || 0) || 0,
        totalBytes: Number(payload.totalBytes || 0) || 0,
        filePath: String(payload.filePath || '').trim(),
        createdAt: index >= 0 ? prev[index].createdAt : now,
        updatedAt: now,
      }

      if (index >= 0) {
        const clone = [...prev]
        clone[index] = { ...clone[index], ...nextItem }
        return clone
      }

      return [nextItem, ...prev].slice(0, 140)
    })
  }, [])

  const updateNotificationsPanelPosition = useCallback(() => {
    const anchor = notificationsButtonRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(440, Math.max(280, window.innerWidth - 24))
    const minLeft = 12
    const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 12)
    const left = Math.min(maxLeft, Math.max(minLeft, rect.right - panelWidth))
    const top = Math.min(window.innerHeight - 120, rect.bottom + 8)

    setNotificationsPanelPosition({
      top,
      left,
      width: panelWidth,
    })
  }, [])

  const updateDownloadsPanelPosition = useCallback(() => {
    const anchor = downloadsButtonRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(460, Math.max(300, window.innerWidth - 24))
    const minLeft = 12
    const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 12)
    const left = Math.min(maxLeft, Math.max(minLeft, rect.right - panelWidth))
    const top = Math.min(window.innerHeight - 120, rect.bottom + 8)

    setDownloadsPanelPosition({
      top,
      left,
      width: panelWidth,
    })
  }, [])

  const toggleNotificationsPanel = () => {
    setNotificationsOpen((prev) => {
      const next = !prev
      if (next) {
        setDownloadsOpen(false)
        updateNotificationsPanelPosition()
        setHasUnreadNotifications(false)
        setNotifications((current) =>
          current.map((notice) => (notice.read ? notice : { ...notice, read: true })),
        )
      }
      return next
    })
  }

  const toggleDownloadsPanel = () => {
    setDownloadsOpen((prev) => {
      const next = !prev
      if (next) {
        setNotificationsOpen(false)
        updateDownloadsPanelPosition()
      }
      return next
    })
  }

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined
    }

    const handlePositionUpdate = () => updateNotificationsPanelPosition()
    window.addEventListener('resize', handlePositionUpdate)
    window.addEventListener('scroll', handlePositionUpdate, true)

    return () => {
      window.removeEventListener('resize', handlePositionUpdate)
      window.removeEventListener('scroll', handlePositionUpdate, true)
    }
  }, [notificationsOpen, updateNotificationsPanelPosition])

  useEffect(() => {
    if (!downloadsOpen) {
      return undefined
    }

    const handlePositionUpdate = () => updateDownloadsPanelPosition()
    window.addEventListener('resize', handlePositionUpdate)
    window.addEventListener('scroll', handlePositionUpdate, true)

    return () => {
      window.removeEventListener('resize', handlePositionUpdate)
      window.removeEventListener('scroll', handlePositionUpdate, true)
    }
  }, [downloadsOpen, updateDownloadsPanelPosition])

  useEffect(() => {
    const bridge = window?.novaPlayer
    const unsubscribe = bridge?.onLibraryDownloadProgress?.((payload) => {
      upsertDownloadJob(payload)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [upsertDownloadJob])

  useEffect(() => {
    const bridge = window?.novaPlayer
    if (!bridge?.onUpdaterEvent) {
      return undefined
    }

    const notifyOnce = (key, message) => {
      const text = String(message || '').trim()
      if (!text) {
        return
      }
      if (lastUpdaterNoticeRef.current === key) {
        return
      }
      lastUpdaterNoticeRef.current = key
      showUploadNotice(text)
    }

    const handleUpdaterEvent = (payload) => {
      const eventName = String(payload?.event || '').trim()
      if (!eventName) {
        return
      }

      if (eventName === 'available') {
        const version = String(payload?.latestVersion || '').trim()
        notifyOnce(
          `available:${version || 'unknown'}`,
          version ? `Yeni sürüm bulundu: v${version}` : 'Yeni sürüm bulundu.',
        )
        return
      }

      if (eventName === 'downloaded') {
        const version = String(payload?.latestVersion || '').trim()
        notifyOnce(
          `downloaded:${version || 'unknown'}`,
          version
            ? `Güncelleme indirildi: v${version}. Yeniden başlatınca otomatik kurulur.`
            : 'Güncelleme indirildi. Yeniden başlatınca otomatik kurulur.',
        )
        return
      }

      if (eventName === 'error') {
        const errorText = String(payload?.error || '').trim()
        if (!errorText) {
          return
        }
        notifyOnce(`error:${errorText}`, `Güncelleme kontrolünde hata: ${errorText}`)
      }
    }

    const unsubscribe = bridge.onUpdaterEvent(handleUpdaterEvent)
    bridge.getUpdaterState?.().then((state) => {
      if (state?.downloaded) {
        const version = String(state?.latestVersion || '').trim()
        notifyOnce(
          `downloaded:${version || 'unknown'}`,
          version
            ? `Güncelleme indirildi: v${version}. Yeniden başlatınca otomatik kurulur.`
            : 'Güncelleme indirildi. Yeniden başlatınca otomatik kurulur.',
        )
      }
    }).catch(() => {})

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [showUploadNotice])

  const clearNotifications = () => {
    setNotifications([])
    setHasUnreadNotifications(false)
  }

  const removeNotification = (noticeId) => {
    setNotifications((prev) => {
      const filtered = prev.filter((notice) => notice.id !== noticeId)
      if (!filtered.length) {
        setHasUnreadNotifications(false)
      }
      return filtered
    })
  }

  const clearDownloadJobs = () => {
    setDownloadJobs([])
  }

  const removeDownloadJob = (requestId) => {
    setDownloadJobs((prev) => prev.filter((item) => item.requestId !== requestId))
  }

  const controlDownloadJob = useCallback(async (requestId, action) => {
    const bridge = window?.novaPlayer
    if (!bridge?.controlDownload) {
      return
    }
    try {
      await bridge.controlDownload({ requestId, action })
    } catch {
      // ignore bridge control failures
    }
  }, [])

  const resetAppCaches = useCallback(() => {
    artistFactsCacheRef.current = {}
    coverArtCacheRef.current = {}
    albumCacheRef.current = {}
    genreCacheRef.current = {}
    coverToneCacheRef.current = {}
    lyricsCacheRef.current = {}
    setArtistFacts(null)

    localStorage.removeItem(ARTIST_FACTS_KEY)
    localStorage.removeItem(COVER_ART_CACHE_KEY)
    localStorage.removeItem(ALBUM_CACHE_KEY)
    localStorage.removeItem(GENRE_CACHE_KEY)
    localStorage.removeItem(COVER_TONE_CACHE_KEY)
    localStorage.removeItem(LYRICS_CACHE_KEY)

    showUploadNotice(t('resetCacheDone', 'Önbellek temizlendi.'))
  }, [showUploadNotice, t])

  const exportLibrary = async () => {
    if (!window.novaPlayer?.exportLibrary) {
      showUploadNotice('Bu sürümde dışa aktarma desteklenmiyor.')
      return
    }

    if (!allTracks.length) {
      showUploadNotice('Dışa aktarılacak şarkı bulunamadı.')
      return
    }

    setExportingLibrary(true)
    try {
      const payloadTracks = await Promise.all(
        allTracks.map(async (track) => {
          const audioBuffer = await toArrayBuffer(track.audioBlob, track.audioUrl)
          const coverSourceUrl = track.coverUrl || track.coverRemoteUrl || ''
          const coverBuffer = await toArrayBuffer(track.coverBlob, coverSourceUrl)

          return {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album || 'Single',
            duration: track.duration || 0,
            source: track.source || 'local',
            audio:
              audioBuffer
                ? {
                    kind: 'buffer',
                    name: track.fileName || `${track.title || 'track'}.mp3`,
                    bytes: audioBuffer,
                  }
                : track.audioUrl
                  ? {
                      kind: 'url',
                      url: track.audioUrl,
                    }
                  : null,
            cover:
              coverBuffer
                ? {
                    kind: 'buffer',
                    name: track.coverName || `${track.title || 'cover'}.jpg`,
                    bytes: coverBuffer,
                  }
                : coverSourceUrl
                  ? {
                      kind: 'url',
                      url: coverSourceUrl,
                    }
                  : null,
          }
        }),
      )

      const result = await window.novaPlayer.exportLibrary({ tracks: payloadTracks })

      if (!result?.ok) {
        if (result?.reason !== 'cancelled') {
          showUploadNotice('Dışa aktarma tamamlanamadı.')
        }
        return
      }

      showUploadNotice(
        `${result.successCount}/${result.total} şarkı ve ${result.coverCount} kapak kaydedildi.`,
      )
    } catch {
      showUploadNotice('Dışa aktarırken bir hata oluştu.')
    } finally {
      setExportingLibrary(false)
    }
  }

  const isFileDragEvent = (event) => {
    const dataTransfer = event?.dataTransfer
    const types = dataTransfer?.types
    if (!types || !Array.from(types).includes('Files')) {
      return false
    }

    const items = Array.from(dataTransfer?.items || [])
      .filter((item) => item.kind === 'file')

    if (items.length) {
      return items.some((item) => item.type?.toLowerCase().startsWith('audio/'))
    }

    const files = Array.from(dataTransfer?.files || [])
    if (files.length) {
      return files.some((file) => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name || ''))
    }

    return false
  }

  useEffect(() => {
    const handleDragEnter = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current += 1
      setIsDragActive(true)
    }

    const handleDragOver = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
      if (dragCounterRef.current === 0) {
        setIsDragActive(false)
      }
    }

    const handleDrop = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current = 0
      setIsDragActive(false)
      addFilesToLibraryRef.current?.(event.dataTransfer?.files || [])
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  const openAddModal = () => {
    setAddMode('choose')
    setAddModalOpen(true)
    setLinkDraft({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
    })
  }

  const closeAddModal = () => {
    setAddModalOpen(false)
    setAddMode('choose')
    setLinkDraft({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
    })
  }

  const searchYouTube = (track) => {
    const query = encodeURIComponent(`${track.title} ${track.artist}`)
    window.novaPlayer?.openExternal?.(`https://www.youtube.com/results?search_query=${query}`)
  }

  const releaseTrackResources = (track) => {
    if (track.audioUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(track.audioUrl)
    }

    if (track.coverUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(track.coverUrl)
    }

    assetUrlsRef.current = assetUrlsRef.current.filter(
      (url) => url !== track.audioUrl && url !== track.coverUrl,
    )
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
    }
  }, [volume])

  useEffect(() => {
    equalizerGainsRef.current = equalizerGains
  }, [equalizerGains])

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    const context = audioContextRef.current
    if (context?.state === 'suspended') {
      context.resume().catch(() => {})
    }

    return undefined
  }, [isPlaying])
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      return undefined
    }

    let cancelled = false

    const ensureGraph = async () => {
      if (!audioContextRef.current) {
        const context = new AudioContextCtor()
        const source = context.createMediaElementSource(audio)
        const filters = equalizerBands.map((band, index) => {
          const filter = context.createBiquadFilter()
          filter.type = band.type
          filter.frequency.value = band.frequency
          filter.Q.value = band.q
          filter.gain.value = equalizerGainsRef.current[index] || 0
          return filter
        })
        const outputGain = context.createGain()
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.82
        outputGain.gain.value = 1

        source.connect(filters[0])
        filters.forEach((filter, index) => {
          if (filters[index + 1]) {
            filter.connect(filters[index + 1])
          } else {
            filter.connect(outputGain)
          }
        })
        outputGain.connect(analyser)
        audioContextRef.current = context
        audioSourceRef.current = source
        audioGainRef.current = outputGain
        audioAnalyserRef.current = analyser
        equalizerFiltersRef.current = filters
        applyAudioChannelMode(monoAudioEnabled)
      }

      if (!cancelled && audioContextRef.current?.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
        } catch {
          // ignore resume failures
        }
      }
    }

    ensureGraph().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [applyAudioChannelMode, monoAudioEnabled])

  useEffect(() => {
    equalizerFiltersRef.current.forEach((filter, index) => {
      if (filter) {
        filter.gain.value = equalizerGainsRef.current[index] || 0
      }
    })
  }, [equalizerGains])

  useEffect(() => {
    applyAudioChannelMode(monoAudioEnabled)
  }, [applyAudioChannelMode, monoAudioEnabled])

  useEffect(() => {
    if (!fullscreenTrackOpen || !fullscreenEffectsEnabled || !isPlaying || appBackgrounded) {
      setFullscreenAudioLevel(0)
      if (fullscreenAudioRafRef.current) {
        window.cancelAnimationFrame(fullscreenAudioRafRef.current)
        fullscreenAudioRafRef.current = null
      }
      return undefined
    }

    const analyser = audioAnalyserRef.current
    if (!analyser) {
      return undefined
    }

    const data = new Uint8Array(analyser.fftSize)
    let smoothLevel = 0

    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let index = 0; index < data.length; index += 1) {
        const sample = (data[index] - 128) / 128
        sum += sample * sample
      }

      const rms = Math.sqrt(sum / data.length)
      const targetLevel = Math.min(1, rms * 6.8)
      smoothLevel = smoothLevel * 0.82 + targetLevel * 0.18
      setFullscreenAudioLevel((prev) => (Math.abs(prev - smoothLevel) > 0.008 ? smoothLevel : prev))
      fullscreenAudioRafRef.current = window.requestAnimationFrame(tick)
    }

    fullscreenAudioRafRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (fullscreenAudioRafRef.current) {
        window.cancelAnimationFrame(fullscreenAudioRafRef.current)
        fullscreenAudioRafRef.current = null
      }
    }
  }, [appBackgrounded, fullscreenEffectsEnabled, fullscreenTrackOpen, currentTrackId, isPlaying])

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return undefined
    }

    let cancelled = false
    const loadOutputs = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) {
          setAudioOutputs(devices.filter((device) => device.kind === 'audiooutput'))
        }
      } catch {
        if (!cancelled) {
          setAudioOutputs([])
        }
      }
    }

    loadOutputs()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !canSelectAudioOutput || typeof audio.setSinkId !== 'function') {
      return undefined
    }

    audio.setSinkId(selectedAudioOutputId).catch(() => {
      setSettingsOpen(false)
    })

    return undefined
  }, [canSelectAudioOutput, selectedAudioOutputId, isHydrated])

  useEffect(() => {
    favoriteTrackIdsRef.current = favoriteTrackIds
  }, [favoriteTrackIds])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    playStatsRef.current = playStats
  }, [playStats])

  useEffect(() => {
    queuedNextTrackIdsRef.current = queuedNextTrackIds
  }, [queuedNextTrackIds])

  useEffect(() => {
    shuffleOrderIdsRef.current = shuffleOrderIds
  }, [shuffleOrderIds])

  useEffect(() => {
    if (!shuffleEnabled) {
      if (shuffleOrderIdsRef.current.length) {
        applyShuffleOrderIds([])
      }
      return
    }

    const playbackIds = playbackTracks.map((track) => track.id)
    if (!playbackIds.length) {
      if (shuffleOrderIdsRef.current.length) {
        applyShuffleOrderIds([])
      }
      return
    }

    const playbackSet = new Set(playbackIds)
    const previousOrder = shuffleOrderIdsRef.current.filter((id) => playbackSet.has(id))
    const missingIds = playbackIds.filter((id) => !previousOrder.includes(id))

    if (!previousOrder.length) {
      const seeded = deterministicShuffleTracks(
        playbackTracks,
        `${playbackCollectionScopeId}|${shuffleSeedRef.current}|shuffle-order`,
      ).map((track) => track.id)
      applyShuffleOrderIds(seeded)
      return
    }

    if (!missingIds.length && previousOrder.length === playbackIds.length) {
      return
    }

    const missingTracks = playbackTracks.filter((track) => missingIds.includes(track.id))
    const appended = deterministicShuffleTracks(
      missingTracks,
      `${playbackCollectionScopeId}|${shuffleSeedRef.current}|shuffle-append`,
    ).map((track) => track.id)
    applyShuffleOrderIds([...previousOrder, ...appended])
  }, [playbackCollectionScopeId, playbackTracks, shuffleEnabled])

  useEffect(() => {
    persistStateRef.current = {
      selectedCollectionId,
      currentTrackId,
      progress,
      volume,
      isPlaying,
      equalizerGains,
    }
  }, [currentTrackId, isPlaying, progress, selectedCollectionId, volume, equalizerGains])

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
        try {
          const [storedTracks, prefs, storedPlaylists] = await Promise.all([
            getStoredTracks(),
            Promise.resolve(loadUiPrefs()),
            Promise.resolve(loadJson(PLAYLISTS_KEY, [])),
        ])
        if (cancelled) {
          return
        }

          const restoredTracks = storedTracks.map((record) => ({
            ...materializeTrack(record, assetUrlsRef),
            title: cleanFilenameTrackTitle(record.title || '') || record.title || 'Bilinmeyen parça',
            album: (record.album || '').trim() || 'Single',
            genre: normalizeGenreName(record.genre || ''),
            source: record.source || (record.audioBlob ? 'local' : 'link'),
          }))
          lastPersistedTracksSignatureRef.current = JSON.stringify(restoredTracks.map(serializeTrack))
          setTracks(applyFavoriteFlags(restoredTracks, favoriteTrackIdsRef.current))
        setPlaylists(
          storedPlaylists.map((playlist, index) => ({
            ...playlist,
            description: String(playlist.description || ''),
            color: playlist.color || playlistColors[index % playlistColors.length],
            coverUrl: playlist.coverUrl || '',
          })),
        )
        setSelectedCollectionId(prefs.selectedCollectionId || 'all')
        setLanguage(UI_LANGUAGES.includes(prefs.language) ? prefs.language : 'tr')
        setSharedManifestUrl(prefs.sharedManifestUrl || DEFAULT_SHARED_MANIFEST_URL)
        setPoolGithubOwner(String(prefs.poolGithubOwner || '').trim())
        setPoolGithubRepo(String(prefs.poolGithubRepo || '').trim())
        setPoolGithubBranch(String(prefs.poolGithubBranch || '').trim() || 'main')
        setPoolGithubPath(String(prefs.poolGithubPath || '').trim() || 'tracks.json')
        setPoolGithubToken(String(prefs.poolGithubToken || '').trim())
        const resolvedThemeMode = ['dark', 'gray', 'light', 'transparent'].includes(prefs.themeMode)
          ? prefs.themeMode
          : 'dark'
        const defaultPalette = getDefaultBackgroundPalette(resolvedThemeMode)
        setThemeMode(resolvedThemeMode)
        setBackgroundStyle(prefs.backgroundStyle === 'solid' ? 'solid' : 'gradient')
        setCoverBasedBackgroundEnabled(Boolean(prefs.coverBasedBackgroundEnabled))
        setBackgroundColor1(normalizeHexColor(prefs.backgroundColor1, defaultPalette.color1))
        setBackgroundColor2(normalizeHexColor(prefs.backgroundColor2, defaultPalette.color2))
        setCloseBehavior(prefs.closeBehavior || 'tray')
        setHardwareAccelerationEnabled(prefs.hardwareAccelerationEnabled !== false)
        setFullscreenEffectsEnabled(prefs.fullscreenEffectsEnabled !== false)
        setReduceAnimationsEnabled(Boolean(prefs.reduceAnimationsEnabled))
        setLowPowerModeEnabled(Boolean(prefs.lowPowerModeEnabled))
        setCompactListEnabled(Boolean(prefs.compactListEnabled))
        setShowScrollbars(Boolean(prefs.showScrollbars))
        setSpaceKeyPlaybackEnabled(prefs.spaceKeyPlaybackEnabled !== false)
        setArrowSeekEnabled(prefs.arrowSeekEnabled !== false)
        setResetShortcutEnabled(prefs.resetShortcutEnabled !== false)
        setSidebarPlayerExpanded(prefs.sidebarPlayerExpanded !== false)
        const restoredShuffleEnabled = Boolean(prefs.shuffleEnabled)
        const restoredRepeatEnabled = Boolean(prefs.repeatEnabled) && !restoredShuffleEnabled
        setShuffleEnabled(restoredShuffleEnabled)
        setRepeatEnabled(restoredRepeatEnabled)
        setCurrentTrackId(
          restoredTracks.find((track) => track.id === prefs.currentTrackId)?.id || restoredTracks[0]?.id || null,
        )
        setVolume(typeof prefs.volume === 'number' ? prefs.volume : 0.85)
        setMonoAudioEnabled(Boolean(prefs.monoAudioEnabled))
        setEqualizerGains(Array.isArray(prefs.equalizerGains) ? prefs.equalizerGains.slice(0, equalizerBands.length).map((value) => Number(value) || 0).concat(Array(Math.max(0, equalizerBands.length - (prefs.equalizerGains || []).length)).fill(0)).slice(0, equalizerBands.length) : Array(equalizerBands.length).fill(0))
        setProgress(typeof prefs.progress === 'number' ? prefs.progress : 0)
        setIsPlaying(Boolean(prefs.isPlaying))
        const hasSavedTrack = restoredTracks.some((track) => track.id === prefs.currentTrackId)
        restoreTrackIdRef.current = hasSavedTrack ? prefs.currentTrackId : null
        restoreSeekRef.current =
          hasSavedTrack && typeof prefs.progress === 'number' ? prefs.progress : 0
      } catch {
        if (!cancelled) {
          setTracks([])
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
      assetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const baseUiPrefs = useMemo(
    () => ({
      selectedCollectionId,
      language,
      sharedManifestUrl,
      poolGithubOwner,
      poolGithubRepo,
      poolGithubBranch,
      poolGithubPath,
      poolGithubToken,
      currentTrackId,
      volume,
      monoAudioEnabled,
      hardwareAccelerationEnabled,
      fullscreenEffectsEnabled,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
      isPlaying,
      equalizerGains,
      audioOutputId: selectedAudioOutputId,
      themeMode,
      backgroundStyle,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      closeBehavior,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      resetShortcutEnabled,
      mediaToggleShortcut,
      sidebarPlayerExpanded,
      shuffleEnabled,
      repeatEnabled,
    }),
    [
      selectedCollectionId,
      language,
      sharedManifestUrl,
      poolGithubOwner,
      poolGithubRepo,
      poolGithubBranch,
      poolGithubPath,
      poolGithubToken,
      currentTrackId,
      volume,
      monoAudioEnabled,
      hardwareAccelerationEnabled,
      fullscreenEffectsEnabled,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
      isPlaying,
      equalizerGains,
      selectedAudioOutputId,
      themeMode,
      backgroundStyle,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      closeBehavior,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      resetShortcutEnabled,
      mediaToggleShortcut,
      sidebarPlayerExpanded,
      shuffleEnabled,
      repeatEnabled,
    ],
  )

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const serializedTracks = tracks.map(serializeTrack)
    const trackSignature = JSON.stringify(serializedTracks)
    if (trackSignature === lastPersistedTracksSignatureRef.current) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      putStoredTracks(serializedTracks)
        .then(() => {
          lastPersistedTracksSignatureRef.current = trackSignature
        })
        .catch(() => {})
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [tracks, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const next = JSON.stringify(playlists)
    if (next === lastSavedPlaylistsRef.current) {
      return
    }

    lastSavedPlaylistsRef.current = next
    saveJson(PLAYLISTS_KEY, playlists)
  }, [isHydrated, playlists])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const next = JSON.stringify(favoriteTrackIds)
    if (next === lastSavedFavoritesRef.current) {
      return
    }

    lastSavedFavoritesRef.current = next
    saveJson(FAVORITES_KEY, favoriteTrackIds)
  }, [isHydrated, favoriteTrackIds])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      const serializedPrefs = JSON.stringify(baseUiPrefs)
      if (serializedPrefs === lastSavedUiPrefsRef.current) {
        return
      }

      lastSavedUiPrefsRef.current = serializedPrefs
      saveUiPrefs(baseUiPrefs)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [baseUiPrefs, isHydrated])

  useEffect(() => {
    if (!isHydrated || !currentTrackId || !isPlaying) {
      return undefined
    }

    const interval = window.setInterval(() => {
      const snapshot = persistStateRef.current
      const nextPrefs = {
        selectedCollectionId: snapshot.selectedCollectionId,
        language,
        sharedManifestUrl,
        poolGithubOwner,
        poolGithubRepo,
        poolGithubBranch,
        poolGithubPath,
        poolGithubToken,
        currentTrackId: snapshot.currentTrackId,
        progress: snapshot.progress,
        volume: snapshot.volume,
        monoAudioEnabled,
        hardwareAccelerationEnabled,
        fullscreenEffectsEnabled,
        reduceAnimationsEnabled,
        lowPowerModeEnabled,
        compactListEnabled,
        showScrollbars,
        isPlaying: snapshot.isPlaying,
        equalizerGains: snapshot.equalizerGains,
        audioOutputId: selectedAudioOutputId,
        themeMode,
        backgroundStyle,
        coverBasedBackgroundEnabled,
        backgroundColor1,
        backgroundColor2,
        closeBehavior,
        spaceKeyPlaybackEnabled,
        arrowSeekEnabled,
        resetShortcutEnabled,
        mediaToggleShortcut,
        sidebarPlayerExpanded,
        shuffleEnabled,
        repeatEnabled,
      }
      const serializedPrefs = JSON.stringify(nextPrefs)
      if (serializedPrefs === lastSavedUiPrefsRef.current) {
        return
      }
      lastSavedUiPrefsRef.current = serializedPrefs
      saveUiPrefs(nextPrefs)
    }, 12000)

    return () => window.clearInterval(interval)
  }, [
    closeBehavior,
    currentTrackId,
    isHydrated,
    isPlaying,
    monoAudioEnabled,
    hardwareAccelerationEnabled,
    fullscreenEffectsEnabled,
    reduceAnimationsEnabled,
    lowPowerModeEnabled,
    compactListEnabled,
    showScrollbars,
    arrowSeekEnabled,
    repeatEnabled,
    mediaToggleShortcut,
    selectedAudioOutputId,
    spaceKeyPlaybackEnabled,
    resetShortcutEnabled,
    sidebarPlayerExpanded,
    backgroundStyle,
    coverBasedBackgroundEnabled,
    backgroundColor1,
    backgroundColor2,
    language,
    sharedManifestUrl,
    poolGithubOwner,
    poolGithubRepo,
    poolGithubBranch,
    poolGithubPath,
    poolGithubToken,
    shuffleEnabled,
    themeMode,
  ])

  useEffect(() => {
    if (!isHydrated || !currentTrackId || !isPlaying) {
      return undefined
    }

    let lastTickAt = Date.now()
    const tickInterval = appBackgrounded ? 3000 : 1000
    const interval = window.setInterval(() => {
      const now = Date.now()
      const elapsedSeconds = Math.max(1, Math.floor((now - lastTickAt) / 1000))
      lastTickAt = now

      setPlayStats((prev) => {
        const previousTrackSeconds = Number(prev.trackSeconds?.[currentTrackId] || 0)
        const previousPlayCount = Number(prev.trackPlayCount?.[currentTrackId] || 0)
        const trackSeconds = {
          ...(prev.trackSeconds || {}),
          [currentTrackId]: previousTrackSeconds + elapsedSeconds,
        }
        const trackPlayCount = {
          ...(prev.trackPlayCount || {}),
          [currentTrackId]: previousPlayCount > 0 ? previousPlayCount : 1,
        }
        return {
          totalSeconds: Number(prev.totalSeconds || 0) + elapsedSeconds,
          trackSeconds,
          trackPlayCount,
        }
      })
    }, tickInterval)

    return () => window.clearInterval(interval)
  }, [appBackgrounded, currentTrackId, isHydrated, isPlaying])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      saveJson(PLAY_STATS_KEY, playStatsRef.current)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [isHydrated, playStats])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    const handleTimeUpdate = () => {
      if (currentTrackId !== persistStateRef.current.currentTrackId) {
        return
      }
      if (isPlayingRef.current) {
        return
      }

      const currentTime = audio.currentTime
      setProgress(currentTime)
    }
    const handleLoadedMetadata = () => {
      const nextDuration = audio.duration || 0
      setDuration(nextDuration)

      if (currentTrack?.id && Number.isFinite(nextDuration) && nextDuration > 0) {
        const roundedDuration = Number(nextDuration.toFixed(2))
        if (Math.abs(Number(currentTrack.duration || 0) - roundedDuration) > 0.25) {
          updateTrack(currentTrack.id, { duration: roundedDuration })
        }
      }

      if (restoreTrackIdRef.current && currentTrack?.id === restoreTrackIdRef.current) {
        const nextTime = Math.min(restoreSeekRef.current || 0, nextDuration || 0)
        if (Number.isFinite(nextTime) && nextTime >= 0) {
          audio.currentTime = nextTime
          setProgress(nextTime)
        }

        restoreTrackIdRef.current = null
        restoreSeekRef.current = null
      }

      if (isPlayingRef.current) {
        audio.play().catch(() => {})
      }
    }
    const handleEnded = () => {
      if (currentTrackId !== persistStateRef.current.currentTrackId) {
        return
      }

      if (!currentTrack) {
        setIsPlaying(false)
        return
      }

      if (repeatEnabled) {
        audio.currentTime = 0
        setProgress(0)
        setDuration(currentTrack.duration || 0)
        restoreSeekRef.current = 0
        audio.play().catch(() => {})
        setIsPlaying(true)
        return
      }

      if (!visibleTracks.length) {
        setIsPlaying(false)
        return
      }

      const nextTrack = getNextTrack({ consumeQueue: true })
      if (!nextTrack) {
        setIsPlaying(false)
        return
      }

      switchTrackRef.current?.(nextTrack, true)
    }

    const handleError = () => {
      setIsPlaying(false)
      if (currentTrack?.source === 'link') {
      showUploadNotice('Bu link oynatılamadı. Drive için doğrudan medya veya indirilebilir dosya bağlantısı gerekir.')
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [
    currentTrack,
    currentTrackId,
    getNextTrack,
    repeatEnabled,
  ])

  useEffect(() => {
    if (progressAnimFrameRef.current) {
      window.cancelAnimationFrame(progressAnimFrameRef.current)
      progressAnimFrameRef.current = null
    }

    if (!isPlaying || !currentTrackId) {
      return undefined
    }

    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    let lastPaintAt = 0
    const tick = (now) => {
      if (audio.paused || audio.ended || currentTrackId !== persistStateRef.current.currentTrackId) {
        progressAnimFrameRef.current = null
        return
      }

      const paintInterval = document.hidden
        ? 780
        : (runtimeLowPowerEnabled ? 110 : 66)

      if (now - lastPaintAt >= paintInterval) {
        setProgress(audio.currentTime || 0)
        lastPaintAt = now
      }

      progressAnimFrameRef.current = window.requestAnimationFrame(tick)
    }

    progressAnimFrameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (progressAnimFrameRef.current) {
        window.cancelAnimationFrame(progressAnimFrameRef.current)
        progressAnimFrameRef.current = null
      }
    }
  }, [currentTrackId, isPlaying, runtimeLowPowerEnabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    if (!currentTrack) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return undefined
    }

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl
      audio.load()
    }

    return undefined
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return undefined
    }

    if (isPlaying) {
      const shouldFadeIn = Date.now() < trackSwitchFadeUntilRef.current
      if (shouldFadeIn) {
        const startVolume = Math.max(0, Math.min(1, volume * 0.2))
        audio.volume = startVolume
      } else {
        audio.volume = volume
      }
      audio.play().then(() => {
        if (shouldFadeIn) {
          window.setTimeout(() => {
            if (audioRef.current === audio) {
              audio.volume = volume
            }
          }, TRACK_SWITCH_FADE_MS)
        }
      }).catch(() => {
        setIsPlaying(false)
        if (currentTrack?.source === 'link') {
          showUploadNotice('Bu link oynatılamadı. Drive için doğrudan medya veya indirilebilir dosya bağlantısı gerekir.')
        }
      })
    } else {
      audio.pause()
    }

    return undefined
  }, [currentTrack, isPlaying, volume, showUploadNotice])

  useEffect(() => {
    if (!window.novaPlayer?.setPresence) {
      return undefined
    }

    if (!currentTrackPresenceId) {
      window.novaPlayer.setPresence({ track: null })
      return undefined
    }

    window.novaPlayer.setPresence({
      track: {
        title: currentTrackPresenceTitle,
        artist: currentTrackPresenceArtist,
        duration: duration,
        collection: activeCollectionLabel,
      },
      isPlaying,
      progress,
      startTimestamp: Date.now() - progressBucket * 5000,
    })

    return undefined
  }, [currentTrackPresenceId, currentTrackPresenceTitle, currentTrackPresenceArtist, isPlaying, progressBucket, duration, progress, activeCollectionLabel])

  const refreshPoolTracksNow = useCallback(async ({ silent = false } = {}) => {
    const remoteSources = [
      { url: DRIVE_MANIFEST_URL, tag: 'drive' },
      { url: sharedManifestUrl, tag: 'shared' },
    ].filter((item) => String(item.url || '').trim())

    if (!remoteSources.length) {
      setServerTracks([])
      return
    }

    setPoolRefreshing(true)
    try {
      const collected = []
      const seenIds = new Set()

      for (const source of remoteSources) {
        try {
          const response = await fetch(normalizeDriveUrl(source.url), { cache: 'no-store' })
          if (!response.ok) {
            continue
          }

          const json = await response.json()
          const trackList = Array.isArray(json)
            ? json
            : Array.isArray(json?.tracks)
              ? json.tracks
              : Array.isArray(json?.items)
                ? json.items
                : []

          for (const rawTrack of trackList) {
            const normalizedTrack = normalizeDriveTrack(rawTrack, source.tag, source.url)
            if (!normalizedTrack?.id || seenIds.has(normalizedTrack.id)) {
              continue
            }
            seenIds.add(normalizedTrack.id)
            collected.push(normalizedTrack)
          }
        } catch {
          // ignore this source and continue with others
        }
      }

      const previousById = new Map(serverTracks.map((track) => [track.id, track]))
      const merged = collected.map((track) => {
        const previous = previousById.get(track.id)
        if (!previous) {
          return track
        }

        const next = { ...track }
        const prevArtist = String(previous.artist || '').trim()
        const prevAlbum = String(previous.album || '').trim()
        const prevCover = String(previous.coverRemoteUrl || previous.coverUrl || '').trim()

        if ((!next.artist || next.artist === 'Yerel Koleksiyon') && prevArtist && prevArtist !== 'Yerel Koleksiyon') {
          next.artist = prevArtist
        }
        if (
          (!next.album || String(next.album).trim().toLowerCase() === 'single') &&
          prevAlbum &&
          prevAlbum.toLowerCase() !== 'single'
        ) {
          next.album = prevAlbum
        }
        if (!String(next.coverRemoteUrl || next.coverUrl || '').trim() && prevCover) {
          next.coverRemoteUrl = prevCover
          next.coverUrl = next.coverUrl || prevCover
        }
        if ((!next.duration || next.duration <= 0) && Number(previous.duration || 0) > 0) {
          next.duration = previous.duration
        }
        if (!next.coverTone && previous.coverTone) {
          next.coverTone = previous.coverTone
        }

        return next
      })

      setServerTracks(applyFavoriteFlags(merged, favoriteTrackIds))
      const nextIdSet = new Set(merged.map((track) => track.id))
      // Allow fresh metadata retries after each pool refresh.
      serverMetaAttemptedAtRef.current = {}
      serverMetaInFlightRef.current = new Set()
      if (!silent) {
        showUploadNotice('Müzik havuzu yenilendi.')
      }
    } catch {
      if (!silent) {
        showUploadNotice('Müzik havuzu yenilenemedi.')
      }
    } finally {
      setPoolRefreshing(false)
    }
  }, [favoriteTrackIds, serverTracks, sharedManifestUrl, showUploadNotice])

  useEffect(() => {
    if (!isHydrated || initialPoolRefreshDoneRef.current) {
      return
    }
    initialPoolRefreshDoneRef.current = true
    refreshPoolTracksNow({ silent: true })
  }, [isHydrated, refreshPoolTracksNow])

  useEffect(() => {
    setServerTracks((prev) => applyFavoriteFlags(prev, favoriteTrackIds))
  }, [favoriteTrackIds])

  useEffect(() => {
    if (!serverTracks.length || appBackgrounded) {
      return undefined
    }

    let cancelled = false
    const now = Date.now()
    const ATTEMPT_COOLDOWN_MS = 2 * 60 * 1000
    const MAX_PARALLEL = 5
    const candidates = serverTracks.filter((track) => {
      const missingArtist = !String(track.artist || '').trim() || track.artist === 'Yerel Koleksiyon'
      const missingAlbum =
        !String(track.album || '').trim() || String(track.album || '').trim().toLowerCase() === 'single'
      const missingCover = !String(track.coverUrl || track.coverRemoteUrl || '').trim()
      if (!(missingArtist || missingAlbum || missingCover)) {
        return false
      }

      if (serverMetaInFlightRef.current.has(track.id)) {
        return false
      }

      const lastAttemptAt = Number(serverMetaAttemptedAtRef.current[track.id] || 0)
      if (lastAttemptAt && now - lastAttemptAt < ATTEMPT_COOLDOWN_MS) {
        return false
      }

      return true
    })

    if (!candidates.length) {
      return undefined
    }

    const enrichTrack = async (track) => {
      serverMetaInFlightRef.current.add(track.id)
      serverMetaAttemptedAtRef.current[track.id] = Date.now()
      try {
        let nextTitle = cleanFilenameTrackTitle(String(track.title || '').trim())
        let nextArtist = String(track.artist || '').trim()
        let nextAlbum = String(track.album || '').trim()
        let nextCover = String(track.coverRemoteUrl || track.coverUrl || '').trim()
        let inferredIdentity = null

        if ((!nextArtist || nextArtist === 'Yerel Koleksiyon') && nextTitle) {
          try {
            inferredIdentity = await inferTrackIdentityFromTitle(nextTitle)
            if (inferredIdentity?.artist) {
              nextArtist = inferredIdentity.artist
            }
            if (inferredIdentity?.title) {
              nextTitle = cleanFilenameTrackTitle(inferredIdentity.title) || nextTitle
            }
            if (!nextAlbum && inferredIdentity?.album) {
              nextAlbum = inferredIdentity.album
            }
            if (!nextCover && inferredIdentity?.coverUrl) {
              nextCover = inferredIdentity.coverUrl
            }
          } catch {
            inferredIdentity = null
          }
        }

        if (nextTitle && nextArtist && nextArtist !== 'Yerel Koleksiyon') {
          let cacheKey = `${normalizeArtistQuery(nextArtist)}|${nextTitle}`.toLowerCase()
          const cachedCover = String(getLruCacheValue(coverArtCacheRef.current, cacheKey) || '').trim()
          const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()

          if (!nextCover && cachedCover) {
            nextCover = cachedCover
          }
          if ((!nextAlbum || nextAlbum.toLowerCase() === 'single') && cachedAlbum) {
            nextAlbum = cachedAlbum
          }

          if (!nextCover || !nextAlbum || nextAlbum.toLowerCase() === 'single') {
            try {
              const remoteMeta = await fetchRemoteTrackMetaSmart(nextTitle, nextArtist, {
                preferredAlbum: nextAlbum || inferredIdentity?.album || '',
                preferredDuration: Number(track.duration || 0),
              })
              if (remoteMeta?.swapped) {
                const swappedTitle = cleanFilenameTrackTitle(nextArtist) || nextTitle
                const swappedArtist = sanitizeDisplayText(nextTitle) || nextArtist
                nextTitle = swappedTitle
                nextArtist = swappedArtist
                cacheKey = `${normalizeArtistQuery(nextArtist)}|${nextTitle}`.toLowerCase()
              }
              let resolvedCover = remoteMeta?.coverUrl || ''
              let resolvedAlbum = String(remoteMeta?.album || '').trim()
              if (!resolvedCover || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') {
                try {
                  const fallbackIdentity = await inferTrackIdentityFromTitle(nextTitle)
                  const fallbackArtistMatches = areArtistsCompatible(
                    nextArtist,
                    String(fallbackIdentity?.artist || ''),
                  )
                  if (fallbackArtistMatches) {
                    if (!resolvedCover && fallbackIdentity?.coverUrl) {
                      resolvedCover = fallbackIdentity.coverUrl
                    }
                    if (
                      (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                      fallbackIdentity?.album
                    ) {
                      resolvedAlbum = String(fallbackIdentity.album).trim()
                    }
                  }
                } catch {
                  // ignore fallback lookup errors
                }
              }
              if (resolvedCover) {
                nextCover = nextCover || resolvedCover
              }
              if (resolvedAlbum) {
                nextAlbum = resolvedAlbum
              }
              setLruCacheValue(coverArtCacheRef.current, cacheKey, nextCover || '', MAX_COVER_CACHE_ENTRIES)
              setLruCacheValue(albumCacheRef.current, cacheKey, nextAlbum || '', MAX_ALBUM_CACHE_ENTRIES)
            } catch {
              // ignore
            }
          }
        }

        const updates = {}
        if (nextTitle && nextTitle !== track.title) {
          updates.title = nextTitle
        }
        if (nextArtist && nextArtist !== track.artist) {
          updates.artist = nextArtist
        }
        if (nextAlbum && nextAlbum !== track.album) {
          updates.album = nextAlbum
        }
        if (nextCover) {
          if (nextCover !== track.coverRemoteUrl) {
            updates.coverRemoteUrl = nextCover
          }
          if (!track.coverUrl) {
            updates.coverUrl = nextCover
          }
        }

        return Object.keys(updates).length ? { id: track.id, updates } : null
      } finally {
        serverMetaInFlightRef.current.delete(track.id)
      }
    }

    const runQueue = async () => {
      const pending = [...candidates]
      const allUpdates = []

      while (pending.length && !cancelled) {
        const chunk = pending.splice(0, MAX_PARALLEL)
        const results = await Promise.all(chunk.map((track) => enrichTrack(track)))
        results.forEach((result) => {
          if (result) {
            allUpdates.push(result)
          }
        })
      }

      if (cancelled) {
        return
      }

      if (allUpdates.length) {
        const updatesById = new Map(allUpdates.map((item) => [item.id, item.updates]))
        setServerTracks((prev) =>
          prev.map((item) => {
            const updates = updatesById.get(item.id)
            return updates ? { ...item, ...updates } : item
          }),
        )
      }

      saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
      saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appBackgrounded, serverTracks])

  useEffect(() => {
    const artistCandidates = extractArtistCandidates(currentTrack?.artist || '')
    if (!artistCandidates.length) {
      setArtistFacts(null)
      setArtistFactsLoading(false)
      return undefined
    }

    setArtistFacts(null)
    const cachedFacts = artistCandidates
      .map((name) => getLruCacheValue(artistFactsCacheRef.current, name))
      .find((facts) => Boolean(facts))
    if (cachedFacts) {
      setArtistFacts(cachedFacts)
      setArtistFactsLoading(false)
      return undefined
    }

    let cancelled = false
    setArtistFactsLoading(true)

    const loadArtistFacts = async () => {
      try {
        let facts = null
        for (const artistName of artistCandidates) {
          if (cancelled) {
            return
          }

          const cached = getLruCacheValue(artistFactsCacheRef.current, artistName)
          if (cached) {
            facts = cached
            break
          }

          const fetched = await fetchArtistFacts(artistName)
          setLruCacheValue(artistFactsCacheRef.current, artistName, fetched, MAX_ARTIST_FACTS_CACHE_ENTRIES)
          if (fetched) {
            facts = fetched
            break
          }
        }

        if (cancelled) {
          return
        }

        saveArtistFactsCache(artistFactsCacheRef.current)
        setArtistFacts(facts)
      } catch {
        if (!cancelled) {
          artistCandidates.forEach((artistName) => {
            if (!Object.prototype.hasOwnProperty.call(artistFactsCacheRef.current, artistName)) {
              setLruCacheValue(artistFactsCacheRef.current, artistName, null, MAX_ARTIST_FACTS_CACHE_ENTRIES)
            }
          })
          saveArtistFactsCache(artistFactsCacheRef.current)
          setArtistFacts(null)
        }
      } finally {
        if (!cancelled) {
          setArtistFactsLoading(false)
        }
      }
    }

    loadArtistFacts()

    return () => {
      cancelled = true
    }
  }, [currentTrack?.artist, currentTrack?.id])

  useEffect(() => {
    if (!lyricsOpen && !sidebarPlayerActive) {
      return undefined
    }

    if (!currentTrack?.id) {
      setLyricsText('')
      setLyricsError('Önce bir şarkı seç.')
      setLyricsLoading(false)
      return undefined
    }

    const cacheKey = `${normalizeArtistQuery(currentTrack.artist || '').toLowerCase()}|${cleanTrackTitleForLyrics(
      currentTrack.title || '',
    ).toLowerCase()}`
    if (Object.prototype.hasOwnProperty.call(lyricsCacheRef.current, cacheKey)) {
      const cached = getLruCacheValue(lyricsCacheRef.current, cacheKey) || ''
      setLyricsText(cached)
      setLyricsError(cached ? '' : 'Sözler bulunamadı.')
      setLyricsLoading(false)
      return undefined
    }

    let cancelled = false
    let settled = false
    setLyricsLoading(true)
    setLyricsError('')
    setLyricsText('')

    const timeout = window.setTimeout(() => {
      if (cancelled || settled) {
        return
      }

      settled = true
      setLyricsLoading(false)
      setLyricsText('')
      setLyricsError('Sözler bulunamadı.')
    }, 10000)

    const loadLyrics = async () => {
      try {
        const text = await fetchLyricsForTrack(currentTrack)
        if (cancelled || settled) {
          return
        }

        settled = true
        window.clearTimeout(timeout)

        setLruCacheValue(lyricsCacheRef.current, cacheKey, text || '', MAX_LYRICS_CACHE_ENTRIES)
        saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
        if (text) {
          setLyricsText(text)
          setLyricsError('')
        } else {
          setLyricsText('')
          setLyricsError('Sözler bulunamadı.')
        }
      } catch {
        if (!cancelled && !settled) {
          settled = true
          window.clearTimeout(timeout)
          setLyricsError('Sözler bulunamadı.')
          setLyricsText('')
        }
      } finally {
        if (!cancelled && settled) {
          setLyricsLoading(false)
        }
      }
    }

    loadLyrics()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [currentTrack, lyricsOpen, sidebarPlayerActive])

  useEffect(() => {
    if (selectedCollectionId === 'server') {
      setSelectedCollectionId('all')
      return
    }

    if (selectedCollectionId.startsWith('genre:')) {
      const exists = genreCollections.some((collection) => collection.id === selectedCollectionId)
      if (!exists) {
        setSelectedCollectionId('all')
      }
    }
  }, [genreCollections, selectedCollectionId])

  useEffect(() => {
    if (!coverBasedBackgroundEnabled || reduceAnimationsEnabled || lowPowerModeEnabled || !currentTrackId) {
      setCoverTransitionWashVisible(false)
      return undefined
    }

    setCoverTransitionWashVisible(true)
    const timeout = window.setTimeout(() => {
      setCoverTransitionWashVisible(false)
    }, 620)
    return () => window.clearTimeout(timeout)
  }, [coverBasedBackgroundEnabled, currentTrackId, lowPowerModeEnabled, reduceAnimationsEnabled])

  const handleLyricsFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !currentTrack?.id) {
      event.target.value = ''
      return
    }

    try {
      const text = normalizeLyricsText(await file.text())
      const cacheKey = `${normalizeArtistQuery(currentTrack.artist || '').toLowerCase()}|${cleanTrackTitleForLyrics(
        currentTrack.title || '',
      ).toLowerCase()}`
      setLruCacheValue(lyricsCacheRef.current, cacheKey, text || '', MAX_LYRICS_CACHE_ENTRIES)
      saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
      setLyricsText(text || '')
      setLyricsError(text ? '' : 'Sözler bulunamadı.')
      setLyricsLoading(false)
    } catch {
      setLyricsError('Sözler bulunamadı.')
      setLyricsText('')
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    saveUiPrefs({
      ...loadUiPrefs(),
      themeMode,
      closeBehavior,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      mediaToggleShortcut,
      monoAudioEnabled,
      language,
      sharedManifestUrl,
      backgroundStyle,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      hardwareAccelerationEnabled,
      fullscreenEffectsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
    })
    updateAppSettings({
      themeMode,
      closeBehavior,
      hardwareAccelerationEnabled,
      resetShortcutEnabled,
      mediaToggleShortcut,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
    })
  }, [arrowSeekEnabled, backgroundColor1, backgroundColor2, backgroundStyle, closeBehavior, compactListEnabled, coverBasedBackgroundEnabled, fullscreenEffectsEnabled, hardwareAccelerationEnabled, language, lowPowerModeEnabled, mediaToggleShortcut, monoAudioEnabled, reduceAnimationsEnabled, resetShortcutEnabled, sharedManifestUrl, showScrollbars, spaceKeyPlaybackEnabled, themeMode])

  useEffect(() => {
    if (!isHydrated || appBackgrounded) {
      return undefined
    }

    let cancelled = false
    const tracksNeedingRemoteMeta = tracks.filter(
      (track) =>
        (
          (!track.coverUrl && !track.coverRemoteUrl) ||
          !String(track.album || '').trim() ||
          String(track.album || '').trim().toLowerCase() === 'single' ||
          !normalizeGenreName(track.genre || '')
        ) &&
        track.title &&
        track.artist &&
        track.artist !== 'Yerel Koleksiyon',
    )

    const runQueue = async () => {
      for (const track of tracksNeedingRemoteMeta) {
        if (cancelled) {
          break
        }

        const cacheKey = `${normalizeArtistQuery(track.artist)}|${track.title}`.toLowerCase()
        const needsCover = !track.coverUrl && !track.coverRemoteUrl
        const normalizedAlbum = String(track.album || '').trim()
        const needsAlbum = !normalizedAlbum || normalizedAlbum.toLowerCase() === 'single'
        const normalizedGenre = normalizeGenreName(track.genre || '')
        const needsGenre = !normalizedGenre
        const cachedCover = getLruCacheValue(coverArtCacheRef.current, cacheKey)
        const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()
        const cachedGenre = normalizeGenreName(getLruCacheValue(genreCacheRef.current, cacheKey) || '')
        const hasUsableCachedCover = Boolean(cachedCover)
        const hasUsableCachedAlbum = Boolean(cachedAlbum && cachedAlbum.toLowerCase() !== 'single')
        const hasUsableCachedGenre = Boolean(cachedGenre)
        const cachedUpdates = {}

        if (needsCover && cachedCover) {
          cachedUpdates.coverRemoteUrl = cachedCover
        }
        if (needsAlbum && cachedAlbum && cachedAlbum.toLowerCase() !== 'single') {
          cachedUpdates.album = cachedAlbum
        }
        if (needsGenre && cachedGenre) {
          cachedUpdates.genre = cachedGenre
        }
        if (Object.keys(cachedUpdates).length) {
          updateTrack(track.id, cachedUpdates)
        }

        if (
          (!needsCover || hasUsableCachedCover) &&
          (!needsAlbum || hasUsableCachedAlbum) &&
          (!needsGenre || hasUsableCachedGenre)
        ) {
          await new Promise((resolve) => scheduleIdle(resolve))
          continue
        }

        try {
          const remoteMeta = await fetchRemoteTrackMetaSmart(track.title, track.artist, {
            preferredDuration: Number(track.duration || 0),
          })
          if (cancelled) {
            break
          }

          let remoteAlbum = String(remoteMeta?.album || '').trim()
          let remoteCover = remoteMeta?.coverUrl || ''
          let remoteGenre = normalizeGenreName(remoteMeta?.genre || '')
          if (!remoteCover || !remoteAlbum || remoteAlbum.toLowerCase() === 'single') {
            try {
              const fallbackIdentity = await inferTrackIdentityFromTitle(track.title)
              const fallbackArtistMatches = areArtistsCompatible(
                track.artist,
                String(fallbackIdentity?.artist || ''),
              )
              if (fallbackArtistMatches) {
                if (!remoteCover && fallbackIdentity?.coverUrl) {
                  remoteCover = fallbackIdentity.coverUrl
                }
                if ((!remoteAlbum || remoteAlbum.toLowerCase() === 'single') && fallbackIdentity?.album) {
                  remoteAlbum = String(fallbackIdentity.album).trim()
                }
              }
            } catch {
              // ignore fallback lookup errors
            }
          }
          setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCover, MAX_COVER_CACHE_ENTRIES)
          setLruCacheValue(albumCacheRef.current, cacheKey, remoteAlbum, MAX_ALBUM_CACHE_ENTRIES)
          setLruCacheValue(genreCacheRef.current, cacheKey, remoteGenre, MAX_GENRE_CACHE_ENTRIES)
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
          saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
          saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)

          const updates = {}
          if (needsCover && remoteCover) {
            updates.coverRemoteUrl = remoteCover
          }
          if (needsAlbum && remoteAlbum && remoteAlbum.toLowerCase() !== 'single') {
            updates.album = remoteAlbum
          }
          if (needsGenre && remoteGenre) {
            updates.genre = remoteGenre
          }
          if (Object.keys(updates).length) {
            updateTrack(track.id, updates)
          }
        } catch {
          if (!cancelled) {
            setLruCacheValue(coverArtCacheRef.current, cacheKey, '', MAX_COVER_CACHE_ENTRIES)
            setLruCacheValue(albumCacheRef.current, cacheKey, '', MAX_ALBUM_CACHE_ENTRIES)
            setLruCacheValue(genreCacheRef.current, cacheKey, '', MAX_GENRE_CACHE_ENTRIES)
            saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
            saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
            saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
          }
        }

        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appBackgrounded, isHydrated, tracks])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    let cancelled = false
    const tracksNeedingTone = tracks.filter(
      (track) =>
        !track.coverTone && (track.coverUrl || track.coverRemoteUrl) && track.id,
    )

    const runQueue = async () => {
      for (const track of tracksNeedingTone) {
        if (cancelled) {
          break
        }

        const source = track.coverUrl || track.coverRemoteUrl
        const cacheKey = source || track.id

        if (Object.prototype.hasOwnProperty.call(coverToneCacheRef.current, cacheKey)) {
          const cachedTone = coverToneCacheRef.current[cacheKey]
          if (cachedTone && !cancelled) {
            updateTrack(track.id, { coverTone: cachedTone })
          }
          await new Promise((resolve) => scheduleIdle(resolve))
          continue
        }

        try {
          const tone = await extractDominantColor(source)
          if (cancelled) {
            break
          }

          coverToneCacheRef.current[cacheKey] = tone || ''
          saveJsonCache(COVER_TONE_CACHE_KEY, coverToneCacheRef.current)
          if (tone) {
            updateTrack(track.id, { coverTone: tone })
          }
        } catch {
          if (!cancelled) {
            coverToneCacheRef.current[cacheKey] = ''
            saveJsonCache(COVER_TONE_CACHE_KEY, coverToneCacheRef.current)
          }
        }

        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isHydrated, tracks])

  useEffect(() => {
    setDockPlaylistMenuOpen(false)
  }, [currentTrackId])

  useEffect(() => {
    if (!isCustomPlaylistSelected) {
      setPlaylistAddOpen(false)
    }
  }, [isCustomPlaylistSelected])

  async function addFilesToLibrary(incomingFiles) {
    const files = Array.from(incomingFiles || []).filter((file) =>
      file?.type?.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file?.name || ''),
    )
    if (!files.length) {
      showUploadNotice('Ses dosyası bulunamadı.')
      return
    }

    const existingSignatures = new Set(allTracks.map(getTrackSignature))
    const createdTracks = []
    const nextTrackOrder =
      Math.max(-1, ...allTracks.map((track, index) => getTrackSortValue(track, index))) + 1
    let duplicateName = ''

    for (const [index, file] of files.entries()) {
      const audioUrl = URL.createObjectURL(file)
      const metadata = await readTrackMetadata(file)
      const parsedName = parseTrackName(file.name)
        let title = cleanFilenameTrackTitle(metadata?.title || parsedName.title) || 'Bilinmeyen parça'
      let artist = metadata?.artist || parsedName.artist
      let album = (metadata?.album || '').trim()

      let inferredIdentity = null
      const needsArtistInference =
        !metadata?.artist?.trim() &&
        (!artist || artist === 'Yerel Koleksiyon') &&
        Boolean(title)

      if (needsArtistInference) {
        try {
          inferredIdentity = await inferTrackIdentityFromTitle(title)
          if (inferredIdentity?.artist) {
            artist = inferredIdentity.artist
          }
          if (inferredIdentity?.title) {
            title = cleanFilenameTrackTitle(inferredIdentity.title) || title
          }
          if (!album && inferredIdentity?.album) {
            album = inferredIdentity.album
          }
        } catch {
          inferredIdentity = null
        }
      }

      const durationValue = await readDuration(audioUrl)
      const signature = getTrackSignature({
        title,
        artist,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        duration: durationValue,
      })

      if (existingSignatures.has(signature)) {
        URL.revokeObjectURL(audioUrl)
        if (!duplicateName) {
          duplicateName = `${artist} - ${title}`.trim()
        }
        continue
      }

      existingSignatures.add(signature)
      let remoteCoverUrl = ''
      let resolvedGenre = normalizeGenreName(metadata?.genre || '')
      if (title && artist && artist !== 'Yerel Koleksiyon') {
        let cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
        let remoteMeta = await fetchRemoteTrackMetaSmart(title, artist, {
          preferredAlbum: album || inferredIdentity?.album || '',
          preferredDuration: Number(durationValue || 0),
        })
        if (remoteMeta?.swapped) {
          const swappedTitle = cleanFilenameTrackTitle(artist) || title
          const swappedArtist = sanitizeDisplayText(title) || artist
          title = swappedTitle
          artist = swappedArtist
          cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
        }
        if (
          (!remoteMeta?.coverUrl || !remoteMeta?.album || String(remoteMeta.album).trim().toLowerCase() === 'single') &&
          title
        ) {
          try {
            const fallbackIdentity = await inferTrackIdentityFromTitle(title)
            const fallbackArtistMatches = areArtistsCompatible(
              artist,
              String(fallbackIdentity?.artist || ''),
            )
            if (fallbackArtistMatches) {
              remoteMeta = {
                ...remoteMeta,
                coverUrl: remoteMeta?.coverUrl || fallbackIdentity?.coverUrl || '',
                album: String(remoteMeta?.album || '').trim() || String(fallbackIdentity?.album || '').trim(),
              }
            }
          } catch {
            // ignore fallback lookup errors
          }
        }
        remoteCoverUrl = remoteMeta?.coverUrl || inferredIdentity?.coverUrl || ''
        resolvedGenre = normalizeGenreName(remoteMeta?.genre || resolvedGenre)
        if (!album && remoteMeta?.album) {
          album = String(remoteMeta.album).trim()
        }
        if (!album && inferredIdentity?.album) {
          album = String(inferredIdentity.album).trim()
        }
        setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
        setLruCacheValue(
          albumCacheRef.current,
          cacheKey,
          String(remoteMeta.album || inferredIdentity?.album || '').trim(),
          MAX_ALBUM_CACHE_ENTRIES,
        )
        setLruCacheValue(
          genreCacheRef.current,
          cacheKey,
          normalizeGenreName(remoteMeta?.genre || resolvedGenre || ''),
          MAX_GENRE_CACHE_ENTRIES,
        )
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
      }
      if (!album) {
        album = 'Single'
      }

      assetUrlsRef.current.push(audioUrl)

      createdTracks.push({
        id: `${file.name}-${file.lastModified}-${index}`,
        title,
        artist,
        album,
        genre: resolvedGenre || '',
        fileName: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        duration: durationValue,
        gradient: gradients[(tracks.length + index) % gradients.length],
        audioBlob: file,
        audioUrl,
        coverBlob: null,
        coverUrl: '',
        coverRemoteUrl: remoteCoverUrl,
        coverTone: '',
        coverName: '',
        isFavorite: false,
        createdAt: Date.now(),
        order: nextTrackOrder + index,
        source: 'local',
      })
    }

    if (createdTracks.length) {
      setTracks((prev) => [...prev, ...createdTracks])
    }

    if (duplicateName) {
      showUploadNotice(`${duplicateName} zaten ekli.`)
    }

    if (!currentTrackId && createdTracks[0]) {
      setProgress(0)
      setDuration(createdTracks[0].duration || 0)
      setCurrentTrackId(createdTracks[0].id)
      setIsPlaying(false)
      openEditor(createdTracks[0])
      restoreSeekRef.current = 0
    }

    closeAddModal()
  }

  addFilesToLibraryRef.current = addFilesToLibrary

  const handleUpload = async (event) => {
    await addFilesToLibrary(event.target.files || [])
    event.target.value = ''
  }

  const handleLinkAdd = async () => {
    const title = cleanFilenameTrackTitle(linkDraft.title) || ''
    const artist = linkDraft.artist.trim()
    const audioUrl = normalizeDriveUrl(linkDraft.audioUrl)
    const coverUrlInput = normalizeDriveUrl(linkDraft.coverUrl)

    if (!title || !artist || !audioUrl) {
      showUploadNotice('Başlık, sanatçı ve link gerekli.')
      return
    }

    const signature = getTrackSignature({
      title,
      artist,
      audioUrl,
      source: 'link',
    })

    if (allTracks.some((track) => getTrackSignature(track) === signature)) {
      showUploadNotice(`${artist} - ${title} zaten ekli.`)
      return
    }

    const cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
    const remoteMeta =
      artist && title && artist !== 'Yerel Koleksiyon'
        ? await fetchRemoteTrackMeta(title, artist)
        : { coverUrl: '', album: '', genre: '' }
        setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteMeta.coverUrl || '', MAX_COVER_CACHE_ENTRIES)
        setLruCacheValue(albumCacheRef.current, cacheKey, String(remoteMeta.album || '').trim(), MAX_ALBUM_CACHE_ENTRIES)
        setLruCacheValue(
          genreCacheRef.current,
          cacheKey,
          normalizeGenreName(remoteMeta.genre || ''),
          MAX_GENRE_CACHE_ENTRIES,
        )
    saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
    saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
    saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)

    const remoteCoverUrl = coverUrlInput || remoteMeta.coverUrl || ''
    const durationValue = await readDuration(audioUrl)

    const nextTrack = {
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      artist,
      album: String(remoteMeta.album || '').trim() || 'Single',
      genre: normalizeGenreName(remoteMeta.genre || ''),
      fileName: '',
      size: '',
      duration: durationValue,
      gradient: gradients[tracks.length % gradients.length],
      audioUrl,
      coverBlob: null,
      coverUrl: remoteCoverUrl,
      coverRemoteUrl: remoteCoverUrl,
      coverTone: '',
      coverName: coverUrlInput ? 'Bağlantı kapağı' : '',
      isFavorite: false,
      createdAt: Date.now(),
      order:
        Math.max(-1, ...allTracks.map((track, index) => getTrackSortValue(track, index))) + 1,
      source: 'link',
    }

    setTracks((prev) => [...prev, nextTrack])
    if (!currentTrackId) {
      setProgress(0)
      setDuration(durationValue || 0)
      setCurrentTrackId(nextTrack.id)
      setIsPlaying(false)
      restoreSeekRef.current = 0
    }

    closeAddModal()
    showUploadNotice('Bağlantı eklendi.')
  }

  const handlePoolUpload = async () => {
    const title = cleanFilenameTrackTitle(poolDraft.title) || ''
    const artist = poolDraft.artist.trim()
    const audioFile = poolDraft.audioFile
    const coverFile = poolDraft.coverFile

    if (!title || !artist || !audioFile) {
      showUploadNotice('Başlık, sanatçı ve şarkı dosyası gerekli.')
      return
    }

    try {
      const duration = await readDuration(URL.createObjectURL(audioFile))

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('title', title)
      formData.append('artist', artist)
      formData.append('duration', duration)
      if (coverFile) {
        formData.append('cover', coverFile)
      }

      const response = await fetch(`${API_BASE}/api/tracks`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        showUploadNotice('Havuza yükleme başarısız oldu.')
        return
      }

      const data = await response.json()
      if (data.track) {
        const track = data.track
        const normalizedTrack = normalizeDriveTrack(track, 'pool', '')
        setServerTracks((prev) => [normalizedTrack, ...prev])
        closeAddModal()
        showUploadNotice(`${artist} - ${title} başarıyla havuza yüklendi.`)
      }
    } catch (error) {
      showUploadNotice('Havuza yükleme sırasında hata oluştu.')
    }
  }

  const poolAdminManifestJson = useMemo(
    () =>
      JSON.stringify(
        {
          tracks: poolAdminTracks
            .map((track) => {
              const title = cleanFilenameTrackTitle(String(track.title || '').trim())
              const artist = sanitizeDisplayText(String(track.artist || '').trim())
              const downloadUrl = normalizeDriveUrl(String(track.downloadUrl || '').trim())
              const coverUrl = normalizeDriveUrl(String(track.coverUrl || '').trim())
              if (!downloadUrl) {
                return null
              }

              const hasMetadata = Boolean(title || artist || coverUrl)
              if (!hasMetadata) {
                return downloadUrl
              }

              return {
                ...(title ? { title } : {}),
                ...(artist ? { artist } : {}),
                downloadUrl,
                ...(coverUrl ? { coverUrl } : {}),
              }
            })
            .filter(Boolean),
        },
        null,
        2,
      ),
    [poolAdminTracks],
  )

  const poolAdminArtistSuggestions = useMemo(() => {
    const suggestions = new Set()

    for (const track of [...tracks, ...serverTracks, ...poolAdminTracks]) {
      const normalizedArtists = extractArtistCandidates(String(track?.artist || ''))
      if (normalizedArtists.length) {
        normalizedArtists.forEach((artist) => suggestions.add(artist))
      } else {
        const artist = sanitizeDisplayText(String(track?.artist || '').trim())
        if (artist) {
          suggestions.add(artist)
        }
      }
    }

    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'tr-TR'))
  }, [poolAdminTracks, serverTracks, tracks])

  const filteredPoolAdminTracks = useMemo(() => {
    const query = sanitizeDisplayText(String(poolAdminSearchQuery || '').toLowerCase().trim())
    if (!query) {
      return poolAdminTracks
    }

    return poolAdminTracks.filter((track) => {
      const artist = sanitizeDisplayText(String(track.artist || '').toLowerCase())
      const title = sanitizeDisplayText(String(track.title || '').toLowerCase())
      const link = String(track.downloadUrl || '').toLowerCase()
      return artist.includes(query) || title.includes(query) || link.includes(query)
    })
  }, [poolAdminSearchQuery, poolAdminTracks])

  const loadPoolAdminTracksFromGithub = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = Date.now()
      poolAdminLoadRequestRef.current = requestId
      setPoolAdminLoading(true)
      if (!silent) {
        setPoolAdminNotice("GitHub'dan tracks.json yükleniyor...")
      }

      const owner = String(poolGithubOwner || '').trim()
      const repo = String(poolGithubRepo || '').trim()
      const branch = String(poolGithubBranch || '').trim() || 'main'
      const path = String(poolGithubPath || '').trim().replace(/^\/+/, '') || 'tracks.json'
      const token = String(poolGithubToken || '').trim()

      try {
        let payload = null

        if (owner && repo && path) {
          const encodedPath = path
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/')
          const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
          const headers = {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }
          if (token) {
            headers.Authorization = `Bearer ${token}`
          }

          const response = await fetch(endpoint, { headers })
          if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`GitHub verisi okunamadı (${response.status})${errorText ? `: ${errorText}` : ''}`)
          }
          const json = await response.json()
          const content = typeof json?.content === 'string' ? json.content : ''
          if (!content) {
            throw new Error('GitHub dosya içeriği boş.')
          }
          payload = JSON.parse(decodeUtf8FromBase64(content))
        } else {
          const fallbackUrl = String(sharedManifestUrl || '').trim()
          if (!fallbackUrl) {
            throw new Error('GitHub owner/repo/path eksik ve yedek manifest URL yok.')
          }
          const response = await fetch(normalizeDriveUrl(fallbackUrl), { cache: 'no-store' })
          if (!response.ok) {
            throw new Error(`Manifest alınamadı (${response.status}).`)
          }
          payload = await response.json()
        }

        const parsed = parsePoolManifestTracks(payload)
        if (poolAdminLoadRequestRef.current !== requestId) {
          return
        }
        setPoolAdminTracks(parsed.map((track) => createPoolEditorTrack(track)))
        if (!silent) {
          setPoolAdminNotice(`GitHub'dan ${parsed.length} şarkı yüklendi.`)
        }
      } catch (error) {
        if (poolAdminLoadRequestRef.current !== requestId) {
          return
        }
        const message = error instanceof Error ? error.message : "GitHub'dan veri alınamadı."
        setPoolAdminNotice(message || "GitHub'dan veri alınamadı.")
      } finally {
        if (poolAdminLoadRequestRef.current === requestId) {
          setPoolAdminLoading(false)
        }
      }
    },
    [poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken, sharedManifestUrl],
  )

  const openPoolAdminPanel = useCallback(() => {
    setPoolAdminOpen(true)
    setPoolAdminUnlocked(false)
    setPoolAdminPasswordInput('')
    setPoolAdminAuthError('')
    setPoolAdminNotice('')
    setPoolAdminSearchQuery('')
    setPoolAdminTracks([])
    loadPoolAdminTracksFromGithub({ silent: true })
  }, [loadPoolAdminTracksFromGithub])

  const closePoolAdminPanel = useCallback(() => {
    setPoolAdminOpen(false)
    setPoolAdminUnlocked(false)
    setPoolAdminPasswordInput('')
    setPoolAdminAuthError('')
    setPoolAdminNotice('')
    setPoolAdminSearchQuery('')
  }, [])

  const unlockPoolAdminPanel = useCallback(() => {
    const normalizedPassword = String(poolAdminPasswordInput || '').trim()
    if (!normalizedPassword) {
      setPoolAdminAuthError('Şifre boş olamaz.')
      return
    }

    if (normalizedPassword === POOL_ADMIN_PASSWORD) {
      setPoolAdminUnlocked(true)
      setPoolAdminAuthError('')
      return
    }
    setPoolAdminAuthError('Şifre yanlış.')
  }, [poolAdminPasswordInput])

  useEffect(() => {
    if (!poolAdminOpen || poolAdminUnlocked) {
      return
    }
    const timer = window.setTimeout(() => {
      poolAdminPasswordInputRef.current?.focus()
      poolAdminPasswordInputRef.current?.select()
    }, 40)
    return () => window.clearTimeout(timer)
  }, [poolAdminOpen, poolAdminUnlocked])

  useEffect(() => {
    if (!poolAdminOpen || !poolAdminUnlocked) {
      return
    }
    const timer = window.setTimeout(() => {
      const grid = poolAdminGridRef.current
      if (!grid) {
        return
      }
      grid.scrollTop = grid.scrollHeight
    }, 40)
    return () => window.clearTimeout(timer)
  }, [poolAdminOpen, poolAdminUnlocked])

  const addPoolAdminTrack = useCallback(() => {
    setPoolAdminTracks((prev) => [...prev, createPoolEditorTrack({})])
  }, [])

  const updatePoolAdminTrack = useCallback((id, field, value) => {
    setPoolAdminTracks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }, [])

  const removePoolAdminTrack = useCallback((id) => {
    setPoolAdminTracks((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const downloadPoolManifestJson = useCallback(() => {
    try {
      const blob = new Blob([`${poolAdminManifestJson}\n`], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'tracks.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setPoolAdminNotice('tracks.json indirildi.')
    } catch {
      setPoolAdminNotice('Dosya indirme başarısız oldu.')
    }
  }, [poolAdminManifestJson])

  const publishPoolManifestToGithub = useCallback(async () => {
    const owner = String(poolGithubOwner || '').trim()
    const repo = String(poolGithubRepo || '').trim()
    const branch = String(poolGithubBranch || '').trim() || 'main'
    const path = String(poolGithubPath || '').trim().replace(/^\/+/, '') || 'tracks.json'
    const token = String(poolGithubToken || '').trim()

    if (!owner || !repo || !path || !token) {
      setPoolAdminNotice('GitHub kaydı için owner, repo, branch, path ve token gerekli.')
      return
    }

    const localTracks = poolAdminTracks.map((track) => normalizePoolManifestTrack(track)).filter(Boolean)

    setPoolGithubSaving(true)
    try {
      const encodedPath = path
        .split('/')
        .filter(Boolean)
        .map((item) => encodeURIComponent(item))
        .join('/')
      const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`

      const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      }

      const readGithubError = async (response) => {
        let detail = ''
        try {
          const json = await response.json()
          detail = String(json?.message || '').trim()
        } catch {
          // ignore body parse issues
        }
        return detail
      }

      let success = false

      for (let attempt = 0; attempt < 3; attempt += 1) {
        let sha = ''

        const currentFileResponse = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers })
        if (currentFileResponse.ok) {
          const currentFile = await currentFileResponse.json()
          sha = String(currentFile?.sha || '')
        } else if (currentFileResponse.status !== 404) {
          const detail = await readGithubError(currentFileResponse)
          throw new Error(
            `GitHub GET hatası (${currentFileResponse.status})${detail ? `: ${detail}` : ''}`,
          )
        }
        const payload = {
          message: `Update tracks.json from Ghxsty Music admin panel (${localTracks.length} track)`,
          branch,
          content: encodeUtf8ToBase64(
            `${JSON.stringify({ tracks: localTracks }, null, 2)}\n`,
          ),
          ...(sha ? { sha } : {}),
        }

        const updateResponse = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (updateResponse.ok) {
          success = true
          break
        }

        const detail = await readGithubError(updateResponse)
        const isRetryableConflict =
          updateResponse.status === 409 ||
          (updateResponse.status === 422 && /sha|update is not a fast forward/i.test(detail))
        if (isRetryableConflict && attempt < 2) {
          continue
        }

        throw new Error(
          `GitHub PUT hatası (${updateResponse.status})${detail ? `: ${detail}` : ''}`,
        )
      }

      if (!success) {
        throw new Error('GitHub kaydı sırasında çakışma oluştu. Tekrar dene.')
      }
      setPoolAdminNotice(`tracks.json güncellendi. Toplam ${localTracks.length} şarkı kaydedildi.`)
    } catch (error) {
      const message = String(error?.message || '').trim()
      const fallback = 'GitHub kaydı başarısız oldu. Token yetkisini ve repo bilgisini kontrol et.'
      setPoolAdminNotice(message || fallback)
    } finally {
      setPoolGithubSaving(false)
    }
  }, [poolAdminTracks, poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken])

  const persistPoolGithubPrefs = useCallback(
    (patch = {}) => {
      const currentPrefs = loadUiPrefs()
      const nextPrefs = {
        ...currentPrefs,
        poolGithubOwner:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubOwner')
            ? patch.poolGithubOwner
            : poolGithubOwner,
        poolGithubRepo:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubRepo')
            ? patch.poolGithubRepo
            : poolGithubRepo,
        poolGithubBranch:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubBranch')
            ? patch.poolGithubBranch
            : poolGithubBranch,
        poolGithubPath:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubPath')
            ? patch.poolGithubPath
            : poolGithubPath,
        poolGithubToken:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubToken')
            ? patch.poolGithubToken
            : poolGithubToken,
      }
      saveUiPrefs(nextPrefs)
    },
    [poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken],
  )

  const downloadPoolTrackToLibrary = useCallback(
    async (track, options = {}) => {
      const {
        suppressNotice = false,
        bypassBusy = false,
      } = options
      if (!track?.audioUrl || (!bypassBusy && (poolDownloadingTrackId || poolBulkDownloading))) {
        return
      }

      const title = String(track.title || '').trim() || 'Adsız parça'
      const artist = String(track.artist || '').trim() || 'Bilinmeyen sanatçı'
      const normalizedAudioUrl = normalizeDriveUrl(track.audioUrl || '')
      const normalizedCoverUrl = normalizeDriveUrl(track.coverUrl || '')
      const requestId = `pool-download-${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      upsertDownloadJob({
        requestId,
        status: 'starting',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })

      setPoolDownloadingTrackId(track.id)
      try {
        let audioFile = null
        let localFileAudioUrl = ''
        let blobSize = 0
        const safeBase = `${artist} - ${title}`.replace(/[\\/:*?"<>|]+/g, ' ').trim() || `track-${Date.now()}`

        if (typeof window !== 'undefined' && window.novaPlayer?.downloadRemoteAssetToLibrary) {
          const bridgeResult = await window.novaPlayer.downloadRemoteAssetToLibrary({
            requestId,
            url: normalizedAudioUrl,
            fileName: `${safeBase}.mp3`,
            title,
            artist,
          })
          if (bridgeResult?.ok && bridgeResult.fileUrl) {
            localFileAudioUrl = String(bridgeResult.fileUrl)
            blobSize = Number(bridgeResult.size || 0)
          } else {
            if (bridgeResult?.reason === 'aborted') {
              return
            }
            throw new Error(`bridge_download_to_library_failed:${String(bridgeResult?.reason || 'unknown')}`)
          }
        } else if (typeof window !== 'undefined' && window.novaPlayer?.downloadRemoteAsset) {
          const bridgeResult = await window.novaPlayer.downloadRemoteAsset({
            url: normalizedAudioUrl,
            fileName: `${safeBase}.mp3`,
          })
          if (!bridgeResult?.ok || !Array.isArray(bridgeResult.bytes) || !bridgeResult.bytes.length) {
            throw new Error('bridge_download_failed')
          }

          const ext = String(bridgeResult.extension || '.mp3').replace(/[^a-z0-9.]/gi, '') || '.mp3'
          const finalName = `${safeBase}${ext.startsWith('.') ? ext : `.${ext}`}`
          const byteArray = new Uint8Array(bridgeResult.bytes)
          const blob = new Blob([byteArray], {
            type: bridgeResult.contentType || 'audio/mpeg',
          })
          blobSize = blob.size || 0
          audioFile =
            typeof File === 'function'
              ? new File([blob], finalName, { type: blob.type || 'audio/mpeg' })
              : blob
          upsertDownloadJob({
            requestId,
            status: 'downloading',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
        } else {
          const response = await fetch(normalizedAudioUrl, { cache: 'no-store' })
          if (!response.ok) {
            throw new Error('download_failed')
          }
          const blob = await response.blob()
          blobSize = blob.size || 0
          const guessedExt =
            /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(normalizedAudioUrl)?.[1]?.toLowerCase() || 'mp3'
          const fileName = `${safeBase}.${guessedExt}`
          audioFile =
            typeof File === 'function'
              ? new File([blob], fileName, { type: blob.type || 'audio/mpeg' })
              : blob
          upsertDownloadJob({
            requestId,
            status: 'downloading',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
        }

        if (!audioFile && !localFileAudioUrl) {
          throw new Error('audiofile-missing')
        }

        const audioUrl = localFileAudioUrl || URL.createObjectURL(audioFile)
        const durationValue = Number(track.duration || 0) || (await readDuration(audioUrl))
        const signature = getTrackSignature({
          title,
          artist,
          size: blobSize ? `${(blobSize / 1024 / 1024).toFixed(1)} MB` : '',
          duration: durationValue,
        })

        if (allTracks.some((item) => getTrackSignature(item) === signature)) {
          if (!localFileAudioUrl) {
            URL.revokeObjectURL(audioUrl)
          }
          if (!suppressNotice) {
            showUploadNotice(`${artist} - ${title} zaten kütüphanende var.`)
          }
          upsertDownloadJob({
            requestId,
            status: 'completed',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
          return
        }

        if (!localFileAudioUrl) {
          assetUrlsRef.current.push(audioUrl)
        }
        let resolvedCoverUrl = normalizedCoverUrl
        let resolvedAlbum = String(track.album || '').trim() || 'Single'
        let resolvedGenre = normalizeGenreName(track.genre || '')
        if (title && artist && artist !== 'Yerel Koleksiyon') {
          const cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
          const cachedCover = String(getLruCacheValue(coverArtCacheRef.current, cacheKey) || '').trim()
          const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()
          const cachedGenre = normalizeGenreName(getLruCacheValue(genreCacheRef.current, cacheKey) || '')
          if (!resolvedCoverUrl && cachedCover) {
            resolvedCoverUrl = cachedCover
          }
          if ((!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') && cachedAlbum) {
            resolvedAlbum = cachedAlbum
          }
          if (!resolvedGenre && cachedGenre) {
            resolvedGenre = cachedGenre
          }
          if (!resolvedCoverUrl || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single' || !resolvedGenre) {
            try {
              const remoteMeta = await fetchRemoteTrackMetaSmart(title, artist, {
                preferredAlbum: resolvedAlbum,
                preferredDuration: Number(durationValue || 0),
              })
              if (!resolvedCoverUrl && remoteMeta?.coverUrl) {
                resolvedCoverUrl = remoteMeta.coverUrl
              }
              if (
                (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                remoteMeta?.album
              ) {
                resolvedAlbum = String(remoteMeta.album).trim()
              }
              if (!resolvedGenre && remoteMeta?.genre) {
                resolvedGenre = normalizeGenreName(remoteMeta.genre)
              }
              if (!resolvedCoverUrl || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') {
                const fallbackIdentity = await inferTrackIdentityFromTitle(title)
                const fallbackArtistMatches = areArtistsCompatible(
                  artist,
                  String(fallbackIdentity?.artist || ''),
                )
                if (fallbackArtistMatches) {
                  if (!resolvedCoverUrl && fallbackIdentity?.coverUrl) {
                    resolvedCoverUrl = fallbackIdentity.coverUrl
                  }
                  if (
                    (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                    fallbackIdentity?.album
                  ) {
                    resolvedAlbum = String(fallbackIdentity.album).trim()
                  }
                }
              }
            } catch {
              // keep current metadata if remote lookup fails
            }
          }
          setLruCacheValue(
            coverArtCacheRef.current,
            cacheKey,
            String(resolvedCoverUrl || '').trim(),
            MAX_COVER_CACHE_ENTRIES,
          )
          setLruCacheValue(
            albumCacheRef.current,
            cacheKey,
            String(resolvedAlbum || '').trim(),
            MAX_ALBUM_CACHE_ENTRIES,
          )
          setLruCacheValue(
            genreCacheRef.current,
            cacheKey,
            String(resolvedGenre || '').trim(),
            MAX_GENRE_CACHE_ENTRIES,
          )
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
          saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
          saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
        }
        const nextTrack = {
          id: `pool-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          artist,
          album: String(resolvedAlbum || '').trim() || 'Single',
          genre: String(resolvedGenre || '').trim(),
          fileName:
            typeof audioFile?.name === 'string'
              ? audioFile.name
              : `${safeBase}.${String((/\.([a-z0-9]{2,5})(?:\?|$)/i.exec(audioUrl)?.[1] || 'mp3')).toLowerCase()}`,
          size: blobSize ? `${(blobSize / 1024 / 1024).toFixed(1)} MB` : '',
          duration: durationValue,
          gradient: track.gradient || gradients[tracks.length % gradients.length],
          audioBlob: audioFile,
          audioUrl,
          coverBlob: null,
          coverUrl: resolvedCoverUrl,
          coverRemoteUrl: resolvedCoverUrl,
          coverTone: track.coverTone || '',
          coverName: resolvedCoverUrl ? 'Havuz kapağı' : '',
          isFavorite: false,
          createdAt: Date.now(),
          poolSourceAudioUrl: normalizedAudioUrl,
          order:
            Math.max(-1, ...allTracks.map((item, index) => getTrackSortValue(item, index))) + 1,
          source: localFileAudioUrl ? 'link' : 'local',
        }

        setTracks((prev) => [...prev, nextTrack])
        const normalizedArtistAfterAdd = normalizeCoverMatchText(String(nextTrack.artist || ''))
        const artistUnknownAfterAdd =
          !normalizedArtistAfterAdd ||
          normalizedArtistAfterAdd === 'yerel koleksiyon' ||
          normalizedArtistAfterAdd === 'bilinmeyen sanatci'
        const missingCoverAfterAdd = !String(nextTrack.coverUrl || nextTrack.coverRemoteUrl || '').trim()
        const missingAlbumAfterAdd =
          !String(nextTrack.album || '').trim() ||
          String(nextTrack.album || '').trim().toLowerCase() === 'single'

        if (missingCoverAfterAdd || artistUnknownAfterAdd || missingAlbumAfterAdd) {
          window.setTimeout(async () => {
            try {
              let retryTitle = String(nextTrack.title || '').trim()
              let retryArtist = String(nextTrack.artist || '').trim()
              let retryAlbum = String(nextTrack.album || '').trim() || 'Single'
              let retryGenre = normalizeGenreName(nextTrack.genre || '')
              let retryCover = String(nextTrack.coverRemoteUrl || nextTrack.coverUrl || '').trim()

              const inferredIdentity = await inferTrackIdentityFromTitle(retryTitle)
              const inferredArtist = String(inferredIdentity?.artist || '').trim()
              if (artistUnknownAfterAdd && inferredArtist) {
                retryArtist = inferredArtist
              }
              if (!retryCover && inferredIdentity?.coverUrl) {
                retryCover = String(inferredIdentity.coverUrl).trim()
              }
              if (
                (!retryAlbum || retryAlbum.toLowerCase() === 'single') &&
                inferredIdentity?.album
              ) {
                retryAlbum = String(inferredIdentity.album).trim()
              }

              const normalizedRetryArtist = normalizeCoverMatchText(retryArtist)
              const retryArtistUnknown =
                !normalizedRetryArtist ||
                normalizedRetryArtist === 'yerel koleksiyon' ||
                normalizedRetryArtist === 'bilinmeyen sanatci'

              if (retryTitle && !retryArtistUnknown) {
                const remoteMeta = await fetchRemoteTrackMetaSmart(retryTitle, retryArtist, {
                  preferredAlbum: retryAlbum,
                  preferredDuration: Number(nextTrack.duration || 0),
                })
                if (!retryCover && remoteMeta?.coverUrl) {
                  retryCover = String(remoteMeta.coverUrl).trim()
                }
                if (
                  (!retryAlbum || retryAlbum.toLowerCase() === 'single') &&
                  remoteMeta?.album
                ) {
                  retryAlbum = String(remoteMeta.album).trim()
                }
                if (!retryGenre && remoteMeta?.genre) {
                  retryGenre = normalizeGenreName(remoteMeta.genre)
                }
              }

              const updates = {}
              if (retryArtist && retryArtist !== nextTrack.artist) {
                updates.artist = retryArtist
              }
              if (retryCover && retryCover !== (nextTrack.coverRemoteUrl || nextTrack.coverUrl || '')) {
                updates.coverRemoteUrl = retryCover
                updates.coverUrl = retryCover
                updates.coverName = 'Otomatik kapak'
              }
              if (retryAlbum && retryAlbum !== nextTrack.album) {
                updates.album = retryAlbum
              }
              if (retryGenre && retryGenre !== normalizeGenreName(nextTrack.genre || '')) {
                updates.genre = retryGenre
              }

              if (Object.keys(updates).length) {
                setTracks((prev) =>
                  prev.map((item) => (item.id === nextTrack.id ? { ...item, ...updates } : item)),
                )
              }

              if (retryTitle && retryArtist && normalizeCoverMatchText(retryArtist)) {
                const retryCacheKey = `${normalizeArtistQuery(retryArtist)}|${retryTitle}`.toLowerCase()
                setLruCacheValue(
                  coverArtCacheRef.current,
                  retryCacheKey,
                  String(retryCover || '').trim(),
                  MAX_COVER_CACHE_ENTRIES,
                )
                setLruCacheValue(
                  albumCacheRef.current,
                  retryCacheKey,
                  String(retryAlbum || '').trim(),
                  MAX_ALBUM_CACHE_ENTRIES,
                )
                setLruCacheValue(
                  genreCacheRef.current,
                  retryCacheKey,
                  String(retryGenre || '').trim(),
                  MAX_GENRE_CACHE_ENTRIES,
                )
                saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
                saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
                saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
              }
            } catch {
              // ignore retry lookup failures
            }
          }, 0)
        }
        if (!currentTrackId) {
          setProgress(0)
          setDuration(nextTrack.duration || 0)
          setCurrentTrackId(nextTrack.id)
          setIsPlaying(false)
          restoreSeekRef.current = 0
        }
        if (!suppressNotice) {
          showUploadNotice(`${artist} - ${title} kütüphaneye indirildi.`)
        }
        upsertDownloadJob({
          requestId,
          status: 'completed',
          receivedBytes: blobSize,
          totalBytes: blobSize,
          title,
          artist,
        })
      } catch (error) {
        const reason = String(error?.message || '')
        if (!suppressNotice) {
          if (reason.includes('invalid-content-type')) {
            showUploadNotice('Havuz parçası indirilemedi: link ses dosyası yerine web sayfası döndürüyor.')
          } else if (reason.includes('drive-confirm-required')) {
            showUploadNotice('Havuz parçası indirilemedi: Drive indirme onayı gerekli görünüyor.')
          } else {
            showUploadNotice('Havuz parçası indirilemedi.')
          }
        }
        upsertDownloadJob({
          requestId,
          status: 'failed',
          receivedBytes: 0,
          totalBytes: 0,
          title,
          artist,
        })
      } finally {
        setPoolDownloadingTrackId(null)
      }
    },
    [allTracks, currentTrackId, poolBulkDownloading, poolDownloadingTrackId, showUploadNotice, tracks.length, upsertDownloadJob],
  )

  const downloadSelectedPoolTracks = useCallback(async () => {
    if (poolBulkDownloading || poolDownloadingTrackId) {
      return
    }

    const queue = selectablePoolTracks
    if (!queue.length) {
      showUploadNotice('İndirilecek şarkı seçmedin.')
      return
    }

    setPoolBulkDownloading(true)
    let successCount = 0

    try {
      for (const track of queue) {
        await downloadPoolTrackToLibrary(track, { suppressNotice: true, bypassBusy: true })
        successCount += 1
        await new Promise((resolve) => window.setTimeout(resolve, 16))
      }
      showUploadNotice(`${successCount} şarkı kütüphanene eklendi.`)
      setPoolSelectedTrackIds([])
      poolSelectionAnchorIdRef.current = null
    } catch {
      showUploadNotice('Toplu indirme sırasında bir hata oluştu.')
    } finally {
      setPoolBulkDownloading(false)
    }
  }, [downloadPoolTrackToLibrary, poolBulkDownloading, poolDownloadingTrackId, selectablePoolTracks, showUploadNotice])

  const downloadablePoolTracks = useMemo(
    () =>
      selectedCollectionId === 'pool'
        ? displayedTracks.filter((track) => track.audioUrl && !isTrackInLocalLibrary(track))
        : [],
    [displayedTracks, isTrackInLocalLibrary, selectedCollectionId],
  )

  const downloadAllPoolTracks = useCallback(async () => {
    if (poolBulkDownloading || poolDownloadingTrackId) {
      return
    }

    const queue = downloadablePoolTracks
    if (!queue.length) {
      showUploadNotice('İndirilecek şarkı bulunamadı.')
      return
    }

    setPoolBulkDownloading(true)
    let successCount = 0

    try {
      for (const track of queue) {
        await downloadPoolTrackToLibrary(track, { suppressNotice: true, bypassBusy: true })
        successCount += 1
        await new Promise((resolve) => window.setTimeout(resolve, 16))
      }
      showUploadNotice(`Hepsi indir tamamlandı. ${successCount} şarkı eklendi.`)
      setPoolSelectedTrackIds([])
      poolSelectionAnchorIdRef.current = null
    } catch {
      showUploadNotice('Hepsi indir sırasında bir hata oluştu.')
    } finally {
      setPoolBulkDownloading(false)
    }
  }, [downloadPoolTrackToLibrary, downloadablePoolTracks, poolBulkDownloading, poolDownloadingTrackId, showUploadNotice])

  const canSwitchTrackNow = useCallback((showNotice = false) => {
    const now = Date.now()
    if (now < trackSwitchCooldownUntilRef.current) {
      if (showNotice) {
        showUploadNotice('Yeni şarkıya geçmek için 1 sn bekle.')
      }
      return false
    }
    return true
  }, [showUploadNotice])

  const setTrackSwitchCooldown = useCallback(() => {
    trackSwitchCooldownUntilRef.current = Date.now() + TRACK_SWITCH_COOLDOWN_MS
  }, [])

  const switchTrack = (nextTrack, shouldPlay = true, options = {}) => {
    if (!nextTrack) {
      return
    }
    const { withFade = true, enforceCooldown = false, collectionId = null } = options
    if (enforceCooldown && !canSwitchTrackNow(true)) {
      return
    }

    setProgress(0)
    setDuration(nextTrack.duration || 0)
    setCurrentTrackId(nextTrack.id)
    setIsPlaying(shouldPlay)
    restoreSeekRef.current = 0
    trackSwitchFadeUntilRef.current = withFade && shouldPlay
      ? Date.now() + TRACK_SWITCH_FADE_MS
      : 0
    if (!shouldPlay && audioRef.current) {
      audioRef.current.volume = volume
    }
    if (enforceCooldown) {
      setTrackSwitchCooldown()
    }
    if (collectionId) {
      const safeCollectionId = collectionId === 'pool' || collectionId === 'server' ? 'all' : collectionId
      setPlaybackCollectionId(safeCollectionId)
    }
  }

  switchTrackRef.current = switchTrack

  const toggleShuffleMode = () => {
    setShuffleEnabled((prev) => {
      const nextValue = !prev
      if (nextValue) {
        shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
        applyShuffleOrderIds([])
        setRepeatEnabled(false)
      } else {
        applyShuffleOrderIds([])
      }
      return nextValue
    })
  }

  const toggleRepeatMode = () => {
    setRepeatEnabled((prev) => {
      const nextValue = !prev
      if (nextValue) {
        setShuffleEnabled(false)
      }
      return nextValue
    })
  }

  const playSelectedCollection = () => {
    if (!isPlaylistCollectionSelected || !visibleTracks.length) {
      return
    }

    applyQueuedNextTracks([])
    setShuffleEnabled(false)
    setRepeatEnabled(false)
    switchTrack(visibleTracks[0], true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
  }

  const shufflePlaySelectedCollection = () => {
    if (!isPlaylistCollectionSelected || !visibleTracks.length) {
      return
    }

    const randomIndex = Math.floor(Math.random() * visibleTracks.length)
    const randomTrack = visibleTracks[randomIndex] || visibleTracks[0]
    shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
    applyQueuedNextTracks([])
    applyShuffleOrderIds([])
    setRepeatEnabled(false)
    setShuffleEnabled(true)
    switchTrack(randomTrack, true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
  }

  const playGenreFromDock = (genreCollectionId) => {
    const targetGenre = genreCollections.find((item) => item.id === genreCollectionId)
    if (!targetGenre) {
      return
    }

    const playlistTracks = getTracksByCollectionId(genreCollectionId)
    if (!playlistTracks.length) {
      handleCollectionSelect(genreCollectionId)
      return
    }

    handleCollectionSelect(genreCollectionId)
    applyQueuedNextTracks([])
    setRepeatEnabled(false)

    if (shuffleEnabled) {
      const randomIndex = Math.floor(Math.random() * playlistTracks.length)
      const randomTrack = playlistTracks[randomIndex] || playlistTracks[0]
      shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
      applyShuffleOrderIds([])
      setShuffleEnabled(true)
      switchTrack(randomTrack, true, {
        enforceCooldown: true,
        collectionId: genreCollectionId,
      })
      return
    }

    setShuffleEnabled(false)
    switchTrack(playlistTracks[0], true, {
      enforceCooldown: true,
      collectionId: genreCollectionId,
    })
  }

  const [playlistDockDragging, setPlaylistDockDragging] = useState(false)

  const handlePlaylistDockPointerDown = useCallback((event) => {
    if (event.button !== 0) {
      return
    }
    const container = playlistDockRef.current
    if (!(container instanceof HTMLElement)) {
      return
    }
    playlistDockDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    }
    suppressPlaylistDockClickRef.current = false
    setPlaylistDockDragging(false)
  }, [])

  const handlePlaylistDockPointerMove = useCallback((event) => {
    const container = playlistDockRef.current
    const dragState = playlistDockDragRef.current
    if (!(container instanceof HTMLElement) || !dragState.active) {
      return
    }
    const deltaX = event.clientX - dragState.startX
    if (Math.abs(deltaX) > 4) {
      suppressPlaylistDockClickRef.current = true
      setPlaylistDockDragging(true)
    }
    container.scrollLeft = dragState.startScrollLeft - deltaX
  }, [])

  const handlePlaylistDockPointerUp = useCallback(() => {
    playlistDockDragRef.current.active = false
    setPlaylistDockDragging(false)
  }, [])

  const handlePlaylistDockClickCapture = useCallback((event) => {
    if (!suppressPlaylistDockClickRef.current) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    suppressPlaylistDockClickRef.current = false
  }, [])

  useEffect(() => {
    if (!genreCollections.length || !selectedCollectionId.startsWith('genre:')) {
      return
    }
    const container = playlistDockRef.current
    if (!(container instanceof HTMLElement)) {
      return
    }
    const target = container.querySelector(`[data-genre-dock-id="${CSS.escape(selectedCollectionId)}"]`)
    if (!(target instanceof HTMLElement)) {
      return
    }
    const rafId = window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      })
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [genreCollections, selectedCollectionId])

  const togglePlayback = () => {
    if (!allTracks.length) {
      openAddModal()
      return
    }

    if (!currentTrack && allTracks[0]) {
      const starterPool = playbackTracks.length ? playbackTracks : visibleTracks
      const starterTrack = shuffleEnabled
        ? (getNextTrack() || starterPool[0] || allTracks[0])
        : (starterPool[0] || allTracks[0])
      if (!starterTrack) {
        return
      }
      setProgress(0)
      setDuration(starterTrack.duration || 0)
      setCurrentTrackId(starterTrack.id)
      setIsPlaying(true)
      restoreSeekRef.current = 0
      setPlaybackCollectionId(
        selectedCollectionId === 'pool' || selectedCollectionId === 'server'
          ? 'all'
          : selectedCollectionId,
      )
      return
    }

    setIsPlaying((prev) => !prev)
  }

  const handleWindowMinimize = useCallback((event) => {
    event?.stopPropagation?.()
    window?.novaPlayer?.minimizeWindow?.()
  }, [])

  const handleWindowToggleMaximize = useCallback(async (event) => {
    event?.stopPropagation?.()
    if (!window?.novaPlayer?.toggleWindowMaximize) {
      return
    }
    try {
      const result = await window.novaPlayer.toggleWindowMaximize()
      if (result && typeof result.isMaximized === 'boolean') {
        setWindowIsMaximized(result.isMaximized)
      }
    } catch {
      // ignore toggle failures
    }
  }, [])

  const handleWindowClose = useCallback((event) => {
    event?.stopPropagation?.()
    window?.novaPlayer?.closeWindow?.()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const applyLayoutState = (layoutState) => {
      const canUse = Boolean(layoutState?.isFullScreen || layoutState?.isMaximized)
      setWindowCanUseSidebarPlayer(canUse)
      setWindowIsMaximized(Boolean(layoutState?.isMaximized))
    }

    const bridge = window.novaPlayer
    let mounted = true

    if (bridge?.getWindowLayoutState) {
      bridge
        .getWindowLayoutState()
        .then((state) => {
          if (!mounted) {
            return
          }
          applyLayoutState(state)
        })
        .catch(() => {})
    }

    const unsubscribe = bridge?.onWindowLayoutState?.((state) => {
      if (!mounted) {
        return
      }
      applyLayoutState(state)
    })

    return () => {
      mounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let rafId = null
    const syncTrackListLayout = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(() => {
        setTrackListLayoutVersion((prev) => (prev + 1) % 100000)
      })
    }

    window.addEventListener('resize', syncTrackListLayout)
    document.addEventListener('fullscreenchange', syncTrackListLayout)

    return () => {
      window.removeEventListener('resize', syncTrackListLayout)
      document.removeEventListener('fullscreenchange', syncTrackListLayout)
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  useEffect(() => {
    setTrackListLayoutVersion((prev) => (prev + 1) % 100000)
  }, [sidebarPlayerActive])

  useEffect(() => {
    if (sidebarPlayerActive) {
      setDockPointerInside(false)
      setDockProximityVisible(true)
      if (dockHideTimerRef.current) {
        window.clearTimeout(dockHideTimerRef.current)
        dockHideTimerRef.current = null
      }
      return undefined
    }

    const handlePointerMove = (event) => {
      if (dockPointerInside) {
        return
      }

      const viewportHeight = window.innerHeight || 0
      const nearBottomEdge = event.clientY >= viewportHeight - 120
      const rect = bottomDockRef.current?.getBoundingClientRect()
      const nearDockArea = rect
        ? event.clientX >= rect.left - 120 &&
          event.clientX <= rect.right + 120 &&
          event.clientY >= rect.top - 120 &&
          event.clientY <= rect.bottom + 120
        : false

      if (nearBottomEdge || nearDockArea) {
        if (dockHideTimerRef.current) {
          window.clearTimeout(dockHideTimerRef.current)
          dockHideTimerRef.current = null
        }
        setDockProximityVisible(true)
        return
      }

      if (dockHideTimerRef.current) {
        return
      }

      dockHideTimerRef.current = window.setTimeout(() => {
        setDockProximityVisible(false)
        dockHideTimerRef.current = null
      }, 160)
    }

    window.addEventListener('mousemove', handlePointerMove)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      if (dockHideTimerRef.current) {
        window.clearTimeout(dockHideTimerRef.current)
        dockHideTimerRef.current = null
      }
    }
  }, [dockPointerInside, sidebarPlayerActive])

  useEffect(() => {
    const handleSpacePlayback = (event) => {
      if (!spaceKeyPlaybackEnabled || event.defaultPrevented) {
        return
      }

      const activeElement = document.activeElement
      const tagName = activeElement?.tagName?.toLowerCase()
      const isTypingTarget =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        Boolean(activeElement?.isContentEditable)

      if (isTypingTarget || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.code === 'Space' || event.key === ' ') {
        if (event.repeat) {
          event.preventDefault()
          return
        }

        const now = Date.now()
        if (now < spaceToggleLockUntilRef.current) {
          event.preventDefault()
          return
        }

        spaceToggleLockUntilRef.current = now + 220
        event.preventDefault()
        togglePlayback()
      }
    }

    window.addEventListener('keydown', handleSpacePlayback)
    return () => window.removeEventListener('keydown', handleSpacePlayback)
  }, [spaceKeyPlaybackEnabled, togglePlayback])

  const handlePoolTrackRowClick = useCallback(
    (event, track, index) => {
      if (selectedCollectionId !== 'pool') {
        return
      }

      const target = event?.target
      if (target instanceof Element) {
        const interactiveAncestor = target.closest(
          'button, input, textarea, select, a, [role="menu"], .track-menu, .dock-playlist-menu',
        )
        if (interactiveAncestor) {
          return
        }
      }

      setPoolSelectedTrackIds((prev) => {
        const prevSet = new Set(prev)
        const hasCurrent = prevSet.has(track.id)

        if (event.shiftKey) {
          const anchorId = poolSelectionAnchorIdRef.current || track.id
          const anchorIndex = displayedTracks.findIndex((item) => item.id === anchorId)
          const toIndex = index
          const fromIndex = anchorIndex >= 0 ? anchorIndex : toIndex
          const start = Math.min(fromIndex, toIndex)
          const end = Math.max(fromIndex, toIndex)
          const rangeIds = displayedTracks.slice(start, end + 1).map((item) => item.id)
          const nextSet = new Set(event.ctrlKey || event.metaKey ? prev : [])
          rangeIds.forEach((id) => nextSet.add(id))
          poolSelectionAnchorIdRef.current = track.id
          return Array.from(nextSet)
        }

        if (event.ctrlKey || event.metaKey) {
          if (hasCurrent) {
            prevSet.delete(track.id)
          } else {
            prevSet.add(track.id)
          }
          poolSelectionAnchorIdRef.current = track.id
          return Array.from(prevSet)
        }

        poolSelectionAnchorIdRef.current = track.id
        return [track.id]
      })
    },
    [displayedTracks, selectedCollectionId],
  )

  const playTrack = (trackId) => {
    const selectedTrack = allTracks.find((track) => track.id === trackId)
    if (!selectedTrack) {
      return
    }

    if (selectedCollectionId === 'pool') {
      downloadPoolTrackToLibrary(selectedTrack)
      closeMenus()
      return
    }

    if (currentTrackId === selectedTrack.id) {
      restartTrack()
      setIsPlaying(true)
      closeMenus()
      return
    }

    switchTrack(selectedTrack, true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
    closeMenus()
  }

  const restartTrack = () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return
    }

    audio.currentTime = 0
    setProgress(0)
    restoreSeekRef.current = 0
  }

  const stepTrack = () => {
    if (repeatEnabled && currentTrack) {
      restartTrack()
      setIsPlaying(true)
      return
    }

    const nextTrack = getNextTrack({ consumeQueue: true, ignoreShuffle: false })
    if (!nextTrack) {
      return
    }

    switchTrack(nextTrack, true, { enforceCooldown: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const bridge = window.novaPlayer
    const unsubscribe = bridge?.onMediaControl?.((command) => {
      switch (String(command || '')) {
        case 'play-pause':
          togglePlayback()
          break
        case 'next-track':
          stepTrack()
          break
        case 'previous-track':
          restartTrack()
          break
        case 'stop':
          setIsPlaying(false)
          break
        default:
          break
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [restartTrack, stepTrack, togglePlayback])

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value)
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const activeDuration = Number.isFinite(audio.duration) ? audio.duration : duration
    const clampedTime = Number.isFinite(activeDuration) && activeDuration > 0
      ? Math.max(0, Math.min(nextTime, activeDuration))
      : Math.max(0, nextTime)

    audio.currentTime = clampedTime
    setProgress(clampedTime)
    restoreSeekRef.current = clampedTime
  }

  const handleVolumeChange = (event) => {
    setVolume(Number(event.target.value))
  }

  const handleEqualizerChange = (index, value) => {
    setEqualizerGains((prev) => prev.map((gain, gainIndex) => (gainIndex === index ? value : gain)))
  }

  const resetEqualizer = () => {
    setEqualizerGains(Array(equalizerBands.length).fill(0))
  }

  const selectAudioOutput = async (deviceId) => {
    setSelectedAudioOutputId(deviceId)
    setSettingsOpen(true)

    const audio = audioRef.current
    if (audio?.setSinkId) {
      try {
        await audio.setSinkId(deviceId)
      } catch {
      showUploadNotice('Ses çıkışı değiştirilemedi.')
      }
    }
  }

  const handleEditChange = (field, value) => {
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const openCoverPicker = () => {
    if (!editTargetId) {
      return
    }

    setCoverMenuOpen(false)
    coverInputRef.current?.click()
  }

  const requestCoverRemoval = () => {
    setPendingCover(null)
    setCoverRemovalRequested(true)
    setCoverMenuOpen(false)
  }

  const scrollToCoverStage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const refreshCurrentCover = useCallback(async () => {
    if (!currentTrack) {
      return
    }

    if (!window.confirm('Kapak resmini yeniden aramak istediğine emin misin?')) {
      return
    }

    try {
      const remoteCoverUrl = await fetchRemoteCoverArt(currentTrack.title || '', currentTrack.artist || '')
      if (!remoteCoverUrl) {
        showUploadNotice('Yeni kapak bulunamadı.')
        return
      }

      const coverTone = await extractDominantColor(remoteCoverUrl)
      const coverName = `${currentTrack.artist || 'Sanatçı'} - ${currentTrack.title || 'Parça'}`
      const cacheKey = `${normalizeArtistQuery(currentTrack.artist || '').toLowerCase()}::${normalizeArtistQuery(currentTrack.title || '').toLowerCase()}`
      setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
      saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)

      const nextUpdate = {
        coverUrl: remoteCoverUrl,
        coverRemoteUrl: remoteCoverUrl,
        coverTone,
        coverName,
      }

      if (tracks.some((track) => track.id === currentTrack.id)) {
        updateTrack(currentTrack.id, nextUpdate)
      }

      showUploadNotice('Kapak güncellendi.')
    } catch {
      showUploadNotice('Kapak aranırken bir sorun oluştu.')
    }
  }, [currentTrack, showUploadNotice, tracks, updateTrack])

  const refreshCurrentArtistFacts = useCallback(async () => {
    if (!currentTrack) {
      return
    }

    if (!window.confirm('Sanatçı bilgisini yeniden aramak istediğine emin misin?')) {
      return
    }

    setArtistFactsLoading(true)
    try {
      const facts = await fetchArtistFacts(currentTrack.artist || '')
      setLruCacheValue(
        artistFactsCacheRef.current,
        currentTrack.artist || '',
        facts,
        MAX_ARTIST_FACTS_CACHE_ENTRIES,
      )
      saveArtistFactsCache(artistFactsCacheRef.current)
      setArtistFacts(facts)
      showUploadNotice('Sanatçı bilgisi güncellendi.')
    } catch {
      showUploadNotice('Sanatçı bilgisi yenilenemedi.')
    } finally {
      setArtistFactsLoading(false)
    }
  }, [currentTrack, showUploadNotice])

  const openArtistProfile = useCallback((artistName) => {
    const candidates = extractArtistCandidates(String(artistName || ''))
    const normalized = candidates[0] || String(artistName || '').trim()
    if (!normalized) {
      return
    }
    setArtistProfileName(normalized)
    setArtistProfileOpen(true)
  }, [])

  const openAlbumInfo = useCallback(
    async (track) => {
      if (!track) {
        return
      }

      const albumName = String(track.album || '').trim() || 'Single'
      const artistName = String(track.artist || '').trim()
      const poolMatches = serverTracks.filter(
        (item) =>
          normalizeCoverMatchText(item.album || '') === normalizeCoverMatchText(albumName) &&
          doesArtistMatch(item.artist || '', artistName),
      )

      setAlbumInfoOpen(true)
      setAlbumInfoLoading(true)
      setAlbumInfo({
        album: albumName,
        artist: artistName || 'Bilinmeyen sanatçı',
        releaseDate: '',
        coverUrl: getTrackDisplayUrl(track, 'hero'),
        poolTracks: poolMatches,
      })

      try {
        const insight = await fetchAlbumInsights({
          artist: artistName,
          album: albumName,
          title: track.title || '',
        })

        setAlbumInfo((prev) => ({
          ...(prev || {}),
          album: String(insight?.album || albumName || '').trim() || albumName,
          artist: String(insight?.artist || artistName || '').trim() || (artistName || 'Bilinmeyen sanatçı'),
          releaseDate: String(insight?.releaseDate || '').trim(),
          coverUrl: String(insight?.coverUrl || prev?.coverUrl || '').trim(),
          poolTracks: poolMatches,
        }))
      } catch {
        // ignore lookup errors, base info is still shown
      } finally {
        setAlbumInfoLoading(false)
      }
    },
    [serverTracks],
  )

  useEffect(() => {
    if (!artistProfileOpen || !artistProfileName) {
      return
    }

    const candidates = extractArtistCandidates(artistProfileName)
    const cachedFacts = candidates
      .map((name) => getLruCacheValue(artistFactsCacheRef.current, name))
      .find((entry) => entry !== undefined)

    if (cachedFacts !== undefined) {
      setArtistProfileFacts(cachedFacts)
      setArtistProfileFactsLoading(false)
      return
    }

    let cancelled = false
    setArtistProfileFactsLoading(true)
    setArtistProfileFacts(null)

    const loadFacts = async () => {
      try {
        let facts = null
        for (const artistName of candidates) {
          if (!artistName) {
            continue
          }
          const fetched = await fetchArtistFacts(artistName)
          setLruCacheValue(artistFactsCacheRef.current, artistName, fetched, MAX_ARTIST_FACTS_CACHE_ENTRIES)
          if (!facts && fetched) {
            facts = fetched
          }
        }
        if (!facts) {
          candidates.forEach((artistName) => {
            if (!Object.prototype.hasOwnProperty.call(artistFactsCacheRef.current, artistName)) {
              setLruCacheValue(artistFactsCacheRef.current, artistName, null, MAX_ARTIST_FACTS_CACHE_ENTRIES)
            }
          })
        }
        saveArtistFactsCache(artistFactsCacheRef.current)
        if (!cancelled) {
          setArtistProfileFacts(facts)
        }
      } catch {
        if (!cancelled) {
          setArtistProfileFacts(null)
        }
      } finally {
        if (!cancelled) {
          setArtistProfileFactsLoading(false)
        }
      }
    }

    loadFacts()
    return () => {
      cancelled = true
    }
  }, [artistProfileName, artistProfileOpen])

  const handleCoverSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const coverUrl = URL.createObjectURL(file)
    assetUrlsRef.current.push(coverUrl)
    setPendingCover({ coverBlob: file, coverUrl, coverName: file.name })
    setCoverRemovalRequested(false)
    setCoverMenuOpen(false)
    event.target.value = ''
  }

  const handlePlaylistCoverSelect = async (event, target = 'create') => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const coverUrl = await readFileAsDataUrl(file)
      if (target === 'edit') {
        setPlaylistEditCoverDraft(coverUrl)
      } else {
        setPlaylistCoverDraft(coverUrl)
      }
    } catch {
      // Ignore invalid image files.
    } finally {
      event.target.value = ''
    }
  }

  const saveTrackChanges = async () => {
    if (!editTargetId || !editDraft) {
      return
    }

    const originalTrack = allTracks.find((track) => track.id === editTargetId)
    if (!originalTrack) {
      return
    }

    const newTitle = cleanFilenameTrackTitle(editDraft.title) || 'Bilinmeyen Şarkı'
    const newArtist = editDraft.artist.trim() || 'Bilinmeyen Sanatci'
    const newAlbum = editDraft.album?.trim() || 'Single'

    // Check if artist or title has changed
    const artistChanged = normalizeArtistQuery(originalTrack.artist || '') !== normalizeArtistQuery(newArtist)
    const titleChanged = originalTrack.title !== newTitle
    const albumChanged =
      normalizeCoverMatchText(originalTrack.album || 'Single') !== normalizeCoverMatchText(newAlbum || 'Single')

    let nextCover = pendingCover
      ? {
          coverBlob: pendingCover.coverBlob,
          coverUrl: pendingCover.coverUrl,
          coverName: pendingCover.coverName,
          coverRemoteUrl: '',
          coverTone: '',
        }
      : coverRemovalRequested
        ? {
            coverBlob: null,
            coverUrl: '',
            coverName: '',
            coverRemoteUrl: '',
            coverTone: '',
          }
        : {}
    let resolvedAlbum = newAlbum
    let resolvedGenre = normalizeGenreName(originalTrack?.genre || '')

    // If artist/title/album changed and no manual cover was provided, refresh remote metadata.
    if ((artistChanged || titleChanged || albumChanged) && !pendingCover && !coverRemovalRequested && newTitle && newArtist && newArtist !== 'Yerel Koleksiyon') {
      try {
        const cacheKey = `${normalizeArtistQuery(newArtist)}|${newTitle}`.toLowerCase()
        const remoteMeta = await fetchRemoteTrackMetaSmart(newTitle, newArtist, {
          preferredAlbum: newAlbum,
          preferredDuration: Number(originalTrack?.duration || 0),
        })
        const remoteCoverUrl = remoteMeta.coverUrl || ''
        const remoteAlbum = String(remoteMeta?.album || '').trim()
        const remoteGenre = normalizeGenreName(remoteMeta?.genre || '')

        // Update caches
      setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
      setLruCacheValue(albumCacheRef.current, cacheKey, remoteAlbum, MAX_ALBUM_CACHE_ENTRIES)
      setLruCacheValue(genreCacheRef.current, cacheKey, remoteGenre, MAX_GENRE_CACHE_ENTRIES)
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)

        // If we got a cover, extract dominant color
        if (remoteCoverUrl) {
          try {
            const tone = await extractDominantColor(remoteCoverUrl)
            nextCover.coverTone = tone || ''
          } catch {
            nextCover.coverTone = ''
          }
        }

        if (remoteCoverUrl) {
          nextCover.coverRemoteUrl = remoteCoverUrl

          // If album was explicitly changed, prioritize the newly found album cover.
          if (albumChanged) {
            nextCover.coverBlob = null
            nextCover.coverUrl = remoteCoverUrl
            nextCover.coverName = 'Albüm kapağı (otomatik)'
          }
        }

        if (remoteAlbum && (artistChanged || titleChanged || albumChanged || normalizeCoverMatchText(newAlbum) === 'single')) {
          resolvedAlbum = remoteAlbum
        }
        if (remoteGenre) {
          resolvedGenre = remoteGenre
        }
      } catch {
        // Silently fail - use original values
      }
    }

    updateTrack(editTargetId, {
      title: newTitle,
      artist: newArtist,
      album: resolvedAlbum,
      genre: resolvedGenre,
      ...nextCover,
    })

    closeEditor()
  }

  const saveBulkTrackChanges = async () => {
    if (!bulkEditDrafts.length) {
      closeBulkEditor()
      return
    }

    setBulkEditSaving(true)
    try {
      const updatesList = []

      for (const draft of bulkEditDrafts) {
        const originalTrack = tracks.find((track) => track.id === draft.id)
        if (!originalTrack) {
          continue
        }

        const newTitle = cleanFilenameTrackTitle(String(draft.title || '')) || 'Bilinmeyen Şarkı'
        const newArtist = String(draft.artist || '').trim() || 'Bilinmeyen Sanatci'
        const inputAlbum = String(draft.album || '').trim()
        const newAlbum = inputAlbum || 'Single'
        const previewCoverUrl = String(draft.coverPreviewUrl || '').trim()
        const originalCoverUrl = String(originalTrack.coverUrl || originalTrack.coverRemoteUrl || '').trim()

        const artistChanged =
          normalizeArtistQuery(originalTrack.artist || '') !== normalizeArtistQuery(newArtist)
        const titleChanged = String(originalTrack.title || '') !== newTitle
        const albumEdited =
          normalizeCoverMatchText(originalTrack.album || 'Single') !== normalizeCoverMatchText(newAlbum)
        const manualCoverChanged =
          Boolean(draft.coverBlob) ||
          Boolean(draft.removeCover) ||
          (Boolean(previewCoverUrl) && previewCoverUrl !== originalCoverUrl)
        const shouldRefreshMeta =
          (artistChanged || titleChanged) &&
          newTitle &&
          newArtist &&
          newArtist !== 'Yerel Koleksiyon'

        if (!artistChanged && !titleChanged && !albumEdited && !manualCoverChanged) {
          continue
        }

        let remoteMeta = null
        if (shouldRefreshMeta) {
          try {
            remoteMeta = await fetchRemoteTrackMetaSmart(newTitle, newArtist, {
              preferredAlbum: newAlbum,
              preferredDuration: Number(originalTrack?.duration || 0),
            })
          } catch {
            remoteMeta = null
          }
        }

        const nextUpdate = {
          title: newTitle,
          artist: newArtist,
          album:
            shouldRefreshMeta &&
            (!albumEdited || normalizeCoverMatchText(newAlbum) === 'single') &&
            String(remoteMeta?.album || '').trim()
              ? String(remoteMeta.album).trim()
              : newAlbum,
          genre:
            shouldRefreshMeta && normalizeGenreName(remoteMeta?.genre || '')
              ? normalizeGenreName(remoteMeta?.genre || '')
              : normalizeGenreName(originalTrack.genre || ''),
        }

        let changedCoverSource = ''
        if (draft.removeCover) {
          nextUpdate.coverBlob = null
          nextUpdate.coverUrl = ''
          nextUpdate.coverRemoteUrl = ''
          nextUpdate.coverName = ''
          nextUpdate.coverTone = ''
        } else if (draft.coverBlob && previewCoverUrl) {
          changedCoverSource = previewCoverUrl
          nextUpdate.coverBlob = draft.coverBlob
          nextUpdate.coverUrl = previewCoverUrl
          nextUpdate.coverRemoteUrl = ''
          nextUpdate.coverName = draft.coverName || draft.coverBlob.name || 'Kapak'
        } else if (shouldRefreshMeta && String(remoteMeta?.coverUrl || '').trim()) {
          changedCoverSource = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverBlob = null
          nextUpdate.coverUrl = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverRemoteUrl = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverName = 'Albüm kapağı (otomatik)'
        }

        if (changedCoverSource) {
          try {
            nextUpdate.coverTone = await extractDominantColor(changedCoverSource)
          } catch {
            nextUpdate.coverTone = ''
          }
        }

        if (shouldRefreshMeta) {
          const cacheKey = `${normalizeArtistQuery(newArtist)}|${newTitle}`.toLowerCase()
          setLruCacheValue(
            coverArtCacheRef.current,
            cacheKey,
            String(remoteMeta?.coverUrl || '').trim(),
            MAX_COVER_CACHE_ENTRIES,
          )
          setLruCacheValue(
            albumCacheRef.current,
            cacheKey,
            String(remoteMeta?.album || '').trim(),
            MAX_ALBUM_CACHE_ENTRIES,
          )
        }

        updatesList.push({ id: draft.id, updates: nextUpdate })
      }

      if (updatesList.length) {
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        applyBulkTrackUpdates(updatesList)
        showUploadNotice(`${updatesList.length} şarkı güncellendi.`)
      } else {
        showUploadNotice('Değişiklik bulunamadı.')
      }
      setBulkEditOpen(false)
      setBulkEditDrafts([])
      setBulkCoverMenuTrackId(null)
      setBulkCoverTargetTrackId(null)
    } finally {
      setBulkEditSaving(false)
    }
  }

  const handleSaveTrackChanges = () => {
    saveTrackChanges().catch(() => {})
  }

  const toggleTrackPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        const hasTrack = playlist.trackIds.includes(trackId)
        return {
          ...playlist,
          trackIds: hasTrack
            ? playlist.trackIds.filter((id) => id !== trackId)
            : [...playlist.trackIds, trackId],
        }
      }),
    )
  }

  const addTrackToPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        const hasTrack = playlist.trackIds.includes(trackId)

        return {
          ...playlist,
          trackIds: hasTrack
            ? playlist.trackIds.filter((id) => id !== trackId)
            : [...playlist.trackIds, trackId],
        }
      }),
    )
  }

  const queueTrackAsNext = (trackId) => {
    if (!trackId || trackId === currentTrackId) {
      return
    }

    const nextQueue = [
      ...sanitizeQueue(queuedNextTrackIdsRef.current).filter((id) => id !== trackId),
      trackId,
    ]
    applyQueuedNextTracks(nextQueue)
  }

  const reorderUpcomingQueueByDrag = (draggedId, droppedOnId) => {
    if (!draggedId || !droppedOnId || draggedId === droppedOnId) {
      return
    }

    const upcomingIds = upcomingPlaybackTracks
      .map((track) => track?.id)
      .filter((id) => id && id !== currentTrackId)

    if (!upcomingIds.length) {
      return
    }

    const fromIndex = upcomingIds.indexOf(draggedId)
    const toIndex = upcomingIds.indexOf(droppedOnId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const nextIds = [...upcomingIds]
    const [moved] = nextIds.splice(fromIndex, 1)
    nextIds.splice(toIndex, 0, moved)
    applyQueuedNextTracks(nextIds)
  }

  const createPlaylist = () => {
    const trimmed = playlistNameDraft.trim()
    const trimmedDescription = playlistDescriptionDraft.trim()
    if (!trimmed) {
      return
    }

    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: trimmed,
      description: trimmedDescription,
      trackIds: [],
      color: playlistColorDraft,
      coverUrl: playlistCoverDraft || '',
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    setSelectedCollectionId(newPlaylist.id)
    setCreatingPlaylist(false)
    setPlaylistNameDraft('')
    setPlaylistDescriptionDraft('')
  }

  const savePlaylistChanges = () => {
    const nextName = playlistEditDraft.trim()
    const nextDescription = playlistEditDescriptionDraft.trim()
    if (!editingPlaylistId || !nextName) {
      return
    }

    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === editingPlaylistId
          ? {
              ...playlist,
              name: nextName,
              description: nextDescription,
              color: playlistEditColorDraft,
              coverUrl: playlistEditCoverDraft || '',
            }
          : playlist,
      ),
    )
    closePlaylistEditor()
  }

  const requestDeletePlaylist = (playlistId) => {
    const playlist = playlists.find((item) => item.id === playlistId)
    if (!playlist) {
      return
    }
    setPendingDeletePlaylistId(playlistId)
  }

  const deletePlaylist = (playlistId) => {
    const playlist = playlists.find((item) => item.id === playlistId)
    if (!playlist) {
      return
    }

    setPlaylists((prev) => prev.filter((item) => item.id !== playlistId))
    if (selectedCollectionId === playlistId) {
      setSelectedCollectionId('all')
    }

    if (editingPlaylistId === playlistId) {
      closePlaylistEditor()
    }
    setPendingDeletePlaylistId(null)
  }

  const toggleFavorite = (trackId) => {
    const track = allTracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }

    const nextFavoriteState = !track.isFavorite
    setFavoriteTrackIds((prev) =>
      nextFavoriteState ? Array.from(new Set([...prev, trackId])) : prev.filter((id) => id !== trackId),
    )

    if (track.source === 'drive') {
      setServerTracks((prev) =>
        prev.map((item) => (item.id === trackId ? { ...item, isFavorite: nextFavoriteState } : item)),
      )
      return
    }

    updateTrack(trackId, { isFavorite: nextFavoriteState })
  }

  const toggleCurrentTrackFavorite = () => {
    if (!currentTrack) {
      return
    }

    toggleFavorite(currentTrack.id)

    if (dockFavoritePulseTimerRef.current) {
      window.clearTimeout(dockFavoritePulseTimerRef.current)
    }

    setDockFavoritePulseId(currentTrack.id)
    dockFavoritePulseTimerRef.current = window.setTimeout(() => {
      setDockFavoritePulseId(null)
    }, 220)
  }

  useEffect(() => {
    return () => {
      if (dockFavoritePulseTimerRef.current) {
        window.clearTimeout(dockFavoritePulseTimerRef.current)
      }
    }
  }, [])

  const requestDeleteTrack = (trackId) => {
    const track = tracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setPendingDeleteTrackId(trackId)
  }

  const deleteTrack = async (trackId) => {
    const track = tracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }

    releaseTrackResources(track)
    deleteStoredTrack(trackId).catch(() => {})

    setTracks((prev) => {
      const deletionIndex = prev.findIndex((item) => item.id === trackId)
      const next = prev.filter((item) => item.id !== trackId)
      const activePlaylist =
        selectedCollectionId === 'all'
          ? null
          : playlists.find((playlist) => playlist.id === selectedCollectionId) || null
      const nextVisible =
        !activePlaylist
          ? next
          : next.filter((item) => activePlaylist.trackIds.includes(item.id))

      if (currentTrackId === trackId) {
        const replacement =
          nextVisible[deletionIndex] || nextVisible[deletionIndex - 1] || nextVisible[0] || next[0] || null
        setCurrentTrackId(replacement?.id || null)
        setProgress(0)
        setDuration(replacement?.duration || 0)
        setIsPlaying(Boolean(replacement))
      }

      if (editTargetId === trackId) {
        closeEditor()
      }

      return next
    })

    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter((id) => id !== trackId),
      })),
    )

    setTrackMenuId(null)
    setPendingDeleteTrackId(null)
  }

  const openTrackMenu = (trackId, anchorEl, pointer = null) => {
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    if (trackMenuId === trackId) {
      setTrackMenuId(null)
      setTrackMenuPosition(null)
      return
    }

    const rect = anchorEl?.getBoundingClientRect()
    const menuWidth = 280
    const menuEstimatedHeight = 340
    const horizontalPadding = 12
    const verticalPadding = 12
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    if (pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)) {
      const left = Math.min(
        Math.max(pointer.x, horizontalPadding),
        Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
      )
      const top = Math.min(
        Math.max(pointer.y, verticalPadding),
        Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
      )
      setTrackMenuId(trackId)
      setTrackMenuPosition({
        position: 'fixed',
        top,
        left,
      })
      return
    }
    const left = rect
        ? Math.min(
          Math.max(rect.right - menuWidth, horizontalPadding),
          Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
        )
      : horizontalPadding
    const fitsBelow = rect
      ? rect.bottom + 8 + menuEstimatedHeight <= viewportHeight - verticalPadding
      : true

    setTrackMenuId(trackId)
    setTrackMenuPosition(
      rect
        ? fitsBelow
          ? {
              position: 'fixed',
              top: Math.min(
                rect.bottom + 8,
                Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
              ),
              left,
            }
          : {
              position: 'fixed',
              bottom: Math.max(viewportHeight - rect.top + 8, verticalPadding),
              left,
            }
        : {
            position: 'fixed',
            top: 96,
            left: horizontalPadding,
          },
    )
  }

  const openPlaylistMenu = (trackId, anchorEl) => {
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    const rect = anchorEl?.getBoundingClientRect()
    const horizontalPadding = 12
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const menuWidth = Math.min(360, Math.max(280, viewportWidth - horizontalPadding * 2))
    const preferredLeft = rect
      ? rect.left + rect.width / 2 - menuWidth / 2
      : horizontalPadding
    const left = Math.min(
      Math.max(preferredLeft, horizontalPadding),
      Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
    )
    const fitsAbove = rect ? rect.top - 240 > 12 : true

    setPlaylistMenuTrackId(trackId)
    setPlaylistMenuPosition(
      rect
        ? fitsAbove
          ? {
              position: 'fixed',
              top: Math.max(rect.top - 12, 12),
              left,
              transform: 'translateY(-100%)',
            }
          : {
              position: 'fixed',
              top: Math.min(rect.bottom + 12, viewportHeight - 24),
              left,
            }
        : {
            position: 'fixed',
            bottom: 96,
            left: horizontalPadding,
          },
    )
    setDockPlaylistMenuOpen(true)
    setTrackMenuId(null)
    setTrackMenuPosition(null)
  }

  const toggleDockPlaylistMenu = (anchorEl) => {
    if (dockPlaylistMenuOpen && playlistMenuPosition) {
      setDockPlaylistMenuOpen(false)
      setPlaylistMenuTrackId(null)
      setPlaylistMenuPosition(null)
      return
    }

    if (currentTrack) {
      openPlaylistMenu(currentTrack.id, anchorEl)
    }
  }

  const openTrackPlaylistMenu = (trackId, anchorEl) => {
    openPlaylistMenu(trackId, anchorEl)
  }

  const handleMediaShortcutInputKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') {
      setMediaToggleShortcut('')
      return
    }

    const nextShortcut = mediaShortcutFromKeyboardEvent(event)
    if (typeof nextShortcut === 'string') {
      setMediaToggleShortcut(nextShortcut.trim())
    }
  }, [])

  return (
    <div className={appShellLayoutClass} style={themeVars} onClick={closeMenus}>
      <div className="window-titlebar" onDoubleClick={handleWindowToggleMaximize}>
        <div className="window-titlebar-drag" />
        <div className="window-titlebar-controls">
          <button
            type="button"
            className="window-control-button"
            onClick={handleWindowMinimize}
            aria-label="Simge durumuna küçült"
            title="Simge durumuna küçült"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="window-control-button"
            onClick={handleWindowToggleMaximize}
            aria-label={windowIsMaximized ? 'Geri yükle' : 'Büyüt'}
            title={windowIsMaximized ? 'Geri yükle' : 'Büyüt'}
          >
            {windowIsMaximized ? <Minimize2 size={13} /> : <Square size={12} />}
          </button>
          <button
            type="button"
            className="window-control-button close"
            onClick={handleWindowClose}
            aria-label="Kapat"
            title="Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <audio ref={audioRef} />

      <AnimatePresence>
        {coverTransitionWashVisible ? (
          <MotionDiv
            key={`cover-wash-${currentTrackId || 'none'}`}
            className="cover-transition-wash"
            style={{ '--cover-shift-color': hexToRgba(currentThemeColor, 0.36) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>

      <input
        ref={coverInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        onChange={handleCoverSelect}
      />
      <input
        ref={lyricsFileInputRef}
        className="hidden-input"
        type="file"
        accept=".txt,text/plain"
        onChange={handleLyricsFileUpload}
      />

      {isDragActive ? (
        <div className="drag-overlay">
          <div className="drag-overlay-card">
            <Upload size={22} />
            <strong>Müziği bırak, otomatik ekleyelim</strong>
            <span>MP3 ve diğer ses dosyaları desteklenir.</span>
          </div>
        </div>
      ) : null}

      <MotionDiv
        className="ambient ambient-left"
        animate={runtimeLowPowerEnabled ? { opacity: 0.12 } : { opacity: [0.14, 0.22, 0.14] }}
        transition={runtimeLowPowerEnabled ? { duration: 0 } : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionDiv
        className="ambient ambient-right"
        animate={runtimeLowPowerEnabled ? { opacity: 0.1 } : { opacity: [0.1, 0.18, 0.1] }}
        transition={runtimeLowPowerEnabled ? { duration: 0 } : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo-frame">
            <img src={appLogo} alt="Music logo" className="topbar-logo" />
          </div>
          <h1>Music</h1>
        </div>

        <div className="topbar-actions">
          <button
            className="icon-button topbar-icon-button"
            onClick={(event) => {
              event.stopPropagation()
              setNotificationsOpen(false)
              setDownloadsOpen(false)
              setStatsOpen(true)
            }}
            aria-label="İstatistikler"
          >
            <BarChart3 size={18} />
          </button>
          <div className="topbar-notification-wrap">
            <button
              ref={notificationsButtonRef}
              className={`icon-button topbar-icon-button ${notificationsOpen ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setSettingsOpen(false)
                setStatsOpen(false)
                toggleNotificationsPanel()
              }}
              aria-label={t('notifications', 'Bildirimler')}
            >
              <Bell size={18} />
            </button>
            {hasUnreadNotifications ? <span className="topbar-notification-dot" /> : null}
          </div>
          <div className="topbar-notification-wrap">
            <button
              ref={downloadsButtonRef}
              className={`icon-button topbar-icon-button ${downloadsOpen ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setSettingsOpen(false)
                setStatsOpen(false)
                toggleDownloadsPanel()
              }}
              aria-label="İndirilenler"
              title="İndirilenler"
            >
              <Download size={18} />
            </button>
            {activeDownloadCount > 0 ? <span className="topbar-notification-dot" /> : null}
          </div>
          <button className="icon-button topbar-icon-button" onClick={(event) => { event.stopPropagation(); setNotificationsOpen(false); setDownloadsOpen(false); setSettingsOpen(true) }} aria-label="Ayarlar">
            <Settings size={18} />
          </button>

          <button className="upload-button" onClick={(event) => { event.stopPropagation(); setNotificationsOpen(false); setDownloadsOpen(false); openUploadPicker() }}>
            <Upload size={18} />
            Ekle
          </button>
        </div>

          <input
            ref={inputRef}
            className="hidden-input"
            type="file"
            accept=".mp3,audio/*"
            multiple
            onChange={handleUpload}
          />
      </header>

      {notificationsOpen
        ? createPortal(
            <div
              className={`notifications-panel notifications-panel--plain theme-${themeMode} ${brightGradientReadabilityVars ? 'bright' : ''}`}
              style={{
                ...themeVars,
                top: notificationsPanelPosition.top,
                left: notificationsPanelPosition.left,
                width: notificationsPanelPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="notifications-head">
                <h4>{t('notifications', 'Bildirimler')}</h4>
                <button
                  type="button"
                  className="mini-button ghost"
                  onClick={clearNotifications}
                  disabled={!notifications.length}
                >
                  <Trash2 size={14} />
                  {t('clearAllNotifications', 'Tümünü temizle')}
                </button>
              </div>
              <div className="notifications-list">
                {notifications.length ? (
                  notifications.map((notice) => (
                    <div key={notice.id} className={`notification-item ${notice.read ? '' : 'unread'}`}>
                      <div className="notification-item-body">
                        <p>{notice.message}</p>
                        <small>{new Date(notice.createdAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                      <button
                        type="button"
                        className="icon-button mini-button ghost notification-delete"
                        onClick={() => removeNotification(notice.id)}
                        aria-label={t('close', 'Kapat')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="notifications-empty">{t('noNotifications', 'Henüz bildirim yok')}</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {downloadsOpen
        ? createPortal(
            <div
              className={`notifications-panel notifications-panel--plain theme-${themeMode} ${brightGradientReadabilityVars ? 'bright' : ''}`}
              style={{
                ...themeVars,
                top: downloadsPanelPosition.top,
                left: downloadsPanelPosition.left,
                width: downloadsPanelPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="notifications-head">
                <h4>İndirilenler</h4>
                <button
                  type="button"
                  className="mini-button ghost"
                  onClick={clearDownloadJobs}
                  disabled={!downloadJobs.length}
                >
                  <Trash2 size={14} />
                  Tümünü temizle
                </button>
              </div>
              <div className="notifications-list">
                {downloadJobs.length ? (
                  downloadJobs.map((job) => {
                    const total = Number(job.totalBytes || 0)
                    const received = Number(job.receivedBytes || 0)
                    const progressPercent = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0
                    const statusText =
                      job.status === 'completed'
                        ? 'Tamamlandı'
                        : job.status === 'failed'
                          ? 'Başarısız'
                          : job.status === 'paused'
                            ? 'Durduruldu'
                            : job.status === 'cancelled'
                              ? 'İptal edildi'
                          : job.status === 'starting'
                            ? 'Başlatılıyor...'
                            : 'İndiriliyor...'
                    const isActiveDownload = job.status === 'starting' || job.status === 'downloading'
                    return (
                      <div key={job.requestId} className={`notification-item ${job.status === 'downloading' ? 'unread' : ''}`}>
                        <div className="notification-item-body">
                          <p>{job.title || 'Şarkı indiriliyor'}</p>
                          <small>{job.artist || 'Bilinmeyen sanatçı'}</small>
                          <small>
                            {formatBytes(received)}
                            {total > 0 ? ` / ${formatBytes(total)} (${progressPercent}%)` : ''}
                            {' • '}
                            {statusText}
                          </small>
                          <div className="download-progress-track">
                            <span
                              className="download-progress-fill"
                              style={{ width: `${job.status === 'completed' ? 100 : progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="download-item-actions">
                          {isActiveDownload ? (
                            <>
                              <button
                                type="button"
                                className="mini-button ghost download-action-button"
                                onClick={() => controlDownloadJob(job.requestId, 'pause')}
                              >
                                Durdur
                              </button>
                              <button
                                type="button"
                                className="mini-button danger download-action-button"
                                onClick={() => controlDownloadJob(job.requestId, 'cancel')}
                              >
                                İptal
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="icon-button mini-button ghost notification-delete"
                            onClick={() => removeDownloadJob(job.requestId)}
                            aria-label={t('close', 'Kapat')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="notifications-empty">Henüz indirme geçmişi yok</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      <AnimatePresence>

        {statsOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStatsOpen(false)}
          >
            <MotionDiv
              className="modal-card glass stats-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">İstatistikler</p>
                  <h3>
                    <BarChart3 size={18} />
                    Dinleme özeti
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setStatsOpen(false)}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <section className="stats-card">
                  <span>Toplam dinleme</span>
                  <strong>{formatListenDuration(playStats?.totalSeconds || 0)}</strong>
                  <small>Tüm oturumlar dahil, bu cihazda kaydedilir.</small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen</span>
                  <strong>{topTrackStats.topTrack?.title || 'Henüz yok'}</strong>
                  <small>
                    {topTrackStats.topTrack
                      ? `${topTrackStats.topTrack.artist} • ${formatListenDuration(topTrackStats.topSeconds)}`
                      : 'Biraz müzik çalınca burada görünür.'}
                  </small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen sanatçı</span>
                  <strong>{topTrackStats.topArtist?.name || 'Henüz yok'}</strong>
                  <small>
                    {topTrackStats.topArtist
                      ? formatListenDuration(topTrackStats.topArtist.seconds)
                      : 'Sanatçı istatistiği için biraz dinleme gerekli.'}
                  </small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen albüm</span>
                  {topTrackStats.topAlbum ? (
                    <div className="stats-highlight">
                      <span className="stats-highlight-cover">
                        {getTrackDisplayUrl(topTrackStats.topAlbum.track, 'thumb') ? (
                          <img
                            src={getTrackDisplayUrl(topTrackStats.topAlbum.track, 'thumb')}
                            alt={`${topTrackStats.topAlbum.name} kapağı`}
                          />
                        ) : (
                          <span
                            className="playlist-menu-cover-fallback"
                            style={{ background: topTrackStats.topAlbum.track?.gradient || gradients[0] }}
                          >
                            {(topTrackStats.topAlbum.name || 'A').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="stats-highlight-copy">
                        <strong>{topTrackStats.topAlbum.name}</strong>
                        <small>{topTrackStats.topAlbum.track?.artist || 'Bilinmeyen sanatçı'}</small>
                      </span>
                    </div>
                  ) : (
                    <strong>Henüz yok</strong>
                  )}
                  <small>
                    {topTrackStats.topAlbum
                      ? formatListenDuration(topTrackStats.topAlbum.seconds)
                      : 'Albüm istatistiği için biraz dinleme gerekli.'}
                  </small>
                </section>

                <section className="stats-card stats-card-wide">
                  <span>En çok dinlenenler</span>
                  {topTrackStats.topList.length ? (
                    <div className="stats-top-list">
                      {topTrackStats.topList.map((item, index) => (
                        <div key={item.trackId} className="stats-top-item">
                          <b>{index + 1}</b>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.artist}</small>
                          </div>
                          <span>{formatListenDuration(item.seconds)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small>Henüz yeterli dinleme verisi yok.</small>
                  )}
                </section>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {settingsOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
          >
            <MotionDiv
              className="modal-card glass settings-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t('settings', 'Ayarlar')}</p>
                  <h3>
                    <Settings size={18} />
                  {t('appSettings', 'Uygulama ayarları')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setSettingsOpen(false)}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                </div>
              </div>

              <div className="settings-layout">
                <aside className="settings-menu">
                  <div className="settings-menu-items">
                    {[
                      ['audio', t('audioOutput', 'Ses')],
                      ['appearance', t('theme', 'Görünüm')],
                      ['playback', t('options', 'Çalma')],
                      ['system', 'Sistem'],
                      ['source', t('sharedSource', 'Kaynak')],
                      ['notes', t('notes', 'Notlar')],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`settings-menu-item ${settingsTab === value ? 'active' : ''}`}
                        onClick={() => setSettingsTab(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="settings-menu-footer">
                    <button
                      type="button"
                      className="settings-menu-item settings-menu-admin-button"
                      onClick={() => {
                        setSettingsOpen(false)
                        setStatsOpen(false)
                        setNotificationsOpen(false)
                        setDownloadsOpen(false)
                        openPoolAdminPanel()
                      }}
                    >
                      <Lock size={14} />
                      <span>Havuz paneli</span>
                    </button>
                  </div>
                </aside>

                <div className={`settings-content ${settingsTab === 'appearance' ? 'appearance-scroll-enabled' : ''}`}>
                  {settingsTab === 'audio' ? (
                    <>
                      <section className="settings-section">
                        <h4>{t('audioOutput', 'Ses çıkışı')}</h4>
                        <p>{t('audioOutputHint', 'Buradan hoparlör, kulaklık ya da sanal çıkış aygıtını seçebilirsin.')}</p>
                        <div className="settings-output-list">
                          {!canSelectAudioOutput ? (
                            <div className="menu-empty">{t('outputNotSupported', 'Bu cihazda desteklenmiyor')}</div>
                          ) : audioOutputs.length === 0 ? (
                            <div className="menu-empty">{t('outputNotFound', 'Çıkış aygıtı bulunamadı')}</div>
                          ) : (
                            audioOutputs.map((device, index) => (
                              <button
                                key={device.deviceId}
                                className={`menu-item ${selectedAudioOutputId === device.deviceId ? 'selected' : ''}`}
                                onClick={() => selectAudioOutput(device.deviceId)}
                              >
                                <Check size={14} className={selectedAudioOutputId === device.deviceId ? 'visible' : 'hidden-check'} />
                                <span>{device.label || `Çıkış ${index + 1}`}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </section>

                      <section className="settings-section settings-eq-section">
                        <div className="settings-section-head">
                          <div>
                            <h4>{t('equalizer', 'Ekolayzer')}</h4>
                            <p>{t('equalizerHint', 'Frekansları hafifçe yükseltip azaltarak sesi şekillendirebilirsin.')}</p>
                          </div>
                          <button className="mini-button ghost" onClick={resetEqualizer}>
                            {t('reset', 'Sıfırla')}
                          </button>
                        </div>
                        <div className="settings-eq-grid">
                          {equalizerBands.map((band, index) => (
                            <label key={band.key} className="eq-band">
                              <span>{band.label}</span>
                              <input
                                className="range eq-range"
                                type="range"
                                min="-12"
                                max="12"
                                step="1"
                                value={equalizerGains[index] || 0}
                                onChange={(event) => handleEqualizerChange(index, Number(event.target.value))}
                              />
                              <strong>{(equalizerGains[index] || 0) > 0 ? `+${equalizerGains[index] || 0}` : equalizerGains[index] || 0} dB</strong>
                            </label>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'appearance' ? (
                    <>
                      <div className="appearance-top-grid">
                        <div className="appearance-left-column">
                          <section className="settings-section appearance-theme-section">
                            <h4>{t('theme', 'Tema')}</h4>
                            <p>{t('themeHint', 'Arayüz görünümünü seç.')}</p>
                            <div className="settings-theme-list">
                              {[
                                ['dark', t('dark', 'Koyu')],
                                ['gray', t('gray', 'Grimsi')],
                                ['light', t('light', 'Açık')],
                                ['transparent', t('transparent', 'Şeffaf')],
                              ].map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  className={`menu-item ${themeMode === value ? 'selected' : ''}`}
                                  onClick={() => setThemeMode(value)}
                                >
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </section>

                          <section className="settings-section">
                            <h4>{t('language', 'Dil')}</h4>
                            <p>{t('languageHint', 'Arayüz dilini değiştir.')}</p>
                            <div className="settings-theme-list">
                              {[
                                ['tr', t('turkish', 'Türkçe')],
                                ['en', t('english', 'English')],
                              ].map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  className={`menu-item ${language === value ? 'selected' : ''}`}
                                  onClick={() => setLanguage(value)}
                                >
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        </div>

                        <section className="settings-section background-style-section">
                          <h4>{t('backgroundStyle', 'Arka plan stili')}</h4>
                          <p>{t('backgroundStyleHint', 'Arka planı düz renk veya gradyan olarak ayarlayabilirsin.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('coverBasedBackground', 'Kapak rengine göre arka plan')}</span>
                            <input
                              type="checkbox"
                              checked={coverBasedBackgroundEnabled}
                              onChange={(event) => setCoverBasedBackgroundEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('coverBasedBackgroundHint', 'Açıkken arka plan gradyanı çalan şarkının kapak tonundan üretilir.')}</p>
                          <div className="settings-theme-list">
                            {[
                              ['solid', t('backgroundSolid', 'Düz renk')],
                              ['gradient', t('backgroundGradient', 'Gradyan')],
                            ].map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`menu-item ${backgroundStyle === value ? 'selected' : ''}`}
                                onClick={() => setBackgroundStyle(value)}
                              >
                                <span>{label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="settings-color-grid">
                            <label className="settings-color-field">
                              <span>{t('backgroundColor1', 'Renk 1')}</span>
                              <input
                                type="color"
                                value={backgroundColor1}
                                onChange={(event) => setBackgroundColor1(event.target.value)}
                              />
                            </label>
                            {backgroundStyle === 'gradient' ? (
                              <label className="settings-color-field">
                                <span>{t('backgroundColor2', 'Renk 2')}</span>
                                <input
                                  type="color"
                                  value={backgroundColor2}
                                  onChange={(event) => setBackgroundColor2(event.target.value)}
                                />
                              </label>
                            ) : null}
                          </div>
                        </section>
                      </div>

                      <section className="settings-section settings-appearance-options">
                        <h4>{t('appearanceOptions', 'Görünüm seçenekleri')}</h4>
                        <p>{t('appearanceOptionsHint', 'Görünüm ve kaydırma tercihlerini tek yerden yönet.')}</p>
                        <div className="settings-options-scroll">
                          <label className="settings-toggle-row">
                            <span>{t('reduceAnimations', 'Animasyonları azalt')}</span>
                            <input
                              type="checkbox"
                              checked={reduceAnimationsEnabled}
                              onChange={(event) => setReduceAnimationsEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('reduceAnimationsHint', 'Arayüz geçişlerini ve hareketli efektleri sadeleştirir.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('lowPowerMode', 'Performans modu')}</span>
                            <input
                              type="checkbox"
                              checked={lowPowerModeEnabled}
                              onChange={(event) => setLowPowerModeEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('lowPowerModeHint', 'Blur, gölge ve cam efektlerini azaltarak daha stabil çalıştırır.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('fullscreenEffects', 'Tam ekran efektleri')}</span>
                            <input
                              type="checkbox"
                              checked={fullscreenEffectsEnabled}
                              onChange={(event) => setFullscreenEffectsEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('fullscreenEffectsHint', 'Gradyan, animasyon ve görsel efektleri aç/kapat.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('compactList', 'Kompakt liste görünümü')}</span>
                            <input
                              type="checkbox"
                              checked={compactListEnabled}
                              onChange={(event) => setCompactListEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('compactListHint', 'Şarkı satırlarını daha sıkı göstererek ekrana daha fazla parça sığdırır.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('showScrollbars', 'Kaydırma çubuğunu göster')}</span>
                            <input
                              type="checkbox"
                              checked={showScrollbars}
                              onChange={(event) => setShowScrollbars(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('showScrollbarsHint', 'Kapalıyken kaydırma çubukları gizlenir, açıkken görünür olur.')}</p>
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'playback' ? (
                    <>
                      <section className="settings-section">
                        <h4>{t('options', 'Ayarlar')}</h4>
                        <p>{t('optionsHint', 'Kullanım seçeneklerini buradan açıp kapat.')}</p>
                        <label className="settings-toggle-row">
                          <span>{t('monoAudio', 'Sesi mono olarak çal')}</span>
                          <input
                            type="checkbox"
                            checked={monoAudioEnabled}
                            onChange={(event) => setMonoAudioEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('spaceShortcut', 'Boşluk tuşu ile çal/duraklat')}</span>
                          <input
                            type="checkbox"
                            checked={spaceKeyPlaybackEnabled}
                            onChange={(event) => setSpaceKeyPlaybackEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('arrowShortcut', 'Ok tuşlarıyla 5 sn ileri/geri sar')}</span>
                          <input
                            type="checkbox"
                            checked={arrowSeekEnabled}
                            onChange={(event) => setArrowSeekEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('resetShortcut', 'Acil reset kısayolu (Ctrl + Shift + R)')}</span>
                          <input
                            type="checkbox"
                            checked={resetShortcutEnabled}
                            onChange={(event) => setResetShortcutEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="field settings-manifest-field">
                          <span>{t('mediaShortcut', 'Global çal/duraklat kısayolu')}</span>
                          <input
                            type="text"
                            value={mediaToggleShortcut}
                            readOnly
                            onKeyDown={handleMediaShortcutInputKeyDown}
                            placeholder="Ctrl+Alt+P"
                            title="Kısayolu kaydetmek için klavyeden kombinasyona bas. Silmek için Backspace."
                          />
                        </label>
                        <small className="settings-help-text">
                          {t('mediaShortcutHint', 'Örnek: Ctrl+Alt+P. Boş bırakırsan kapalı olur.')}
                        </small>
                      </section>

                      <section className="settings-section">
                        <h4>{t('closeMode', 'Kapatma')}</h4>
                        <p>{t('closeModeHint', 'Kapat tuşuna basınca uygulamanın ne yapacağını seç.')}</p>
                        <div className="settings-theme-list">
                          {[
                            ['tray', t('closeTray', 'Arka planda kalsın')],
                            ['quit', t('closeQuit', 'Tamamen kapansın')],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              className={`menu-item ${closeBehavior === value ? 'selected' : ''}`}
                              onClick={() => setCloseBehavior(value)}
                            >
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'system' ? (
                    <>
                      <section className="settings-section">
                        <h4>{t('hardwareAcceleration', 'Donanım hızlandırma')}</h4>
                        <p>{t('hardwareAccelerationHint', 'Kapattığında uygulama yeniden başlatma ister.')}</p>
                        <label className="settings-toggle-row">
                          <span>{t('hardwareAcceleration', 'Donanım hızlandırma')}</span>
                          <input
                            type="checkbox"
                            checked={hardwareAccelerationEnabled}
                            onChange={(event) => setHardwareAccelerationEnabled(event.target.checked)}
                          />
                        </label>
                      </section>

                      <section className="settings-section">
                        <h4>{t('export', 'Dışa aktarma')}</h4>
                        <p>{t('exportHint', 'Tüm şarkıları ve mevcut kapakları klasöre indir.')}</p>
                        <button
                          className="mini-button primary"
                          onClick={exportLibrary}
                          disabled={exportingLibrary}
                        >
                          <Upload size={14} />
                          {exportingLibrary ? t('exporting', 'Hazırlanıyor...') : t('exportStart', 'Müzikleri ve kapakları indir')}
                        </button>
                        <p className="settings-help-text">{t('resetCacheHint', 'Kapak, albüm, söz ve sanatçı bilgisini temizler. Şarkıların silinmez.')}</p>
                        <button
                          className="mini-button ghost"
                          onClick={() => setPendingResetCache(true)}
                        >
                          <Trash2 size={14} />
                          {t('resetCache', 'Önbelleği sıfırla')}
                        </button>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'source' ? (
                    <section className="settings-section">
                      <h4>{t('sharedSource', 'Ortak kaynak')}</h4>
                      <p>{t('sharedSourceHint', 'Yan bilgisayardaki tracks.json linkini gir. Buradaki şarkılar herkes tarafından görülebilir.')}</p>
                      <label className="field settings-manifest-field">
                        <span>{t('remoteManifestUrl', 'Uzak manifest URL')}</span>
                        <input
                          type="text"
                          value={sharedManifestUrl}
                          onChange={(event) => setSharedManifestUrl(event.target.value)}
                          placeholder="http://192.168.x.x:8080/tracks.json"
                        />
                      </label>
                      <small className="settings-help-text">{t('remoteManifestExample', 'Örnek: ağda açtığın küçük bir HTTP sunucu üzerinden tracks.json.')}</small>
                      <small className="settings-help-text">{t('remoteManifestRelative', 'Manifest içinde audioFile/coverFile kullanırsan URL yazmadan dosya yoluyla ekleyebilirsin. (Örn: songs/parca.mp3)')}</small>
                    </section>
                  ) : null}

                  {settingsTab === 'notes' ? (
                    <section className="settings-section">
                      <h4>{t('notes', 'Not')}</h4>
                      <p>{t('noteLocal', 'Playlist ve favori durumları yerelde saklanır.')}</p>
                      <p>{t('noteResume', 'Uygulama son çalınan parçayı ve konumu hatırlar.')}</p>
                      <p>{t('noteShared', 'Sunucudakiler, uzak manifest adresinden dakikada bir güncellenir.')}</p>
                      <p>{t('noteExport', 'Dışa aktarma, ses ve kapakları tek klasörde yedekler.')}</p>
                      <p>{t('noteResetShortcut', 'Acil reset kısayolu: Ctrl + Shift + R')}</p>
                      <p>{tf('noteAppVersion', { app: APP_NAME, version: APP_VERSION }, `${APP_NAME} sürümü: v${APP_VERSION}`)}</p>
                    </section>
                  ) : null}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {poolAdminOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePoolAdminPanel}
          >
            <MotionDiv
              className={`modal-card glass pool-admin-modal ${poolAdminUnlocked ? '' : 'pool-admin-modal--auth'}`.trim()}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Müzik Havuzu</p>
                  <h3>
                    <Lock size={18} />
                    Havuz düzenleme paneli
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePoolAdminPanel}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              {!poolAdminUnlocked ? (
                <form
                  className="pool-admin-auth"
                  onSubmit={(event) => {
                    event.preventDefault()
                    unlockPoolAdminPanel()
                  }}
                >
                  <label className="field">
                    <span>Şifre</span>
                    <input
                      ref={poolAdminPasswordInputRef}
                      type="password"
                      value={poolAdminPasswordInput}
                      onChange={(event) => {
                        setPoolAdminPasswordInput(event.target.value)
                        if (poolAdminAuthError) {
                          setPoolAdminAuthError('')
                        }
                      }}
                      placeholder="Panel şifresi"
                      autoComplete="current-password"
                    />
                  </label>
                  {poolAdminAuthError ? <p className="pool-admin-error">{poolAdminAuthError}</p> : null}
                  <button type="submit" className="mini-button primary">
                    Panele gir
                  </button>
                </form>
              ) : (
                <div className="pool-admin-body">
                  <div className="pool-admin-toolbar">
                    <button
                      className="mini-button ghost"
                      onClick={() => loadPoolAdminTracksFromGithub()}
                      disabled={poolAdminLoading}
                    >
                      {poolAdminLoading ? 'Yükleniyor...' : 'Yenile'}
                    </button>
                    <button className="mini-button ghost" onClick={addPoolAdminTrack}>
                      <Plus size={14} />
                      Satır ekle
                    </button>
                    <button className="mini-button primary" onClick={downloadPoolManifestJson}>
                      <Download size={14} />
                      tracks.json indir
                    </button>
                    <input
                      className="pool-admin-search-input"
                      type="search"
                      value={poolAdminSearchQuery}
                      onChange={(event) => setPoolAdminSearchQuery(event.target.value)}
                      placeholder="Şarkı, sanatçı veya link ara"
                    />
                  </div>
                  <div className="pool-admin-github-grid">
                    <label className="field">
                      <span>GitHub Owner</span>
                      <input
                        type="text"
                        value={poolGithubOwner}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubOwner(nextValue)
                          persistPoolGithubPrefs({ poolGithubOwner: nextValue })
                        }}
                        placeholder="852vc2gstg-lab"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>Repo</span>
                      <input
                        type="text"
                        value={poolGithubRepo}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubRepo(nextValue)
                          persistPoolGithubPrefs({ poolGithubRepo: nextValue })
                        }}
                        placeholder="ghxsty-music-pool"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>Branch</span>
                      <input
                        type="text"
                        value={poolGithubBranch}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubBranch(nextValue)
                          persistPoolGithubPrefs({ poolGithubBranch: nextValue })
                        }}
                        placeholder="main"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>JSON yolu</span>
                      <input
                        type="text"
                        value={poolGithubPath}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubPath(nextValue)
                          persistPoolGithubPrefs({ poolGithubPath: nextValue })
                        }}
                        placeholder="tracks.json"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field pool-admin-token-field">
                      <span>GitHub Token (repo)</span>
                      <input
                        type="password"
                        value={poolGithubToken}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubToken(nextValue)
                          persistPoolGithubPrefs({ poolGithubToken: nextValue })
                        }}
                        placeholder="ghp_..."
                        autoComplete="off"
                      />
                    </label>
                    <button
                      className="mini-button primary pool-admin-github-save"
                      onClick={publishPoolManifestToGithub}
                      disabled={poolGithubSaving}
                    >
                      <Upload size={14} />
                      {poolGithubSaving ? "GitHub'a yazılıyor..." : "GitHub'a kaydet"}
                    </button>
                  </div>
                  {poolAdminNotice ? <p className="pool-admin-note">{poolAdminNotice}</p> : null}
                  <div className="pool-admin-grid" ref={poolAdminGridRef}>
                    <datalist id="pool-admin-artist-suggestions">
                      {poolAdminArtistSuggestions.map((artist) => (
                        <option key={`pool-admin-artist-${artist}`} value={artist} />
                      ))}
                    </datalist>
                    {filteredPoolAdminTracks.map((track) => (
                      <div key={track.id} className="pool-admin-row">
                        <label className="field">
                          <span>Sanatçı adı</span>
                          <input
                            type="text"
                            list="pool-admin-artist-suggestions"
                            value={track.artist || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'artist', event.target.value)}
                            placeholder="Radiohead"
                            autoComplete="off"
                          />
                        </label>
                        <label className="field">
                          <span>Şarkı adı</span>
                          <input
                            type="text"
                            value={track.title || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'title', event.target.value)}
                            placeholder="Nice Dream"
                          />
                        </label>
                        <label className="field">
                          <span>Link</span>
                          <input
                            type="text"
                            value={track.downloadUrl}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'downloadUrl', event.target.value)}
                            placeholder="https://...mp3"
                          />
                        </label>
                        <label className="field">
                          <span>Kapak linki (opsiyonel)</span>
                          <input
                            type="text"
                            value={track.coverUrl || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'coverUrl', event.target.value)}
                            placeholder="https://...jpg"
                          />
                        </label>
                        <button
                          className="mini-button danger pool-admin-remove"
                          onClick={() => removePoolAdminTrack(track.id)}
                          title="Satırı sil"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    ))}
                    {!filteredPoolAdminTracks.length ? (
                      <div className="menu-empty">Aramaya uygun kayıt bulunamadı.</div>
                    ) : null}
                  </div>
                </div>
              )}
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {pendingDeleteTrack || pendingDeletePlaylist || pendingResetCache ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setPendingDeleteTrackId(null)
              setPendingDeletePlaylistId(null)
              setPendingResetCache(false)
            }}
          >
            <MotionDiv
              className="modal-card glass confirm-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="confirm-modal-head">
                <p className="eyebrow">
                  {pendingResetCache
                    ? t('confirmResetCacheTitle', 'Önbelleği sıfırla')
                    : pendingDeleteTrack
                    ? t('confirmDeleteTrackTitle', 'Şarkıyı sil')
                    : t('confirmDeletePlaylistTitle', 'Playlisti sil')}
                </p>
                <h3>
                  <Trash2 size={18} />
                  {pendingResetCache
                    ? t('confirmResetCacheTitle', 'Önbelleği sıfırla')
                    : pendingDeleteTrack
                    ? t('confirmDeleteTrackTitle', 'Şarkıyı sil')
                    : t('confirmDeletePlaylistTitle', 'Playlisti sil')}
                </h3>
              </div>

              <p className="confirm-modal-copy">
                {pendingResetCache
                  ? t('confirmResetCacheBody', 'Önbelleği temizlemek istediğine emin misin? Şarkılar silinmez.')
                  : pendingDeleteTrack
                  ? tf(
                      'confirmDeleteTrackBody',
                      { name: pendingDeleteTrack.title || 'Bu parça' },
                      `"${pendingDeleteTrack.title || 'Bu parça'}" parçasını silmek istediğine emin misin?`,
                    )
                  : tf(
                      'confirmDeletePlaylistBody',
                      { name: pendingDeletePlaylist?.name || 'Bu playlist' },
                      `"${pendingDeletePlaylist?.name || 'Bu playlist'}" playlistini silmek istediğine emin misin?`,
                    )}
              </p>

              <div className="editor-actions">
                <button
                  className="mini-button ghost"
                  onClick={() => {
                    setPendingDeleteTrackId(null)
                    setPendingDeletePlaylistId(null)
                    setPendingResetCache(false)
                  }}
                >
                  <X size={14} />
                  {t('cancelAction', 'Vazgeç')}
                </button>
                <button
                  className="mini-button danger"
                  onClick={() => {
                    if (pendingResetCache) {
                      resetAppCaches()
                      setPendingResetCache(false)
                      return
                    }
                    if (pendingDeleteTrack) {
                      deleteTrack(pendingDeleteTrack.id)
                      return
                    }
                    if (pendingDeletePlaylist) {
                      deletePlaylist(pendingDeletePlaylist.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                  {pendingResetCache ? t('resetAction', 'Sıfırla') : t('deleteAction', 'Sil')}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {addModalOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddModal}
          >
            <MotionDiv
              className="modal-card glass add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Ekle</p>
                  <h3>
                    <Plus size={18} />
                    Dosya veya link
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closeAddModal}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              {addMode === 'choose' ? (
                <div className="add-choice-grid">
                  <button
                    className="add-choice-card"
                    onClick={() => {
                      setAddMode('file')
                      inputRef.current?.click()
                    }}
                  >
                    <FileUp size={20} />
                    <strong>Dosya ekle</strong>
                    <span>Bilgisayarındaki MP3'leri otomatik okuyalım.</span>
                  </button>

                  <button className="add-choice-card" onClick={() => setAddMode('link')}>
                    <Link2 size={20} />
                    <strong>Link ekle</strong>
                    <span>Drive bağlantısı ile çalsın. Şarkı ve sanatçıyı sen gir.</span>
                  </button>

                </div>
              ) : null}

              {addMode === 'link' ? (
                <div className="add-form">
                  <label className="field">
                    <span>Şarkı adı</span>
                    <input
                      type="text"
                      value={linkDraft.title}
                      onChange={(event) =>
                        setLinkDraft((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Şarkı adı"
                      autoFocus
                    />
                  </label>

                  <label className="field">
                    <span>Sanatçı</span>
                    <input
                      type="text"
                      value={linkDraft.artist}
                      onChange={(event) =>
                        setLinkDraft((prev) => ({ ...prev, artist: event.target.value }))
                      }
                      placeholder="Sanatçı adı"
                    />
                  </label>

                  <label className="field">
                    <span>Drive bağlantısı</span>
                    <input
                      type="text"
                      value={linkDraft.audioUrl}
                      onChange={(event) =>
                        setLinkDraft((prev) => ({ ...prev, audioUrl: event.target.value }))
                      }
                      placeholder="https://drive.google.com/file/d/..."
                    />
                  </label>
                  <p className="field-hint">
                    Drive bağlantısı ile çalsın. Şarkı ve sanatçıyı sen gir.
                  </p>

                  <label className="field">
                    <span>Kapak bağlantısı</span>
                    <input
                      type="text"
                      value={linkDraft.coverUrl}
                      onChange={(event) =>
                        setLinkDraft((prev) => ({ ...prev, coverUrl: event.target.value }))
                      }
                      placeholder="Üstteki şeye bağla"
                    />
                  </label>

                  <div className="editor-actions">
                    <button className="mini-button ghost" onClick={() => setAddMode('choose')}>
                      Geri
                    </button>
                    <button className="mini-button primary" onClick={handleLinkAdd}>
                      <Link2 size={14} />
                      Linki ekle
                    </button>
                  </div>
                </div>
              ) : null}

            </MotionDiv>
          </MotionDiv>
        ) : null}

        {playlistAddOpen && currentPlaylist ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistAddModal}
          >
            <MotionDiv
              className="modal-card glass playlist-add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist'e ekle</p>
                  <h3>
                    <ListMusic size={18} />
                    {currentPlaylist.name}
                  </h3>
                  <span className="panel-subtitle">Şarkının yanındaki + ile doğrudan bu playliste ekleyebilirsin.</span>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistAddModal}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="playlist-add-list">
                {sortTracksByOrder(tracks).map((track) => {
                  const alreadyInPlaylist = currentPlaylist.trackIds.includes(track.id)

                  return (
                    <div key={`playlist-add-${track.id}`} className="playlist-add-row">
                      <span className="playlist-add-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="playlist-add-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                      <button
                        className={`playlist-add-button ${alreadyInPlaylist ? 'added' : ''}`}
                        type="button"
                        onClick={() => addTrackToPlaylist(currentPlaylist.id, track.id)}
                        aria-label={alreadyInPlaylist ? 'Playlistten çıkar' : 'Playliste ekle'}
                        title={alreadyInPlaylist ? 'Bu şarkıyı playlistten çıkar' : 'Bu şarkıyı playliste ekle'}
                      >
                        {alreadyInPlaylist ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>

      {artistProfileOpen ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setArtistProfileOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="modal-card glass artist-profile-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="artist-profile-top">
              <div className="artist-profile-top-main">
                <div className="artist-profile-avatar">
                  {artistProfilePhotoUrl ? (
                    <img src={artistProfilePhotoUrl} alt={`${artistProfileName || 'Sanatçı'} görseli`} />
                  ) : (
                    <span className="artist-photo-fallback">
                      <UserRound size={18} />
                      Sanatçı
                    </span>
                  )}
                </div>
                <div className="artist-profile-head-inline">
                  <p className="eyebrow">Sanatçı</p>
                  <h3>{artistProfileName || 'Bilinmeyen sanatçı'}</h3>
                  <small>
                    {artistProfileLibraryTracks.length} kütüphane • {artistProfilePoolTracks.length} havuz
                  </small>
                  {artistProfileFactsLoading ? (
                    <p className="about-text">Sanatçı bilgisi çekiliyor...</p>
                  ) : artistProfileFacts ? (
                    <>
                      <p className="about-text">{artistProfileAboutLine || 'Detay bulunamadı.'}</p>
                      {artistProfileFacts.summary ? <p className="about-summary">{artistProfileFacts.summary}</p> : null}
                    </>
                  ) : (
                    <p className="about-text">Sanatçı detayları bulunamadı.</p>
                  )}
                </div>
              </div>
              <button className="mini-button ghost artist-profile-close" onClick={() => setArtistProfileOpen(false)}>
                <X size={14} />
                Kapat
              </button>
            </div>

            <div className="artist-profile-body">
              <section className="artist-profile-tracks artist-profile-albums">
                <p className="about-title">Albümler / Singles</p>
                <div className="album-browser-grid artist-album-grid">
                  {artistProfileAlbums.length ? (
                    artistProfileAlbums.map((albumItem) => (
                      <button
                        key={`artist-album-${albumItem.key}`}
                        type="button"
                        className="album-browser-card artist-album-card"
                        onClick={() => openAlbumInfo(albumItem.coverTrack)}
                        title={`${albumItem.album} albüm detayları`}
                      >
                        <span className="album-browser-cover">
                          {getTrackDisplayUrl(albumItem.coverTrack, 'thumb') ? (
                            <img
                              src={getTrackDisplayUrl(albumItem.coverTrack, 'thumb')}
                              alt={`${albumItem.album} kapağı`}
                              className="track-thumb-image"
                            />
                          ) : (
                            <span
                              className="track-thumb-fallback"
                              style={{ background: albumItem.coverTrack?.gradient || gradients[0] }}
                            />
                          )}
                        </span>
                        <span className="album-browser-copy">
                          <strong>{albumItem.album}</strong>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="about-text">Bu sanatçıya ait albüm bulunamadı.</p>
                  )}
                </div>
              </section>

              <section className="artist-profile-tracks artist-profile-local-tracks">
                <p className="about-title">Eklediğin şarkılar</p>
                <div className="artist-profile-track-list">
                  {artistProfileLibraryTracks.length ? (
                    artistProfileLibraryTracks.map((track) => (
                      <button
                        key={`artist-profile-track-${track.id}`}
                        type="button"
                        className="artist-profile-track-row"
                        onClick={() => {
                          playTrack(track.id)
                          setArtistProfileOpen(false)
                        }}
                      >
                        <span className="artist-profile-track-cover">
                          {getTrackDisplayUrl(track, 'thumb') ? (
                            <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                          ) : (
                            <span className="track-thumb-fallback" style={{ background: track.gradient }} />
                          )}
                        </span>
                        <span className="artist-profile-track-copy">
                          <strong>{track.title}</strong>
                          <small>{track.album || 'Single'}</small>
                        </span>
                        <span>{formatTime(track.duration)}</span>
                      </button>
                    ))
                  ) : (
                    <p className="about-text">Bu sanatçıya ait ekli parça bulunamadı.</p>
                  )}
                </div>
              </section>

              <section className="artist-profile-tracks artist-profile-pool-tracks">
                <p className="about-title">Müzik havuzundaki şarkılar</p>
                <div className="artist-profile-track-list">
                  {artistProfilePoolTracks.length ? (
                    artistProfilePoolTracks.map((track) => (
                      (() => {
                        const isAlreadyInLibrary = isTrackInLocalLibrary(track)
                        return (
                      <button
                        key={`artist-profile-pool-track-${track.id}`}
                        type="button"
                        className={`artist-profile-track-row ${isAlreadyInLibrary ? 'already-added' : ''}`}
                        onClick={() => {
                          if (isAlreadyInLibrary) {
                            return
                          }
                          downloadPoolTrackToLibrary(track)
                        }}
                      >
                        <span className="artist-profile-track-cover">
                          {getTrackDisplayUrl(track, 'thumb') ? (
                            <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                          ) : (
                            <span className="track-thumb-fallback" style={{ background: track.gradient }} />
                          )}
                        </span>
                        <span className="artist-profile-track-copy">
                          <strong>{track.title}</strong>
                          <small>{track.album || 'Single'}</small>
                        </span>
                        <span className={`artist-profile-track-action ${isAlreadyInLibrary ? 'added' : ''}`}>
                          {isAlreadyInLibrary ? (
                            <>
                              <Check size={12} />
                              Eklendi
                            </>
                          ) : (
                            'Ekle'
                          )}
                        </span>
                      </button>
                        )
                      })()
                    ))
                  ) : (
                    <p className="about-text">Bu sanatçının müzik havuzunda şarkısı bulunamadı.</p>
                  )}
                </div>
              </section>
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      {albumInfoOpen ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setAlbumInfoOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="modal-card glass album-info-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Albüm</p>
                <h3>{albumInfo?.album || 'Bilinmeyen albüm'}</h3>
                <span className="panel-subtitle">{albumInfo?.artist || 'Bilinmeyen sanatçı'}</span>
              </div>
              <button className="mini-button ghost" onClick={() => setAlbumInfoOpen(false)}>
                <X size={14} />
                Kapat
              </button>
            </div>

            <div className="album-info-body">
              <div className="album-info-cover">
                {albumInfo?.coverUrl ? (
                  <img src={albumInfo.coverUrl} alt={`${albumInfo?.album || 'Albüm'} kapağı`} />
                ) : (
                  <div className="track-thumb-fallback" style={{ background: gradients[0] }} />
                )}
              </div>

              <div className="album-info-content">
                <p className="about-title">Detaylar</p>
                {albumInfoLoading ? (
                  <p className="about-text">Albüm bilgileri çekiliyor...</p>
                ) : (
                  <p className="about-text">
                    Çıkış tarihi:{' '}
                    {albumInfo?.releaseDate && Number.isFinite(new Date(albumInfo.releaseDate).getTime())
                      ? new Date(albumInfo.releaseDate).toLocaleDateString(
                          language === 'tr' ? 'tr-TR' : 'en-US',
                          { day: '2-digit', month: 'long', year: 'numeric' },
                        )
                      : 'Bilinmiyor'}
                    {' • '}
                    Müzik havuzu:{' '}
                    {Array.isArray(albumInfo?.poolTracks) && albumInfo.poolTracks.length
                      ? `${albumInfo.poolTracks.length} şarkı var`
                      : 'Bulunamadı'}
                  </p>
                )}

                {Array.isArray(albumInfo?.poolTracks) && albumInfo.poolTracks.length ? (
                  <>
                    <p className="about-title">Havuzdaki bu albüm şarkıları</p>
                    <div className="artist-profile-track-list">
                      {albumInfo.poolTracks.map((track) => {
                        const isAlreadyInLibrary = isTrackInLocalLibrary(track)
                        return (
                        <button
                          key={`album-pool-track-${track.id}`}
                          type="button"
                          className={`artist-profile-track-row ${isAlreadyInLibrary ? 'already-added' : ''}`}
                          onClick={() => {
                            if (isAlreadyInLibrary) {
                              return
                            }
                            downloadPoolTrackToLibrary(track)
                          }}
                        >
                          <span className="artist-profile-track-cover">
                            {getTrackDisplayUrl(track, 'thumb') ? (
                              <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                            ) : (
                              <span className="track-thumb-fallback" style={{ background: track.gradient }} />
                            )}
                          </span>
                          <span className="artist-profile-track-copy">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                          <span className={`artist-profile-track-action ${isAlreadyInLibrary ? 'added' : ''}`}>
                            {isAlreadyInLibrary ? (
                              <>
                                <Check size={12} />
                                Eklendi
                              </>
                            ) : (
                              'Ekle'
                            )}
                          </span>
                        </button>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      <div className="dashboard">
        <MotionAside
          className="library-panel glass"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t('library', 'Kütüphane')}</p>
              <h3>
                <ListMusic size={18} />
                {t('tracks', 'Parçalar')}
              </h3>
              <span className="panel-subtitle">{activeCollectionLabel}</span>
            </div>

            <div className="panel-header-actions">
              <button className="mini-upload" onClick={(event) => { event.stopPropagation(); openAddModal() }}>
                <Plus size={16} />
                {t('add', 'Ekle')}
              </button>
              <button
                className={`mini-button collection-quick-switch ${selectedCollectionId === 'all' ? 'primary' : 'ghost'}`}
                onClick={() => handleCollectionSelect('all')}
                title="Tüm parçalar"
              >
                <ListMusic size={14} />
                {t('allTracks', 'Tüm parçalar')}
              </button>
              <button
                className={`mini-button collection-quick-switch ${selectedCollectionId === 'favorites' ? 'primary' : 'ghost'}`}
                onClick={() => handleCollectionSelect('favorites')}
                title="Favoriler"
              >
                <Heart size={14} />
                {t('favorites', 'Favoriler')}
              </button>
              <button
                className={`mini-button collection-quick-switch ${selectedCollectionId === 'pool' ? 'primary' : 'ghost'}`}
                onClick={() => handleCollectionSelect('pool')}
                title={t('publicPool', 'Müzik Havuzu')}
              >
                <Download size={14} />
                {t('publicPool', 'Müzik Havuzu')}
              </button>
            </div>
          </div>

          <div className="library-body">
            <aside className="playlist-rail">
              <div className="playlist-rail-header">
                <h4>{t('playlists', 'Playlistler')}</h4>
                <button className="mini-upload playlist-create-trigger" onClick={openPlaylistCreator}>
                  <Plus size={16} />
                  {t('create', 'Oluştur')}
                </button>
              </div>

              <div className="library-collections-layout">
                <div className="playlist-rail-list">
                  {playlists.length === 0 ? (
                    <div className="menu-empty">{t('noPlaylistYet', 'Henüz playlist yok')}</div>
                  ) : (
                    playlists.map((playlist) => {
                      const isSelected = selectedCollectionId === playlist.id
                      const coverLetter = playlist.name?.trim()?.[0]?.toUpperCase() || 'P'

                      return (
                        <div
                          key={playlist.id}
                          className={`playlist-rail-row ${isSelected ? 'selected' : ''}`}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                          }}
                        >
                          <button
                            className="playlist-rail-main"
                            type="button"
                            onClick={() => handleCollectionSelect(playlist.id)}
                            onContextMenu={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                            }}
                          >
                            <span className="playlist-rail-cover">
                              {playlist.coverUrl ? (
                                <img
                                  src={playlist.coverUrl}
                                  alt={`${playlist.name} kapağı`}
                                  onContextMenu={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                                  }}
                                />
                              ) : (
                                <span
                                  className="playlist-rail-cover-fallback"
                                  style={{ background: playlist.color || playlistColors[0] }}
                                  onContextMenu={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                                  }}
                                >
                                  {coverLetter}
                                </span>
                              )}
                            </span>
                                <span className="playlist-rail-copy">
                              <strong>{playlist.name}</strong>
                              <span>{playlist.trackIds.length} şarkı</span>
                            </span>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {genreCollections.length ? (
                <div className="playlist-rail-dock">
                  <div className="playlist-rail-dock-divider" />
                  <p className="eyebrow playlist-rail-dock-title">Türler</p>
                  <div
                    ref={playlistDockRef}
                    className={`playlist-rail-dock-list ${playlistDockDragging ? 'dragging' : ''}`}
                    role="list"
                    aria-label="Türe göre hızlı çalma"
                    onPointerDown={handlePlaylistDockPointerDown}
                    onPointerMove={handlePlaylistDockPointerMove}
                    onPointerUp={handlePlaylistDockPointerUp}
                    onPointerCancel={handlePlaylistDockPointerUp}
                    onPointerLeave={handlePlaylistDockPointerUp}
                    onClickCapture={handlePlaylistDockClickCapture}
                  >
                    {genreCollections.map((genreCollection) => {
                      const coverLetter = genreCollection.name?.trim()?.[0]?.toUpperCase() || 'T'
                      const isSelected = selectedCollectionId === genreCollection.id
                      const shapeVariant = getGenreShapeVariant(genreCollection.key || genreCollection.name || '')
                      return (
                        <button
                          key={`genre-dock-${genreCollection.id}`}
                          type="button"
                          role="listitem"
                          className={`playlist-rail-dock-item genre-dock-item ${isSelected ? 'active' : ''}`}
                          data-genre-dock-id={genreCollection.id}
                          onClick={() => playGenreFromDock(genreCollection.id)}
                          title={`${genreCollection.name} türünü çal`}
                        >
                          <span className="playlist-rail-dock-cover">
                            <span
                              className={`playlist-rail-dock-fallback genre-dock-shape genre-dock-shape-${shapeVariant}`}
                              style={{ background: genreCollection.color || playlistColors[0] }}
                            >
                              <span className="genre-dock-glyph">{coverLetter}</span>
                            </span>
                            <span className="playlist-rail-dock-play">
                              <Play size={14} />
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

            </aside>

            <div className={`track-column ${selectedCollectionId === 'pool' ? 'pool-collection' : ''}`}>
              {selectedCollectionId !== 'pool' ? (
                <div className="collection-hero glass">
                  <span className="collection-hero-cover">
                    {activeCollectionCover ? (
                      <img src={activeCollectionCover} alt={`${activeCollectionLabel} kapağı`} />
                    ) : (
                      <span className="collection-hero-fallback" style={{ background: activeCollectionColor }}>
                        {activeCollectionLabel?.trim()?.[0]?.toUpperCase() || 'P'}
                      </span>
                    )}
                  </span>
                  <div className="collection-hero-copy">
                    <p className="eyebrow">Seçili koleksiyon</p>
                    <strong>{activeCollectionLabel}</strong>
                    <span>{activeCollectionDescription}</span>
                  </div>
                  <div className="meta-strip collection-meta-strip">
                    <div>
                      <span>Koleksiyon</span>
                      <strong>{visibleTracks.length} parca</strong>
                    </div>
                    <div>
                      <span>Toplam süre</span>
                      <strong>{formatCollectionDuration(selectedCollectionDuration, language)}</strong>
                    </div>
                    <div>
                      <span>Playlist</span>
                      <strong>{activeCollectionLabel}</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="library-search track-search-top">
                <input
                  type="search"
                  value={trackSearchQuery}
                  onChange={(event) => setTrackSearchQuery(event.target.value)}
                  placeholder={t('searchPlaceholder', 'Şarkı, sanatçı veya albüm ara')}
                />
                {selectedCollectionId === 'pool' ? (
                  <label className="track-search-toggle">
                    <input
                      type="checkbox"
                      checked={hideDownloadedPoolTracks}
                      onChange={(event) => setHideDownloadedPoolTracks(event.target.checked)}
                    />
                    <span>İndirdiklerimi gizle</span>
                  </label>
                ) : null}
              </div>

              <div className={selectedCollectionId === 'pool' ? 'pool-browser-layout' : ''}>
                {selectedCollectionId === 'pool' ? (
                  <aside className="pool-artist-column glass">
                    <div className="pool-artist-head">
                      <p className="eyebrow">Sanatçılar</p>
                      <strong>{poolArtists.length} sanatçı</strong>
                      <span>Havuzdaki parçaları sanatçıya göre filtrele</span>
                    </div>
                    <div className="pool-artist-list">
                      <button
                        className={`pool-artist-item ${poolArtistFilter === 'all' ? 'active' : ''}`}
                        type="button"
                        onClick={() => setPoolArtistFilter('all')}
                      >
                        <strong className="pool-artist-name">
                          <span>Tüm şarkıcılar</span>
                        </strong>
                        <span>{serverTracks.length} parça</span>
                      </button>
                      {poolArtists.map((artistItem) => (
                        <button
                          key={`pool-artist-${artistItem.name}`}
                          className={`pool-artist-item ${poolArtistFilter === artistItem.name ? 'active' : ''}`}
                          type="button"
                          onClick={() => setPoolArtistFilter(artistItem.name)}
                        >
                          <strong className="pool-artist-name">
                            <span>{artistItem.name}</span>
                            {artistItem.addedCount > 0 ? (
                              <span className="pool-added-check" title="Kütüphanende bu sanatçıdan şarkı var">
                                <Check size={12} />
                              </span>
                            ) : null}
                          </strong>
                          <span>{artistItem.count} parça</span>
                        </button>
                      ))}
                    </div>
                  </aside>
                ) : null}

                <div className={selectedCollectionId === 'pool' ? 'pool-browser-main' : ''}>
                  {selectedCollectionId === 'pool' ? (
                    <div className="pool-browser-summary glass">
                      <div>
                        <span>Seçili sanatçı</span>
                        <strong>{poolArtistFilter === 'all' ? 'Tüm şarkıcılar' : poolArtistFilter}</strong>
                      </div>
                      <div>
                        <span>Gösterilen şarkı</span>
                        <strong>{displayedTracks.length} parça</strong>
                      </div>
                      <div>
                        <span>Toplam havuz</span>
                        <strong>{serverTracks.length} parça</strong>
                      </div>
                    </div>
                  ) : null}
                  <div className="playlist-section">
                    <div className="playlist-section-header">
                      <h4>{t('tracks', 'Parçalar')}</h4>
                      <div className="playlist-section-actions">
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={refreshPoolTracksNow}
                            disabled={poolRefreshing || poolBulkDownloading}
                            title="Müzik havuzunu yenile"
                          >
                            <RefreshCw size={14} />
                            {poolRefreshing ? 'Yenileniyor...' : 'Yenile'}
                          </button>
                        ) : null}
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={downloadAllPoolTracks}
                            disabled={poolBulkDownloading || poolDownloadingTrackId || downloadablePoolTracks.length === 0}
                            title="Havuzdaki tüm indirilebilir şarkıları indir"
                          >
                            <Download size={14} />
                            {poolBulkDownloading ? 'İndiriliyor...' : `Hepsini indir (${downloadablePoolTracks.length})`}
                          </button>
                        ) : null}
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={downloadSelectedPoolTracks}
                            disabled={poolBulkDownloading || poolDownloadingTrackId || selectablePoolTracks.length === 0}
                            title="Seçilen şarkıları toplu indir"
                          >
                            <Download size={14} />
                            {poolBulkDownloading
                              ? 'Toplu indiriliyor...'
                              : `Seçileni indir (${selectablePoolTracks.length})`}
                          </button>
                        ) : null}
                        {selectedCollectionId !== 'pool' ? (
                          <>
                            <button
                              className="mini-upload playlist-create-trigger"
                              onClick={(event) => {
                                event.stopPropagation()
                                if (isCustomPlaylistSelected) {
                                  openPlaylistAddModal()
                                  return
                                }
                                openAddModal()
                              }}
                            >
                              <Plus size={16} />
                              {isCustomPlaylistSelected ? "Playlist'e ekle" : t('add', 'Ekle')}
                            </button>
                            <button
                              className="mini-button playlist-action-button"
                              onClick={openBulkEditor}
                              disabled={!tracks.length}
                              title="Şarkıları toplu düzenle"
                            >
                              <Edit3 size={14} />
                              Toplu düzenle
                            </button>
                          </>
                        ) : null}
                        {isPlaylistCollectionSelected ? (
                          <>
                            {isCustomPlaylistSelected ? (
                              <button
                                className="mini-button playlist-action-button"
                                onClick={() => currentPlaylist && openPlaylistEditor(currentPlaylist)}
                                disabled={!currentPlaylist}
                                title="Playlist'i düzenle"
                              >
                                <Edit3 size={14} />
                                Playlist'i düzenle
                              </button>
                            ) : null}
                            <button
                              className="mini-button playlist-action-button"
                              onClick={playSelectedCollection}
                              disabled={!visibleTracks.length}
                              title="Playlisti sırayla çal"
                            >
                              <Play size={14} />
                              Çal
                            </button>
                            <button
                              className="mini-button playlist-action-button"
                              onClick={shufflePlaySelectedCollection}
                              disabled={!visibleTracks.length}
                              title="Playlisti karışık çal"
                            >
                              <Shuffle size={14} />
                              Karışık çal
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {tracks.length === 0 ? (
                        <button className="playlist-empty-card" onClick={(event) => { event.stopPropagation(); openAddModal() }}>
                          <h4>Henüz şarkı yok</h4>
                          <p>Dosya veya Drive bağlantısı ekleyebilirsin.</p>
                        </button>
                    ) : (
                      <div className="playlist-track-hint">
                        <p>{tf('totalTracksReady', { count: tracks.length }, `Toplam ${tracks.length} şarkı hazır. Dosya veya bağlantı eklemek için Ekle butonunu kullan.`)}</p>
                      </div>
                    )}
                  </div>

                  <div
                    ref={trackListViewportRef}
                    className={selectedCollectionId === 'pool' ? 'pool-tracks-scroll' : ''}
                  >
                    {displayedTracks.length === 0 ? (
                      <div className="empty-state compact">
                        <div className="empty-orb" />
                          <h4>{visibleTracks.length === 0 ? t('noTracksYet', 'Henüz parça yok') : t('noResults', 'Sonuç bulunamadı')}</h4>
                        <p>
                          {visibleTracks.length === 0
                            ? t('noTracksHint', 'Dosya ya da link ekleyince burada temiz bir liste halinde görünecek.')
                            : t('noResultsHint', 'Arama veya indirilebilir filtresini değiştirip tekrar dene.')}
                        </p>
                      </div>
                    ) : (
                    <div className="track-list" key={`track-list-${trackListLayoutVersion}`}>
                      {renderedTracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id
              const isEditing = editTargetId === track.id
              const isPoolCollection = selectedCollectionId === 'pool'
              const isAlreadyInLibrary = isPoolCollection && isTrackInLocalLibrary(track)
              const localLibraryMatch =
                isPoolCollection && isAlreadyInLibrary
                  ? localLibraryTrackByKey.get(getLocalLibraryMatchKey(track)) || null
                  : null
              const contextMenuTrackId = localLibraryMatch?.id || track.id
              const hasPoolDuration = !isPoolCollection || (Number(track.duration || 0) > 0)
              const canDragReorder = track.source !== 'drive' && track.source !== 'shared'
              const isDragged = draggedTrackId === track.id
              const isDropTarget = dragOverTrackId === track.id && draggedTrackId && draggedTrackId !== track.id

                return (
                  <div
                    key={track.id}
                    className={`track-row ${
                      isActive ? 'active' : ''
                    } ${trackMenuId === track.id ? 'menu-open' : ''} ${isDragged ? 'dragging' : ''} ${isDropTarget ? 'drag-over' : ''} ${
                      isPoolCollection ? `pool-track-row ${hasPoolDuration ? 'has-duration' : 'no-duration'}` : ''
                    } ${isPoolCollection && poolSelectedTrackIdSet.has(track.id) ? 'pool-selected' : ''}`}
                    style={{ '--row-index': Math.min(index, 18) }}
                    onClick={(event) => {
                      if (selectedCollectionId !== 'pool') {
                        return
                      }
                      handlePoolTrackRowClick(event, track, index)
                    }}
                    onContextMenu={(event) => {
                      if (isPoolCollection && !isAlreadyInLibrary) {
                        event.preventDefault()
                        event.stopPropagation()
                        return
                      }
                      event.preventDefault()
                      event.stopPropagation()
                      openTrackMenu(contextMenuTrackId, null, { x: event.clientX, y: event.clientY })
                    }}
                    onDragEnter={() => {
                      if (!draggedTrackId || !canDragReorder) {
                        return
                      }
                      setDragOverTrackId(track.id)
                    }}
                    onDragOver={(event) => {
                      if (!draggedTrackId || !canDragReorder) {
                        return
                      }
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      setDragOverTrackId(track.id)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const droppedId = event.dataTransfer.getData('text/plain') || draggedTrackId
                      reorderTracksByDrag(droppedId, track.id)
                      setDraggedTrackId(null)
                      setDragOverTrackId(null)
                    }}
                    onDragEnd={() => {
                      setDraggedTrackId(null)
                      setDragOverTrackId(null)
                    }}
                    onDoubleClick={() => {
                      if (selectedCollectionId === 'pool') {
                        downloadPoolTrackToLibrary(track)
                        return
                      }

                      if (currentTrackId === track.id) {
                        restartTrack()
                        setIsPlaying(true)
                        return
                      }

                      playTrack(track.id)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        playTrack(track.id)
                      }
                    }}
                  >
                    <button
                      className="track-drag-handle"
                      type="button"
                      tabIndex={-1}
                      aria-label="Sıralamak için sürükle"
                      title={canDragReorder ? 'Sıralamak için sürükle' : 'Bu şarkının sırası değiştirilemez'}
                      disabled={!canDragReorder}
                      onClick={(event) => event.stopPropagation()}
                      draggable={canDragReorder}
                      onDragStart={(event) => {
                        event.stopPropagation()
                        if (!canDragReorder) {
                          event.preventDefault()
                          return
                        }
                        setDraggedTrackId(track.id)
                        setDragOverTrackId(track.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', track.id)
                      }}
                      onDragEnd={() => {
                        setDraggedTrackId(null)
                        setDragOverTrackId(null)
                      }}
                    >
                      <GripVertical size={14} />
                    </button>

                      <div className="track-thumb">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img
                            src={getTrackDisplayUrl(track, 'thumb')}
                            alt={`${track.title} kapak`}
                            className="track-thumb-image"
                          />
                      ) : (
                        <div className="track-thumb-fallback" style={{ background: track.gradient }} />
                      )}
                    </div>

                    <div className="track-info">
                      <div className="track-title-line">
                        <strong>{track.title}</strong>
                        <button
                          type="button"
                          className="track-artist-button track-artist-inline-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openArtistProfile(track.artist)
                          }}
                          title={`${track.artist} detaylarını aç`}
                        >
                          <span className="track-artist-inline">{track.artist}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        className="track-album-button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openAlbumInfo(track)
                        }}
                        title={`${track.album || 'Single'} albüm detaylarını aç`}
                      >
                        <small className="track-album-inline">{track.album || 'Single'}</small>
                      </button>
                    </div>

                    {hasPoolDuration ? (
                      <div className="track-meta">
                        <span>{formatTime(track.duration)}</span>
                      </div>
                    ) : null}

                     {isPoolCollection ? (
                       <button
                         className={`track-download-button ${isAlreadyInLibrary ? 'added' : ''}`}
                         onClick={(event) => {
                           event.stopPropagation()
                           if (!track.audioUrl || isAlreadyInLibrary) {
                             return
                           }
                           downloadPoolTrackToLibrary(track)
                         }}
                         disabled={Boolean(poolBulkDownloading || poolDownloadingTrackId === track.id || !track.audioUrl || isAlreadyInLibrary)}
                         title={`${track.artist} - ${track.title} için İndir ve Kütüphaneye ekle`}
                         aria-label="İndir ve Kütüphaneye ekle"
                       >
                         {isAlreadyInLibrary ? <Check size={16} /> : <Download size={16} />}
                         <span>
                           {isAlreadyInLibrary
                             ? 'Eklendi'
                             : poolDownloadingTrackId === track.id
                               ? 'Ekleniyor...'
                               : 'İndir ve Kütüphaneye ekle'}
                         </span>
                       </button>
                     ) : null}

                     {!isPoolCollection ? (
                       <button
                         className={`track-menu-trigger ${isEditing ? 'editing' : ''}`}
                         onClick={(event) => {
                           event.stopPropagation()
                           openTrackMenu(track.id, event.currentTarget)
                         }}
                         onDoubleClick={(event) => {
                           event.stopPropagation()
                         }}
                         aria-label="Parça menüsü"
                       >
                         <MoreVertical size={16} />
                       </button>
                     ) : null}
                  </div>
                )
                      })}
                      {hasMoreRenderedTracks ? <div ref={trackListSentinelRef} className="track-list-sentinel" /> : null}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionAside>

        <AnimatePresence initial={false} mode="wait">
        {sidebarPlayerActive ? (
        <MotionSection
          key="sidebar-player-panel"
          className="player-panel glass"
          initial={{ opacity: 0, x: 64, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 38, y: 54, scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 270, damping: 26, mass: 0.85 }}
        >
          <div className="player-panel-tools">
            <button
              className="icon-button"
              onClick={openFullscreenTrack}
              aria-label="Tam ekran"
              title="Tam ekran"
              disabled={!currentTrack}
            >
              <Maximize2 size={15} />
            </button>
            <button
              className={`icon-button ${queueOpen ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setQueueOpen((prev) => !prev)
              }}
              aria-label="Sıradaki liste"
              title="Sıradaki liste"
              disabled={!currentTrack}
            >
              <ListOrdered size={15} />
            </button>
            <button
              className={`icon-button ${currentTrack?.isFavorite ? 'active' : ''}`}
              onClick={toggleCurrentTrackFavorite}
              aria-label="Favori"
              title={currentTrack?.isFavorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
              disabled={!currentTrack}
            >
              <Heart size={15} className={currentTrack?.isFavorite ? 'active-heart' : ''} />
            </button>
            <button
              className="icon-button"
              onClick={(event) => {
                event.stopPropagation()
                currentTrack && toggleDockPlaylistMenu(event.currentTarget)
              }}
              aria-label="Playliste ekle"
              title="Playliste ekle"
              disabled={!currentTrack}
            >
              <ListMusic size={15} />
            </button>
            <button
              className="mini-button ghost player-panel-toggle"
              onClick={() => setSidebarPlayerExpanded(false)}
              aria-label="Playerı küçült"
              title="Playerı küçült"
            >
              <Minimize2 size={14} />
              Küçült
            </button>
          </div>

          <div className="player-now-box">
            <div className="now-playing">
              <AnimatePresence mode="wait">
                <MotionDiv
                  key={currentTrack?.id || 'empty-cover'}
                  ref={coverStageRef}

                  className={`cover-stage ${currentCoverUrl ? 'with-cover' : 'banner-only'}`}
                  style={{
                    background: sidebarPlayerActive ? 'transparent' : currentCoverTone,
                    '--cover-fg': currentCoverColors.fg,
                    '--cover-fg-soft': currentCoverColors.fgSoft,
                    '--cover-fg-muted': currentCoverColors.fgMuted,
                  }}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="cover-compact-layout">
                    <div className="cover-art">
                      {currentCoverUrl ? (
                        <img className="cover-image" src={currentCoverUrl} alt={`${currentTrack?.title || 'Parça'} kapağı`} />
                      ) : (
                        <div className="track-thumb-fallback" style={{ background: currentTrack?.gradient || gradients[0] }} />
                      )}
                    </div>
                  </div>
                </MotionDiv>
              </AnimatePresence>

              <div className="player-track-summary">
                <div className="player-track-title-line">
                  <strong>{currentTrackDisplayTitle}</strong>
                </div>
                <div className="player-track-artist-line">
                  <button
                    type="button"
                    className="track-artist-button player-track-artist-inline"
                    onClick={() => openArtistProfile(currentTrack?.artist || '')}
                    disabled={!currentTrack?.artist}
                    title={currentTrack?.artist ? `${currentTrack.artist} detaylarını aç` : 'Sanatçı bilgisi'}
                  >
                    {currentTrack?.artist || 'Sanatçı bilgisi'}
                  </button>
                </div>
                <button
                  type="button"
                  className="player-track-album-button"
                  onClick={() => openAlbumInfo(currentTrack)}
                  disabled={!currentTrack}
                  title={currentTrack?.album ? `${currentTrack.album} albüm detayları` : 'Albüm detayları'}
                >
                  <small className="player-track-album-line">{currentTrack?.album || 'Single'}</small>
                </button>
              </div>

              <div className="playback-sequence-card">
                <div
                  ref={playbackSequenceRef}
                  className="playback-sequence-list"
                  onPointerDown={handlePlaybackSequencePointerDown}
                  onPointerMove={handlePlaybackSequencePointerMove}
                  onPointerUp={handlePlaybackSequencePointerEnd}
                  onPointerCancel={handlePlaybackSequencePointerEnd}
                >
                  {playbackPreviewTracks.length ? (
                    playbackPreviewTracks.map((track, index) => {
                      const isCurrent = track?.id === currentTrackId
                      return (
                        <button
                          key={`${track?.id || 'empty'}-${index}`}
                          type="button"
                          className={`playback-sequence-item ${isCurrent ? 'active' : ''}`}
                          onClick={(event) => {
                            if (playbackSequenceDragRef.current.moved) {
                              event.preventDefault()
                              return
                            }
                            if (!track?.id || track.id === currentTrackId) {
                              return
                            }
                            switchTrack(track, true, {
                              enforceCooldown: false,
                              collectionId:
                                playbackCollectionId ||
                                (selectedCollectionId === 'pool' || selectedCollectionId === 'server'
                                  ? 'all'
                                  : selectedCollectionId),
                            })
                          }}
                          title={`${track?.title || 'Parça'} - ${track?.artist || ''}`}
                          disabled={!track?.id || isCurrent}
                        >
                          <span className="playback-sequence-cover">
                            {getTrackDisplayUrl(track, 'thumb') ? (
                              <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                            ) : (
                              <span className="playlist-menu-cover-fallback" style={{ background: track?.gradient || currentThemeColor }}>
                                <ListMusic size={11} />
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <p className="queue-empty">Sıra hazır olduğunda burada görünecek.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="player-about-block">
              <div className="player-info-tabs">
                <button
                  className={`mini-button ${rightPanelTab === 'artist' ? 'primary' : 'ghost'}`}
                  type="button"
                  onClick={() => setRightPanelTab('artist')}
                >
                  Sanatçı bilgisi
                </button>
                <button
                  className={`mini-button ${rightPanelTab === 'lyrics' ? 'primary' : 'ghost'}`}
                  type="button"
                  onClick={() => setRightPanelTab('lyrics')}
                >
                  Sözler
                </button>
              </div>

              <div className="player-info-content">
                {rightPanelTab === 'artist' ? (
                  <div className="player-artist-block">
                    <p className="about-title">Hakkında</p>
                    {artistFactsLoading ? (
                      <p className="about-text">Sanatçı bilgisi çekiliyor...</p>
                    ) : artistFactLine ? (
                      <p className="about-text">{artistFactLine}</p>
                    ) : (
                      <p className="about-text">Sanatçı bilgisi bulunamadı.</p>
                    )}
                    {artistFacts?.summary ? <p className="about-summary">{artistFacts.summary}</p> : null}
                    <div className="artist-photo">
                      {artistFacts?.photoUrl ? (
                        <img src={artistFacts.photoUrl} alt={`${currentTrack?.artist || 'Sanatçı'} görseli`} />
                      ) : (
                        <div className="artist-photo-fallback">
                          <UserRound size={20} />
                          <span>Sanatçı görseli yok</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="player-lyrics-block">
                    <p className="about-title">Sözler</p>
                    {lyricsLoading ? <p className="about-text">Sözler yükleniyor...</p> : null}
                    {!lyricsLoading && lyricsText ? <pre className="lyrics-text player-lyrics-text">{lyricsText}</pre> : null}
                    {!lyricsLoading && !lyricsText ? (
                      <div className="player-lyrics-empty">
                        <p className="about-text">{lyricsError || 'Sözler bulunamadı.'}</p>
                        <button className="mini-button ghost" onClick={() => lyricsFileInputRef.current?.click()}>
                          <Upload size={14} />
                          TXT yükle
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="player-controls-box">
            <div className="control-row">
              <button
                className={`icon-button ${shuffleEnabled ? 'active' : ''}`}
                onClick={toggleShuffleMode}
                aria-label="Karıştır"
                title={shuffleEnabled ? 'Karıştır açık (kapat)' : 'Karıştır aç'}
              >
                <Shuffle size={18} />
              </button>
              <button className="icon-button" onClick={restartTrack} aria-label="Başa al" title="Şarkıyı başa sar">
                <Rewind size={18} />
              </button>

              <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? 'Duraklat' : 'Oynat'} title={isPlaying && currentTrack ? 'Çalmayı duraklat' : 'Şarkıyı oynat'}>
                {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <button className="icon-button" onClick={stepTrack} aria-label="Sonraki" title="Sonraki şarkıya geç">
                <Forward size={18} />
              </button>
              <button
                className={`icon-button ${repeatEnabled ? 'active' : ''}`}
                onClick={toggleRepeatMode}
                aria-label="Aynı şarkıyı tekrarla"
                title={repeatEnabled ? 'Tekrar açık (kapat)' : 'Tekrar aç'}
              >
                <Repeat size={18} />
              </button>
            </div>

            <div className="progress-block">
              <input
                className="range range-progress"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(progress, duration || 0)}
                onChange={handleSeek}
                disabled={!currentTrack}
              />
              <div className="time-row">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="volume-row">
              <Volume2 size={18} />
              <input
                className="range"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>

          <div className="editor-panel">
            <div className="panel-header">
              <div>
                  <p className="eyebrow">Düzenleme</p>
                <h3>
                  <ImageIcon size={18} />
                  Parça bilgisi
                </h3>
              </div>
              <div className="editor-actions">
                <button className="mini-button ghost" onClick={closeEditor}>
                  <X size={14} />
                  Kapat
                </button>
                <button className="mini-button" onClick={openCoverPicker} disabled={!editingTrack}>
                  <ImageIcon size={14} />
                  Kapak
                </button>
                <button className="mini-button primary" onClick={handleSaveTrackChanges} disabled={!editDraft}>
                  <Save size={14} />
                  Kaydet
                </button>
              </div>
            </div>

            {editDraft && editingTrack ? (
              <div className="editor-grid">
                <div className="editor-cover-wrap">
                  <button
                    type="button"
                    className="editor-cover editor-cover-button"
                    onClick={() => setCoverMenuOpen((prev) => !prev)}
                  >
                    {getTrackCoverUrl(editingTrack, pendingCover) ? (
                      <img
                        src={getTrackCoverUrl(editingTrack, pendingCover)}
                        alt="Kapak önizleme"
                        className="editor-cover-image"
                        draggable={false}
                      />
                    ) : (
                      <div className="editor-cover-fallback" style={{ background: editingTrack.gradient }}>
                        <ImageIcon size={26} />
                      </div>
                    )}
                  </button>
                  {coverMenuOpen ? (
                    <div className="editor-cover-menu">
                      <button type="button" className="menu-item" onClick={openCoverPicker}>
                        <ImageIcon size={14} />
                        Kapağı değiştir
                      </button>
                      <button type="button" className="menu-item danger" onClick={requestCoverRemoval}>
                        <Trash2 size={14} />
                        Kapağı sil
                      </button>
                    </div>
                  ) : null}
                </div>

                <label className="field">
                  <span>Şarkı adı</span>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(event) => handleEditChange('title', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>
                    <UserRound size={14} />
                  Sanatçı
                  </span>
                  <input
                    type="text"
                    value={editDraft.artist}
                    onChange={(event) => handleEditChange('artist', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Albüm</span>
                  <input
                    type="text"
                    value={editDraft.album || 'Single'}
                    onChange={(event) => handleEditChange('album', event.target.value)}
                    placeholder="Albüm adı (yoksa Single)"
                  />
                </label>

                <div className="cover-meta">
                  <span>Kapak dosyası</span>
                  <strong>
                    {coverRemovalRequested
                      ? 'Kaldırılacak'
                      : pendingCover?.coverName || editingTrack.coverName || 'Secilmedi'}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="editor-empty">
                Bir parçayı seçip sağ üstteki düzenle butonuyla değişiklik yapabilirsin
              </div>
            )}
          </div>
        </MotionSection>
        ) : null}
        </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
      {!sidebarPlayerActive ? (
      <MotionFooter
        key="bottom-player-dock"
        ref={bottomDockRef}
        className={`player-dock glass ${bottomDockVisible ? '' : 'dock-auto-hidden'}`.trim()}
        style={themeVars}
        onMouseEnter={() => {
          setDockPointerInside(true)
          setDockProximityVisible(true)
        }}
        onMouseLeave={() => {
          setDockPointerInside(false)
        }}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 44, x: -24, scale: 0.985 }}
        animate={{ opacity: bottomDockVisible ? 1 : 0.08, y: bottomDockVisible ? 0 : 90, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, x: 52, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.84 }}
      >
        <div className="dock-track">
          <div
            className="dock-thumb"
            onClick={scrollToCoverStage}
            role="button"
            tabIndex={0}
          >
            {getTrackDisplayUrl(currentTrack, 'thumb') ? (
              <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt={`${currentTrack.title} kapak`} className="track-thumb-image" />
            ) : (
              <div className="track-thumb-fallback" style={{ background: currentTrack?.gradient || gradients[0] }} />
            )}
          </div>

          <div
            className="dock-meta"
            onClick={scrollToCoverStage}
            role="button"
            tabIndex={0}
          >
            <div className="dock-meta-row">
              <strong>{currentTrack?.title || 'Bir parça seç'}</strong>
              <div className="dock-actions">
                <button
                  className={`dock-icon-button ${currentTrack?.isFavorite ? 'active' : ''} ${dockFavoritePulseId === currentTrack?.id ? 'favorite-pulse' : ''}`}
                  onClick={(event) => { event.stopPropagation(); toggleCurrentTrackFavorite() }}
                  aria-label="Favori"
                >
                  <Heart size={16} className={currentTrack?.isFavorite ? 'active-heart' : ''} />
                </button>
                <button
                  className="dock-icon-button"
                  onClick={(event) => { event.stopPropagation(); currentTrack && toggleDockPlaylistMenu(event.currentTarget) }}
                  aria-label="Playliste ekle"
                >
                  <ListMusic size={16} />
                </button>
                <button
                  className="dock-icon-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!currentTrack) {
                      return
                    }
                    openTrackMenu(currentTrack.id, event.currentTarget)
                  }}
                  onDoubleClick={(event) => event.stopPropagation()}
                  disabled={!currentTrack}
                  aria-label="Parça menüsü"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
            <span>{currentTrack?.artist || 'Sanatçı bilgisi'}</span>
          </div>
        </div>

        <div className="dock-center">
          <div className="dock-controls">
            <button className={`icon-button ${shuffleEnabled ? 'active' : ''}`} onClick={toggleShuffleMode} aria-label="Karışık çal" title={shuffleEnabled ? 'Karışık çalma açık (kapat)' : 'Karışık çalmayı aç'}>
              <Shuffle size={18} />
            </button>

            <button className="icon-button" onClick={restartTrack} aria-label="Başa al" title="Şarkıyı başa sar">
              <Rewind size={18} />
            </button>

            <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? 'Duraklat' : 'Oynat'} title={isPlaying && currentTrack ? 'Çalmayı duraklat' : 'Şarkıyı oynat'}>
              {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button className="icon-button" onClick={stepTrack} aria-label="Sonraki" title="Sonraki şarkıya geç">
              <Forward size={18} />
            </button>

            <button className={`icon-button ${repeatEnabled ? 'active' : ''}`} onClick={toggleRepeatMode} aria-label="Tekrarla" title={repeatEnabled ? 'Tekrarlama açık (kapat)' : 'Şarkıyı tekrarlamayı aç'}>
              <Repeat size={18} />
            </button>
          </div>

          <div className="dock-progress dock-progress--compact">
            <div className="dock-progress-row">
              <span className="time-badge time-badge--start">{formatTime(progress)}</span>
              <input
                className="range range-progress"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(progress, duration || 0)}
                onChange={handleSeek}
                disabled={!currentTrack}
              />
              <span className="time-badge time-badge--end">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="dock-right">
          <div className="dock-utility-row">
            <button
              className={`dock-icon-button ${queueOpen ? 'active' : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setQueueOpen((prev) => !prev)
              }}
              disabled={!currentTrack}
              aria-label="Sıradaki liste"
            >
              <ListOrdered size={14} />
            </button>
            <button
              className={`dock-icon-button dock-lyrics-button ${lyricsOpen ? 'active' : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setLyricsOpen((prev) => !prev)
              }}
              disabled={!currentTrack}
              aria-label="Lyrics"
            >
              <Mic2 size={14} />
            </button>
            <button
              className="dock-icon-button dock-fullscreen-button"
              type="button"
              onClick={openFullscreenTrack}
              disabled={!currentTrack}
              aria-label="Tam ekran"
            >
              <Maximize2 size={14} />
            </button>
            {windowCanUseSidebarPlayer && !sidebarPlayerActive ? (
              <button
                className="dock-icon-button"
                type="button"
                onClick={() => {
                  if (!windowCanUseSidebarPlayer) {
                    return
                  }
                  setSidebarPlayerExpanded(true)
                }}
                aria-label="Sağ playerı aç"
                title="Sağ playerı aç"
              >
                <Maximize2 size={14} />
              </button>
            ) : null}
            <div className="volume-row dock-volume-compact">
              <Volume2 size={18} />
              <input
                className="range range-compact"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
      </MotionFooter>
      ) : null}
      </AnimatePresence>

      {showScrollTopButton ? (
        <button
          type="button"
          className="scroll-top-fab"
          style={scrollTopButtonLeft ? { left: scrollTopButtonLeft } : undefined}
          onClick={scrollAllListsToTop}
          aria-label="En üste çık"
          title="En üste çık"
        >
          <ChevronUp size={18} />
          En üste çık
        </button>
      ) : null}

      {fullscreenTrackOpen && currentTrack ? createPortal(
        <div
          className="fullscreen-track-backdrop"
          onClick={closeFullscreenTrack}
          onMouseMove={revealFullscreenControls}
          onMouseDown={(event) => {
            if (event.button === 0 || event.button === 2) {
              revealFullscreenControls()
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault()
            revealFullscreenControls()
          }}
        >
          <div
            className={`fullscreen-track-panel ${fullscreenEffectsEnabled ? '' : 'fullscreen-effects-off'}`.trim()}
            style={{
              background: fullscreenEffectsEnabled ? fullscreenGradient.background : currentCoverTone,
              '--cover-fg': fullscreenCoverColors.fg,
              '--cover-fg-soft': fullscreenCoverColors.fgSoft,
              '--cover-fg-muted': fullscreenCoverColors.fgMuted,
              '--fullscreen-control-bg': fullscreenControlBg,
              '--fullscreen-control-border': fullscreenControlBorder,
              '--fullscreen-control-fg': fullscreenCoverColors.fg,
              '--fullscreen-control-fg-soft': fullscreenCoverColors.fgSoft,
              '--fullscreen-control-fg-muted': fullscreenCoverColors.fgMuted,
              '--audio-level': Number.isFinite(fullscreenAudioLevel) ? fullscreenAudioLevel : 0,
              '--fullscreen-orb-a': fullscreenGradient.orbA,
              '--fullscreen-orb-b': fullscreenGradient.orbB,
              '--fullscreen-orb-c': fullscreenGradient.orbC,
            }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => {
              if (event.button === 0 || event.button === 2) {
                revealFullscreenControls()
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              revealFullscreenControls()
            }}
          >
            {fullscreenEffectsEnabled ? (
              <div className="fullscreen-audio-ambient" aria-hidden>
                <MotionDiv
                  className="fullscreen-ambient-blob blob-a"
                  animate={{ x: [0, 26, -20, 0], y: [0, -18, 14, 0], scale: [1, 1.08, 0.95, 1] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
                <MotionDiv
                  className="fullscreen-ambient-blob blob-b"
                  animate={{ x: [0, -24, 18, 0], y: [0, 16, -12, 0], scale: [1, 0.94, 1.08, 1] }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />
                <MotionDiv
                  className="fullscreen-ambient-blob blob-c"
                  animate={{ x: [0, 16, -14, 0], y: [0, -12, 10, 0], scale: [1, 1.06, 0.96, 1] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                />
                <span className="fullscreen-audio-wash" />
                <span className="fullscreen-audio-orb orb-a" />
                <span className="fullscreen-audio-orb orb-b" />
                <span className="fullscreen-audio-orb orb-c" />
                <span className="fullscreen-audio-grid" />
                <span className="fullscreen-audio-grain" />
              </div>
            ) : null}
            <button className="fullscreen-track-close" type="button" onClick={closeFullscreenTrack} aria-label="Kapat">
              <Minimize2 size={16} />
            </button>
            <AnimatePresence mode="wait">
              <MotionDiv
                key={currentTrack.id}
                className="fullscreen-track-scene"
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 1.012 }}
                transition={{ duration: 0.34, ease: 'easeOut' }}
              >
                <div className="fullscreen-track-cover">
                  {getTrackCoverUrl(currentTrack) ? (
                    <img src={getTrackCoverUrl(currentTrack)} alt="Kapak önizleme" />
                  ) : (
                    <div className="fullscreen-track-fallback" style={{ background: currentTrack.gradient || currentThemeColor }} />
                  )}
                </div>
                <div className="fullscreen-track-copy">
                  <h2 className={fullscreenTitle.className} style={fullscreenTitle.style}>{fullscreenTitle.text || 'Bir parça seç'}</h2>
                  <p>{currentTrack.artist}</p>
                  {fullscreenEffectsEnabled ? (
                    <div className="fullscreen-audio-visualizer" aria-hidden>
                      {Array.from({ length: 12 }).map((_, index) => (
                        <span key={`viz-${index}`} style={{ '--bar-index': index }} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </MotionDiv>
            </AnimatePresence>

            {fullscreenQueueOpen ? (
            <div className="fullscreen-queue-panel">
              <div className="queue-panel-head">
                <div>
                  <p className="eyebrow">Sıradaki</p>
                  <strong>Çalma listesi</strong>
                </div>
              </div>

              <div className="queue-now-playing">
                <span className="queue-label">Şu anda çalan</span>
                <div className="queue-item">
                  <span className="queue-item-cover">
                    {getTrackDisplayUrl(currentTrack, 'thumb') ? (
                      <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt="" className="playlist-menu-cover-image" />
                    ) : (
                      <span className="playlist-menu-cover-fallback" style={{ background: currentTrack.gradient || currentThemeColor }}>
                        <ListMusic size={12} />
                      </span>
                    )}
                  </span>
                  <span className="queue-item-copy">
                    <strong>{currentTrack.title}</strong>
                    <small>{currentTrack.artist}</small>
                  </span>
                </div>
              </div>

              <div className="queue-list fullscreen-queue-list">
                {upcomingPlaybackTracks.length ? (
                  upcomingPlaybackTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`queue-item queue-item-reorderable ${queueDraggedTrackId === track.id ? 'dragging' : ''} ${queueDragOverTrackId === track.id ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setQueueDraggedTrackId(track.id)
                        setQueueDragOverTrackId(track.id)
                        event.dataTransfer.setData('text/plain', track.id)
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnter={() => {
                        if (!queueDraggedTrackId || queueDraggedTrackId === track.id) {
                          return
                        }
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDragOver={(event) => {
                        if (!queueDraggedTrackId || queueDraggedTrackId === track.id) {
                          return
                        }
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const droppedId = event.dataTransfer.getData('text/plain')
                        reorderUpcomingQueueByDrag(droppedId, track.id)
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                      onDragEnd={() => {
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                    >
                      <span className="queue-item-drag-handle">
                        <GripVertical size={12} />
                      </span>
                      <span className="queue-item-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="queue-item-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="queue-empty">Sıradaki parça yok.</p>
                )}
              </div>
            </div>
            ) : null}

            <div className={`fullscreen-track-controls ${fullscreenControlsVisible ? 'visible' : ''}`}>
              <div className="fullscreen-track-controls-bar">
                <div className="fullscreen-track-controls-row">
                  <div className="fullscreen-track-controls-left-spacer" aria-hidden />
                  <div className="fullscreen-track-main-controls">
                    <button className={`icon-button ${shuffleEnabled ? 'active' : ''}`} onClick={toggleShuffleMode} aria-label="Karışık çal" title={shuffleEnabled ? 'Karışık çalma açık (kapat)' : 'Karışık çalmayı aç'}>
                      <Shuffle size={18} />
                    </button>
                    <button className="icon-button" onClick={restartTrack} aria-label="Başa al" title="Şarkıyı başa sar">
                      <Rewind size={18} />
                    </button>
                    <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? 'Duraklat' : 'Oynat'} title={isPlaying && currentTrack ? 'Çalmayı duraklat' : 'Şarkıyı oynat'}>
                      {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="icon-button" onClick={stepTrack} aria-label="Sonraki" title="Sonraki şarkıya geç">
                      <Forward size={18} />
                    </button>
                    <button className={`icon-button ${repeatEnabled ? 'active' : ''}`} onClick={toggleRepeatMode} aria-label="Tekrarla" title={repeatEnabled ? 'Tekrarlama açık (kapat)' : 'Şarkıyı tekrarlamayı aç'}>
                      <Repeat size={18} />
                    </button>
                  </div>
                  <div className="fullscreen-track-side-actions">
                    <button
                      type="button"
                      className={`icon-button ${dockPlaylistMenuOpen ? 'active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleDockPlaylistMenu(event.currentTarget)
                      }}
                      aria-label="Playliste ekle"
                      title="Playliste ekle"
                    >
                      <ListMusic size={18} />
                    </button>
                    <button
                      type="button"
                      className={`icon-button ${lyricsOpen ? 'active' : ''}`}
                      onClick={() => setLyricsOpen((prev) => !prev)}
                      aria-label="Şarkı sözlerini aç/kapat"
                      title="Şarkı sözleri"
                    >
                      <Mic2 size={18} />
                    </button>
                    <button
                      type="button"
                      className={`icon-button ${fullscreenQueueOpen ? 'active' : ''}`}
                      onClick={() => setFullscreenQueueOpen((prev) => !prev)}
                      aria-label="Sıradaki listeyi aç/kapat"
                      title="Sıradaki liste"
                    >
                      <ListOrdered size={18} />
                    </button>
                    <div className="fullscreen-track-volume-control">
                      <Volume2 size={16} />
                      <input
                        className="range range-compact"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        aria-label="Ses seviyesi"
                      />
                    </div>
                  </div>
                </div>
                <div className="fullscreen-track-progress">
                  <span className="time-badge time-badge--start">{formatTime(progress)}</span>
                  <input
                    className="range range-progress"
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={Math.min(progress, duration || 0)}
                    onChange={handleSeek}
                    disabled={!currentTrack}
                  />
                  <span className="time-badge time-badge--end">{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      <AnimatePresence>
        {bulkEditOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBulkEditor}
          >
            <MotionDiv
              className="modal-card glass bulk-edit-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Toplu düzenleme</p>
                  <h3>
                    <Edit3 size={18} />
                    Şarkıları toplu düzenle
                  </h3>
                  <span className="panel-subtitle">
                    İsim, sanatçı ve albüm bilgisini düzenle. Kapağa tıklayıp değiştir veya sil.
                  </span>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closeBulkEditor} disabled={bulkEditSaving}>
                    <X size={14} />
                    Kapat
                  </button>
                  <button
                    className="mini-button primary"
                    onClick={() => saveBulkTrackChanges().catch(() => {})}
                    disabled={bulkEditSaving || !bulkEditDrafts.length}
                  >
                    <Save size={14} />
                    {bulkEditSaving ? 'Kaydediliyor...' : 'Tümünü kaydet'}
                  </button>
                </div>
              </div>

              <input
                ref={bulkCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={handleBulkCoverSelect}
              />

              <div className="bulk-edit-list">
                {bulkEditDrafts.map((draft) => {
                  const sourceTrack = tracks.find((item) => item.id === draft.id)
                  if (!sourceTrack) {
                    return null
                  }

                  const previewCover = draft.coverPreviewUrl || getTrackDisplayUrl(sourceTrack, 'thumb')
                  const isCoverMenuOpen = bulkCoverMenuTrackId === draft.id

                  return (
                    <div key={`bulk-edit-${draft.id}`} className="bulk-edit-row">
                      <div className="bulk-edit-cover-wrap">
                        <button
                          type="button"
                          className="bulk-edit-cover bulk-edit-cover-button"
                          onClick={() => setBulkCoverMenuTrackId((prev) => (prev === draft.id ? null : draft.id))}
                          aria-label="Kapak seçenekleri"
                          title="Kapak seçenekleri"
                        >
                          {previewCover ? (
                            <img
                              src={previewCover}
                              alt={`${draft.title || sourceTrack.title} kapak`}
                              className="track-thumb-image"
                            />
                          ) : (
                            <div className="track-thumb-fallback" style={{ background: sourceTrack.gradient }} />
                          )}
                        </button>
                        {isCoverMenuOpen ? (
                          <div className="bulk-cover-menu">
                            <button type="button" className="menu-item" onClick={() => openBulkCoverPicker(draft.id)}>
                              <ImageIcon size={14} />
                              Kapağı değiştir
                            </button>
                            <button type="button" className="menu-item danger" onClick={() => removeBulkCover(draft.id)}>
                              <Trash2 size={14} />
                              Kapağı sil
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <label className="field">
                        <span>Şarkı adı</span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(event) => handleBulkEditChange(draft.id, 'title', event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>Sanatçı</span>
                        <input
                          type="text"
                          value={draft.artist}
                          onChange={(event) => handleBulkEditChange(draft.id, 'artist', event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>Albüm</span>
                        <input
                          type="text"
                          value={draft.album}
                          onChange={(event) => handleBulkEditChange(draft.id, 'album', event.target.value)}
                          placeholder="Single"
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {editDraft && editingTrack ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditor}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                <p className="eyebrow">Düzenleme</p>
                  <h3>
                    <ImageIcon size={18} />
                  Parça bilgisi
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closeEditor}>
                    <X size={14} />
                    Kapat
                  </button>
                  <button className="mini-button" onClick={openCoverPicker} disabled={!editingTrack}>
                    <ImageIcon size={14} />
                    Kapak
                  </button>
                  <button className="mini-button primary" onClick={handleSaveTrackChanges} disabled={!editDraft}>
                    <Save size={14} />
                    Kaydet
                  </button>
                </div>
              </div>

              <div className="editor-grid">
                <div className="editor-cover-wrap">
                  <button
                    type="button"
                    className="editor-cover editor-cover-button"
                    onClick={() => setCoverMenuOpen((prev) => !prev)}
                  >
                    {getTrackCoverUrl(editingTrack, pendingCover) ? (
                      <img
                        src={getTrackCoverUrl(editingTrack, pendingCover)}
                        alt="Kapak önizleme"
                        className="editor-cover-image"
                        draggable={false}
                      />
                    ) : (
                      <div className="editor-cover-fallback" style={{ background: editingTrack.gradient }}>
                        <ImageIcon size={26} />
                      </div>
                    )}
                  </button>
                  {coverMenuOpen ? (
                    <div className="editor-cover-menu">
                      <button type="button" className="menu-item" onClick={openCoverPicker}>
                        <ImageIcon size={14} />
                        Kapağı değiştir
                      </button>
                      <button type="button" className="menu-item danger" onClick={requestCoverRemoval}>
                        <Trash2 size={14} />
                        Kapağı sil
                      </button>
                    </div>
                  ) : null}
                </div>

                <label className="field">
                  <span>Parça adı</span>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(event) => handleEditChange('title', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>
                    <UserRound size={14} />
                  Sanatçı
                  </span>
                  <input
                    type="text"
                    value={editDraft.artist}
                    onChange={(event) => handleEditChange('artist', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Albüm</span>
                  <input
                    type="text"
                    value={editDraft.album || 'Single'}
                    onChange={(event) => handleEditChange('album', event.target.value)}
                    placeholder="Albüm adı (yoksa Single)"
                  />
                </label>

                <div className="cover-meta">
                  <span>Kapak dosyası</span>
                  <strong>
                    {coverRemovalRequested
                      ? 'Kaldırılacak'
                      : pendingCover?.coverName || editingTrack.coverName || 'Seçilmedi'}
                  </strong>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {creatingPlaylist ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistCreator}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                ref={playlistCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={(event) => handlePlaylistCoverSelect(event, 'create')}
              />
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist</p>
                  <h3>
                    <ListMusic size={18} />
                    Yeni playlist
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistCreator}>
                    <X size={14} />
                    Kapat
                  </button>
                  <button className="mini-button primary" onClick={createPlaylist} disabled={!playlistNameDraft.trim()}>
                    <Plus size={14} />
                  Oluştur
                  </button>
                </div>
              </div>

              <div className="playlist-create-row">
                <div className="playlist-editor-cover">
                  {playlistCoverDraft ? (
                    <img src={playlistCoverDraft} alt="Playlist kapak resmi önizleme" className="editor-cover-image" />
                  ) : (
                    <div className="editor-cover-fallback" style={{ background: playlistColorDraft }}>
                      <ListMusic size={26} />
                    </div>
                  )}
                </div>
                <div className="playlist-fields-stack">
                  <label className="field">
                    <span>Playlist adı</span>
                    <input
                      type="text"
                      value={playlistNameDraft}
                      onChange={(event) => setPlaylistNameDraft(event.target.value)}
                      placeholder="Örneğin: Gece listesi"
                    />
                  </label>
                  <label className="field">
                    <span>Açıklama</span>
                    <input
                      type="text"
                      value={playlistDescriptionDraft}
                      onChange={(event) => setPlaylistDescriptionDraft(event.target.value)}
                      placeholder="Playlist açıklaması"
                    />
                  </label>
                </div>
              </div>

              <div className="playlist-cover-controls">
                <div className="cover-meta">
                  <span>Kapak görseli</span>
                  <strong>{playlistCoverDraft ? 'Seçildi' : 'Seçilmedi'}</strong>
                </div>

                <button className="mini-button" onClick={() => playlistCoverInputRef.current?.click()}>
                  <ImageIcon size={14} />
                  Kapak ekle
                </button>
              </div>

              <div className="color-picker">
                <span>Renk</span>
                <div className="color-swatch-row">
                  {playlistColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch ${playlistColorDraft === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setPlaylistColorDraft(color)}
                      aria-label={`Renk ${color}`}
                    />
                  ))}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {editingPlaylistId ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistEditor}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                ref={playlistEditCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={(event) => handlePlaylistCoverSelect(event, 'edit')}
              />
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist</p>
                  <h3>
                    <ListMusic size={18} />
                Playlist düzenle
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistEditor}>
                    <X size={14} />
                    Kapat
                  </button>
                  <button
                    className="mini-button primary"
                    onClick={savePlaylistChanges}
                    disabled={!playlistEditDraft.trim()}
                  >
                    <Save size={14} />
                    Kaydet
                  </button>
                </div>
              </div>

              <div className="playlist-create-row">
                <div className="playlist-editor-cover">
                  {playlistEditCoverDraft ? (
                    <img
                      src={playlistEditCoverDraft}
                      alt="Playlist kapak resmi önizleme"
                      className="editor-cover-image"
                    />
                  ) : (
                    <div className="editor-cover-fallback" style={{ background: playlistEditColorDraft }}>
                      <ListMusic size={26} />
                    </div>
                  )}
                </div>
                <div className="playlist-fields-stack">
                  <label className="field">
                    <span>Playlist adı</span>
                    <input
                      type="text"
                      value={playlistEditDraft}
                      onChange={(event) => setPlaylistEditDraft(event.target.value)}
                      autoFocus
                    />
                  </label>
                  <label className="field">
                    <span>Açıklama</span>
                    <input
                      type="text"
                      value={playlistEditDescriptionDraft}
                      onChange={(event) => setPlaylistEditDescriptionDraft(event.target.value)}
                      placeholder="Playlist açıklaması"
                    />
                  </label>
                </div>
              </div>

              <div className="playlist-cover-controls">
                <div className="cover-meta">
                  <span>Kapak görseli</span>
                  <strong>{playlistEditCoverDraft ? 'Seçildi' : 'Seçilmedi'}</strong>
                </div>

                <button className="mini-button" onClick={() => playlistEditCoverInputRef.current?.click()}>
                  <ImageIcon size={14} />
                  Kapak ekle
                </button>
              </div>

              <div className="color-picker">
                <span>Renk</span>
                <div className="color-swatch-row">
                  {playlistColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch ${playlistEditColorDraft === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setPlaylistEditColorDraft(color)}
                      aria-label={`Renk ${color}`}
                    />
                  ))}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
      </div>

      {dockPlaylistMenuOpen && playlistMenuTrackId && playlistMenuPosition
        ? createPortal(
            <div
              className={`dock-playlist-menu dock-playlist-menu--portal ${fullscreenTrackOpen ? 'dock-playlist-menu--fullscreen' : ''}`}
              style={playlistMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const activeTrack = allTracks.find((track) => track.id === playlistMenuTrackId)

                return playlists.length === 0 ? (
                  <div className="menu-empty">Henüz playlist yok</div>
                ) : (
                  playlists.map((playlist) => {
                    const inPlaylist = activeTrack ? playlist.trackIds.includes(activeTrack.id) : false
                    return (
                      <button
                        key={playlist.id}
                        className={`menu-item playlist-menu-entry ${inPlaylist ? 'selected' : ''}`}
                        onClick={() => activeTrack && toggleTrackPlaylist(playlist.id, activeTrack.id)}
                      >
                        <span className="playlist-menu-cover">
                          {playlist.coverUrl ? (
                            <img src={playlist.coverUrl} alt="" className="playlist-menu-cover-image" />
                          ) : (
                            <span
                              className="playlist-menu-cover-fallback"
                              style={{ background: playlist.color || currentThemeColor }}
                            >
                              <ListMusic size={12} />
                            </span>
                          )}
                        </span>
                        <span className="playlist-menu-copy">
                          <strong>{playlist.name}</strong>
                    <small>{playlist.trackIds.length} şarkı</small>
                        </span>
                        <Check size={14} className={inPlaylist ? 'visible' : 'hidden-check'} />
                      </button>
                    )
                  })
                )
              })()}
            </div>,
            document.body,
          )
        : null}

      {lyricsOpen
        ? createPortal(
            <div
              className={`lyrics-panel ${fullscreenTrackOpen ? 'lyrics-panel--fullscreen' : ''} ${fullscreenTrackOpen && fullscreenQueueOpen ? 'lyrics-panel--with-queue' : ''}`}
              style={{ right: 16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="lyrics-panel-head">
                <div>
                  <p className="eyebrow">Lyrics</p>
                  <strong>{currentTrack?.title || 'Şarkı yok'}</strong>
                  <span>{currentTrack?.artist || ''}</span>
                </div>
                <button
                  className="dock-icon-button"
                  type="button"
                  onClick={() => setLyricsOpen(false)}
                  aria-label="Lyrics kapat"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="lyrics-panel-body">
                {lyricsLoading ? <p>Sözler yükleniyor...</p> : null}
                {!lyricsLoading && lyricsError ? <p>{lyricsError}</p> : null}
                {!lyricsLoading && !lyricsError && lyricsText ? (
                  <pre className="lyrics-text">{lyricsText}</pre>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {queueOpen
        ? createPortal(
            <div
              className="queue-panel"
              style={{
                right: sidebarPlayerActive
                  ? (lyricsOpen
                    ? 'calc(var(--right-player-width) + 452px)'
                    : 'calc(var(--right-player-width) + 16px)')
                  : (lyricsOpen ? 452 : 16),
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="queue-panel-head">
                <div>
                  <p className="eyebrow">Sıradaki</p>
                  <strong>Çalma listesi</strong>
                </div>
                <button
                  className="dock-icon-button"
                  type="button"
                  onClick={() => setQueueOpen(false)}
                  aria-label="Sıradaki paneli kapat"
                >
                  <X size={14} />
                </button>
              </div>

              {currentTrack ? (
                <div className="queue-now-playing">
                  <span className="queue-label">Şu anda çalan</span>
                  <div className="queue-item">
                    <span className="queue-item-cover">
                      {getTrackDisplayUrl(currentTrack, 'thumb') ? (
                        <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt="" className="playlist-menu-cover-image" />
                      ) : (
                        <span className="playlist-menu-cover-fallback" style={{ background: currentTrack.gradient || currentThemeColor }}>
                          <ListMusic size={12} />
                        </span>
                      )}
                    </span>
                    <span className="queue-item-copy">
                      <strong>{currentTrack.title}</strong>
                      <small>{currentTrack.artist}</small>
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="queue-list">
                {upcomingPlaybackTracks.length ? (
                  upcomingPlaybackTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`queue-item queue-item-reorderable ${queueDraggedTrackId === track.id ? 'dragging' : ''} ${queueDragOverTrackId === track.id && queueDraggedTrackId !== track.id ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setQueueDraggedTrackId(track.id)
                        setQueueDragOverTrackId(track.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', track.id)
                      }}
                      onDragEnter={() => {
                        if (!queueDraggedTrackId) {
                          return
                        }
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDragOver={(event) => {
                        if (!queueDraggedTrackId) {
                          return
                        }
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const droppedId = event.dataTransfer.getData('text/plain') || queueDraggedTrackId
                        reorderUpcomingQueueByDrag(droppedId, track.id)
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                      onDragEnd={() => {
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                    >
                      <span className="queue-item-drag-handle" title="Sırayı değiştirmek için sürükle">
                        <GripVertical size={14} />
                      </span>
                      <span className="queue-item-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="queue-item-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="queue-empty">Sırada başka şarkı yok.</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {trackMenuId && trackMenuPosition
        ? createPortal(
            <div
              className="track-menu track-menu--portal"
              style={trackMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const track = allTracks.find((item) => item.id === trackMenuId)
                if (!track) {
                  return null
                }

                return (
                  <>
                    {track.source !== 'drive' && track.source !== 'shared' ? (
                      <button
                        className="menu-item"
                        onClick={() => {
                          openEditor(track)
                          setTrackMenuId(null)
                          setTrackMenuPosition(null)
                        }}
                      >
                        <ImageIcon size={14} />
                      Düzenle
                      </button>
                    ) : null}
                    <button className="menu-item" onClick={() => toggleFavorite(track.id)}>
                      <Heart size={14} className={track.isFavorite ? 'active-heart' : ''} />
                      {track.isFavorite ? 'Favoriden çıkar' : 'Favorile'}
                    </button>
                    <button className="menu-item" onClick={() => searchYouTube(track)}>
                      <Youtube size={14} />
                      YouTube'da ara
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        queueTrackAsNext(track.id)
                        setTrackMenuId(null)
                        setTrackMenuPosition(null)
                      }}
                    >
                      <Forward size={14} />
                      Bir sonraki olarak ayarla
                    </button>
                    <button className="menu-item" onClick={(event) => openTrackPlaylistMenu(track.id, event.currentTarget)}>
                      <ListMusic size={14} />
                      Playliste ekle
                    </button>
                    {track.source === 'drive' || track.source === 'shared' || track.source === 'pool' ? (
                      <button
                        className="menu-item"
                        onClick={() => {
                          downloadPoolTrackToLibrary(track)
                          setTrackMenuId(null)
                          setTrackMenuPosition(null)
                        }}
                      >
                        <Download size={14} />
                        İndir ve kütüphaneye ekle
                      </button>
                    ) : null}
                    {track.source !== 'drive' && track.source !== 'shared' ? (
                      <button className="menu-item danger" onClick={() => requestDeleteTrack(track.id)}>
                        <Trash2 size={14} />
                        Sil
                      </button>
                    ) : null}
                  </>
                )
              })()}
            </div>,
            document.body,
          )
        : null}

      {playlistContextMenuId && playlistContextMenuPosition
        ? createPortal(
            <div
              className="track-menu track-menu--portal playlist-context-menu"
              style={playlistContextMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const playlist = playlists.find((item) => item.id === playlistContextMenuId)
                if (!playlist) {
                  return null
                }
                return (
                  <>
                    <button
                      className="menu-item"
                      onClick={() => {
                        openPlaylistEditor(playlist)
                        setPlaylistContextMenuId(null)
                        setPlaylistContextMenuPosition(null)
                      }}
                    >
                      <Edit3 size={14} />
                      Düzenle
                    </button>
                    <button
                      className="menu-item danger"
                      onClick={() => {
                        requestDeletePlaylist(playlist.id)
                        setPlaylistContextMenuId(null)
                        setPlaylistContextMenuPosition(null)
                      }}
                    >
                      <Trash2 size={14} />
                      Sil
                    </button>
                  </>
                )
              })()}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default App





























