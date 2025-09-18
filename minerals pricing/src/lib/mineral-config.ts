import { MineralConfig } from '@/types/minerals'

// Comprehensive mineral configuration for real-time pricing
export const MINERAL_CONFIGS: MineralConfig[] = [
  // Precious Metals
  {
    id: 'gold',
    name: 'Gold',
    symbol: 'XAU',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'COMEX',
    description: 'Most traded precious metal, store of value'
  },
  {
    id: 'silver',
    name: 'Silver',
    symbol: 'XAG',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'COMEX',
    description: 'Industrial and investment precious metal'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    symbol: 'XPT',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'NYMEX',
    description: 'Automotive and jewelry precious metal'
  },
  {
    id: 'palladium',
    name: 'Palladium',
    symbol: 'XPD',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'NYMEX',
    description: 'Industrial precious metal, catalytic converters'
  },
  {
    id: 'rhodium',
    name: 'Rhodium',
    symbol: 'RH',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Rarest precious metal, automotive catalysts'
  },

  // Base Metals
  {
    id: 'copper',
    name: 'Copper',
    symbol: 'XCU',
    category: 'Base Metals',
    unit: 'pound',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Industrial metal, electrical conductivity'
  },
  {
    id: 'aluminum',
    name: 'Aluminum',
    symbol: 'ALU',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Lightweight metal, construction and aerospace'
  },
  {
    id: 'zinc',
    name: 'Zinc',
    symbol: 'ZNC',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Galvanizing steel, corrosion protection'
  },
  {
    id: 'lead',
    name: 'Lead',
    symbol: 'LEA',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Batteries, radiation shielding'
  },
  {
    id: 'nickel',
    name: 'Nickel',
    symbol: 'NIC',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Stainless steel production, batteries'
  },
  {
    id: 'tin',
    name: 'Tin',
    symbol: 'TIN',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'metalpriceapi',
    defaultMarket: 'Global',
    exchange: 'LME',
    description: 'Soldering, food packaging'
  },
  {
    id: 'iron-ore',
    name: 'Iron Ore',
    symbol: 'IRO',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Steel production raw material'
  },

  // Energy Commodities
  {
    id: 'crude-oil-brent',
    name: 'Brent Crude Oil',
    symbol: 'BRT',
    category: 'Energy',
    unit: 'barrel',
    apiSource: 'manual',
    defaultMarket: 'Global',
    exchange: 'ICE',
    description: 'Global oil benchmark'
  },
  {
    id: 'crude-oil-wti',
    name: 'WTI Crude Oil',
    symbol: 'WTI',
    category: 'Energy',
    unit: 'barrel',
    apiSource: 'manual',
    defaultMarket: 'Global',
    exchange: 'NYMEX',
    description: 'US oil benchmark'
  },
  {
    id: 'natural-gas',
    name: 'Natural Gas',
    symbol: 'NG',
    category: 'Energy',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    exchange: 'NYMEX',
    description: 'Clean burning fossil fuel'
  },
  {
    id: 'coal',
    name: 'Coal',
    symbol: 'COL',
    category: 'Energy',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Thermal power generation'
  },
  {
    id: 'uranium',
    name: 'Uranium',
    symbol: 'URA',
    category: 'Energy',
    unit: 'pound',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Nuclear power fuel'
  },

  // Industrial Minerals & Rare Earth Elements
  {
    id: 'lithium',
    name: 'Lithium',
    symbol: 'LIT',
    category: 'Rare Earth Elements',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Battery production, EV industry'
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    symbol: 'COB',
    category: 'Rare Earth Elements',
    unit: 'pound',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Battery cathodes, aerospace alloys'
  },
  {
    id: 'titanium',
    name: 'Titanium',
    symbol: 'TIT',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Aerospace, medical implants'
  },
  {
    id: 'tungsten',
    name: 'Tungsten',
    symbol: 'TUN',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Steel hardening, electronics'
  },
  {
    id: 'molybdenum',
    name: 'Molybdenum',
    symbol: 'MOL',
    category: 'Industrial Minerals',
    unit: 'pound',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Steel alloys, catalysts'
  },
  {
    id: 'neodymium',
    name: 'Neodymium',
    symbol: 'NEO',
    category: 'Rare Earth Elements',
    unit: 'kilogram',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Permanent magnets, wind turbines'
  },
  {
    id: 'cerium',
    name: 'Cerium',
    symbol: 'CER',
    category: 'Rare Earth Elements',
    unit: 'kilogram',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Catalysts, glass polishing'
  },
  {
    id: 'lanthanum',
    name: 'Lanthanum',
    symbol: 'LAN',
    category: 'Rare Earth Elements',
    unit: 'kilogram',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Battery electrodes, optics'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    symbol: 'GRA',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Battery anodes, steel production'
  },
  {
    id: 'silicon',
    name: 'Silicon',
    symbol: 'SIL',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Semiconductors, solar panels'
  },

  // Agricultural Commodities (Mining-Related)
  {
    id: 'phosphate',
    name: 'Phosphate Rock',
    symbol: 'PHO',
    category: 'Agricultural Commodities',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    description: 'Fertilizer production'
  },
  {
    id: 'potash',
    name: 'Potash',
    symbol: 'POT',
    category: 'Agricultural Commodities',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'Global',
    description: 'Fertilizer, potassium source'
  },
  {
    id: 'sulfur',
    name: 'Sulfur',
    symbol: 'SUL',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    description: 'Chemical production, fertilizers'
  },

  // KSA-Specific Minerals (14 minerals across 7 provinces)
  {
    id: 'gold-mahd-dahab',
    name: 'Gold (Mahd adh Dhahab)',
    symbol: 'AUMHD',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Medina Province',
    operator: 'Saudi Arabian Mining Company (Ma\'aden)',
    description: 'Historic gold mine in Medina Province'
  },
  {
    id: 'gold-sukhaybarat',
    name: 'Gold (As Sukhaybarat)',
    symbol: 'AUSUK',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Qassim Province',
    operator: 'Saudi Arabian Mining Company (Ma\'aden)',
    description: 'Gold deposit in Qassim Province'
  },
  {
    id: 'silver-jabal-sayid',
    name: 'Silver (Jabal Sayid)',
    symbol: 'AGJSY',
    category: 'Precious Metals',
    unit: 'troy_oz',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Medina Province',
    operator: 'Aqua Power',
    description: 'Silver mine in Medina Province'
  },
  {
    id: 'copper-jabal-sayid',
    name: 'Copper (Jabal Sayid)',
    symbol: 'CUJSY',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Medina Province',
    operator: 'Aqua Power',
    description: 'Copper mining operation in Medina Province'
  },
  {
    id: 'zinc-jabal-sayid',
    name: 'Zinc (Jabal Sayid)',
    symbol: 'ZNJSY',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Medina Province',
    operator: 'Aqua Power',
    description: 'Zinc mining operation in Medina Province'
  },
  {
    id: 'phosphate-al-jalamid',
    name: 'Phosphate (Al Jalamid)',
    symbol: 'PHJALM',
    category: 'Agricultural Commodities',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Northern Borders Province',
    operator: 'Saudi Arabian Mining Company (Ma\'aden)',
    description: 'Phosphate rock mining in Northern Borders'
  },
  {
    id: 'bauxite-al-baitha',
    name: 'Bauxite (Al Ba\'itha)',
    symbol: 'BXBTH',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Ha\'il Province',
    operator: 'Saudi Arabian Mining Company (Ma\'aden)',
    description: 'Bauxite mining for aluminum production'
  },
  {
    id: 'aluminum-al-baitha',
    name: 'Aluminum (Al Ba\'itha)',
    symbol: 'ALBTH',
    category: 'Base Metals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Ha\'il Province',
    operator: 'Saudi Arabian Mining Company (Ma\'aden)',
    description: 'Aluminum smelting facility'
  },
  {
    id: 'kaolin-al-zulfi',
    name: 'Kaolin (Al Zulfi)',
    symbol: 'KAOZLF',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Riyadh Province',
    operator: 'Saudi Ceramic Company',
    description: 'High-quality kaolin for ceramics industry'
  },
  {
    id: 'feldspar-hail',
    name: 'Feldspar (Ha\'il)',
    symbol: 'FELHL',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Ha\'il Province',
    operator: 'Saudi Industrial Development Fund',
    description: 'Feldspar mining for glass and ceramics'
  },
  {
    id: 'magnesite-saber',
    name: 'Magnesite (Saber)',
    symbol: 'MGSAB',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Asir Province',
    operator: 'Saudi Basic Industries Corporation (SABIC)',
    description: 'Magnesite for refractory materials'
  },
  {
    id: 'gypsum-ain-dar',
    name: 'Gypsum (Ain Dar)',
    symbol: 'GYPAD',
    category: 'Construction Materials',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Eastern Province',
    operator: 'Saudi Gypsum Industries',
    description: 'Gypsum for construction and cement industry'
  },
  {
    id: 'limestone-makkah',
    name: 'Limestone (Makkah)',
    symbol: 'LIMKH',
    category: 'Construction Materials',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Makkah Province',
    operator: 'Saudi Cement Company',
    description: 'High-grade limestone for cement production'
  },
  {
    id: 'salt-jubail',
    name: 'Salt (Jubail)',
    symbol: 'SALJUB',
    category: 'Industrial Minerals',
    unit: 'tonne',
    apiSource: 'manual',
    defaultMarket: 'KSA',
    location: 'Eastern Province',
    operator: 'Saudi Basic Industries Corporation (SABIC)',
    description: 'Industrial salt production in Jubail'
  }
]

export const getMineralsByCategory = (category: string) => {
  return MINERAL_CONFIGS.filter(mineral => mineral.category === category)
}

export const getMineralsByMarket = (market: 'KSA' | 'Global') => {
  return MINERAL_CONFIGS.filter(mineral => mineral.defaultMarket === market)
}

export const getMineralsByApiSource = (apiSource: string) => {
  return MINERAL_CONFIGS.filter(mineral => mineral.apiSource === apiSource)
}

export const getMineralById = (id: string) => {
  return MINERAL_CONFIGS.find(mineral => mineral.id === id)
}