import fs from 'node:fs'

const sets = JSON.parse(fs.readFileSync(new URL('../src/content/sets.json', import.meta.url), 'utf8'))
const seen = new Set()
const back = /[aou]/
const front = /[äöy]/
for (const level of sets.levels) {
  if (level.words.length !== 400) throw new Error(`${level.id} ${level.words.length}`)
  for (const item of level.words) {
    if (item.syllables.join('') !== item.word) throw new Error(`join ${item.word}`)
    if (back.test(item.word) && front.test(item.word)) throw new Error(`harmony ${item.word}`)
    if (!back.test(item.word) && !front.test(item.word)) throw new Error(`neutral ${item.word}`)
    if (seen.has(item.word)) throw new Error(`dup ${item.word}`)
    seen.add(item.word)
  }
}
console.log('ok', seen.size)
