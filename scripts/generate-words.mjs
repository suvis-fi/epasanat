import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PER_LEVEL = 400
const ONSETS = ['k', 'p', 't', 's', 'n', 'm', 'l', 'r', 'h', 'v', 'j']
const GEMINATES = ['k', 'p', 't', 's', 'l', 'r', 'n', 'm']
const CLUSTERS = [
  ['l', 'k'], ['l', 'p'], ['l', 't'], ['l', 's'], ['l', 'm'],
  ['r', 'k'], ['r', 'p'], ['r', 't'], ['r', 's'], ['r', 'm'], ['r', 'v'],
  ['s', 'k'], ['s', 'p'], ['s', 't'], ['s', 'n'], ['s', 'm'],
  ['n', 'k'], ['n', 't'], ['n', 's'],
  ['m', 'p'],
  ['k', 's'],
  ['t', 's'],
]
const DENY = ['vittu', 'paska', 'kyrpä', 'mulkku', 'pillu', 'huora', 'perkele', 'saatana', 'helvetti', 'neekeri']

const listPath = process.env.FINNISH_WORDS || path.join(os.tmpdir(), 'kaikkisanat.txt')
const dict = new Set(
  fs.readFileSync(listPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => /^[a-zäöå]+$/u.test(line)),
)

const rng = mulberry32(20260929)
const used = new Set()

const levels = [
  {
    id: 'helppo',
    name: 'Helppo',
    blurb: 'Kaksi selvää tavua',
    words: fill(PER_LEVEL, [easyWord]),
  },
  {
    id: 'keski',
    name: 'Keski',
    blurb: 'Kolme tavua',
    words: fill(PER_LEVEL, [mediumWord]),
  },
  {
    id: 'haastava',
    name: 'Haastava',
    blurb: 'Yhtymiä ja pitkiä äänteitä',
    words: fill(PER_LEVEL, [geminateWord, geminateWord, clusterWord, clusterWord, longWord]),
  },
  {
    id: 'pidempi',
    name: 'Pidempi',
    blurb: 'Pidempiä sanoja',
    words: fill(PER_LEVEL, [longerCluster, longerGeminate, longerLong]),
  },
]

for (const level of levels) {
  level.words.sort((a, b) => a.word.localeCompare(b.word, 'fi'))
  console.log(level.id, level.words.length, level.words.slice(0, 8).map((word) => word.word).join(', '))
}

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/content/sets.json')
fs.writeFileSync(outPath, `${JSON.stringify({ levels }, null, 2)}\n`)
console.log('wrote', levels.reduce((sum, level) => sum + level.words.length, 0))

function fill(count, makers) {
  const words = []
  let guard = 0
  while (words.length < count && guard < count * 200) {
    guard += 1
    const made = makers[Math.floor(rng() * makers.length)]()
    if (!made || used.has(made.word) || !acceptable(made)) continue
    used.add(made.word)
    words.push(made)
  }
  if (words.length < count) throw new Error(`only ${words.length} of ${count}`)
  return words
}

function easyWord() {
  const harmony = pickHarmony()
  const first = syllable(harmony)
  const second = syllable(harmony)
  if (first === second) return null
  return { word: first + second, syllables: [first, second] }
}

function mediumWord() {
  const harmony = pickHarmony()
  const parts = [syllable(harmony), syllable(harmony), syllable(harmony)]
  if (new Set(parts).size < 3) return null
  return { word: parts.join(''), syllables: parts }
}

function geminateWord() {
  const harmony = pickHarmony()
  const vowel = pickVowel(harmony)
  const tail = pickVowel(harmony)
  const onset = pick(ONSETS)
  const geminate = pick(GEMINATES)
  const word = `${onset}${vowel}${geminate}${geminate}${tail}`
  return { word, syllables: [`${onset}${vowel}${geminate}`, `${geminate}${tail}`] }
}

function clusterWord() {
  const harmony = pickHarmony()
  const vowel = pickVowel(harmony)
  const tail = pickVowel(harmony)
  const onset = pick(ONSETS)
  const [coda, next] = pick(CLUSTERS)
  const word = `${onset}${vowel}${coda}${next}${tail}`
  return { word, syllables: [`${onset}${vowel}${coda}`, `${next}${tail}`] }
}

function longWord() {
  const harmony = pickHarmony()
  const long = pick(harmony === 'back' ? ['aa', 'oo', 'uu', 'ee', 'ii'] : ['ää', 'öö', 'yy', 'ee', 'ii'])
  const onset = pick(ONSETS)
  const next = pick(ONSETS)
  const tail = pickVowel(harmony)
  const word = `${onset}${long}${next}${tail}`
  return { word, syllables: [`${onset}${long}`, `${next}${tail}`] }
}

function longerCluster() {
  return extend(clusterWord())
}

function longerGeminate() {
  return extend(geminateWord())
}

function longerLong() {
  return extend(longWord())
}

function extend(base) {
  if (!base) return null
  const harmony = /[äöy]/.test(base.word) ? 'front' : 'back'
  const extra = syllable(harmony)
  if (base.syllables.at(-1) === extra) return null
  return { word: base.word + extra, syllables: [...base.syllables, extra] }
}

function syllable(harmony) {
  return pick(ONSETS) + pickVowel(harmony)
}

function pickHarmony() {
  return rng() < 0.5 ? 'back' : 'front'
}

function pickVowel(harmony) {
  const vowels = harmony === 'back' ? ['a', 'o', 'u', 'e', 'i'] : ['ä', 'ö', 'y', 'e', 'i']
  return pick(vowels)
}

function acceptable(item) {
  if (item.syllables.join('') !== item.word) return false
  if (!harmonyOk(item.word)) return false
  if (DENY.some((bad) => item.word.includes(bad))) return false
  if (blocked(item.word)) return false
  return true
}

function harmonyOk(word) {
  const back = /[aou]/.test(word)
  const front = /[äöy]/.test(word)
  return back !== front && (back || front)
}

function blocked(word) {
  if (dict.has(word) || dict.has(`${word}a`) || dict.has(`${word}ä`)) return true
  for (let length = 4; length <= word.length; length += 1) {
    for (let index = 0; index + length <= word.length; index += 1) {
      if (dict.has(word.slice(index, index + length))) return true
    }
  }
  return false
}

function pick(list) {
  return list[Math.floor(rng() * list.length)]
}

function mulberry32(seed) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let next = Math.imul(state ^ (state >>> 15), 1 | state)
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}
