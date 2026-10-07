// Tiny, safe Markdown subset for product descriptions (s160 — the showcase write-ups).
// Supports: ### / #### headings · **bold** · "* " / "- " bullets (a plain line right under a
// bullet continues it) · "---" rule · blank line = new paragraph. Everything is HTML-escaped
// FIRST, then only our own tags are added — safe for v-html. Each block gets its own dir from
// its MAJORITY script (not the first letter — "HP ZBook - ورك ستيشن…" is an Arabic line), so an
// Arabic paragraph aligns right on its own while the page layout stays LTR.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
const dirOf = (s) => {
  const ar = (s.match(/[\u0600-\u06FF]/g) || []).length
  const la = (s.match(/[A-Za-z]/g) || []).length
  return ar > la ? 'rtl' : ar || la ? 'ltr' : 'auto'
}

export function renderRichText(text) {
  if (!text) return ''
  const out = []
  let list = null   // array of li html while inside a list
  let listText = '' // raw text of the list, for its direction
  let para = []     // lines of the current paragraph

  const flushPara = () => {
    if (para.length) out.push(`<p dir="${dirOf(para.join(' '))}">${para.map(inline).join('<br>')}</p>`)
    para = []
  }
  const flushList = () => {
    if (list) out.push(`<ul dir="${dirOf(listText)}">${list.map((li) => `<li>${li}</li>`).join('')}</ul>`)
    list = null
    listText = ''
  }

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    let m
    if (!line) { flushPara(); flushList(); continue }
    if ((m = line.match(/^(#{3,4})\s+(.*)$/))) {
      flushPara(); flushList()
      const tag = m[1].length === 3 ? 'h3' : 'h4'
      out.push(`<${tag} dir="${dirOf(m[2])}">${inline(m[2])}</${tag}>`)
    } else if (/^-{3,}$/.test(line)) {
      flushPara(); flushList(); out.push('<hr>')
    } else if ((m = line.match(/^[*-]\s+(.*)$/))) {
      flushPara()
      if (!list) list = []
      list.push(inline(m[1]))
      listText += ' ' + m[1]
    } else if (list) {
      list[list.length - 1] += `<span class="rt-sub">${inline(line)}</span>`
      listText += ' ' + line
    } else {
      para.push(line.replace(/^>\s?/, ''))
    }
  }
  flushPara(); flushList()
  return out.join('')
}
