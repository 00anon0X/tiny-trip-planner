import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 3852)
const dist = path.join(__dirname, 'dist')

app.disable('x-powered-by')
app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'tiny-trip-planner', version: '1.0.0' })
})
app.use(express.static(dist, { extensions: ['html'], maxAge: '1h' }))
app.use((_req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.listen(port, host, () => {
  console.log(`tiny-trip-planner listening on http://${host}:${port}`)
})
