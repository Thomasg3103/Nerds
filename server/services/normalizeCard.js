// Pure function — maps a Pokemon TCG API card onto our internal item shape.
// Kept separate from the route so it can be unit-tested without Express or DB.
export function normalizeCard(card, setId) {
  return {
    category_id: 'pokemon',
    external_id: card.id,
    name:        card.name,
    image_url:   card.images?.small ?? null,
    set_name:    setId,
    metadata: {
      number:    card.number    ?? null,
      rarity:    card.rarity    ?? null,
      supertype: card.supertype ?? null,
      types:     card.types     ?? [],
    },
  }
}
