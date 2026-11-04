import { MAX_DECK_SIZE, type DeckCard } from '../types'

const SHEET_WIDTH = 7500
const SHEET_HEIGHT = 7350
const COLUMNS = 10
const ROWS = 7
const CARD_WIDTH = SHEET_WIDTH / COLUMNS
const CARD_HEIGHT = SHEET_HEIGHT / ROWS

function drawFallbackCard(context: CanvasRenderingContext2D, item: DeckCard, x: number, y: number) {
  context.fillStyle = '#f0c98e'
  context.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT)
  context.strokeStyle = '#39754b'
  context.lineWidth = 3
  context.strokeRect(x + 2, y + 2, CARD_WIDTH - 4, CARD_HEIGHT - 4)
  context.fillStyle = '#3d3026'
  context.font = '700 8px Arial'
  context.fillText(item.cards.name.slice(0, 18), x + 5, y + 14)
  context.font = '600 7px Arial'
  context.fillText(item.cards.type.replace('_', ' '), x + 5, y + 27)
  context.fillStyle = '#dce8c8'
  context.fillRect(x + 5, y + 34, CARD_WIDTH - 10, 38)
  context.fillStyle = '#775b40'
  context.font = '7px Arial'
  const text = item.cards.text || 'Critter card'
  context.fillText(text.slice(0, 21), x + 5, y + 83)
  context.fillText(text.slice(21, 42), x + 5, y + 92)
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load card image: ${url}`))
    image.src = url
  })
}

export async function exportDeckImage(deckName: string, deckCards: DeckCard[]) {
  const canvas = document.createElement('canvas')
  canvas.width = SHEET_WIDTH
  canvas.height = SHEET_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser does not support image export.')

  context.fillStyle = '#000'
  context.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT)

  const copies = deckCards.flatMap((item) => Array.from({ length: item.quantity }, () => item))
  for (const [index, item] of copies.slice(0, MAX_DECK_SIZE).entries()) {
    const column = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const x = column * CARD_WIDTH
    const y = row * CARD_HEIGHT
    if (!item.cards.image_url) {
      drawFallbackCard(context, item, x, y)
      continue
    }
    try {
      const image = await loadImage(item.cards.image_url)
      context.drawImage(image, x, y, CARD_WIDTH, CARD_HEIGHT)
    } catch {
      drawFallbackCard(context, item, x, y)
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('The deck image could not be created.')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${deckName.trim() || 'deck'}.png`
  link.click()
  URL.revokeObjectURL(url)
}
