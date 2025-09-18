import { MineralPrice, PriceHistory, MarketSummary } from '@/types/minerals'

export const mockMinerals: MineralPrice[] = [
  // KSA Market - Precious Metals
  {
    id: 'ksa-gold-mahd',
    name: 'Gold (Mahd adh Dhahab)',
    symbol: 'AU-MDD',
    currentPrice: 7435.50,
    currency: 'SAR',
    change24h: 125.30,
    changePercent24h: 1.71,
    volume24h: 12500000,
    marketCap: 890000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Precious Metals',
    unit: 'per oz',
    location: 'Al Madinah Province',
    operator: 'Ma\'aden'
  },
  {
    id: 'ksa-gold-amar',
    name: 'Gold (Al Amar Mine)',
    symbol: 'AU-AAM',
    currentPrice: 7425.80,
    currency: 'SAR',
    change24h: 118.60,
    changePercent24h: 1.62,
    volume24h: 8900000,
    marketCap: 645000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Precious Metals',
    unit: 'per oz',
    location: 'Eastern Province',
    operator: 'Ma\'aden'
  },
  {
    id: 'ksa-silver-hajar',
    name: 'Silver (Al Hajar)',
    symbol: 'AG-AH',
    currentPrice: 94.25,
    currency: 'SAR',
    change24h: -2.15,
    changePercent24h: -2.23,
    volume24h: 8750000,
    marketCap: 45000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Precious Metals',
    unit: 'per oz',
    location: 'Al Madinah Province',
    operator: 'Ma\'aden'
  },

  // KSA Market - Base Metals
  {
    id: 'ksa-copper-sayid',
    name: 'Copper (Jabal Sayid)',
    symbol: 'CU-JS',
    currentPrice: 32.85,
    currency: 'SAR',
    change24h: 1.45,
    changePercent24h: 4.62,
    volume24h: 15600000,
    marketCap: 125000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Base Metals',
    unit: 'per lb',
    location: 'Al Madinah Province',
    operator: 'Ma\'aden'
  },
  {
    id: 'ksa-zinc-masane',
    name: 'Zinc (Al Masane)',
    symbol: 'ZN-AM',
    currentPrice: 11.24,
    currency: 'SAR',
    change24h: 0.34,
    changePercent24h: 3.12,
    volume24h: 9800000,
    marketCap: 78000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Base Metals',
    unit: 'per lb',
    location: 'Najran Province',
    operator: 'Ma\'aden'
  },
  {
    id: 'ksa-lead-masane',
    name: 'Lead (Al Masane)',
    symbol: 'PB-AM',
    currentPrice: 7.82,
    currency: 'SAR',
    change24h: -0.18,
    changePercent24h: -2.25,
    volume24h: 6500000,
    marketCap: 34000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Base Metals',
    unit: 'per lb',
    location: 'Najran Province',
    operator: 'Ma\'aden'
  },

  // KSA Market - Industrial Minerals
  {
    id: 'ksa-phosphate-jalamid',
    name: 'Phosphate Rock (Al-Jalamid)',
    symbol: 'PO4-AJ',
    currentPrice: 425.50,
    currency: 'SAR',
    change24h: 12.30,
    changePercent24h: 2.98,
    volume24h: 18750000,
    marketCap: 285000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Industrial Minerals',
    unit: 'per ton',
    location: 'Northern Borders',
    operator: 'Ma\'aden Phosphate Company'
  },
  {
    id: 'ksa-bauxite-qassim',
    name: 'Bauxite (Az Zabirah)',
    symbol: 'AL2O3-AZ',
    currentPrice: 295.75,
    currency: 'SAR',
    change24h: 8.45,
    changePercent24h: 2.94,
    volume24h: 12400000,
    marketCap: 156000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Industrial Minerals',
    unit: 'per ton',
    location: 'Al Qassim Province',
    operator: 'Ma\'aden Alumina Company'
  },
  {
    id: 'ksa-limestone-riyadh',
    name: 'Limestone (Riyadh Quarries)',
    symbol: 'LS-RQ',
    currentPrice: 85.20,
    currency: 'SAR',
    change24h: 2.10,
    changePercent24h: 2.53,
    volume24h: 25600000,
    marketCap: 45000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Construction Materials',
    unit: 'per ton',
    location: 'Riyadh Province',
    operator: 'Saudi Cement Company'
  },
  {
    id: 'ksa-gypsum-eastern',
    name: 'Gypsum (Eastern Province)',
    symbol: 'GYP-EP',
    currentPrice: 95.80,
    currency: 'SAR',
    change24h: 1.85,
    changePercent24h: 1.97,
    volume24h: 14200000,
    marketCap: 28000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Industrial Minerals',
    unit: 'per ton',
    location: 'Eastern Province',
    operator: 'Saudi Gypsum Company'
  },
  {
    id: 'ksa-iron-ore-wadi',
    name: 'Iron Ore (Wadi as Saqaym)',
    symbol: 'FE-WS',
    currentPrice: 425.60,
    currency: 'SAR',
    change24h: -8.20,
    changePercent24h: -1.89,
    volume24h: 16800000,
    marketCap: 198000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Ferrous Metals',
    unit: 'per ton',
    location: 'Ha\'il Province',
    operator: 'Ma\'aden Iron & Steel'
  },
  {
    id: 'ksa-salt-jubail',
    name: 'Salt (Jubail)',
    symbol: 'SALT-JB',
    currentPrice: 125.40,
    currency: 'SAR',
    change24h: 3.20,
    changePercent24h: 2.62,
    volume24h: 11500000,
    marketCap: 34000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Industrial Minerals',
    unit: 'per ton',
    location: 'Eastern Province',
    operator: 'SABIC Salt Company'
  },

  // KSA Market - Energy & Strategic
  {
    id: 'ksa-oil',
    name: 'Crude Oil (Arab Light)',
    symbol: 'OIL-AL',
    currentPrice: 285.60,
    currency: 'SAR',
    change24h: 4.20,
    changePercent24h: 1.49,
    volume24h: 45000000,
    marketCap: 2500000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Energy',
    unit: 'per barrel',
    location: 'Eastern Province',
    operator: 'Saudi Aramco'
  },
  {
    id: 'ksa-ree-taif',
    name: 'Rare Earth Elements (Taif)',
    symbol: 'REE-TF',
    currentPrice: 15600.25,
    currency: 'SAR',
    change24h: 485.30,
    changePercent24h: 3.21,
    volume24h: 2850000,
    marketCap: 125000000000,
    lastUpdate: new Date().toISOString(),
    market: 'KSA',
    category: 'Strategic Metals',
    unit: 'per kg',
    location: 'Mecca Province',
    operator: 'Ma\'aden REE Division'
  },
  
  // Global Market
  {
    id: 'global-gold',
    name: 'Gold',
    symbol: 'AU',
    currentPrice: 1982.50,
    currency: 'USD',
    change24h: 33.40,
    changePercent24h: 1.71,
    volume24h: 45000000,
    marketCap: 12500000000000,
    lastUpdate: new Date().toISOString(),
    market: 'Global',
    category: 'Precious Metals'
  },
  {
    id: 'global-silver',
    name: 'Silver',
    symbol: 'AG',
    currentPrice: 25.13,
    currency: 'USD',
    change24h: -0.57,
    changePercent24h: -2.23,
    volume24h: 28000000,
    marketCap: 850000000000,
    lastUpdate: new Date().toISOString(),
    market: 'Global',
    category: 'Precious Metals'
  },
  {
    id: 'global-copper',
    name: 'Copper',
    symbol: 'CU',
    currentPrice: 8.75,
    currency: 'USD',
    change24h: 0.23,
    changePercent24h: 2.66,
    volume24h: 67000000,
    marketCap: 450000000000,
    lastUpdate: new Date().toISOString(),
    market: 'Global',
    category: 'Base Metals'
  }
]

export const generateMockPriceHistory = (mineralId: string, days: number = 30): PriceHistory[] => {
  const mineral = mockMinerals.find(m => m.id === mineralId)
  if (!mineral) return []

  const history: PriceHistory[] = []
  const basePrice = mineral.currentPrice
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const volatility = Math.random() * 0.1 - 0.05
    const price = basePrice * (1 + volatility * (i / days))
    const volume = mineral.volume24h * (0.8 + Math.random() * 0.4)
    
    history.push({
      timestamp: date.toISOString(),
      price: Number(price.toFixed(2)),
      volume: Math.round(volume)
    })
  }
  
  return history
}

export const mockMarketSummary: MarketSummary = {
  totalMarketCap: 15750000000000,
  totalVolume24h: 287850000,
  marketsCount: 6,
  topGainer: mockMinerals.find(m => m.id === 'global-copper')!,
  topLoser: mockMinerals.find(m => m.id === 'global-silver')!
}