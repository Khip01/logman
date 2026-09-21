import { serve } from '@hono/node-server'
import { Hono } from 'hono'

/**
 * Server mini logman (AGENTS.md bagian 4 dan 5).
 * Tanggung jawab: IO file (config, logs), backup rotasi, ekspor PDF, logging.
 *
 * CATATAN FASE 1: hanya kerangka dengan endpoint kesehatan. Endpoint data
 * ditambahkan pada fase data layer.
 */

const API_PORT = Number(process.env.LOGMAN_API_PORT ?? 5198)
const HOST = process.env.LOGMAN_HOST ?? '127.0.0.1'

const app = new Hono()

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    name: 'logman',
    version: '0.1.0',
    time: new Date().toISOString(),
  }),
)

serve({ fetch: app.fetch, port: API_PORT, hostname: HOST }, (info) => {
  console.log(`[logman] API server aktif di http://${HOST}:${info.port}`)
})
