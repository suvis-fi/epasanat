export function watchVoices(onChange) {
  if (!window.speechSynthesis) return () => {}
  const emit = () => onChange(window.speechSynthesis.getVoices())
  emit()
  window.speechSynthesis.addEventListener('voiceschanged', emit)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', emit)
}

export function finnishVoice(voices) {
  return voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith('fi')) || null
}

const RATE = 0.58
const GAP_MS = 520

let runId = 0

export function speechParts(word, syllables = []) {
  if (syllables.length > 1) return [...syllables, word]
  return [word]
}

export function speakWord(word, syllables = []) {
  stopSpeech()
  const token = runId
  const parts = speechParts(word, syllables)
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve({ ok: false })
      return
    }
    const voice = finnishVoice(window.speechSynthesis.getVoices())
    let index = 0
    let settled = false
    const finish = (ok) => {
      if (settled) return
      settled = true
      resolve({ ok })
    }
    const speakNext = () => {
      if (token !== runId) {
        finish(false)
        return
      }
      if (index >= parts.length) {
        finish(true)
        return
      }
      const utter = new SpeechSynthesisUtterance(parts[index])
      index += 1
      utter.lang = 'fi-FI'
      utter.rate = RATE
      utter.pitch = 1
      if (voice) utter.voice = voice
      utter.onend = () => {
        window.setTimeout(speakNext, GAP_MS)
      }
      utter.onerror = () => finish(false)
      try {
        window.speechSynthesis.speak(utter)
      } catch {
        finish(false)
      }
    }
    window.setTimeout(speakNext, 80)
  })
}

export function stopSpeech() {
  runId += 1
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* The browser can throw if speech was already stopped. */
  }
}
