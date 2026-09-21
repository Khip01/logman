import { describe, expect, it } from 'vitest'
import { createLogRecord, createTraceId, formatLogLine, formatLogText } from './types'

describe('createTraceId', () => {
  it('menghasilkan id yang unik', () => {
    const ids = new Set(Array.from({ length: 500 }, () => createTraceId()))
    expect(ids.size).toBe(500)
  })

  it('menerima waktu yang disuntikkan agar deterministik', () => {
    const a = createTraceId(1000)
    const b = createTraceId(1000)
    expect(a).not.toBe(b)
    expect(a.startsWith((1000).toString(36))).toBe(true)
  })
})

describe('createLogRecord', () => {
  it('mengisi field wajib', () => {
    const record = createLogRecord('info', 'logs.save', 'Tersimpan')
    expect(record.level).toBe('info')
    expect(record.scope).toBe('logs.save')
    expect(record.message).toBe('Tersimpan')
    expect(record.traceId).toBeTruthy()
    expect(record.time).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('memakai traceId yang diberikan', () => {
    const record = createLogRecord('warn', 'x', 'y', { traceId: 'abc' })
    expect(record.traceId).toBe('abc')
  })

  it('menyertakan durationMs bila diberikan', () => {
    const record = createLogRecord('info', 'x', 'y', { durationMs: 12 })
    expect(record.durationMs).toBe(12)
  })
})

describe('format', () => {
  it('format JSON Lines berakhir newline dan satu baris', () => {
    const record = createLogRecord('info', 'scope', 'pesan', { traceId: 't1' })
    const line = formatLogLine(record)
    expect(line.endsWith('\n')).toBe(true)
    expect(line.trimEnd().includes('\n')).toBe(false)
    expect(JSON.parse(line).traceId).toBe('t1')
  })

  it('format teks memuat level, scope, dan traceId', () => {
    const record = createLogRecord('error', 'logs.save', 'Gagal', {
      traceId: 't9',
      durationMs: 42,
    })
    const text = formatLogText(record)
    expect(text).toContain('[error]')
    expect(text).toContain('logs.save')
    expect(text).toContain('Gagal')
    expect(text).toContain('42ms')
    expect(text).toContain('t9')
  })
})
