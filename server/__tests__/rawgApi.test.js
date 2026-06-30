import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchGames } from '../services/rawgApi.js'

describe('searchGames', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.RAWG_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.RAWG_API_KEY
  })

  it('returns results from a successful response', async () => {
    const results = [{ id: 1, name: 'Zelda' }]
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results }),
    })

    const result = await searchGames('zelda')
    expect(result).toEqual(results)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('zelda'))
  })

  it('includes the API key in the request URL', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [] }) })
    await searchGames('test')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-key'))
  })

  it('throws when RAWG_API_KEY is not set', async () => {
    delete process.env.RAWG_API_KEY
    await expect(searchGames('zelda')).rejects.toThrow('RAWG_API_KEY is not set')
  })

  it('throws on a non-ok response (403)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 403 })
    await expect(searchGames('zelda')).rejects.toThrow('RAWG API error 403')
  })

  it('throws on rate limit (429)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429 })
    await expect(searchGames('zelda')).rejects.toThrow('RAWG API error 429')
  })

  it('throws on a network failure', async () => {
    fetch.mockRejectedValue(new Error('Network error'))
    await expect(searchGames('zelda')).rejects.toThrow('Network error')
  })
})
