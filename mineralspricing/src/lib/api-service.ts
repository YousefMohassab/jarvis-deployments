import { MineralPrice, MetalPriceAPIResponse, MetalPriceAPISymbolsResponse } from '@/types/minerals'
import { MINERAL_CONFIGS, getMineralsByApiSource } from './mineral-config'

const METAL_PRICE_API_BASE_URL = 'https://api.metalpriceapi.com/v1'
const METAL_PRICE_API_KEY = process.env.NEXT_PUBLIC_METAL_PRICE_API_KEY || 'demo' // Replace with real API key

export class PricingAPIService {
  private cache: Map<string, { data: MineralPrice[], timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

  // MetalpriceAPI Integration
  private async fetchFromMetalPriceAPI(base: string = 'USD'): Promise<MetalPriceAPIResponse> {
    const url = `${METAL_PRICE_API_BASE_URL}/latest?api_key=${METAL_PRICE_API_KEY}&base=${base}`
    
    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      console.log('Fetching from MetalpriceAPI with key:', METAL_PRICE_API_KEY === 'demo' ? 'DEMO KEY' : 'CUSTOM KEY')
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Minerals-Pricing-Dashboard/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`MetalpriceAPI error: ${response.status} ${response.statusText}`)
      }
      
      const data: MetalPriceAPIResponse = await response.json()
      
      if (!data.success) {
        throw new Error('MetalpriceAPI returned unsuccessful response')
      }
      
      console.log('Successfully fetched data from MetalpriceAPI')
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('MetalpriceAPI request timed out after 10 seconds')
        throw new Error('API request timeout - using fallback data')
      }
      console.error('Error fetching from MetalpriceAPI:', error)
      throw error
    }
  }

  private async fetchSupportedSymbols(): Promise<MetalPriceAPISymbolsResponse> {
    const url = `${METAL_PRICE_API_BASE_URL}/symbols?api_key=${METAL_PRICE_API_KEY}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`MetalpriceAPI symbols error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching symbols from MetalpriceAPI:', error)
      throw error
    }
  }

  // Convert API data to our MineralPrice format
  private convertMetalPriceData(apiData: MetalPriceAPIResponse, market: 'KSA' | 'Global' = 'Global'): MineralPrice[] {
    const mineralPrices: MineralPrice[] = []
    
    // Get minerals that use MetalpriceAPI
    const metalPriceMinerals = getMineralsByApiSource('metalpriceapi')
    
    for (const mineral of metalPriceMinerals) {
      const rate = apiData.rates[mineral.symbol]
      if (rate) {
        // Convert rate to price per unit (MetalpriceAPI gives rates relative to base currency)
        const price = apiData.base === 'USD' ? (1 / rate) * 100 : rate * 100 // Convert to more readable prices
        
        const mineralPrice: MineralPrice = {
          id: mineral.id,
          name: mineral.name,
          symbol: mineral.symbol,
          currentPrice: price,
          currency: apiData.base,
          change24h: Math.random() * 20 - 10, // Simulated - real API would need historical comparison
          changePercent24h: Math.random() * 4 - 2, // Simulated
          volume24h: Math.random() * 1000000,
          marketCap: Math.random() * 10000000,
          lastUpdate: new Date(apiData.timestamp * 1000).toISOString(),
          market: mineral.defaultMarket,
          category: mineral.category,
          unit: mineral.unit,
          location: mineral.location,
          operator: mineral.operator,
          exchange: mineral.exchange,
          high24h: price * (1 + Math.random() * 0.02),
          low24h: price * (1 - Math.random() * 0.02),
          open24h: price * (1 + (Math.random() - 0.5) * 0.01),
          close24h: price
        }
        
        mineralPrices.push(mineralPrice)
      }
    }
    
    return mineralPrices
  }

  // Generate mock data for minerals not available via API
  private generateMockData(): MineralPrice[] {
    const mockMinerals = MINERAL_CONFIGS.filter(m => m.apiSource === 'manual')
    
    return mockMinerals.map(mineral => {
      const basePrice = this.getBasePriceForMineral(mineral.symbol)
      const currentPrice = basePrice * (0.95 + Math.random() * 0.1)
      
      return {
        id: mineral.id,
        name: mineral.name,
        symbol: mineral.symbol,
        currentPrice,
        currency: 'USD',
        change24h: (Math.random() - 0.5) * 50,
        changePercent24h: (Math.random() - 0.5) * 5,
        volume24h: Math.random() * 10000000,
        marketCap: Math.random() * 100000000,
        lastUpdate: new Date().toISOString(),
        market: mineral.defaultMarket,
        category: mineral.category,
        unit: mineral.unit,
        location: mineral.location,
        operator: mineral.operator,
        exchange: mineral.exchange,
        high24h: currentPrice * (1 + Math.random() * 0.03),
        low24h: currentPrice * (1 - Math.random() * 0.03),
        open24h: currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        close24h: currentPrice
      }
    })
  }

  private getBasePriceForMineral(symbol: string): number {
    // Base prices for realistic mock data
    const basePrices: Record<string, number> = {
      // Energy
      'BRT': 75, 'WTI': 73, 'NG': 3.5, 'COL': 120, 'URA': 45,
      // Rare Earth Elements
      'LIT': 25000, 'COB': 35, 'NEO': 120, 'CER': 2.5, 'LAN': 3.2,
      // Industrial Minerals
      'TIT': 12000, 'TUN': 320, 'MOL': 19, 'GRA': 800, 'SIL': 2100,
      'IRO': 110, 'RH': 12000,
      // Agricultural
      'PHO': 180, 'POT': 280, 'SUL': 150,
      // KSA-Specific Minerals
      'AUMHD': 2050, 'AUSUK': 2045, 'AGJSY': 24, 'CUJSY': 8500, 'ZNJSY': 2800,
      'PHJALM': 175, 'BXBTH': 180, 'ALBTH': 2200, 'KAOZLF': 95, 'FELHL': 120,
      'MGSAB': 250, 'GYPAD': 18, 'LIMKH': 35, 'SALJUB': 25
    }
    
    return basePrices[symbol] || 100
  }

  // Main method to fetch all mineral prices
  async getAllMineralPrices(forceRefresh: boolean = false): Promise<MineralPrice[]> {
    const cacheKey = 'all_minerals'
    const cachedData = this.cache.get(cacheKey)
    
    // Return cached data if available and not expired
    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached mineral data')
      return cachedData.data
    }

    console.log('Loading mineral pricing data...')
    
    // Start with mock data immediately to ensure fast loading
    const mockData = this.generateMockData()
    const allMinerals: MineralPrice[] = [...mockData]

    // Try to fetch real API data with timeout protection (restored)
    try {
      console.log('Attempting to fetch real-time data from MetalpriceAPI...')
      const metalPriceData = await Promise.race([
        this.fetchFromMetalPriceAPI('USD'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 5000) // 5 second timeout
        )
      ])
      
      const realMetalPrices = this.convertMetalPriceData(metalPriceData)
      
      // Replace mock data with real data where available
      realMetalPrices.forEach(realPrice => {
        const mockIndex = allMinerals.findIndex(mock => mock.id === realPrice.id)
        if (mockIndex !== -1) {
          allMinerals[mockIndex] = realPrice
        } else {
          allMinerals.push(realPrice)
        }
      })
      
      console.log(`✅ Updated ${realMetalPrices.length} minerals with real-time data`)
    } catch (error) {
      console.warn('⚠️ Using mock data only - API unavailable:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Cache the results
    this.cache.set(cacheKey, {
      data: allMinerals,
      timestamp: Date.now()
    })

    console.log(`📊 Total minerals loaded: ${allMinerals.length} (${allMinerals.filter(m => m.market === 'KSA').length} KSA, ${allMinerals.filter(m => m.market === 'Global').length} Global)`)
    return allMinerals
  }

  // Get prices for specific minerals
  async getMineralPricesByIds(ids: string[]): Promise<MineralPrice[]> {
    const allPrices = await this.getAllMineralPrices()
    return allPrices.filter(price => ids.includes(price.id))
  }

  // Get prices by market
  async getMineralPricesByMarket(market: 'KSA' | 'Global'): Promise<MineralPrice[]> {
    const allPrices = await this.getAllMineralPrices()
    return allPrices.filter(price => price.market === market)
  }

  // Get prices by category
  async getMineralPricesByCategory(category: string): Promise<MineralPrice[]> {
    const allPrices = await this.getAllMineralPrices()
    return allPrices.filter(price => price.category === category)
  }

  // Check API health
  async checkAPIHealth(): Promise<{ metalpriceapi: boolean }> {
    const health = { metalpriceapi: false }
    
    try {
      await this.fetchFromMetalPriceAPI('USD')
      health.metalpriceapi = true
    } catch {
      health.metalpriceapi = false
    }

    return health
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }
}

// Singleton instance
export const pricingAPIService = new PricingAPIService()