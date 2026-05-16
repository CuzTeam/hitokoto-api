import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@latest/'

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function main() {
  console.log('Fetching version.json...')
  const version = await fetchJSON(BASE_URL + 'version.json')
  console.log(`Bundle version: ${version.bundle_version}`)

  const categories = {}
  let totalSentences = 0

  for (const cat of version.sentences) {
    const url = BASE_URL + cat.path.replace('./', '')
    console.log(`Fetching ${cat.name} (${cat.key})...`)
    const sentences = await fetchJSON(url)

    let min = Infinity
    let max = 0
    for (const s of sentences) {
      const len = s.length ?? s.hitokoto.length
      if (len < min) min = len
      if (len > max) max = len
    }

    categories[cat.key] = {
      name: cat.name,
      min,
      max,
      sentences,
    }
    totalSentences += sentences.length
  }

  const output = {
    version: version.bundle_version,
    updated_at: version.updated_at,
    categories,
  }

  const outPath = resolve(__dirname, '..', 'data', 'sentences.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output))
  console.log(`Done. ${totalSentences} sentences written to data/sentences.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
