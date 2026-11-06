/*
 * The win: cards leave the piles one by one and bounce off the bottom of the
 * screen. The canvas is never cleared, so each leaves its path drawn behind it.
 */
const STEP = 1000 / 60
const GRAVITY = 0.5
const LAUNCH_EVERY = 14
const FADE = 600

/** The mark as .card::before crops it; the paths are read off the stage's copy, so they aren't kept twice. */
function drawMark(ctx: CanvasRenderingContext2D, el: HTMLElement, box: DOMRect, color: string) {
  const size = box.height * 1.54
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = Number(getComputedStyle(el, '::before').opacity)
  ctx.translate(box.width - size * 0.533, box.height * 0.46 - size / 2)
  ctx.scale(size / 446.89362, size / 446.89362)
  // SiteMarkGlyph's two group transforms, multiplied.
  ctx.transform(1.8014244, 0, 0, 1.8014244, -9.57371, -7.153538)
  for (const part of ['.glyph-ring', '.glyph-a']) {
    const d = document.querySelector(part)?.getAttribute('d')
    if (d) ctx.fill(new Path2D(d))
  }
  ctx.restore()
}

/** A card as it looks on the table, ready to stamp over and over. */
function stampOf(el: HTMLElement, dpr: number) {
  const style = getComputedStyle(el)
  const box = el.getBoundingClientRect()
  const stamp = document.createElement('canvas')
  stamp.width = box.width * dpr
  stamp.height = box.height * dpr
  const ctx = stamp.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.fillStyle = style.backgroundColor
  ctx.fillRect(0, 0, box.width, box.height)
  drawMark(ctx, el, box, style.color)
  // The stage's gap around a card, which is what makes the path read as cards.
  ctx.strokeStyle = style.outlineColor
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, box.width, box.height)
  ctx.strokeStyle = style.getPropertyValue('--card-edge')
  ctx.lineWidth = 1.5
  ctx.strokeRect(1.75, 1.75, box.width - 3.5, box.height - 3.5)
  const code = el.dataset.card!
  const size = parseFloat(style.fontSize)
  const x = parseFloat(style.paddingLeft)
  const y = parseFloat(style.paddingTop)
  ctx.fillStyle = style.color
  ctx.textBaseline = 'top'
  ctx.font = `700 ${size}px ${style.fontFamily}`
  ctx.fillText(code[0]!, x, y)
  const after = ctx.measureText(code[0]!).width
  ctx.font = `400 ${size}px ${style.fontFamily}`
  ctx.fillText(code.slice(1), x + after, y)
  return { stamp, box }
}

/** Starts the cascade and returns how to stop it; `done` runs once it has faded. */
export function bounceCards(canvas: HTMLCanvasElement, cards: HTMLElement[], done: () => void) {
  const dpr = Math.min(devicePixelRatio, 2)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const waiting = cards.map((el) => stampOf(el, dpr))
  const flying: { stamp: HTMLCanvasElement, x: number, y: number, w: number, h: number, vx: number, vy: number, bounce: number }[] = []
  let sinceLaunch = LAUNCH_EVERY
  let last = performance.now()
  let owed = 0
  let frame = requestAnimationFrame(tick)

  function step() {
    if (++sinceLaunch >= LAUNCH_EVERY && waiting.length) {
      sinceLaunch = 0
      const { stamp, box } = waiting.shift()!
      // Toward the far side, crossing the screen in the same time on any screen.
      const way = box.left + box.width / 2 > width / 2 ? -1 : 1
      flying.push({
        stamp,
        x: box.left,
        y: box.top,
        w: box.width,
        h: box.height,
        vx: way * width / (140 + Math.random() * 100),
        vy: -Math.random() * 8,
        bounce: 0.72 + Math.random() * 0.14,
      })
    }
    for (let i = flying.length - 1; i >= 0; i--) {
      const card = flying[i]!
      card.vy += GRAVITY
      card.x += card.vx
      card.y += card.vy
      if (card.y + card.h > height) {
        card.y = height - card.h
        card.vy *= -card.bounce
      }
      if (card.x + card.w < 0 || card.x > width) flying.splice(i, 1)
      else ctx.drawImage(card.stamp, card.x, card.y, card.w, card.h)
    }
  }

  function tick(now: number) {
    // Steps, not frames: the same path at any refresh rate, and no leap after a hidden tab.
    owed = Math.min(owed + now - last, STEP * 4)
    last = now
    while (owed >= STEP) {
      step()
      owed -= STEP
    }
    if (waiting.length || flying.length) frame = requestAnimationFrame(tick)
    else canvas.animate({ opacity: [1, 0] }, { duration: FADE, fill: 'forwards' }).onfinish = done
  }

  return () => cancelAnimationFrame(frame)
}
