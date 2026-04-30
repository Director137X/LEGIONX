import express from 'express'
import cors from 'cors'
import animaRouter from './routes/anima.js'

const app = express()
const PORT = process.env.PORT ?? 8080

app.use(cors())
app.use(express.json())

app.get('/api/healthz', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/anima/chat', animaRouter)

app.listen(PORT, () => {
  console.log(`ANIMA backend running on port ${PORT}`)
})
