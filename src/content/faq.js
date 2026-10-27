export const faq = [
  {
    question: 'Onko Epäsanat maksuton?',
    answer: 'Kyllä. Harjoitus on ilmainen, eikä siihen tarvitse kirjautua tai luoda tunnusta.',
  },
  {
    question: 'Kuinka kauan harjoitus kestää?',
    answer:
      'Yksi harjoituskerta kestää noin kolme minuuttia. Lyhyt kesto on tarkoituksellinen: harjoittelu on helppo aloittaa, ja keskittyminen ei ehdi loppua kesken.',
  },
  {
    question: 'Tallennetaanko minusta tietoja?',
    answer:
      'Harjoituksen tiedot tallentuvat vain omaan selaimeesi, eikä niitä lähetetä minnekään. Sivusto käyttää Google Analyticsia käyttäjämäärien seuraamiseen, mutta analytiikka ei näe harjoituksessa luettuja sanoja. Lisätietoja: ohje vanhemmille ja opettajille. Jos lähetät harjoituksen jälkeen WhatsApp-todisteen, päätät itse, lähetätkö sen ja kenelle.',
  },
  {
    question: 'Mitä epäsanat ovat?',
    answer:
      'Epäsanat eli pseudosanat ovat keksittyjä sanoja, jotka noudattavat suomen kielen rakennetta mutta eivät tarkoita mitään, esimerkiksi kiroitas, lumpeva ja sorkaane. Arkikielessä niitä voi kutsua myös hölynpölysanoiksi.',
  },
  {
    question: 'Miksi hölynpölysanoja kannattaa lukea?',
    answer:
      'Epäsanoja ei voi arvata eikä tunnistaa ulkomuistista, joten jokainen kirjain ja tavu täytyy lukea oikeasti. Siksi ne sopivat lukemisen tarkkuuden ja sujuvuuden harjoitteluun.',
  },
  {
    question: 'Kenelle harjoitus sopii?',
    answer:
      'Nuorille, joilla on lukivaikeus (lukihäiriö, dysleksia) tai joiden lukeminen on hidasta, työlästä tai kiireistä, esimerkiksi ADHD:n vuoksi. Se sopii myös kaikille, jotka haluavat vahvistaa lukemisen tarkkuutta.',
  },
  {
    question: 'Tarvitseeko aikuisen olla vieressä?',
    answer:
      'Ei tarvitse. Harjoitus on tehty omatoimiseksi. Jos nuori haluaa, hän voi lähettää harjoituksen lopuksi WhatsApp-todisteen vanhemmalle, opettajalle tai valmentajalle.',
  },
  {
    question: 'Miten muistan harjoitella uudestaan?',
    answer:
      'Harjoituksen lopuksi sovellus kysyy, milloin haluat harjoitella seuraavan kerran. Voit lisätä ajan itse puhelimen tai tietokoneen kalenteriin. Sovellus ei aseta hälytystä automaattisesti.',
  },
  {
    question: 'Miten saan sivun puhelimen kotivalikkoon?',
    answer:
      'Avaa sivu puhelimen selaimessa. iPhonella napauta Jaa-kuvaketta ja valitse Lisää Koti-valikkoon. Androidilla napauta selaimen kolmea pistettä ja valitse Lisää aloitusnäyttöön. Tarkemmat ohjeet löytyvät <a href="/vanhemmille-ja-opettajille#kotivalikko">vanhempien ja opettajien ohjeesta</a>.',
  },
  {
    question: 'Korvaako harjoitus lukivaikeuden tutkimuksen?',
    answer:
      'Ei. Harjoitus ei korvaa lukivaikeuden tai ADHD:n tutkimusta, diagnoosia eikä ammattilaisen tukea. Jos lukeminen tuntuu jatkuvasti työläältä, ota yhteyttä koulun erityisopettajaan tai kouluterveydenhuoltoon.',
  },
]

export function plainAnswer(answer) {
  return answer.replace(/<[^>]*>/g, '')
}

export function renderFaqBody(items = faq) {
  return items
    .map((item) => `      <h2>${item.question}</h2>\n      <p>${item.answer}</p>`)
    .join('\n\n')
}

export function faqJsonLd(items = faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fi',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainAnswer(item.answer),
      },
    })),
  }
}
