import { defineConfig } from 'vite'

function blogUrl() {
  const rewrite = (req, _res, next) => {
    const path = req.url?.split('?')[0]
    if (path === '/miksi-epasanat' || path === '/miksi-epasanat/') {
      req.url = '/miksi-epasanat/index.html'
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
  }
}

export default defineConfig({
  plugins: [blogUrl()],
})
