import { Router } from 'express'

const router = Router()

// Games routes — IGDB / RAWG integration to be added in Phase 1 (games).
router.get('/', (_req, res) => {
  res.json({ message: 'Games API — coming soon' })
})

export default router
