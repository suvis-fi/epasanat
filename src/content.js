import sets from './content/sets.json' with { type: 'json' }

export function getLevels() {
  return sets.levels
}

export function getLevel(id) {
  return sets.levels.find((level) => level.id === id) || sets.levels[0]
}

export function pickWords(level, count, used = []) {
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

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
