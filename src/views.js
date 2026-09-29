export function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function homeView(vm) {
  return `<main class="shell">
    <p class="brand">Epäsanat</p>
    <h1>Lue epäsanoja ääneen.</h1>
    <p class="lead">Kestää noin 3 minuuttia. Ei tarvitse kiirehtiä.</p>
    <div class="stack start-block">
      <button class="primary" type="button" data-action="start">Aloita 3 min</button>
    </div>
    <div class="meta">
      <div class="week" aria-label="Tällä viikolla ${vm.weekCount}/${vm.weekGoal}">
        ${dots(vm.weekCount, vm.weekGoal)}
        <span>${vm.weekLabel}</span>
      </div>
      <p class="xp">${vm.xp} XP</p>
    </div>
    <section class="block">
      <h2>Taso</h2>
      <div class="chips" role="radiogroup" aria-label="Taso">
        ${vm.levels.map((level) => `<button type="button" role="radio" aria-checked="${level.on}" class="${level.on ? 'is-on' : ''}" data-action="level" data-level="${esc(level.id)}">${esc(level.name)}</button>`).join('')}
      </div>
      <p class="muted">${esc(vm.blurb)}</p>
      ${vm.suggestion ? `<div class="note"><p>${esc(vm.suggestion.text)}</p><button type="button" class="secondary" data-action="level" data-level="${esc(vm.suggestion.id)}">Vaihda</button></div>` : ''}
    </section>
    ${vm.voiceNote ? `<p class="muted">${esc(vm.voiceNote)}</p>` : ''}
    <button class="ghost" type="button" data-action="settings">Asetukset</button>
  </main>`
}

export function practiceView(vm) {
  if (vm.quitAsk) {
    return `<main class="shell">
      <div class="stage">
        <h1>${esc(vm.word)}</h1>
        <p class="lead">Keskeytetäänkö harjoitus?</p>
      </div>
      <div class="stack">
        <button class="primary" type="button" data-action="quit-cancel">Jatka lukemista</button>
        <button class="secondary" type="button" data-action="quit-confirm">Poistu</button>
      </div>
    </main>`
  }

  if (vm.phase === 'mini') {
    return `<main class="shell">
      <div class="stage">
        <p class="brand">Epäsanat</p>
        <h1>Hienosti jaksoit.</h1>
        <p class="lead">${vm.doneCount} sanaa luettu. Vielä 3 sanaa?</p>
      </div>
      <div class="stack">
        <button class="primary" type="button" data-action="mini">Vielä mini (3 sanaa)</button>
        <button class="secondary" type="button" data-action="finish">Lopeta</button>
      </div>
    </main>`
  }

  const syllables = vm.showSyllables
    ? `<p class="syllables">${esc(vm.syllables)}</p>`
    : ''

  let actions = ''
  if (vm.phase === 'read') {
    actions = `<div class="stack">
      <button class="secondary" type="button" data-action="peek" ${vm.peeked ? 'disabled' : ''}>${vm.peeked ? 'Tavut näkyvissä' : 'Näytä tavut'}</button>
      <button class="primary" type="button" data-action="ready" ${vm.gateOpen ? '' : 'disabled'}>Valmis</button>
    </div>`
  } else if (vm.phase === 'check') {
    actions = `<div class="stack">
      ${vm.canSpeak ? '<p class="muted center">Ensin tavut, sitten koko sana. Hitaasti.</p><button class="secondary" type="button" data-action="replay">Toista</button>' : ''}
      <p class="question">${esc(vm.question)}</p>
      <div class="pair">
        <button class="primary" type="button" data-action="yes">Kyllä</button>
        <button class="secondary" type="button" data-action="no">Ei</button>
      </div>
    </div>`
  }

  const feedback = vm.phase === 'feedback'
    ? `<p class="feedback">${vm.feedbackYes ? 'Hyvä.' : 'Selvä. Jatketaan.'}</p>`
    : ''

  return `<main class="shell practice">
    <header class="top">
      <button class="ghost" type="button" data-action="quit">Sulje</button>
      <p class="step">${vm.step}</p>
    </header>
    <div class="stage">
      <h1 class="word">${esc(vm.word)}</h1>
      ${syllables}
      ${vm.showReal ? '<p class="real">Oikea sana</p>' : ''}
      ${vm.phase === 'read' ? `<div class="gate" aria-hidden="true"><span class="gate-fill" style="--p:${vm.gateProgress};animation-delay:-${vm.gateElapsed}ms"></span></div><p class="hint">${vm.gateOpen ? 'Voit jatkaa, kun olet lukenut.' : 'Lue rauhassa.'}</p>` : ''}
      ${vm.voiceMissing ? '<p class="muted center">Kuuntelu ei toimi tällä laitteella. Katso tavut.</p>' : ''}
      ${feedback}
    </div>
    ${actions}
  </main>`
}

export function summaryView(vm) {
  const pills = vm.pills.length
    ? `<p class="pills">${vm.pills.map((pill) => `<span>${esc(pill)}</span>`).join('')}</p>`
    : ''
  const unlocks = vm.unlocks.length
    ? `<p class="note-line">${vm.unlocks.map((name) => `Uusi teema auki: ${esc(name)}. Vaihda se asetuksissa.`).join(' ')}</p>`
    : ''
  return `<main class="shell">
    <p class="brand">Epäsanat</p>
    <h1>Kierros valmis</h1>
    <p class="lead">${esc(vm.duration)} · ${esc(vm.levelName)}</p>
    <p class="result">${vm.correct}/${vm.total} onnistui · ${vm.pct} %</p>
    ${pills}
    <ul class="xp-list">
      ${vm.parts.map((part) => `<li><span>${esc(part.label)}</span><span>+${part.amount}</span></li>`).join('')}
    </ul>
    <p class="total">+${vm.sessionXp} XP tästä kierroksesta</p>
    <p class="muted">${esc(vm.weekLabel)} · yhteensä ${vm.totalXp} XP</p>
    ${unlocks}
    <div class="stack">
      <button class="primary" type="button" data-action="to-report">Jatka</button>
    </div>
  </main>`
}

export function reportView(vm) {
  const custom = vm.next === 'custom'
    ? `<div class="when-fields">
        <label>Päivä<input id="custom-date" type="date" value="${esc(vm.customDate)}"></label>
        <label>Kello<input id="custom-time" type="time" value="${esc(vm.customTime)}"></label>
      </div>${vm.timeError ? `<p class="muted">${esc(vm.timeError)}</p>` : ''}`
    : ''
  const note = vm.reportNote ? `<p class="note-line">${esc(vm.reportNote)}</p>` : ''
  const nextStep = vm.reportDone
    ? `<button class="primary" type="button" data-action="after-report">Jatka</button>`
    : ''
  return `<main class="shell">
    <p class="brand">Epäsanat</p>
    <h1>Kerro vanhemmalle</h1>
    <p class="lead">Hyvä sessio. Viesti lähtee vain, jos sinä lähetät sen.</p>
    <label class="field" for="report-text">Viesti</label>
    <textarea id="report-text" readonly rows="11">${esc(vm.text)}</textarea>
    <h2>Seuraava harjoitus</h2>
    <p class="muted">Jos valitset ajan, se lisätään viestiin.</p>
    <div class="chips">
      ${choice('tomorrow', 'Huomenna', vm.next)}
      ${choice('in2', '2 päivän päästä', vm.next)}
      ${choice('custom', 'Valitse aika', vm.next)}
      ${choice('none', 'Ei nyt', vm.next)}
    </div>
    ${custom}
    ${note}
    <div class="stack">
      <a class="button primary" href="${esc(vm.waUrl)}" target="_blank" rel="noopener" data-action="send">Lähetä WhatsAppilla</a>
      <button class="secondary" type="button" data-action="copy">${vm.copied ? 'Kopioitu' : 'Kopioi viesti'}</button>
      ${nextStep}
      <button class="ghost" type="button" data-action="skip-report">Ei nyt</button>
    </div>
  </main>`
}

export function remindView(vm) {
  return `<main class="shell">
    <p class="brand">Epäsanat</p>
    <h1>Muistutus kalenteriin</h1>
    <p class="lead">${esc(vm.whenLabel)}</p>
    <p>Epäsanat 3 min. Lisää tapahtuma puhelimen tai tietokoneen kalenteriin.</p>
    ${vm.remindNote ? `<p class="note-line">${esc(vm.remindNote)}</p>` : ''}
    <div class="stack">
      <button class="primary" type="button" data-action="ics">Lisää kalenteriin</button>
      <a class="button secondary" href="${esc(vm.googleUrl)}" target="_blank" rel="noopener" data-action="google">Avaa Google-kalenteri</a>
      <button class="ghost" type="button" data-action="home">${vm.remindRewarded ? 'Valmis' : 'Ei nyt'}</button>
    </div>
  </main>`
}

export function settingsView(vm) {
  const themes = vm.themes.length
    ? `<section class="block"><h2>Teema</h2><div class="chips">${vm.themes.map((theme) => `<button type="button" class="${theme.on ? 'is-on' : ''}" data-action="theme" data-theme="${esc(theme.id)}">${esc(theme.name)}</button>`).join('')}</div></section>`
    : ''
  return `<main class="shell">
    <button class="ghost back" type="button" data-action="home">Takaisin</button>
    <h1>Asetukset</h1>
    <label class="toggle">
      <input id="tts" type="checkbox" ${vm.tts ? 'checked' : ''}>
      <span>Kuuntele malli</span>
    </label>
    <p class="muted">Sovellus lukee sanan ääneen, kun painat Valmis.</p>
    ${vm.voiceNote ? `<p class="muted">${esc(vm.voiceNote)}</p>` : ''}
    <label class="field" for="phone">Vanhemman WhatsApp</label>
    <input id="phone" type="tel" inputmode="tel" autocomplete="off" maxlength="20" placeholder="040 123 4567" value="${esc(vm.phone)}">
    <p class="muted">Vapaaehtoinen. Numero pysyy vain tässä laitteessa.</p>
    ${themes}
  </main>`
}

function dots(count, goal) {
  return Array.from({ length: goal }, (_, index) => `<span class="dot${index < count ? ' on' : ''}"></span>`).join('')
}

function choice(id, label, selected) {
  const on = selected === id
  return `<button type="button" class="${on ? 'is-on' : ''}" aria-pressed="${on}" data-action="next" data-next="${id}">${label}</button>`
}
