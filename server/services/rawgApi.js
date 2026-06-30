const BASE_URL = 'https://api.rawg.io/api'

// Searches RAWG for games matching the query (live — not cached, results are only
// persisted once the user actually adds a game to their collection).
export async function searchGames(query) {
  if (!process.env.RAWG_API_KEY) {
    throw new Error('RAWG_API_KEY is not set in .env')
  }

  const url = `${BASE_URL}/games?search=${encodeURIComponent(query)}&key=${process.env.RAWG_API_KEY}&page_size=20`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`RAWG API error ${res.status}`)

  const { results } = await res.json()
  return results
}

// Maps a raw RAWG API result onto our internal item shape.
// Pure function — no network/DB calls — so it can be unit tested in isolation.
export function normalizeGame(game) {
  return {
    external_id: String(game.id),
    name: game.name,
    image_url: game.background_image ?? null,
    metadata: {
      released:  game.released ?? null,
      rating:    game.rating ?? null,
      platforms: (game.platforms ?? []).map((p) => p.platform.name),
      genres:    (game.genres ?? []).map((g) => g.name),
    },
  }
}
