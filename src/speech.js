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

export function speakWord(word) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve({ ok: false })
      return
    }
    const utter = new SpeechSynthesisUtterance(word)
    utter.lang = 'fi-FI'
    utter.rate = 0.82
    utter.pitch = 1
    const voice = finnishVoice(window.speechSynthesis.getVoices())
    if (voice) utter.voice = voice
    utter.onend = () => resolve({ ok: true })
    utter.onerror = () => resolve({ ok: false })
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch {
      resolve({ ok: false })
    }
  })
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* The browser can throw if speech was already stopped. */
  }
}
