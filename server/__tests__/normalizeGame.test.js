import { describe, it, expect } from 'vitest'
import { normalizeGame } from '../services/rawgApi.js'

describe('normalizeGame', () => {
  it('maps all RAWG fields to the internal shape', () => {
    const raw = {
      id:               3498,
      name:             'Grand Theft Auto V',
      background_image: 'https://example.com/gta5.jpg',
      released:         '2013-09-17',
      rating:           4.47,
      platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation 4' } }],
      genres:    [{ name: 'Action' }, { name: 'Adventure' }],
    }

    expect(normalizeGame(raw)).toEqual({
      external_id: '3498',
      name:        'Grand Theft Auto V',
      image_url:   'https://example.com/gta5.jpg',
      metadata: {
        released:  '2013-09-17',
        rating:    4.47,
        platforms: ['PC', 'PlayStation 4'],
        genres:    ['Action', 'Adventure'],
      },
    })
  })

  it('returns null for a missing background_image', () => {
    expect(normalizeGame({ id: 1, name: 'Test' }).image_url).toBeNull()
  })

  it('returns null for a missing released date', () => {
    expect(normalizeGame({ id: 1, name: 'Test' }).metadata.released).toBeNull()
  })

  it('returns empty arrays when platforms and genres are absent', () => {
    const result = normalizeGame({ id: 1, name: 'Test' })
    expect(result.metadata.platforms).toEqual([])
    expect(result.metadata.genres).toEqual([])
  })

  it('coerces a numeric id to string', () => {
    const result = normalizeGame({ id: 42, name: 'Test' })
    expect(result.external_id).toBe('42')
    expect(typeof result.external_id).toBe('string')
  })
})
