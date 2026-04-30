import type { FTag } from '../types'

type PatternDef = { pattern: RegExp; weight: number; tag: FTag }

const PHRASE_PATTERNS: PatternDef[] = [
  // finance
  { pattern: /closed? a deal/i, weight: 5, tag: 'finance' },
  { pattern: /signed? a client/i, weight: 5, tag: 'finance' },
  { pattern: /got a new client/i, weight: 5, tag: 'finance' },
  { pattern: /made a sale/i, weight: 5, tag: 'finance' },
  { pattern: /\$\d+/i, weight: 5, tag: 'finance' },
  { pattern: /revenue|income|profit|earnings/i, weight: 4, tag: 'finance' },
  { pattern: /business|client|customer|sales/i, weight: 3, tag: 'finance' },
  { pattern: /invest|stock|market|trading/i, weight: 3, tag: 'finance' },
  // fitness
  { pattern: /hit the gym/i, weight: 5, tag: 'fitness' },
  { pattern: /personal record|PR|new max/i, weight: 5, tag: 'fitness' },
  { pattern: /worked out|training session/i, weight: 5, tag: 'fitness' },
  { pattern: /\d+\s*(reps?|sets?|miles?|km|lbs?|kg)/i, weight: 5, tag: 'fitness' },
  { pattern: /ran|running|jogged|sprint/i, weight: 4, tag: 'fitness' },
  { pattern: /gym|workout|exercise|lifting/i, weight: 3, tag: 'fitness' },
  { pattern: /diet|nutrition|protein|calories/i, weight: 3, tag: 'fitness' },
  // family
  { pattern: /spent time with (my )?(mom|dad|wife|kids?|children|parents?|family)/i, weight: 7, tag: 'family' },
  { pattern: /my (mom|dad|mother|father|wife|husband|kids?|son|daughter|children|parents?)/i, weight: 5, tag: 'family' },
  { pattern: /called (my )?(mom|dad|mother|father|parents?)/i, weight: 5, tag: 'family' },
  { pattern: /family dinner|family time|family night/i, weight: 5, tag: 'family' },
  { pattern: /date night|anniversary/i, weight: 4, tag: 'family' },
  // faith
  { pattern: /read the bible/i, weight: 5, tag: 'faith' },
  { pattern: /went to church/i, weight: 5, tag: 'faith' },
  { pattern: /morning prayer|morning devotion|morning meditation/i, weight: 5, tag: 'faith' },
  { pattern: /gratitude (journal|practice|list)/i, weight: 5, tag: 'faith' },
  { pattern: /pray(ed|ing)?|prayer/i, weight: 4, tag: 'faith' },
  { pattern: /meditat(ed|ion|ing)/i, weight: 4, tag: 'faith' },
  { pattern: /faith|god|spiritual|devotion/i, weight: 3, tag: 'faith' },
  // friends
  { pattern: /spent time with [A-Z][a-z]+/i, weight: 5, tag: 'friends' },
  { pattern: /my best friend|old friend|childhood friend/i, weight: 5, tag: 'friends' },
  { pattern: /hung out with/i, weight: 5, tag: 'friends' },
  { pattern: /caught up with/i, weight: 5, tag: 'friends' },
  { pattern: /brotherhood|tribe|crew|squad/i, weight: 4, tag: 'friends' },
]

const KEYWORDS: Record<FTag, string[]> = {
  finance: ['money','wealth','rich','financial','cash','bank','crypto','invest','income','salary','profit','revenue','business','client','sales','deal','market','trade'],
  fitness: ['gym','workout','exercise','run','jog','lift','train','pushup','pullup','squat','bench','health','diet','nutrition','protein','calories','fat','muscle'],
  family: ['mom','dad','mother','father','wife','husband','son','daughter','kid','child','parent','brother','sister','sibling','home','house','family'],
  faith: ['god','pray','prayer','church','bible','faith','spiritual','meditation','meditate','grateful','gratitude','devotion','worship'],
  friends: ['friend','buddy','bro','brother','sister','pal','crew','squad','tribe','social','party','hangout','meetup','network'],
}

export function detect5FContext(text: string): FTag | null {
  const scores: Record<FTag, number> = { finance: 0, fitness: 0, family: 0, faith: 0, friends: 0 }
  const tags: FTag[] = ['finance', 'fitness', 'family', 'faith', 'friends']

  // proper noun detection
  const properNouns = text.match(/\bwith ([A-Z][a-z]+)\b/g) ?? []
  properNouns.forEach(() => { scores.friends += 6 })
  const andNouns = text.match(/\band ([A-Z][a-z]+)\b/g) ?? []
  andNouns.forEach(() => { scores.friends += 3 })

  // phrase patterns
  for (const p of PHRASE_PATTERNS) {
    if (p.pattern.test(text)) scores[p.tag] += p.weight
  }

  // keyword fallback
  const words = text.toLowerCase().split(/\W+/)
  for (const tag of tags) {
    for (const kw of KEYWORDS[tag]) {
      if (words.includes(kw)) scores[tag] += 1
    }
  }

  const sorted = tags.sort((a, b) => scores[b] - scores[a])
  if (scores[sorted[0]] === 0) return null
  if (scores[sorted[0]] === scores[sorted[1]]) return null
  return sorted[0]
}

export function detectAll5FContext(text: string): FTag[] {
  const scores: Record<FTag, number> = { finance: 0, fitness: 0, family: 0, faith: 0, friends: 0 }
  const tags: FTag[] = ['finance', 'fitness', 'family', 'faith', 'friends']

  const properNouns = text.match(/\bwith ([A-Z][a-z]+)\b/g) ?? []
  properNouns.forEach(() => { scores.friends += 6 })
  const andNouns = text.match(/\band ([A-Z][a-z]+)\b/g) ?? []
  andNouns.forEach(() => { scores.friends += 3 })

  for (const p of PHRASE_PATTERNS) {
    if (p.pattern.test(text)) scores[p.tag] += p.weight
  }

  const words = text.toLowerCase().split(/\W+/)
  for (const tag of tags) {
    for (const kw of KEYWORDS[tag]) {
      if (words.includes(kw)) scores[tag] += 1
    }
  }

  const top = Math.max(...Object.values(scores))
  if (top < 2) return []
  return tags.filter(t => scores[t] >= 2 && scores[t] >= top * 0.4)
}
