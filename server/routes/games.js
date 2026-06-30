import { Router } from 'express'
import supabase from '../db.js'
import { searchGames, normalizeGame } from '../services/rawgApi.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/games/search?q=zelda  — public (no auth needed for live search)
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

// GET /api/games/owned  — auth required
router.get('/owned', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .select('*, items(*)')
      .eq('user_id', req.userId)

    if (error) throw error

    const games = data.filter(r => r.items?.category_id === 'games')
    res.json(games)
  } catch (err) {
    console.error('[GET /api/games/owned]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/games/own  — auth required
// Body: normalized game (external_id, name, image_url, metadata) + optional status
router.post('/own', requireAuth, async (req, res) => {
  const { external_id, name, image_url, metadata = {}, status = 'Backlog' } = req.body

  if (!external_id || !name) {
    return res.status(400).json({ error: 'external_id and name are required' })
  }

  try {
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
        { item_id: item.id, user_id: req.userId, condition_status: status, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,item_id' }
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

// PATCH /api/games/own/:itemId  — auth required
// Body: { status?, hours_played? }
router.patch('/own/:itemId', requireAuth, async (req, res) => {
  const { status, hours_played } = req.body
  const updates = { updated_at: new Date().toISOString() }
  if (status !== undefined)      updates.condition_status = status
  if (hours_played !== undefined) updates.hours_played = hours_played

  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .update(updates)
      .eq('item_id', req.params.itemId)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(`[PATCH /api/games/own/${req.params.itemId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/games/own/:itemId  — auth required
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
    console.error(`[DELETE /api/games/own/${req.params.itemId}]`, err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
