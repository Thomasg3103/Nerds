import { Router } from 'express'
import supabase from '../db.js'
import { searchGames, normalizeGame } from '../services/rawgApi.js'

const router = Router()

// GET /api/games/search?q=zelda
// Live search against RAWG — not cached, since search terms are unbounded.
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'q query parameter is required' })

  try {
    const results = await searchGames(q)
    res.json(results.map(normalizeGame))
  } catch (err) {
    console.error('[GET /api/games/search]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/games/owned
// Returns all games the user currently owns/tracks.
router.get('/owned', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .select('*, items(*)')

    if (error) throw error

    const games = data.filter((r) => r.items?.category_id === 'games')
    res.json(games)
  } catch (err) {
    console.error('[GET /api/games/owned]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/games/own
// Adds a game to the collection. Body: a normalized game (external_id, name,
// image_url, metadata) plus an optional starting status.
router.post('/own', async (req, res) => {
  const { external_id, name, image_url, metadata = {}, status = 'Backlog' } = req.body

  if (!external_id || !name) {
    return res.status(400).json({ error: 'external_id and name are required' })
  }

  try {
    // Items table doubles as the per-category catalog cache — a game is only
    // stored here once a user actually adds it, unlike Pokemon sets which are
    // pre-cached in bulk.
    const { data: item, error: itemError } = await supabase
      .from('items')
      .upsert(
        { category_id: 'games', external_id: String(external_id), name, image_url, set_name: null, metadata },
        { onConflict: 'category_id,external_id' }
      )
      .select()
      .single()
    if (itemError) throw itemError

    const { data: record, error: recordError } = await supabase
      .from('ownership_records')
      .upsert(
        { item_id: item.id, condition_status: status, updated_at: new Date().toISOString() },
        { onConflict: 'item_id' }
      )
      .select()
      .single()
    if (recordError) throw recordError

    res.status(201).json({ ...record, items: item })
  } catch (err) {
    console.error('[POST /api/games/own]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/games/own/:itemId
// Updates status and/or hours played. Body: { status?, hours_played? }
router.patch('/own/:itemId', async (req, res) => {
  const { itemId } = req.params
  const { status, hours_played } = req.body

  const updates = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.condition_status = status
  if (hours_played !== undefined) updates.hours_played = hours_played

  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .update(updates)
      .eq('item_id', itemId)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(`[PATCH /api/games/own/${req.params.itemId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/games/own/:itemId
// Removes a game from the collection.
router.delete('/own/:itemId', async (req, res) => {
  const { itemId } = req.params

  try {
    const { error } = await supabase
      .from('ownership_records')
      .delete()
      .eq('item_id', itemId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error(`[DELETE /api/games/own/${req.params.itemId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
