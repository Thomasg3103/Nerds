import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchSets, fetchCardsBySet } from '../services/pokemonApi.js'

// Helper: build a mock Response-like object
const mockResponse = (ok, body) => ({
  ok,
  status: ok ? 200 : body,
  json: () => Promise.resolve(ok ? body : {}),
})

describe('fetchSets', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('returns sets from a successful response', async () => {
    const sets = [{ id: 'base1', name: 'Base Set' }]
    fetch.mockResolvedValue(mockResponse(true, { data: sets }))

    const result = await fetchSets()
    expect(result).toEqual(sets)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sets'),
      expect.any(Object)
    )
  })

  it('throws on a non-ok response (e.g. 429 rate limit)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchSets()).rejects.toThrow('Pokemon TCG API error 429')
  })

  it('throws on a server error (500)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchSets()).rejects.toThrow('Pokemon TCG API error 500')
  })

  it('throws on a network failure', async () => {
    fetch.mockRejectedValue(new Error('Network error'))
    await expect(fetchSets()).rejects.toThrow('Network error')
  })
})

describe('fetchCardsBySet', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('returns cards for the given set', async () => {
    const cards = [{ id: 'base1-4', name: 'Charizard' }]
    fetch.mockResolvedValue(mockResponse(true, { data: cards }))

    const result = await fetchCardsBySet('base1')
    expect(result).toEqual(cards)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('base1'),
      expect.any(Object)
    )
  })

  it('throws on rate limit (429)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchCardsBySet('base1')).rejects.toThrow('Pokemon TCG API error 429')
  })

  it('throws on a server error (500)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchCardsBySet('base1')).rejects.toThrow('Pokemon TCG API error 500')
  })
})
