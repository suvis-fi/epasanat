import { GATE_MS } from './constants.js'

export function createSession(words, now = Date.now()) {
  return {
    queue: words.map(copyWord),
    index: 0,
    phase: 'read',
    results: [],
    startedAt: now,
    gateStartedAt: now,
    gatePausedAt: 0,
    peeked: false,
    miniUsed: false,
    feedbackYes: null,
    quitAsk: false,
  }
}

export function currentItem(session) {
  return session.queue[session.index]
}

export function isGateOpen(session, now = Date.now()) {
  return session.phase === 'read' && now - session.gateStartedAt >= GATE_MS
}

export function gateRemaining(session, now = Date.now()) {
  return Math.max(0, GATE_MS - (now - session.gateStartedAt))
}

export function peekSyllables(session) {
  if (session.phase !== 'read' || session.quitAsk) return false
  session.peeked = true
  return true
}

export function pauseGate(session, now = Date.now()) {
  if (session.quitAsk) return
  session.quitAsk = true
  session.gatePausedAt = now
}

export function resumeGate(session, now = Date.now()) {
  if (session.gatePausedAt) {
    session.gateStartedAt += now - session.gatePausedAt
    session.gatePausedAt = 0
  }
  session.quitAsk = false
}

export function submitReady(session, now = Date.now()) {
  if (session.phase !== 'read' || session.quitAsk) return false
  if (!isGateOpen(session, now)) return false
  session.phase = 'check'
  return true
}

export function answer(session, yes) {
  if (session.phase !== 'check') return false
  const item = currentItem(session)
  session.results.push({
    word: item.word,
    syllables: [...item.syllables],
    yes: Boolean(yes),
    peeked: session.peeked,
  })
  session.phase = 'feedback'
  session.feedbackYes = Boolean(yes)
  return true
}

export function afterFeedback(session, now = Date.now()) {
  if (session.phase !== 'feedback') return 'stay'
  if (session.index + 1 < session.queue.length) {
    session.index += 1
    startWord(session, now)
    return 'next'
  }
  if (!session.miniUsed) {
    session.phase = 'mini'
    return 'mini'
  }
  session.phase = 'done'
  return 'done'
}

export function startMini(session, words, now = Date.now()) {
  if (session.phase !== 'mini' || !words.length) return false
  session.queue.push(...words.map(copyWord))
  session.miniUsed = true
  session.index += 1
  startWord(session, now)
  return true
}

export function startWord(session, now = Date.now()) {
  session.phase = 'read'
  session.peeked = false
  session.gateStartedAt = now
  session.gatePausedAt = 0
  session.feedbackYes = null
  session.quitAsk = false
}

function copyWord(word) {
  return { word: word.word, syllables: [...word.syllables] }
}
