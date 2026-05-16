const data = require('../data/sentences.json')

const categoryKeys = Object.keys(data.categories)

function getCategories(c) {
  if (!c) return categoryKeys
  if (!Array.isArray(c)) c = [c]
  return c.filter((k) => categoryKeys.includes(k))
}

function filterCategoriesByLength(cats, minLen, maxLen) {
  return cats.filter((key) => {
    const cat = data.categories[key]
    return minLen <= cat.max && maxLen >= cat.min
  })
}

function getRandomSentence(category, minLen, maxLen) {
  const sentences = data.categories[category].sentences.filter((s) => {
    const len = s.length ?? s.hitokoto.length
    return len >= minLen && len <= maxLen
  })
  if (sentences.length === 0) return null
  return sentences[Math.floor(Math.random() * sentences.length)]
}

function formatJSON(sentence) {
  return JSON.stringify(sentence)
}

function formatJS(sentence, select) {
  return `(function hitokoto(){var hitokoto=${JSON.stringify(sentence.hitokoto)};var dom=document.querySelector('${select}');Array.isArray(dom)?dom[0].innerText=hitokoto:dom.innerText=hitokoto;})()`
}

function formatText(sentence) {
  return sentence.hitokoto
}

module.exports = function hitokoto(query) {
  const encode = ['json', 'js', 'text'].includes(query.encode) ? query.encode : 'json'
  const select = query.select || '.hitokoto'
  const minLength = Math.max(0, parseInt(query.min_length) || 0)
  let maxLength = parseInt(query.max_length) || 30
  if (maxLength > 1000) maxLength = 1000
  if (maxLength < minLength) {
    return { status: 400, type: 'application/json', body: JSON.stringify({ status: 400, message: '`max_length` 不能小于 `min_length`！', data: [], ts: Date.now() }) }
  }

  let cats = getCategories(query.c)
  cats = filterCategoriesByLength(cats, minLength, maxLength)
  if (cats.length === 0) {
    return { status: 400, type: 'application/json', body: JSON.stringify({ status: 400, message: '很抱歉，没有分类有句子符合长度区间。', data: [], ts: Date.now() }) }
  }

  const category = cats[Math.floor(Math.random() * cats.length)]
  const sentence = getRandomSentence(category, minLength, maxLength)
  if (!sentence) {
    return { status: 400, type: 'application/json', body: JSON.stringify({ status: 400, message: '很抱歉，没有句子符合长度区间。', data: [], ts: Date.now() }) }
  }

  const mimeMap = { json: 'application/json', js: 'application/javascript', text: 'text/plain' }
  const formatMap = { json: formatJSON, js: (s) => formatJS(s, select), text: formatText }

  return { status: 200, type: mimeMap[encode], body: formatMap[encode](sentence) }
}
