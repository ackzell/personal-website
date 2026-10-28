/**
 * Just enough XML for the two feeds the media pages read (YouTube's Atom and
 * the podcast's RSS). Both are machine-written and flat, so the blocks and
 * fields are found by tag name rather than through a full parser.
 */

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode(text: string) {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code: string) => {
      if (code[0] !== '#') return entities[code] ?? match
      return String.fromCodePoint(code[1] === 'x' ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1)))
    })
    .trim()
}

/** Every `<tag>…</tag>` block, as the markup between the tags. */
export function blocks(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}[\\s>]([\\s\\S]*?)</${tag}>`, 'g'))].map((match) => match[1]!)
}

/** The text of the first `<tag>`, decoded. */
export function text(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))
  return match ? decode(match[1]!) : undefined
}

/** An attribute of the first `<tag>`, decoded; `<tag>`s match self-closing too. */
export function attr(xml: string, tag: string, name: string) {
  const element = xml.match(new RegExp(`<${tag}\\s[^>]*>`))?.[0]
  const value = element?.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
  return value === undefined ? undefined : decode(value)
}

/** The same attribute from every `<tag>`, in order. */
export function attrs(xml: string, tag: string, name: string) {
  return [...xml.matchAll(new RegExp(`<${tag}\\s[^>]*>`, 'g'))].map((match) => attr(match[0], tag, name) ?? '')
}
