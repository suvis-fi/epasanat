import {
  ACCURATE_AT,
  CALM_AT,
  MERI_XP,
  STORAGE_KEY,
  SUGGEST_DOWN,
  SUGGEST_UP,
  WEEKLY_GOAL,
  XP,
} from './constants.js'

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh()
    const data = JSON.parse(raw)
    const unlocks = Array.isArray(data.unlocks) ? data.unlocks.filter((id) => typeof id === 'string') : []
    return {
      xp: Number.isFinite(data.xp) ? data.xp : 0,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      recentWords: Array.isArray(data.recentWords) ? data.recentWords.filter((word) => typeof word === 'string') : [],
      usedByLevel: normalizeUsedByLevel(data.usedByLevel),
      usedRealByLevel: normalizeUsedByLevel(data.usedRealByLevel),
      missedByLevel: normalizeMissed(data.missedByLevel),
      unlocks: Array.from(new Set(['paper', ...unlocks])),
      settings: {
        tts: data.settings?.tts !== false,
        parentPhone: typeof data.settings?.parentPhone === 'string' ? data.settings.parentPhone : '',
        theme: typeof data.settings?.theme === 'string' ? data.settings.theme : 'paper',
        levelId: typeof data.settings?.levelId === 'string' ? data.settings.levelId : 'helppo',
      },
      lastResult: data.lastResult && typeof data.lastResult === 'object' ? data.lastResult : null,
    }
  } catch {
    return fresh()
  }
}

export function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function activeTheme(state) {
  return state.unlocks.includes(state.settings.theme) ? state.settings.theme : 'paper'
}

export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function weekCount(state, now = new Date()) {
  const key = weekKey(now)
  return state.sessions.filter((session) => session.week === key).length
}

export function updateSettings(patch) {
  const state = load()
  state.settings = { ...state.settings, ...patch }
  if (!state.unlocks.includes(state.settings.theme)) state.settings.theme = 'paper'
  save(state)
  return state
}

export function beginSession() {
  const state = load()
  state.xp += XP.start
  const unlocked = grantUnlocks(state)
  save(state)
  return { xp: state.xp, unlocked }
}

export function completeSession({ levelId, results, durationMs, scored }) {
  const state = load()
  state.xp += scored.earned
  state.sessions.push({
    at: new Date().toISOString(),
    week: weekKey(),
    levelId,
    correct: scored.correct,
    total: scored.total,
    durationMs,
  })
  const cutoff = Date.now() - 120 * 24 * 60 * 60 * 1000
  state.sessions = state.sessions.filter((session) => new Date(session.at).getTime() >= cutoff)
  state.lastResult = { levelId, accuracy: scored.accuracy, at: new Date().toISOString() }
  const unlocked = grantUnlocks(state)
  save(state)
  return { xp: state.xp, unlocked, weekCount: weekCount(state) }
}

export function markUsed(levelId, usedNext, real = false) {
  const state = load()
  const key = real ? 'usedRealByLevel' : 'usedByLevel'
  state[key][levelId] = usedNext
  save(state)
  return state
}

export function rememberMisses(levelId, results) {
  const state = load()
  const current = new Map((state.missedByLevel[levelId] || []).map((item) => [item.word, { ...item }]))
  const seen = new Set(results.map((result) => result.word))
  for (const [word, item] of current) {
    if (!seen.has(word) && item.wait > 0) item.wait -= 1
  }
  for (const result of results) {
    if (result.yes) current.delete(result.word)
    else current.set(result.word, { word: result.word, wait: 1 })
  }
  state.missedByLevel[levelId] = [...current.values()]
  save(state)
  return state
}

export function award(amount) {
  const state = load()
  state.xp += amount
  const unlocked = grantUnlocks(state)
  save(state)
  return { xp: state.xp, unlocked }
}

export function scoreSession(results) {
  const total = results.length
  const correct = results.filter((result) => result.yes).length
  const calmWords = results.filter((result) => !result.peeked).length
  const accuracy = total ? correct / total : 0
  const calm = total ? calmWords / total >= CALM_AT : false
  const accurate = accuracy >= ACCURATE_AT
  const parts = [
    { id: 'yes', label: 'Onnistumiset', amount: correct * XP.yes },
    { id: 'complete', label: 'Kierros valmis', amount: XP.complete },
  ]
  if (accurate) parts.push({ id: 'accurate', label: 'Tarkka lukija', amount: XP.accurate })
  if (calm) parts.push({ id: 'calm', label: 'Rauhallinen', amount: XP.calm })
  const earned = parts.reduce((sum, part) => sum + part.amount, 0)
  return {
    total,
    correct,
    accuracy,
    calm,
    accurate,
    parts: parts.filter((part) => part.amount > 0),
    earned,
  }
}

export function suggestLevel(levels, levelId, accuracy) {
  const index = levels.findIndex((level) => level.id === levelId)
  if (index < 0 || typeof accuracy !== 'number') return null
  if (accuracy >= SUGGEST_UP && index < levels.length - 1) return levels[index + 1].id
  if (accuracy < SUGGEST_DOWN && index > 0) return levels[index - 1].id
  return null
}

export function weeklyGoal() {
  return WEEKLY_GOAL
}

function grantUnlocks(state) {
  const fresh = []
  if (state.xp >= MERI_XP && !state.unlocks.includes('meri')) {
    state.unlocks.push('meri')
    fresh.push('meri')
  }
  if (weekCount(state) >= WEEKLY_GOAL && !state.unlocks.includes('ilta')) {
    state.unlocks.push('ilta')
    fresh.push('ilta')
  }
  return fresh
}

function normalizeMissed(value) {
  const missed = emptyUsedByLevel()
  if (!value || typeof value !== 'object') return missed
  for (const id of Object.keys(missed)) {
    if (!Array.isArray(value[id])) continue
    missed[id] = value[id]
      .filter((item) => item && typeof item.word === 'string')
      .map((item) => ({ word: item.word, wait: Number.isFinite(item.wait) ? item.wait : 0 }))
  }
  return missed
}

function normalizeUsedByLevel(value) {
  const used = emptyUsedByLevel()
  if (!value || typeof value !== 'object') return used
  for (const id of Object.keys(used)) {
    if (Array.isArray(value[id])) used[id] = value[id].filter((word) => typeof word === 'string')
  }
  return used
}

function emptyUsedByLevel() {
  return { helppo: [], keski: [], haastava: [], pidempi: [] }
}

function fresh() {
  return {
    xp: 0,
    sessions: [],
    recentWords: [],
    usedByLevel: emptyUsedByLevel(),
    usedRealByLevel: emptyUsedByLevel(),
    missedByLevel: emptyUsedByLevel(),
    unlocks: ['paper'],
    settings: {
      tts: true,
      parentPhone: '',
      theme: 'paper',
      levelId: 'helppo',
    },
    lastResult: null,
  }
}
