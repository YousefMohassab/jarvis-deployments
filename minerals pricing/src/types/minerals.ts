export interface MineralPrice {
  id: string
  name: string
  symbol: string
  currentPrice: number
  currency: string
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap: number
  lastUpdate: string
  market: 'KSA' | 'Global'
  category: 'Precious Metals' | 'Base Metals' | 'Energy' | 'Industrial Minerals' | 'Rare Earth Elements' | 'Agricultural Commodities' | 'Construction Materials' | 'Ferrous Metals' | 'Strategic Metals'
  unit?: string
  location?: string
  operator?: string
  exchange?: string
  high24h?: number
  low24h?: number
  open24h?: number
  close24h?: number
}

export interface PriceHistory {
  timestamp: string
  price: number
  volume: number
}

export interface MarketSummary {
  totalMarketCap: number
  totalVolume24h: number
  marketsCount: number
  topGainer: MineralPrice
  topLoser: MineralPrice
}

export interface ReportData {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dateRange: {
    start: string
    end: string
  }
  minerals: string[]
  markets: ('KSA' | 'Global')[]
  createdAt: string
  status: 'generating' | 'completed' | 'failed'
  downloadUrl?: string
}

// API Response Types
export interface MetalPriceAPIResponse {
  success: boolean
  base: string
  timestamp: number
  rates: Record<string, number>
}

export interface MetalPriceAPISymbolsResponse {
  success: boolean
  symbols: Record<string, string>
}

export interface MineralConfig {
  id: string
  name: string
  symbol: string
  category: MineralPrice['category']
  unit: MineralPrice['unit']
  apiSource: 'metalpriceapi' | 'alpha_vantage' | 'manual'
  defaultMarket: 'KSA' | 'Global'
  location?: string
  operator?: string
  exchange?: string
  description?: string
}