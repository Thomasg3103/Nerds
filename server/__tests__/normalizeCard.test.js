import { describe, it, expect } from 'vitest'
import { normalizeCard } from '../services/normalizeCard.js'

describe('normalizeCard', () => {
  it('maps all Pokemon TCG fields to the internal shape', () => {
    const card = {
      id:        'base1-4',
      name:      'Charizard',
      images:    { small: 'https://example.com/charizard.jpg' },
      number:    '4',
      rarity:    'Holo Rare',
      supertype: 'Pokémon',
      types:     ['Fire'],
    }

    expect(normalizeCard(card, 'base1')).toEqual({
      category_id: 'pokemon',
      external_id: 'base1-4',
      name:        'Charizard',
      image_url:   'https://example.com/charizard.jpg',
      set_name:    'base1',
      metadata: {
        number:    '4',
        rarity:    'Holo Rare',
        supertype: 'Pokémon',
        types:     ['Fire'],
      },
    })
  })

  it('returns null when images are missing', () => {
    const card = { id: 'test-1', name: 'Bulbasaur', supertype: 'Pokémon' }
    expect(normalizeCard(card, 'test').image_url).toBeNull()
  })

  it('defaults types to an empty array when absent', () => {
    const card = { id: 'test-1', name: 'Trainer Card', supertype: 'Trainer' }
    expect(normalizeCard(card, 'test').metadata.types).toEqual([])
  })

  it('returns null for missing rarity', () => {
    const card = { id: 'test-1', name: 'Basic Energy', supertype: 'Energy' }
    expect(normalizeCard(card, 'base1').metadata.rarity).toBeNull()
  })

  it('returns null for missing number', () => {
    const card = { id: 'promo-1', name: 'Promo Card', supertype: 'Pokémon' }
    expect(normalizeCard(card, 'promo').metadata.number).toBeNull()
  })

  it('uses the provided setId for both set_name and category_id', () => {
    const card = { id: 'sv1-1', name: 'Sprigatito', supertype: 'Pokémon' }
    const result = normalizeCard(card, 'sv1')
    expect(result.set_name).toBe('sv1')
    expect(result.category_id).toBe('pokemon')
  })
})
