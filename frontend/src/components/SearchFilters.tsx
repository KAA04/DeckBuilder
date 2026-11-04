import type { CardType, Color } from '../types'

export interface SearchValues { search: string; type: string; color: string; set_name: string; sort: string }

export function SearchFilters({ values, onChange }: { values: SearchValues; onChange: (values: SearchValues) => void }) {
  const update = (key: keyof SearchValues, value: string) => onChange({ ...values, [key]: value })
  return <div className="filters">
    <label className="search-box"><span>Sniff out a card</span><input value={values.search} onChange={(event) => update('search', event.target.value)} placeholder="Name, keyword, or creature..." /></label>
    <div className="filter-grid">
      <select aria-label="Card type" value={values.type} onChange={(event) => update('type', event.target.value)}><option value="">All card kinds</option>{(['LEADER', 'CREATURE', 'HABITAT', 'TRINKET', 'SPELL_MAIN', 'SPELL_INTERUPT'] as CardType[]).map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select>
      <select aria-label="Color" value={values.color} onChange={(event) => update('color', event.target.value)}><option value="">All colors</option>{(['RED', 'PURPLE', 'BLUE', 'GREEN', 'YELLOW'] as Color[]).map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <input aria-label="Set" value={values.set_name} onChange={(event) => update('set_name', event.target.value)} placeholder="Habitat set" />
      <select aria-label="Sort" value={values.sort} onChange={(event) => update('sort', event.target.value)}><option value="name">Sort: name</option><option value="type">Sort: type</option><option value="set_name">Sort: set</option><option value="number">Sort: number</option></select>
    </div>
  </div>
}
