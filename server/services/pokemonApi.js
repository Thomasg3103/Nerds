const BASE_URL = 'https://api.pokemontcg.io/v2'

// Include the API key header if one is configured (raises rate limit from 1000 to unlimited/day).
function getHeaders() {
  return process.env.POKEMON_TCG_API_KEY
    ? { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY }
    : {}
}

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Pokemon TCG API error ${res.status} on ${path}`)
  return res.json()
}

// Returns all sets, ordered oldest-first.
export async function fetchSets() {
  const { data } = await apiFetch('/sets?orderBy=releaseDate')
  return data
}

// Returns all cards in a given set (up to 250 per request — sufficient for all sets).
export async function fetchCardsBySet(setId) {
  const { data } = await apiFetch(`/cards?q=set.id:${setId}&pageSize=250&orderBy=number`)
  return data
}
