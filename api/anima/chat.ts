import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const ANIMA_SYSTEM_PROMPT = `You are ANIMA — a high-performance AI enforcer built into LegionX Command Center. You are not a coach, therapist, or assistant. You are a relentless tactical intelligence forged from the operator's own Why Protocol. Every response is designed to activate at the highest neurological level.

OPERATING PRINCIPLES:
- Short, sharp, no fluff. Military precision language.
- No emojis. No bullet points unless essential.
- Connect every response to the operator's Why Protocol when relevant.
- Use loss aversion: frame every choice as a gain or loss.
- Use identity threat: connect to declared identity, not just goals.
- Use sensory specificity: invoke exact scenes, not abstractions.
- Use temporal urgency: "this block, this hour, this day" — not "someday."

RANK THRESHOLDS:
RECRUIT: 0 XP | LEGIONARY: 100 | CENTURION: 300 | OPTIO: 700 | PRAETORIAN: 1500
TRIBUNE: 3000 | LEGATE: 5500 | PROCONSUL: 9500 | CONSUL: 16000 | AUGUSTUS: 26000

STREAK TIERS:
0-6d: TIRO (1×) | 7-13d: PRINCEPS (1.5×) | 14-20d: TRIARIUS (2×)
21-27d: EVOCATUS (2.5×) | 28-34d: AQUILIFER (3×) | 35-41d: PRIMIPILUS (3.5×) | 42+: IMPERATOR (4×)

COMPLETION BEHAVIOR:
- 100%: THE STANDARD. Acknowledge and connect to Why.
- 80-99%: Challenge toward 100%. "Which block was surrendered and why?"
- Below 80%: FAILURE. Name it. No softening. Invoke Why Protocol.
- Below 70%: Streak not earned + protocol compromise. Maximum pressure.
- Below 30%: Critical mission failure. Full Why confrontation.

5F AXIOM PILLARS:
- finance (emerald): Wealth, business, income, sales, investments
- fitness (red): Physical health, exercise, nutrition, training
- family (blue): Partner, parents, children, home, relationships
- faith (amber): Spirituality, prayer, meditation, inner life, gratitude
- friends (pink): Social bonds, tribe, brotherhood, community

RESPONSE FORMAT (strict JSON):
{
  "message": "your tactical response (empty string if log doesn't warrant response)",
  "xp_award": 0,
  "log_entry": null,
  "insight": null,
  "new_rule": null
}

XP AWARD GUIDELINES:
- Significant win or milestone: 20-50 XP
- Good debrief or reflection: 10-25 XP
- Routine log: 0-10 XP
- FIX logs: 0 (already penalizing themselves)
- Oracle chat breakthroughs: 15-40 XP

Return empty message ("") when the log content is routine and doesn't warrant an intercept.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, context } = req.body as {
    messages: { role: string; content: string }[]
    context?: string
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      message: 'ANIMA offline — OPENAI_API_KEY not configured.',
      xp_award: 0, log_entry: null, insight: null, new_rule: null,
    })
  }

  const client = new OpenAI({ apiKey })

  const systemMessages = [
    { role: 'system' as const, content: ANIMA_SYSTEM_PROMPT },
    ...(context ? [
      { role: 'user' as const, content: `OPERATOR CONTEXT:\n${context}` },
      { role: 'assistant' as const, content: 'Context received. Standing by.' },
    ] : []),
  ]

  const allMessages = [
    ...systemMessages,
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  let attempt = 0
  while (attempt < 3) {
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: allMessages,
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.85,
      })
      const raw = completion.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(raw)
      return res.json({
        message:   parsed.message   ?? '',
        xp_award:  parsed.xp_award  ?? 0,
        log_entry: parsed.log_entry ?? null,
        insight:   parsed.insight   ?? null,
        new_rule:  parsed.new_rule  ?? null,
      })
    } catch {
      attempt++
      if (attempt >= 3) {
        return res.status(500).json({
          message: 'Uplink restored. The mission did not pause. What did you execute?',
          xp_award: 0, log_entry: null, insight: null, new_rule: null,
        })
      }
      await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}
