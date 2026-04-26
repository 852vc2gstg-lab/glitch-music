import { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Download,
  FileUp,
  ImageIcon,
  Link2,
  Music2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import './admin.css'

const formatTime = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeDriveUrl = (value = '') => {
  const url = value.trim()
  if (!url) {
    return ''
  }

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
  if (fileMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`
  }

  const idMatch = url.match(/[?&]id=([^&]+)/i)
  if (url.includes('drive.google.com') && idMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`
  }

  return url
}

const parseTrackName = (fileName) => {
  const cleanName = fileName.replace(/\.[^/.]+$/, '')
  const parts = cleanName.split(' - ')

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      title: parts.slice(1).join(' - '),
    }
  }

  return {
    artist: '',
    title: cleanName,
  }
}

const readTrackMetadata = async (file) => {
  try {
    const { parseBlob } = await import('music-metadata-browser')
    const metadata = await parseBlob(file)
    const title = metadata?.common?.title?.trim() || ''
    const artist =
      metadata?.common?.artists?.filter(Boolean).join(', ')?.trim() ||
      metadata?.common?.artist?.trim() ||
      ''

    return {
      title,
      artist,
    }
  } catch {
    return null
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

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('file-read-failed'))
    reader.readAsDataURL(file)
  })

const emptyRow = () => ({
  id: crypto.randomUUID(),
  title: '',
  artist: '',
  audioUrl: '',
  coverUrl: '',
  duration: '',
  sourceFile: '',
  coverName: '',
})

const createManifest = (rows) => ({
  tracks: rows.map((row) => ({
    id: row.id.trim() || slugify(`${row.artist || 'track'}-${row.title || 'untitled'}`),
    title: row.title.trim(),
    artist: row.artist.trim(),
    audioUrl: normalizeDriveUrl(row.audioUrl.trim()),
    coverUrl: normalizeDriveUrl(row.coverUrl.trim()),
    duration: Number.parseFloat(row.duration) || 0,
  })),
})

export default function AdminApp() {
  const [rows, setRows] = useState([])
  const [bulkLinks, setBulkLinks] = useState('')
  const [notice, setNotice] = useState('')
  const [dropActive, setDropActive] = useState(false)
  const [selectedCoverRow, setSelectedCoverRow] = useState(null)
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const manifest = useMemo(() => createManifest(rows), [rows])
  const manifestJson = useMemo(() => JSON.stringify(manifest, null, 2), [manifest])
  const missingAudioCount = rows.filter((row) => !row.audioUrl.trim()).length
  const filledCount = rows.length - missingAudioCount

  const flashNotice = (message) => {
    setNotice(message)
    window.clearTimeout(flashNotice._timer)
    flashNotice._timer = window.setTimeout(() => setNotice(''), 2500)
  }

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    setRows((prev) => [emptyRow(), ...prev])
  }

  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId))
  }

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      return
    }

    const audioFiles = files.filter(
      (file) => file.type.startsWith('audio') || /\.(mp3|m4a|wav|flac|ogg)$/i.test(file.name),
    )
    const imageFiles = files.filter((file) => file.type.startsWith('image'))
    const coverMap = new Map()

    for (const image of imageFiles) {
      const base = image.name.replace(/\.[^/.]+$/, '').toLowerCase()
      coverMap.set(base, await fileToDataUrl(image))
    }

    const importedRows = []

    for (const [index, file] of audioFiles.entries()) {
      const audioUrl = URL.createObjectURL(file)
      const metadata = await readTrackMetadata(file)
      const parsed = parseTrackName(file.name)
      const title = metadata?.title || parsed.title
      const artist = metadata?.artist || parsed.artist
      const duration = await readDuration(audioUrl)
      const base = file.name.replace(/\.[^/.]+$/, '').toLowerCase()
      const coverUrl = coverMap.get(base) || ''

      URL.revokeObjectURL(audioUrl)

      importedRows.push({
        id: slugify(`${artist || 'track'}-${title || file.name}-${index}`) || crypto.randomUUID(),
        title,
        artist,
        audioUrl: '',
        coverUrl,
        duration: Number.isFinite(duration) ? Math.round(duration) : 0,
        sourceFile: file.name,
        coverName: coverUrl ? 'Yerel kapak' : '',
      })
    }

    if (importedRows.length) {
      setRows((prev) => [...importedRows, ...prev])
      flashNotice(`${importedRows.length} dosya içe aktarıldı.`)
    }

    event.target.value = ''
  }

  const applyBulkLinks = () => {
    const lines = bulkLinks
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (!lines.length) {
      flashNotice('Yapıştırılacak bağlantı bulunamadı.')
      return
    }

    setRows((prev) =>
      prev.map((row, index) => {
        const line = lines[index]
        if (!line) {
          return row
        }

        const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
        return {
          ...row,
          audioUrl: normalizeDriveUrl(parts[0] || row.audioUrl),
          coverUrl: normalizeDriveUrl(parts[1] || row.coverUrl),
        }
      }),
    )

    flashNotice('Bağlantılar sıralı olarak uygulandı.')
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    setDropActive(false)
    const files = Array.from(event.dataTransfer.files || [])
    if (!files.length) {
      return
    }

    await handleFiles({ target: { files, value: '' } })
  }

  const handleCoverPick = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCoverRow) {
      return
    }

    const dataUrl = await fileToDataUrl(file)
    updateRow(selectedCoverRow, {
      coverUrl: dataUrl,
      coverName: file.name,
    })
    setSelectedCoverRow(null)
    event.target.value = ''
  }

  const downloadJson = () => {
    const blob = new Blob([`${manifestJson}\n`], { type: 'application/json;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'tracks.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
    flashNotice('tracks.json indirildi.')
  }

  const copyJson = async () => {
    await navigator.clipboard.writeText(manifestJson)
    flashNotice('JSON panoya kopyalandı.')
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <div className="admin-badge">
            <Sparkles size={16} />
            Yerel admin paneli
          </div>
          <h1>Ghxsty Manifest Studio</h1>
          <p>
            MP3 dosyalarını içe aktar, Drive bağlantılarını sırayla uygula ve tek tuşla
            <code>tracks.json</code> üret.
          </p>
        </div>

        <div className="admin-actions">
          <button className="admin-button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} />
            Dosya ekle
          </button>
          <button className="admin-button ghost" onClick={addRow}>
            <Plus size={16} />
            Satır ekle
          </button>
          <button className="admin-button primary" onClick={downloadJson} disabled={!rows.length}>
            <Download size={16} />
            JSON indir
          </button>
        </div>
      </div>

      {notice ? <div className="admin-badge">{notice}</div> : null}

      <div className="admin-grid">
        <section className="panel">
          <div
            className={`dropzone ${dropActive ? 'active' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDropActive(true)
            }}
            onDragLeave={() => setDropActive(false)}
            onDrop={handleDrop}
          >
            <strong>MP3 veya kapak dosyalarını buraya bırak</strong>
            <p>
              MP3&apos;lerden başlık, sanatçı ve süre otomatik okunur. Aynı isimli görseller
              varsa kapak olarak eşleşir.
            </p>
            <div className="hint-row">
              <span className="hint-chip">Toplu MP3 içe aktar</span>
              <span className="hint-chip">Kapaklar otomatik eşleşir</span>
              <span className="hint-chip">Drive linkleri sonradan yapıştır</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept=".mp3,audio/*,image/*"
            multiple
            onChange={handleFiles}
          />

          <input
            ref={coverInputRef}
            className="hidden-input"
            type="file"
            accept="image/*"
            onChange={handleCoverPick}
          />

          <div className="bulk-grid">
            <div className="bulk-field">
              <label>Drive bağlantılarını satır satır yapıştır</label>
              <textarea
                value={bulkLinks}
                onChange={(event) => setBulkLinks(event.target.value)}
                placeholder={
                  'https://drive.google.com/file/d/.../view?usp=sharing\nhttps://drive.google.com/file/d/.../view?usp=sharing|https://drive.google.com/file/d/.../view?usp=sharing'
                }
              />
              <div className="paste-actions">
                <button className="admin-button ghost" onClick={applyBulkLinks}>
                  <ClipboardPaste size={16} />
                  Bağlantıları uygula
                </button>
                <div className="hint-chip">Biçim: audioUrl veya audioUrl|coverUrl</div>
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-card">
              <span>Toplam satır</span>
              <strong>{rows.length}</strong>
            </div>
            <div className="status-card">
              <span>Hazır</span>
              <strong>{filledCount}</strong>
            </div>
            <div className="status-card">
              <span>Eksik audioUrl</span>
              <strong>{missingAudioCount}</strong>
            </div>
          </div>

          <div className="track-list">
            {rows.length === 0 ? (
              <div className="empty-state">
                Henüz parça yok. Önce MP3 seçebilir veya boş bir satır ekleyebilirsin.
              </div>
            ) : (
              rows.map((row) => (
                <article key={row.id} className="track-card">
                  <div className="track-card-header">
                    <div className="track-card-title">
                      <strong>{row.title || 'Başlıksız parça'}</strong>
                      <span>{row.artist || 'Sanatçı yok'}</span>
                    </div>
                    <div className="admin-badge">
                      <Music2 size={14} />
                      {formatTime(row.duration)}
                    </div>
                  </div>

                  <div className="track-card-grid">
                    <div className="cover-preview">
                      {row.coverUrl ? (
                        <img src={row.coverUrl} alt={row.title || 'Kapak'} />
                      ) : (
                        <div className="cover-placeholder">
                          <ImageIcon size={26} />
                        </div>
                      )}
                    </div>

                    <div className="row-fields">
                      <div className="row-field">
                        <label>ID</label>
                        <input
                          value={row.id}
                          onChange={(event) => updateRow(row.id, { id: event.target.value })}
                          placeholder="benzersiz-id"
                        />
                      </div>
                      <div className="row-field">
                        <label>Başlık</label>
                        <input
                          value={row.title}
                          onChange={(event) => updateRow(row.id, { title: event.target.value })}
                        />
                      </div>
                      <div className="row-field">
                        <label>Sanatçı</label>
                        <input
                          value={row.artist}
                          onChange={(event) => updateRow(row.id, { artist: event.target.value })}
                        />
                      </div>
                      <div className="row-field">
                        <label>Süre</label>
                        <input
                          value={row.duration}
                          onChange={(event) => updateRow(row.id, { duration: event.target.value })}
                          placeholder="386"
                        />
                      </div>
                      <div className="row-field">
                        <label>Audio URL</label>
                        <input
                          value={row.audioUrl}
                          onChange={(event) => updateRow(row.id, { audioUrl: event.target.value })}
                          placeholder="Drive dosya linki"
                        />
                      </div>
                      <div className="row-field">
                        <label>Kapak URL</label>
                        <input
                          value={row.coverUrl}
                          onChange={(event) => updateRow(row.id, { coverUrl: event.target.value })}
                          placeholder="İsteğe bağlı"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row-actions">
                    <button
                      className="admin-button ghost"
                      onClick={() => {
                        setSelectedCoverRow(row.id)
                        coverInputRef.current?.click()
                      }}
                    >
                      <ImageIcon size={16} />
                      Kapak seç
                    </button>
                    <button className="admin-button ghost" onClick={() => removeRow(row.id)}>
                      <Trash2 size={16} />
                      Sil
                    </button>
                  </div>

                  {!row.audioUrl.trim() ? (
                    <div className="row-warning">
                      Bu satırda audioUrl boş. JSON&apos;a yazılır ama uygulamada oynatmak için geçerli
                      Drive linki gerekir.
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="right-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>JSON önizleme</h2>
                <p>Manifest, uygulamanın okuyacağı son formata burada dönüşür.</p>
              </div>
              <div className="admin-actions">
                <button className="admin-button ghost" onClick={copyJson} disabled={!rows.length}>
                  <Check size={16} />
                  Kopyala
                </button>
                <button className="admin-button primary" onClick={downloadJson} disabled={!rows.length}>
                  <Download size={16} />
                  İndir
                </button>
              </div>
            </div>
            <pre className="preview-code">{manifestJson}</pre>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>İpuçları</h2>
                <p>Bu panelde sunucu gerekmez; tüm iş tarayıcıda olur.</p>
              </div>
            </div>
            <div className="bulk-grid">
              <div className="hint-chip">
                <Link2 size={14} /> Drive paylaşım linklerini yapıştırabilirsin, panel doğrudan indirme
                linkine çevirir.
              </div>
              <div className="hint-chip">
                <AlertCircle size={14} /> `audioUrl` zorunlu, `coverUrl` isteğe bağlıdır.
              </div>
              <div className="hint-chip">
                <Sparkles size={14} /> Toplu MP3 seçince metadata otomatik okunur, böylece başlık ve
                sanatçıyı tek tek yazman gerekmez.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<AdminApp />)
