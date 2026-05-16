const { URL } = require('node:url')
const hitokoto = require('../src/hitokoto')
const data = require('../data/sentences.json')

module.exports = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (pathname === '/ping') {
    res.setHeader('Content-Type', 'text/plain')
    res.status(200).send('pong')
    return
  }

  if (pathname === '/status') {
    let totalSentences = 0
    const cats = []
    for (const [key, cat] of Object.entries(data.categories)) {
      totalSentences += cat.sentences.length
      cats.push({ key, name: cat.name, count: cat.sentences.length })
    }
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json({
      version: data.version,
      updated_at: data.updated_at,
      total_sentences: totalSentences,
      categories: cats,
      ts: Date.now(),
    })
    return
  }

  if (pathname === '/' || pathname === '') {
    const query = Object.fromEntries(url.searchParams)
    const c = url.searchParams.getAll('c')
    if (c.length > 0) query.c = c.length === 1 ? c[0] : c

    const result = hitokoto(query)
    res.setHeader('Content-Type', result.type)
    res.status(result.status).send(result.body)
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(404).json({ status: 404, message: 'Not Found', ts: Date.now() })
}
