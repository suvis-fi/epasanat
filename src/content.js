import sets from './content/sets.json'

export function getLevels() {
  return sets.levels
}

export function getLevel(id) {
  return sets.levels.find((level) => level.id === id) || sets.levels[0]
}

export function pickWords(level, count, avoid = []) {
  const banned = new Set(avoid)
  let pool = level.words.filter((word) => !banned.has(word.word))
  if (pool.length < count) pool = [...level.words]
  return shuffle(pool).slice(0, Math.min(count, pool.length))
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
