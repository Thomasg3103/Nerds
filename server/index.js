import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import pokemonRouter from './routes/pokemon.js'
import gamesRouter from './routes/games.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/pokemon', pokemonRouter)
app.use('/api/games', gamesRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
