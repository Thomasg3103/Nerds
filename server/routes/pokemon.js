import { Router } from 'express'
import supabase from '../db.js'
import { fetchSets, fetchCardsBySet } from '../services/pokemonApi.js'
import { normalizeCard } from '../services/normalizeCard.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/pokemon/sets  — public (no auth)
// Serves from the pokemon_sets cache; populates it on first call.
router.get('/sets', async (_req, res) => {
  try {
    const { data: cached, error } = await supabase
      .from('pokemon_sets')
      .select('*')
      .order('release_date', { ascending: false })

    if (error) throw error

    if (cached && cached.length > 0) return res.json(cached)

    const sets = await fetchSets()
    const rows = sets.map((s) => ({
      id:           s.id,
      name:         s.name,
      series:       s.series ?? null,
      total:        s.total,
      release_date: s.releaseDate ?? null,
      logo_url:     s.images?.logo ?? null,
    }))

    const { error: upsertError } = await supabase.from('pokemon_sets').upsert(rows)
    if (upsertError) throw upsertError

    res.json([...rows].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? '')))
  } catch (err) {
    console.error('[GET /api/pokemon/sets]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/pokemon/sets/:setId  — public
router.get('/sets/:setId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pokemon_sets')
      .select('*')
      .eq('id', req.params.setId)
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(`[GET /api/pokemon/sets/${req.params.setId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/pokemon/sets/:setId/cards  — public
// Returns all cards in a set, caching them in items on first call.
router.get('/sets/:setId/cards', async (req, res) => {
  const { setId } = req.params
  try {
    const { data: cached, error } = await supabase
      .from('items')
      .select('*')
      .eq('category_id', 'pokemon')
      .eq('set_name', setId)

    if (error) throw error
    if (cached && cached.length > 0) return res.json(cached)

    const cards = await fetchCardsBySet(setId)
    const rows = cards.map((c) => normalizeCard(c, setId))

    const { data: inserted, error: upsertError } = await supabase
      .from('items')
      .upsert(rows, { onConflict: 'category_id,external_id' })
      .select()

    if (upsertError) throw upsertError
    res.json(inserted)
  } catch (err) {
    console.error(`[GET /api/pokemon/sets/${req.params.setId}/cards]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/pokemon/owned  — auth required
router.get('/owned', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .select('*, items(*)')
      .eq('user_id', req.userId)

    if (error) throw error

    const pokemon = data.filter(r => r.items?.category_id === 'pokemon')
    res.json(pokemon)
  } catch (err) {
    console.error('[GET /api/pokemon/owned]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/pokemon/own  — auth required
// Body: { item_id, quantity?, condition_status? }
router.post('/own', requireAuth, async (req, res) => {
  const { item_id, quantity = 1, condition_status = 'Near Mint' } = req.body

  if (!item_id) return res.status(400).json({ error: 'item_id is required' })

  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .upsert(
        { item_id, user_id: req.userId, quantity_owned: quantity, condition_status, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,item_id' }
      )
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('[POST /api/pokemon/own]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/pokemon/own/:itemId  — auth required
router.delete('/own/:itemId', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('ownership_records')
      .delete()
      .eq('item_id', req.params.itemId)
      .eq('user_id', req.userId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error(`[DELETE /api/pokemon/own/${req.params.itemId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
