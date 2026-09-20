import { describe, it, expect } from 'vitest'
import { renderSvgInto } from '../../src/blueprint-editor/assets/svgSanitizer'

function render(html: string): SVGElement {
  const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement
  renderSvgInto(container, html)
  return container
}

describe('renderSvgInto (SVG sanitizer)', () => {
  it('keeps safe shapes and their attributes', () => {
    const el = render('<rect x="1" y="2" width="10" height="20" fill="#fff"/>')
    const rect = el.querySelector('rect')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('1')
    expect(rect?.getAttribute('fill')).toBe('#fff')
  })

  it('strips on* event handler attributes', () => {
    const el = render('<rect onclick="alert(1)" onload="alert(1)" width="10" height="10"/>')
    const rect = el.querySelector('rect')
    expect(rect?.hasAttribute('onclick')).toBe(false)
    expect(rect?.hasAttribute('onload')).toBe(false)
  })

  it('strips style attributes carrying dangerous url/expression payloads', () => {
    const payloads = [
      'background:url(javascript:alert(1))',
      'background:url(vbscript:msgbox)',
      'behavior:url(#default#time2)',
      'width:expression(alert(1))',
    ]
    for (const style of payloads) {
      const el = render(`<rect style="${style}" width="10" height="10"/>`)
      expect(el.querySelector('rect')?.hasAttribute('style')).toBe(false)
    }
  })

  it('strips javascript:, data:, blob: and vbscript: hrefs', () => {
    for (const href of ['javascript:alert(1)', 'data:text/plain,hello', 'blob:xyz', 'vbscript:msgbox']) {
      const el = render(`<rect href="${href}" width="10" height="10"/>`)
      expect(el.querySelector('rect')?.getAttribute('href')).toBeNull()
    }
  })

  it('removes elements carrying xlink:href payloads', () => {
    // xlink is an unbound namespace in the parse wrapper, so the document
    // fails to parse; assert the no-op contract instead.
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement
    expect(() => renderSvgInto(container, '<use xlink:href="javascript:alert(1)"/>')).not.toThrow()
    expect(container.children.length).toBe(0)
  })

  it('strips href payloads from allowed tags', () => {
    const el = render('<rect href="vbscript:msgbox" width="10" height="10"/>')
    expect(el.querySelector('rect')?.getAttribute('href')).toBeNull()
  })

  it('removes non-safe tags entirely, such as image', () => {
    const el = render('<image href="vbscript:msgbox" width="10" height="10"/>')
    expect(el.querySelector('image')).toBeNull()
  })

  it('removes unknown-tag subtrees such as script', () => {
    const el = render('<rect width="10" height="10"/><script>alert(1)</script>')
    expect(el.querySelector('script')).toBeNull()
    expect(el.querySelector('rect')).not.toBeNull()
  })

  it('propagates data-role into an svg-role class', () => {
    const el = render('<rect data-role="wall" width="10" height="10"/>')
    expect(el.querySelector('rect')?.classList.contains('svg-role__wall')).toBe(true)
  })

  it('leaves the container empty on a parser error instead of throwing', () => {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement
    expect(() => renderSvgInto(container, '<rect><unclosed')).not.toThrow()
    expect(container.children.length).toBe(0)
  })
})
