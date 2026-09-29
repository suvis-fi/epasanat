# Epäsanat

Suomenkielinen web-sovellus epäsanojen lukemiseen. Kohderyhmä: oppilaat, joilla on lukivaikeus (myös ADHD). Ei kirjautumista.

## Päätökset (V1)

| Asia | Valinta |
|------|---------|
| Stack | **Vite + vanilla JS** (ei Reactia V1:ssä) |
| Kieli | Suomi |
| Päätoiminto | Lukeminen (kuuntelumalli TTS:llä) |
| Edistyminen | `localStorage` |
| Vanhempiraportti | WhatsApp (`wa.me`) — lapsi lähettää |
| Muistutus | Kalenterilinkki + rivi WhatsApp-viestiin |
| Julkaisu myöhemmin | Staattinen hostaus: **Vercel**, Netlify tai GitHub Pages |

## Kehitys

```bash
npm install
npm run dev
```

## V1

Kotinäkymä, Lue-kierros (pace gate, tavutus, Kyllä/Ei), kuuntelumalli, XP ja viikkotavoite, WhatsApp-raportti sekä kalenterimuistutus ovat käytössä. Edistyminen tallentuu selaimeen (`localStorage`, avain `epasanat.v1`).

## Seuraavaksi

1. Kokeile puhelimella (iOS Safari ja Android Chrome)
2. Deploy staattisena: Vercel, Netlify tai GitHub Pages

## Muistiinpano

Tämä kansio on erillinen projekti. Älä sekoita `arjenaikataulut`-repoon.
