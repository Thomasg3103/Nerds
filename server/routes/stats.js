import { Router } from 'express'
import supabase from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/stats
// Returns owned-item counts for the authenticated user.
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ownership_records')
      .select('items(category_id, set_name)')
      .eq('user_id', req.userId)

    if (error) throw error

    const pokemonRows = data.filter(r => r.items?.category_id === 'pokemon')
    const gamesRows   = data.filter(r => r.items?.category_id === 'games')
    const pokemonSets = new Set(pokemonRows.map(r => r.items?.set_name).filter(Boolean)).size

    res.json({
      pokemon:     pokemonRows.length,
      pokemonSets,
      games:       gamesRows.length,
    })
  } catch (err) {
    console.error('[GET /api/stats]', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
