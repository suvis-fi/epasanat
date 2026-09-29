import sets from './content/sets.json' with { type: 'json' }
import realWords from './content/real-words.json' with { type: 'json' }

export function getLevels() {
  return sets.levels.map(withRealWords)
}

export function getLevel(id) {
  return getLevels().find((level) => level.id === id) || withRealWords(sets.levels[0])
}

export function pickWords(level, count, used = []) {
  if (count <= 0) return { words: [], usedNext: used }
  const usedSet = new Set(used)
  const fresh = level.words.filter((word) => !usedSet.has(word.word))
  if (fresh.length >= count) {
    const words = shuffle(fresh).slice(0, count)
    return { words, usedNext: [...used, ...words.map((word) => word.word)] }
  }
  const pickedFresh = shuffle(fresh)
  const chosen = new Set(pickedFresh.map((word) => word.word))
  const recent = new Set(used.slice(-count))
  let recycledPool = level.words.filter((word) => !chosen.has(word.word) && !recent.has(word.word))
  if (recycledPool.length < count - pickedFresh.length) {
    recycledPool = level.words.filter((word) => !chosen.has(word.word))
  }
  const recycled = shuffle(recycledPool).slice(0, count - pickedFresh.length)
  const words = [...pickedFresh, ...recycled]
  return { words, usedNext: words.map((word) => word.word) }
}

export function buildRound({ level, count, usedPseudo = [], usedReal = [], missed = [], includeReal = false }) {
  const review = missed.slice(0, 2)
  const reviewNames = new Set(review.map((word) => word.word))
  let realPick = { words: [], usedNext: usedReal }
  if (includeReal && level.realWords?.length) {
    const realCount = Math.min(2, Math.max(0, count - review.length))
    realPick = pickWords(
      { words: level.realWords },
      realCount,
      usedReal.filter((word) => !reviewNames.has(word)),
    )
    realPick.words = realPick.words.filter((word) => !reviewNames.has(word.word))
  }
  const pseudoPick = pickWords(level, Math.max(0, count - review.length - realPick.words.length), usedPseudo)
  return {
    words: shuffle([...review, ...realPick.words, ...pseudoPick.words]),
    usedNext: pseudoPick.usedNext,
    usedRealNext: realPick.usedNext,
  }
}

function withRealWords(level) {
  if (level.id !== realWords.levelId) return level
  return {
    ...level,
    blurb: 'Kaksi selvää tavua. Mukana myös oikeita sanoja.',
    realWords: realWords.words,
  }
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
