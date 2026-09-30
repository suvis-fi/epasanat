import './style.css'
import { FEEDBACK_MS, GATE_MS, MINI_SIZE, ROUND_SIZE, THEME_NAMES, XP } from './constants.js'
import { buildRound, getLevel, getLevels } from './content.js'
import {
  activeTheme,
  award,
  beginSession,
  completeSession,
  load,
  markUsed,
  rememberMisses,
  save,
  scoreSession,
  suggestLevel,
  updateSettings,
  weekCount,
  weeklyGoal,
} from './progress.js'
import {
  afterFeedback,
  answer,
  createSession,
  currentItem,
  gateRemaining,
  isGateOpen,
  pauseGate,
  peekSyllables,
  resumeGate,
  startMini,
  submitReady,
} from './practice.js'
import { finnishVoice, speakWord, stopSpeech, watchVoices } from './speech.js'
import { buildReport, formatDay, formatDuration, whatsAppUrl } from './report.js'
import {
  downloadIcs,
  formatWhen,
  googleCalendarUrl,
  icsContent,
  isFuture,
  resolveWhen,
  toDateInput,
  toTimeInput,
} from './remind.js'
import {
  homeView,
  practiceView,
  remindView,
  reportView,
  settingsView,
  summaryView,
} from './views.js'

const app = document.querySelector('#app')
const live = document.querySelector('#live')

let view = 'home'
let session = null
let ending = null
let voiceState = 'unknown'
let gateTimer = 0
let feedbackTimer = 0
let scrollKey = ''

init()

function init() {
  applyTheme(activeTheme(load()))
  migrateRecentWords()
  const state = load()
  if (!getLevels().some((level) => level.id === state.settings.levelId)) {
    updateSettings({ levelId: 'helppo' })
  }
  app.addEventListener('click', onClick)
  app.addEventListener('change', onChange)
  initVoices()
  render()
}

function onClick(event) {
  const target = event.target.closest('[data-action]')
  if (!target || target.disabled) return
  const action = target.dataset.action
  if (action === 'start') startPractice()
  else if (action === 'level') setLevel(target.dataset.level)
  else if (action === 'settings') {
    view = 'settings'
    render()
  } else if (action === 'home') goHome()
  else if (action === 'theme') setTheme(target.dataset.theme)
  else if (action === 'quit') askQuit()
  else if (action === 'quit-cancel') cancelQuit()
  else if (action === 'quit-confirm') quitSession()
  else if (action === 'peek') peek()
  else if (action === 'ready') ready()
  else if (action === 'replay') replay()
  else if (action === 'yes') choose(true)
  else if (action === 'no') choose(false)
  else if (action === 'mini') beginMini()
  else if (action === 'finish') finishSession()
  else if (action === 'to-report') {
    view = 'report'
    render()
  } else if (action === 'next') chooseNext(target.dataset.next)
  else if (action === 'send') {
    event.preventDefault()
    openReport(target.href)
  }
  else if (action === 'copy') copyReport()
  else if (action === 'skip-report') leaveReport()
  else if (action === 'after-report') {
    if (ending?.next === 'custom' && !selectedWhen()) render()
    else leaveReport()
  }
  else if (action === 'ics') addCalendar('ics')
  else if (action === 'google') {
    event.preventDefault()
    openCalendar(target.href)
  }
}

function onChange(event) {
  const target = event.target
  if (target.id === 'tts') {
    updateSettings({ tts: target.checked })
    render()
  } else if (target.id === 'custom-date' && ending) {
    ending.customDate = target.value
    render()
  } else if (target.id === 'custom-time' && ending) {
    ending.customTime = target.value
    render()
  }
}

function render() {
  try {
    applyTheme(activeTheme(load()))
    app.innerHTML = markup()
    syncGate()
    announce()
    const key = `${view}:${session?.phase ?? ''}:${session?.index ?? ''}`
    if (key !== scrollKey) {
      scrollKey = key
      window.scrollTo(0, 0)
    }
  } catch (error) {
    console.error(error)
    app.innerHTML = `<main class="shell"><h1>Jokin meni rikki</h1><button class="primary" type="button" data-action="home">Takaisin</button></main>`
  }
}

function markup() {
  if (view === 'practice' && session) return practiceView(practiceModel())
  if (view === 'summary' && ending) return summaryView(summaryModel())
  if (view === 'report' && ending) return reportView(reportModel())
  if (view === 'remind' && ending) return remindView(remindModel())
  if (view === 'settings') return settingsView(settingsModel())
  return homeView(homeModel())
}

function homeModel() {
  const state = load()
  const levels = getLevels()
  const current = getLevel(state.settings.levelId)
  const goal = weeklyGoal()
  const count = Math.min(goal, weekCount(state))
  const suggestion = suggestionFor(state, levels)
  return {
    xp: state.xp,
    weekCount: count,
    weekGoal: goal,
    weekLabel: weekLabel(count, goal),
    levels: levels.map((level) => ({
      id: level.id,
      name: level.name,
      on: level.id === current.id,
    })),
    blurb: current.blurb,
    suggestion,
    voiceNote: voiceNote(),
  }
}

function practiceModel() {
  const item = currentItem(session)
  const state = load()
  const open = isGateOpen(session)
  const elapsed = Math.min(GATE_MS, Date.now() - session.gateStartedAt)
  const heardModel = state.settings.tts && voiceState !== 'missing' && voiceState !== 'unsupported'
  return {
    phase: session.phase,
    quitAsk: session.quitAsk,
    word: item.word,
    syllables: item.syllables.join(' · '),
    showSyllables: session.peeked || session.phase === 'check' || session.phase === 'feedback',
    peeked: session.peeked,
    gateOpen: open,
    gateElapsed: elapsed,
    gateProgress: elapsed / GATE_MS,
    step: `${session.index + 1} / ${session.queue.length}`,
    doneCount: session.results.length,
    canSpeak: heardModel,
    voiceMissing: session.phase === 'check' && state.settings.tts && !heardModel,
    question: heardModel ? 'Menikö samoin?' : 'Menikö oikein?',
    feedbackYes: session.feedbackYes,
    showReal: Boolean(item.real) && (session.phase === 'check' || session.phase === 'feedback'),
  }
}

function summaryModel() {
  const goal = weeklyGoal()
  const count = Math.min(goal, ending.weekCount)
  return {
    duration: formatDuration(ending.durationMs),
    levelName: ending.levelName,
    correct: ending.scored.correct,
    total: ending.scored.total,
    pct: Math.round(ending.scored.accuracy * 100),
    pills: [
      ending.scored.accurate ? 'Tarkka lukija' : '',
      ending.scored.calm ? 'Rauhallinen' : '',
    ].filter(Boolean),
    parts: [{ label: 'Aloitit', amount: XP.start }, ...ending.scored.parts],
    sessionXp: ending.sessionXp,
    totalXp: ending.totalXp,
    weekLabel: weekLabel(count, goal),
    unlocks: ending.unlocked.map((id) => THEME_NAMES[id]).filter(Boolean),
  }
}

function reportModel() {
  const when = selectedWhen()
  const nextLabel = when ? formatWhen(when) : ''
  const text = reportText(nextLabel)
  return {
    text,
    waUrl: whatsAppUrl(text),
    next: ending.next,
    customDate: ending.customDate,
    customTime: ending.customTime,
    timeError: ending.next === 'custom' && ending.customDate && ending.customTime && !when
      ? 'Valitse tuleva aika.'
      : '',
    copied: ending.copied,
    reportDone: ending.sent || ending.copied,
    reportNote: reportNote(),
  }
}

function remindModel() {
  const when = selectedWhen()
  return {
    whenLabel: when ? formatWhen(when) : '',
    googleUrl: when ? googleCalendarUrl(when) : '#',
    remindNote: ending.remindRewarded ? `Muistutus tehty. +${XP.remind} XP` : '',
    remindRewarded: ending.remindRewarded,
  }
}

function settingsModel() {
  const state = load()
  const themes = state.unlocks.filter((id) => THEME_NAMES[id])
  return {
    tts: state.settings.tts,
    voiceNote: voiceNote(),
    themes: themes.length > 1
      ? themes.map((id) => ({
        id,
        name: THEME_NAMES[id],
        on: activeTheme(state) === id,
      }))
      : [],
  }
}

function startPractice() {
  const state = load()
  const level = getLevel(state.settings.levelId)
  const words = drawWords(level, ROUND_SIZE, true)
  if (!words.length) return
  session = createSession(words)
  ending = null
  beginSession()
  view = 'practice'
  render()
}

function drawWords(level, count, includeReal) {
  const state = load()
  const missed = includeReal
    ? (state.missedByLevel[level.id] || [])
      .filter((item) => item.wait <= 0)
      .map((item) => findWord(level, item.word))
      .filter(Boolean)
    : []
  const round = buildRound({
    level,
    count,
    usedPseudo: state.usedByLevel[level.id] || [],
    usedReal: state.usedRealByLevel[level.id] || [],
    missed,
    includeReal,
  })
  markUsed(level.id, round.usedNext)
  if (includeReal) markUsed(level.id, round.usedRealNext, true)
  return round.words
}

function findWord(level, word) {
  return [...level.words, ...(level.realWords || [])].find((item) => item.word === word) || null
}

function migrateRecentWords() {
  const state = load()
  if (!state.recentWords.length) return
  for (const word of state.recentWords) {
    const level = getLevels().find((item) => item.words.some((entry) => entry.word === word))
    if (!level || state.usedByLevel[level.id].includes(word)) continue
    state.usedByLevel[level.id].push(word)
  }
  state.recentWords = []
  save(state)
}

function setLevel(levelId) {
  if (!getLevels().some((level) => level.id === levelId)) return
  updateSettings({ levelId })
  render()
}

function setTheme(theme) {
  const state = load()
  if (!state.unlocks.includes(theme)) return
  updateSettings({ theme })
  render()
}

function askQuit() {
  if (!session || session.phase === 'mini') return
  clearTimeout(feedbackTimer)
  pauseGate(session)
  stopSpeech()
  render()
}

function cancelQuit() {
  if (!session) return
  resumeGate(session)
  if (session.phase === 'feedback') scheduleAdvance()
  render()
}

function quitSession() {
  clearPracticeTimers()
  stopSpeech()
  session = null
  view = 'home'
  render()
}

function peek() {
  if (!session || !peekSyllables(session)) return
  render()
}

function ready() {
  if (!session || !submitReady(session)) return
  speakIfEnabled()
  render()
}

function replay() {
  speakIfEnabled()
}

function choose(yes) {
  if (!session || !answer(session, yes)) return
  stopSpeech()
  scheduleAdvance()
  render()
}

function scheduleAdvance() {
  clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => {
    if (!session || session.phase !== 'feedback') return
    const step = afterFeedback(session)
    if (step === 'done') finishSession()
    else render()
  }, FEEDBACK_MS)
}

function beginMini() {
  if (!session) return
  const level = getLevel(load().settings.levelId)
  const extra = drawWords(level, MINI_SIZE)
  if (!startMini(session, extra)) finishSession()
  else render()
}

function finishSession() {
  if (!session || !session.results.length) {
    quitSession()
    return
  }
  clearPracticeTimers()
  stopSpeech()
  const level = getLevel(load().settings.levelId)
  const durationMs = Date.now() - session.startedAt
  const scored = scoreSession(session.results)
  const saved = completeSession({
    levelId: level.id,
    results: session.results,
    durationMs,
    scored,
  })
  rememberMisses(level.id, session.results)
  ending = {
    levelId: level.id,
    levelName: level.name,
    durationMs,
    scored,
    sessionXp: XP.start + scored.earned,
    totalXp: saved.xp,
    unlocked: saved.unlocked,
    weekCount: saved.weekCount,
    next: null,
    customDate: '',
    customTime: '',
    sent: false,
    copied: false,
    copyError: '',
    reportRewarded: false,
    remindRewarded: false,
  }
  session = null
  view = 'summary'
  render()
}

function chooseNext(choice) {
  if (!ending) return
  ending.next = choice
  if (choice === 'custom' && !ending.customDate) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    ending.customDate = toDateInput(tomorrow)
    ending.customTime = toTimeInput(new Date())
  }
  render()
}

function openReport(url) {
  window.open(url, '_blank', 'noopener')
  rewardReport()
}

function rewardReport() {
  if (!ending || ending.reportRewarded) return
  ending.reportRewarded = true
  ending.sent = true
  const saved = award(XP.report)
  ending.totalXp = saved.xp
  ending.unlocked.push(...saved.unlocked)
  window.setTimeout(render, 50)
}

async function copyReport() {
  if (!ending) return
  const when = selectedWhen()
  const text = reportText(when ? formatWhen(when) : '')
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch {
    const area = document.querySelector('#report-text')
    if (area) {
      area.focus()
      area.select()
      try {
        ok = document.execCommand('copy')
      } catch {
        ok = false
      }
    }
  }
  if (!ending.reportRewarded && ok) {
    ending.reportRewarded = true
    const saved = award(XP.report)
    ending.totalXp = saved.xp
    ending.unlocked.push(...saved.unlocked)
  }
  ending.copied = ok
  ending.copyError = ok ? '' : 'Valitse teksti ja kopioi se itse.'
  render()
}

function leaveReport() {
  if (selectedWhen()) {
    view = 'remind'
    render()
    return
  }
  goHome()
}

function openCalendar(url) {
  window.open(url, '_blank', 'noopener')
  addCalendar('google')
}

function addCalendar(kind) {
  const when = selectedWhen()
  if (!when || !ending) return
  if (kind === 'ics') downloadIcs('epasanat.ics', icsContent(when))
  if (!ending.remindRewarded) {
    ending.remindRewarded = true
    const saved = award(XP.remind)
    ending.totalXp = saved.xp
    ending.unlocked.push(...saved.unlocked)
  }
  if (kind === 'ics') render()
  else window.setTimeout(render, 50)
}

function goHome() {
  clearPracticeTimers()
  stopSpeech()
  session = null
  view = 'home'
  render()
}

function speakIfEnabled() {
  const state = load()
  if (!state.settings.tts || !session) return
  if (voiceState === 'missing' || voiceState === 'unsupported') return
  const item = currentItem(session)
  if (item) speakWord(item.word, item.syllables)
}

function selectedWhen() {
  if (!ending || !ending.next || ending.next === 'none') return null
  const when = resolveWhen(ending.next, ending.customDate, ending.customTime)
  return when && isFuture(when) ? when : null
}

function reportText(nextLabel) {
  const pct = Math.round(ending.scored.accuracy * 100)
  return buildReport({
    day: formatDay(new Date()),
    durationLabel: formatDuration(ending.durationMs),
    levelName: ending.levelName,
    correct: ending.scored.correct,
    total: ending.scored.total,
    pct,
    xp: ending.sessionXp,
    calm: ending.scored.calm,
    accurate: ending.scored.accurate,
    nextLabel,
  })
}

function reportNote() {
  if (ending?.copyError) return ending.copyError
  if (ending?.reportRewarded) return `Hienoa, että kerroit. +${XP.report} XP`
  return ''
}

function suggestionFor(state, levels) {
  const last = state.lastResult
  if (!last) return null
  const suggestedId = suggestLevel(levels, last.levelId, last.accuracy)
  if (!suggestedId || suggestedId === state.settings.levelId) return null
  const suggested = getLevel(suggestedId)
  const from = levels.findIndex((level) => level.id === last.levelId)
  const to = levels.findIndex((level) => level.id === suggestedId)
  const text = to > from
    ? `Edellinen kierros meni tarkasti. Voit kokeilla tasoa ${suggested.name}.`
    : `Edellinen kierros oli raskas. Taso ${suggested.name} voi sopia paremmin.`
  return { id: suggested.id, text }
}

function weekLabel(count, goal) {
  if (count >= goal) return 'Viikkotavoite täynnä'
  return `${count}/${goal} tällä viikolla`
}

function voiceNote() {
  if (voiceState === 'unsupported') return 'Kuuntelu ei toimi tässä selaimessa. Tavut näkyvät silti.'
  if (voiceState === 'missing') return 'Tällä laitteella ei ole suomenkielistä ääntä. Tavut näkyvät silti.'
  return ''
}

function syncGate() {
  clearTimeout(gateTimer)
  if (view !== 'practice' || !session || session.phase !== 'read' || session.quitAsk) return
  const remain = gateRemaining(session)
  if (remain === 0) return
  gateTimer = window.setTimeout(render, remain)
}

function announce() {
  if (!live) return
  let text = ''
  if (view === 'practice' && session) {
    const item = currentItem(session)
    if (session.quitAsk) text = 'Keskeytetäänkö harjoitus?'
    else if (session.phase === 'read') text = `${item.word}. Lue ääneen.`
    else if (session.phase === 'check') text = `${item.word}. ${item.syllables.join(' ')}.`
    else if (session.phase === 'feedback') text = session.feedbackYes ? 'Hyvä.' : 'Selvä. Jatketaan.'
    else if (session.phase === 'mini') text = 'Kierros tehty. Vielä 3 sanaa?'
  } else if (view === 'summary') text = 'Kierros valmis.'
  else if (view === 'report') text = 'Kerro vanhemmalle.'
  else if (view === 'remind') text = 'Muistutus kalenteriin.'
  if (text && live.textContent !== text) live.textContent = text
}

function clearPracticeTimers() {
  clearTimeout(gateTimer)
  clearTimeout(feedbackTimer)
  gateTimer = 0
  feedbackTimer = 0
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  const colors = { paper: '#f3efe4', meri: '#e5f2f4', ilta: '#161513' }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme] || colors.paper)
}

function initVoices() {
  if (!window.speechSynthesis) {
    voiceState = 'unsupported'
    return
  }
  watchVoices((voices) => {
    const next = finnishVoice(voices) ? 'finnish' : (voices.length ? 'missing' : 'unknown')
    if (next === voiceState) return
    voiceState = next
    const showVoice = view === 'home' || view === 'settings' || (view === 'practice' && session?.phase === 'check')
    if (showVoice) render()
  })
}
