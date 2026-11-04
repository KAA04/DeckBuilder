export type CardType = 'LEADER' | 'CREATURE' | 'HABITAT' | 'TRINKET' | 'SPELL_MAIN' | 'SPELL_INTERUPT'
export type Color = 'RED' | 'PURPLE' | 'BLUE' | 'GREEN' | 'YELLOW'

export interface Card {
  id: number
  name: string
  text: string | null
  color1: Color | null
  color2: Color | null
  type: CardType
  health: number | null
  power: number | null
  defense: number | null
  cost: number | null
  set_name: string
  number: number
  image_url: string | null
}

export interface DeckCard {
  card_id: number
  quantity: number
  cards: Card
}

export interface Deck {
  id: string
  user_id: string
  name: string
  description: string | null
  card_count: number
  cards?: DeckCard[]
}

export interface Profile {
  id: string
  username: string
  role: 'USER' | 'ADMIN'
}

export interface CardsResponse {
  cards: Card[]
  page: number
  limit: number
  total: number
  has_more: boolean
}
