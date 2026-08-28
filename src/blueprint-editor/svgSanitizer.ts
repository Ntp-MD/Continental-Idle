const ALLOWED_SVG_TAGS = new Set<string>([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polygon',
  'polyline',
  'text',
  'tspan',
])

function sanitizeSvgNode(node: Element): boolean {
  const tag = node.tagName.toLowerCase()
  if (!ALLOWED_SVG_TAGS.has(tag)) return false

  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase()
    if (name.startsWith('on')) {
      node.removeAttribute(attr.name)
      continue
    }
    if (name === 'style' && /(expression|javascript:|vbscript:|mhtml:|@import|behavior:|binding:|url\s*\(\s*['"]?(javascript|data|blob|vbscript|mhtml):)/i.test(attr.value)) {
      node.removeAttribute(attr.name)
      continue
    }
    if ((name === 'href' || name.startsWith('xlink:')) && /^(javascript|data|blob):/i.test(attr.value)) {
      node.removeAttribute(attr.name)
    }
  }

  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i]
    if (!sanitizeSvgNode(child)) child.remove()
  }
  return true
}

export function renderSvgInto(container: SVGElement, html: string): void {
  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`,
    'image/svg+xml',
  )
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.warn('[SVG] Failed to parse SVG content:', parserError.textContent, html)
    return
  }
  if (doc.documentElement) sanitizeSvgNode(doc.documentElement)
  while (container.firstChild) container.removeChild(container.firstChild)
  Array.from(doc.documentElement.children).forEach(child => {
    const node = document.importNode(child, true) as SVGElement
    const role = node.getAttribute('data-role')
    if (role) node.classList.add(`svg_role__${role}`)
    container.appendChild(node)
  })
}
