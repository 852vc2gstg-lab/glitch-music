/* global Buffer, process */

import http from 'node:http'
import { createReadStream, promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 8787)
const DATA_DIR = path.join(__dirname, 'data')
const MEDIA_DIR = path.join(__dirname, 'media')
const AUDIO_DIR = path.join(MEDIA_DIR, 'audio')
const COVER_DIR = path.join(MEDIA_DIR, 'covers')
const DB_FILE = path.join(DATA_DIR, 'library.json')

const mimeTypes = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const ensureStorage = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(AUDIO_DIR, { recursive: true })
  await fs.mkdir(COVER_DIR, { recursive: true })

  try {
    await fs.access(DB_FILE)
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ tracks: [] }, null, 2))
  }
}

const readDb = async () => {
  await ensureStorage()
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return { tracks: Array.isArray(parsed?.tracks) ? parsed.tracks : [] }
  } catch {
    return { tracks: [] }
  }
}

const writeDb = async (db) => {
  await ensureStorage()
  await fs.writeFile(DB_FILE, `${JSON.stringify(db, null, 2)}\n`)
}

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extraHeaders,
  })
  res.end(JSON.stringify(payload))
}

const getOrigin = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto']
  const host = req.headers.host || `localhost:${PORT}`
  return process.env.PUBLIC_BASE_URL || `${forwardedProto || 'http'}://${host}`
}

const sanitizeName = (value) =>
  String(value || '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const toBuffer = async (file) => Buffer.from(await file.arrayBuffer())

const buildFileUrl = (origin, folder, filename) => `${origin}/media/${folder}/${encodeURIComponent(filename)}`

const parseMultipart = async (req) => {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: 'half',
  })

  return request.formData()
}

const handleTrackUpload = async (req, res) => {
  const origin = getOrigin(req)
  const form = await parseMultipart(req)
  const audio = form.get('audio')
  const cover = form.get('cover')
  const title = String(form.get('title') || '').trim() || 'Bilinmeyen Parça'
  const artist = String(form.get('artist') || '').trim() || 'Bilinmeyen Sanatçı'
  const duration = Number(form.get('duration') || 0)

  if (!(audio instanceof File)) {
    sendJson(res, 400, { error: 'audio_file_required' })
    return
  }

  const id = randomUUID()
  const audioExt = path.extname(audio.name || '.mp3') || '.mp3'
  const audioFileName = `${id}-${sanitizeName(path.basename(audio.name || 'track'))}${audioExt}`
  const audioPath = path.join(AUDIO_DIR, audioFileName)
  await fs.writeFile(audioPath, await toBuffer(audio))

  let coverUrl = ''
  if (cover instanceof File) {
    const coverExt = path.extname(cover.name || '.jpg') || '.jpg'
    const coverFileName = `${id}-${sanitizeName(path.basename(cover.name || 'cover'))}${coverExt}`
    const coverPath = path.join(COVER_DIR, coverFileName)
    await fs.writeFile(coverPath, await toBuffer(cover))
    coverUrl = buildFileUrl(origin, 'covers', coverFileName)
  }

  const track = {
    id,
    title,
    artist,
    duration,
    audioUrl: buildFileUrl(origin, 'audio', audioFileName),
    coverUrl,
    createdAt: Date.now(),
    source: 'pool',
  }

  const db = await readDb()
  db.tracks.unshift(track)
  await writeDb(db)

  sendJson(res, 201, { track })
}

const serveMedia = async (req, res, folder, filename) => {
  const baseDir = folder === 'audio' ? AUDIO_DIR : COVER_DIR
  const filePath = path.join(baseDir, filename)
  try {
    await fs.access(filePath)
  } catch {
    sendJson(res, 404, { error: 'not_found' })
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  createReadStream(filePath).pipe(res)
}

const requestListener = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  if (url.pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (url.pathname === '/api/tracks' && req.method === 'GET') {
    const db = await readDb()
    sendJson(res, 200, { tracks: db.tracks })
    return
  }

  if (url.pathname === '/api/tracks' && req.method === 'POST') {
    try {
      await handleTrackUpload(req, res)
    } catch (error) {
      sendJson(res, 500, { error: 'upload_failed', message: error?.message || String(error) })
    }
    return
  }

  if (url.pathname.startsWith('/media/audio/') && req.method === 'GET') {
    await serveMedia(req, res, 'audio', decodeURIComponent(url.pathname.replace('/media/audio/', '')))
    return
  }

  if (url.pathname.startsWith('/media/covers/') && req.method === 'GET') {
    await serveMedia(req, res, 'covers', decodeURIComponent(url.pathname.replace('/media/covers/', '')))
    return
  }

  sendJson(res, 404, { error: 'not_found' })
}

await ensureStorage()

http.createServer(requestListener).listen(PORT, () => {
  console.log(`Ghxsty Music API running on http://127.0.0.1:${PORT}`)
})
