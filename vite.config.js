import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { faqJsonLd, renderFaqBody } from './src/content/faq.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const ukkFile = path.join(root, 'public', 'ukk', 'index.html')

function faqDocument(html) {
  const jsonLd = '<!--faq-jsonld-->'
  const body = '<!--faq-body-->'
  if (!html.includes(jsonLd) || !html.includes(body)) {
    throw new Error('UKK-sivulta puuttuu FAQ-merkki')
  }
  const script = `<script type="application/ld+json">\n${JSON.stringify(faqJsonLd(), null, 2)}\n    </script>`
  return html.replace(jsonLd, script).replace(body, renderFaqBody())
}

function blogUrl() {
  const rewrite = (req, res, next) => {
    const urlPath = req.url?.split('?')[0]
    if (urlPath === '/ukk' || urlPath === '/ukk/' || urlPath === '/ukk/index.html') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(faqDocument(fs.readFileSync(ukkFile, 'utf8')))
      return
    }
    const path = urlPath
    if (path === '/miksi-epasanat' || path === '/miksi-epasanat/') {
      req.url = '/miksi-epasanat/index.html'
    }
    if (path === '/vanhemmille-ja-opettajille' || path === '/vanhemmille-ja-opettajille/') {
      req.url = '/vanhemmille-ja-opettajille/index.html'
    }
    if (path === '/epasanalista' || path === '/epasanalista/') {
      req.url = '/epasanalista/index.html'
    }
    if (path === '/epasanojen-lukeminen-kotona' || path === '/epasanojen-lukeminen-kotona/') {
      req.url = '/epasanojen-lukeminen-kotona/index.html'
    }
    next()
  }
  return {
    name: 'blog-url',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
    closeBundle: {
      order: 'post',
      handler() {
        const out = path.join(root, 'dist', 'ukk', 'index.html')
        fs.writeFileSync(out, faqDocument(fs.readFileSync(out, 'utf8')))
      },
    },
  }
}

export default defineConfig({
  plugins: [blogUrl()],
})
