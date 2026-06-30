/**
 * System test — Games API
 * Tests the full route layer: auth → validation → DB → response.
 * External dependencies (Supabase, RAWG) are mocked.
 *
 * Flow covered: search → add game → view collection → update status → remove
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// vi.hoisted runs before module imports so the object is available inside vi.mock.
const db = vi.hoisted(() => ({
  items:             { data: null,  error: null },
  ownership_records: { data: [],    error: null },
  auth_user:         { data: { user: { id: 'user-123' } }, error: null },
}))

// Build a chainable Supabase query mock that resolves with db[table] at call time.
vi.mock('../db.js', () => {
  function chain(table) {
    const result = db[table] || { data: null, error: null }
    const p = Promise.resolve(result)
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      not:    vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      // Make the chain itself awaitable (queries that don't end with .single())
      then:    (res, rej) => p.then(res, rej),
      catch:   (rej)      => p.catch(rej),
      finally: (fn)       => p.finally(fn),
    }
  }
  return {
    default: {
      from: vi.fn().mockImplementation((t) => chain(t)),
      auth: {
        getUser: vi.fn().mockImplementation(() => Promise.resolve(db.auth_user)),
      },
    },
  }
})

vi.mock('../services/rawgApi.js', () => ({
  searchGames:   vi.fn(),
  normalizeGame: vi.fn((g) => g),
}))

import gamesRouter from '../routes/games.js'
import { searchGames, normalizeGame } from '../services/rawgApi.js'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/games', gamesRouter)
  return app
}

describe('Games API — system test', () => {
  let app

  beforeEach(() => {
    app = buildApp()
    vi.clearAllMocks()
    db.items             = { data: null, error: null }
    db.ownership_records = { data: [],   error: null }
    db.auth_user         = { data: { user: { id: 'user-123' } }, error: null }
  })

  // ── Authentication ────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 on GET /owned with no token', async () => {
      const res = await request(app).get('/api/games/owned')
      expect(res.status).toBe(401)
    })

    it('returns 401 on POST /own with no token', async () => {
      const res = await request(app).post('/api/games/own').send({ external_id: '1', name: 'Test' })
      expect(res.status).toBe(401)
    })

    it('returns 401 when the token is invalid', async () => {
      db.auth_user = { data: { user: null }, error: new Error('Invalid') }
      const res = await request(app)
        .get('/api/games/owned')
        .set('Authorization', 'Bearer bad-token')
      expect(res.status).toBe(401)
    })
  })

  // ── Search (no auth required) ─────────────────────────────────────────────

  describe('GET /api/games/search', () => {
    it('returns normalized results for a valid query', async () => {
      const raw        = [{ id: 3498, name: 'GTA V' }]
      const normalized = [{ external_id: '3498', name: 'GTA V', image_url: null, metadata: {} }]
      searchGames.mockResolvedValue(raw)
      normalizeGame.mockImplementation((g) => ({ ...g, external_id: String(g.id) }))

      const res = await request(app).get('/api/games/search?q=gta')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(searchGames).toHaveBeenCalledWith('gta')
    })

    it('returns 400 when the q param is missing', async () => {
      const res = await request(app).get('/api/games/search')
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/q query parameter/)
    })

    it('returns 500 when the RAWG API fails', async () => {
      searchGames.mockRejectedValue(new Error('RAWG API error 429'))
      const res = await request(app).get('/api/games/search?q=zelda')
      expect(res.status).toBe(500)
    })
  })

  // ── Add + view collection (core ownership flow) ───────────────────────────

  describe('POST /api/games/own', () => {
    it('adds a game and returns 201 with the record', async () => {
      const item   = { id: 'item-uuid', category_id: 'games', name: 'Zelda', external_id: '1234' }
      const record = { id: 'rec-uuid', item_id: 'item-uuid', condition_status: 'Backlog', user_id: 'user-123' }
      db.items             = { data: item,   error: null }
      db.ownership_records = { data: record, error: null }

      const res = await request(app)
        .post('/api/games/own')
        .set('Authorization', 'Bearer token')
        .send({ external_id: '1234', name: 'Zelda' })

      expect(res.status).toBe(201)
    })

    it('returns 400 when external_id is missing', async () => {
      const res = await request(app)
        .post('/api/games/own')
        .set('Authorization', 'Bearer token')
        .send({ name: 'Zelda' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/external_id/)
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/games/own')
        .set('Authorization', 'Bearer token')
        .send({ external_id: '1234' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/games/owned', () => {
    it('returns the user\'s games collection', async () => {
      db.ownership_records = {
        data: [
          { id: 'r1', item_id: 'i1', condition_status: 'Backlog', user_id: 'user-123',
            items: { id: 'i1', category_id: 'games', name: 'Zelda' } },
        ],
        error: null,
      }

      const res = await request(app)
        .get('/api/games/owned')
        .set('Authorization', 'Bearer token')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('returns an empty array when the user owns no games', async () => {
      db.ownership_records = { data: [], error: null }

      const res = await request(app)
        .get('/api/games/owned')
        .set('Authorization', 'Bearer token')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  // ── Update status / hours ─────────────────────────────────────────────────

  describe('PATCH /api/games/own/:itemId', () => {
    it('updates status and returns the updated record', async () => {
      const updated = { id: 'r1', condition_status: 'Complete', user_id: 'user-123' }
      db.ownership_records = { data: updated, error: null }

      const res = await request(app)
        .patch('/api/games/own/item-uuid')
        .set('Authorization', 'Bearer token')
        .send({ status: 'Complete' })

      expect(res.status).toBe(200)
    })
  })

  // ── Remove ────────────────────────────────────────────────────────────────

  describe('DELETE /api/games/own/:itemId', () => {
    it('removes a game and returns success', async () => {
      db.ownership_records = { data: null, error: null }

      const res = await request(app)
        .delete('/api/games/own/item-uuid')
        .set('Authorization', 'Bearer token')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
