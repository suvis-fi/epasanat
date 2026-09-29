# Epäsanat — mitä sovelluksen pitää tehdä

Tuotespesifikaatio V1:lle ja pelillistämisen / raportoinnin pohjalle. Kieli: suomi. Ei kirjautumista.

---

## 1. Tarkoitus

Auttaa oppilaita, joilla on **lukivaikeus**, harjoittelemaan **epäsanojen lukemista** lyhyissä, turvallisissa sessioissa.

Epäsana = suomen äänne- ja kirjoitussääntöjen mukainen “sana”, jolla ei ole merkitystä. Oppilas ei voi arvata sanavarastosta, vaan joutuu käyttämään dekoodausta (äänne–kirjain / tavutus).

**Ei ole:** yleinen lukupeli kaikille sujuville lukijoille, puheterapian epäsanantoistosovellus, tai nopeuskilpailu.

---

## 2. Kenelle

### Ensisijainen
- Oppilaat, joilla on lukivaikeus / heikko lukusujuvuus
- Ikähaarukka noin 10–16, mutta sisältö ja sävy erityisesti **teineille**, joilla lukeminen tuntuu raskaalta
- Myös ADHD: lyhyt fokus, impulsivity/hätäisyys, lukemisen välttely

### Käyttäjäroolit V1:ssä
- **Oppilas** ajaa session yksin (ei vaadi aikuista vieressä)
- **Vanhempi** vastaanottaa session yhteenvedon (WhatsApp), voi tarvittaessa muistuttaa seuraavasta kerrasta

### Ei V1:ssä
- Opettajatilin / luokan hallinta
- Kirjautuminen, käyttäjätilit, pilvisynkronointi

---

## 3. Pedagogiset periaatteet (suunnittelun ohjurit)

1. **Onnistuminen ensin** — aloita tasolta, jossa onnistumisprosentti pysyy korkeana (~75–80 %). Älä hukuta virheisiin.
2. **Tavu on keskeinen yksikkö** suomessa — vaikeustasot perustuvat tavurakenteeseen ja pituuteen, ei satunnaiseen “hankaluuteen”.
3. **Lyhyet, toistuvat sessiot** > yksi pitkä urakka.
4. **Välitön palaute** jokaisen kohdan jälkeen.
5. **Älä palkitse nopeutta** — hätäisyys on osa ongelmaa; palkitse aloittamista, tarkkuutta ja session loppuun saattamista.
6. **Malliääni session jälkeen** auttaa yksin harjoittelevaa vertaamaan omaa lukemista oikeaan muotoon (ei puheentunnistusta V1:ssä).
7. **Siirtovaikutus tekstiin on rajallinen**, jos harjoitellaan vain irrallisia epäsanoja — sisältö kannattaa järjestää tavurakenteittain (myöhemmin yhteys oikeisiin sanoihin).

---

## 4. V1 — pakolliset ominaisuudet

### 4.1 Kotinäkymä
- Täysin suomenkielinen UI
- Selkeä, teiniystävällinen, rauhallinen ulkoasu (ei lapsellinen maskotti V1:ssä)
- Iso ensisijainen painike: esim. **Aloita 3 min** (tai vastaava lyhyt lupaus)
- Näytä kevyesti: XP / viikkotavoitteen eteneminen (esim. 2/3 sessiota tällä viikolla)
- Asetuksiin pääsy: kuuntelumalli päälle/pois, ehkä vanhemman WhatsApp-numero (valinnainen, vain tällä laitteella)

### 4.2 Harjoitustila: Lue (ensisijainen toiminto)
Yhden epäsanan kierros:

1. Näytä epäsana isolla fontilla, rauhallinen näyttö (vähän hälyä).
2. **Pace gate (hätäisyyttä vastaan):** “Valmis” / “Seuraava”-tyyppinen eteneminen ei aukea heti — lyhyt lukkoaika (n. 2–3 s, säädettävä), jotta pelkkä vilkaisu ei riitä.
3. Oppilas lukee ääneen.
4. Oppilas painaa **Valmis**.
5. **Kuuntele malli** (oletus päällä): sovellus lukee epäsanan ääneen (Web Speech API, `fi-FI`).
6. Näytä samalla **tavutus** (esim. `kel-pa`), jos saatavilla.
7. Painike **Toista** (kuuntele malli uudelleen).
8. Itsearviointi: **Menikö samoin?** → **Kyllä** / **Ei**.
9. Lyhyt palaute → seuraava sana.

**Kierroksen pituus:** oletus 6–8 sanaa (~2–4 min).  
Kierroksen jälkeen tarjonta: **Vielä mini (3 sanaa)** tai lopetus.

**Apu:** **Näytä tavut** ennen tai aikana (V1:ssä ilmaiseksi tai hyvin pienellä XP-vähennyksellä — tärkeämpää on onnistuminen kuin rankaisu).

### 4.3 Sisältö
- Epäsanat JSON-seteissä (tai vastaavassa staattisessa datassa).
- Vähintään 3–4 tasoa / settiä tavurakenteen mukaan, esim.:
  - helppo: lyhyet, selkeät tavut (CV-tyyppiset)
  - keskitaso: pidemmät / enemmän tavuja
  - haastavampi: konsonanttiyhtymiä, pituuksia
- Jokaisella kohteella vähintään: `word`, mieluiten `syllables` (tavutus näytölle).
- Sanat noudattavat suomen fonotaktiikkaa (kuulostavat “suomelta”, eivät ole oikeita sanoja).

### 4.4 Puhesynteesi (TTS)
- Asetus: **Kuuntele malli** — Päällä / Pois (oletus: Päällä).
- Käytä `speechSynthesis`, kieli `fi-FI`.
- Jos suomen ääntä ei ole saatavilla: näytä selkeä tavutus + viesti, että kuuntelu ei toimi tällä laitteella; harjoittelu jatkuu silti.
- **Ei** puheentunnistusta V1:ssä (sovellus ei arvioi ääneen lukemista automaattisesti).

### 4.5 Edistyminen (localStorage)
Tallenna laitteelle esim.:
- `xp`
- `sessionsCompleted` / viikon sessiomäärä
- `unlocks` (teemat tms.)
- asetukset (TTS, vanhemman numero)
- viimeisimmän session yhteenveto (raporttia varten)

Ei tilejä, ei palvelinta V1:ssä.

### 4.6 Pelillisyys (ADHD- ja lukivaikeusystävällinen)

**Palkitse:**
- Session **aloittaminen** (pieni XP — vähentää välttämistä)
- Oikea itsearvio (**Kyllä** kun osui)
- Kierroksen **loppuun saattaminen**
- Korkea tarkkuus (esim. ≥ 80 %) → bonus (“Tarkka lukija”)
- Pace gaten käyttäminen / rauhallinen eteneminen → “Rauhallinen”-bonus
- Vanhempiraportin lähettämisen avaaminen / yritys
- Seuraavan kerran muistutuksen asettaminen

**Älä tee V1:ssä:**
- Pääpisteenä aikaa vastaan juoksemista / countdown-kilpailua
- Ankaria päivittäisiä streakeja (“menetit putken”) — käytä mieluummin **pehmeää viikkotavoitetta** (esim. 3 sessiota / viikko)
- Lapsellista ylikuormitettua animaatiohälyä jokaisella napautuksella
- Monta yhtäaikaista tavoitetta näytöllä

**Unlockit:** kevyet (väriteema, ikoni) — teinityylisiä, ei välttämättä pehmoeläimiä.

### 4.7 Session loppu — yhteenveto
Näytä:
- kesto
- oikein / väärin ja %
- saatu XP
- mahdolliset bonukset (tarkka / rauhallinen)

Sitten ohjaa järjestyksessä:

#### A) Vanhempiraportti (pakollinen prompt, mutta ei lukitse ikuisesti)
- Otsikko esim. **Kerro vanhemmalle**
- Kehys: ylpeys / “hyvä sessio”, ei syyllistämistä
- Ensisijainen: **Lähetä WhatsAppilla**
- Toissijainen: **Kopioi viesti**
- Kolmas: **Ei nyt** (sallittu; älä ansaitse XP:tä raportista jos ohitetaan)
- Toteutus: valmis teksti → `https://wa.me/?text=...` (tai `wa.me/358...` jos numero tallennettu)
- Viesti syntyy **laitteella** (ei palvelinta); yksityisyys: ei lasten dataa pilveen V1:ssä

Esimerkkisisältö viestissä:
- päiväys
- kesto
- taso / setti
- oikein/väärin ja %
- XP
- positiivinen rivi (esim. rauhallinen harjoittelu)
- valinnainen vinkki kotiin (esim. lukekaa yhdessä 3 epäsanaa)
- jos seuraava kerta sovittu: se aika viestiin

#### B) Seuraavan session muistutus
Heti raportin jälkeen (tai samassa lopetuspolussa):

- Kysymys: **Muistuta seuraavasta harjoituksesta?**
- Valinnat: **Huomenna** · **2 päivän päästä** · **Valitse aika** · **Ei nyt**
- Oletus ADHD-ystävällisesti: huomenna samaan aikaan / kiinteä “arkisin ilta”
- **V1-toteutus (luotettava):**
  1. Kalenteritapahtuma (Google Calendar -linkki ja/tai `.ics`) — “Epäsanat 3 min”
  2. Sama ajankohta myös WhatsApp-raporttiin, jos raportti lähetetään
- Selaimen push-ilmoitukset: vain **valinnainen lisä** myöhemmin (iPhonella epäluotettava ilman raskaampaa push-setupia) — ei ainoa muistutus

### 4.8 Asetukset (minimi)
- Kuuntele malli: päällä/pois
- (Valinnainen) vanhemman puhelinnumero WhatsAppia varten, vain `localStorage`
- Mahdollisesti pace gaten kesto (tai pidä kiinteänä V1:ssä)

---

## 5. Explicitisti pois V1:stä (non-goals)

- Kirjautuminen / käyttäjätilit / pilvisynkka
- Automaattinen WhatsApp-lähetys ilman käyttäjän napautusta
- Puheentunnistus (“arvioiko app lukemisen oikeaksi”)
- Moninpeli, tulostaulukot luokalle
- Opettajan dashboard
- Nopeuskilpailu päämekanismina
- Pitkä tarinamoodi / raskas metapeli ennen kuin lukulooppi toimii
- Taustapalvelin (ellei myöhemmin tarvita pushia varten)

---

## 6. Tekninen kehys

| Asia | Valinta |
|------|---------|
| Stack | Vite + vanilla JS |
| UI-kieli | Suomi |
| Data | Staattiset JSON-setit + `localStorage` |
| TTS | Web Speech API |
| Raportti | `wa.me` + kopiointi |
| Muistutus | Kalenteri + rivi WhatsAppissa |
| Julkaisu | Staattinen: Vercel / Netlify / GitHub Pages |
| PWA / “Lisää kotiin” | Suositeltava myöhemmin; ei estä V1:tä |

Ehdotettu rakenne:

```text
src/
  main.js
  practice.js      # Lue-looppi
  speech.js        # TTS
  progress.js      # localStorage, XP, viikkotavoite
  report.js        # WhatsApp-teksti
  remind.js        # kalenteri / seuraava kerta
  content/sets.json
styles / index.html
```

---

## 7. Toteutusjärjestys (reasonable steps)

1. **Skeleton** — kotinäkymä FI, Aloita, tyhjä harjoitusnäkymä, progress-stub  
2. **Lue-looppi + sisältö** — pace gate, Kyllä/Ei, 6–8 sanan kierros, yhteenveto  
3. **TTS** — Kuuntele malli + Toista + tavutus + fallback  
4. **Kevyt pelillisyys** — XP, viikkotavoite, 1–2 unlockia  
5. **Vanhempiraportti-prompt** — WhatsApp + kopioi + Ei nyt  
6. **Seuraava kerta** — kalenteri + rivi raporttiin  
7. **Polish + deploy** — mobiili, iOS-quirks, lisää settejä  

---

## 8. Onnistumiskriteerit (tuote)

Sovellus on V1:ssä “valmis kokeiltavaksi kotona”, kun:

1. Teini pystyy suorittamaan session noin **alle 4 minuutissa**.  
2. Hätäisyys vähenee mekaniikan avulla (pace gate + malliääni + tarkkuuspalkinnot; ei nopeuspisteitä).  
3. Itsearviointi on mahdollista yksin (kuuntelumalli + tavutus).  
4. Lopussa **promptataan** lähettämään vanhempiraportti WhatsAppilla.  
5. Oppilas voi asettaa **seuraavan kerran** muistutuksen kalenteriin.  
6. Palaaminen toiseen kertaan on kevyt (viikkotavoite, ei rankaisevaa streakiä).

---

## 9. Myöhemmät ideat (ei V1-lupaus)

- Kirjoita-tila (kuule / näe → kirjoita)
- Sujuvuuslista (aika + tarkkuus, varovasti ADHD huomioiden)
- Parannettu ääni (nauhoitteet TTS:n sijaan)
- Selaimen ilmoitukset (best-effort)
- Yhteys oikeisiin sanoihin / lyhyt tekstiharjoitus transferiin
- Opettajan tulostettava / QR-yhteenveto
- PWA-asennus ja offline

---

## 10. Lyhyt “definition of done” yhdelle sanalle

> Näytä epäsana → hidasta hätäisyyttä → oppilas lukee → malliääni + tavutus → Kyllä/Ei → toista kunnes kierros valmis → XP → promptaa WhatsApp-raportti → promptaa seuraavan kerran muistutus.

---

*Dokumentti päivittää tuotteen yhteisen ymmärryksen. Kun ominaisuus muuttuu, päivitä tämä tiedosto.*
