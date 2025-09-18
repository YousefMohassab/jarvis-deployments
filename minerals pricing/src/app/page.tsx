'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { pricingAPIService } from '@/lib/api-service'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { MineralPrice } from '@/types/minerals'
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const [minerals, setMinerals] = useState<MineralPrice[]>([])
  const [selectedMarket, setSelectedMarket] = useState<'all' | 'KSA' | 'Global'>('all')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  // Fetch initial data
  const fetchMinerals = async (forceRefresh: boolean = false) => {
    console.log('🔄 Starting fetchMinerals, forceRefresh:', forceRefresh)
    try {
      setLoading(true)
      setError(null)
      
      console.log('📡 Calling API service...')
      // Add timeout protection
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('API call timeout after 15 seconds')), 15000)
      )
      
      const data = await Promise.race([
        pricingAPIService.getAllMineralPrices(forceRefresh),
        timeoutPromise
      ])
      
      console.log('✅ API service returned data:', data.length, 'minerals')
      setMinerals(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('❌ Failed to fetch minerals:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to load mineral prices: ${errorMessage}`)
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }

  // Load mineral data with timeout protection  
  useEffect(() => {
    console.log('🚀 Component mounted, loading mineral data...')
    
    // Load data with fallback protection
    fetchMinerals()
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMinerals(true) // Force refresh to get latest data
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const handleRefresh = () => {
    fetchMinerals(true)
  }

  const filteredMinerals = selectedMarket === 'all' ? minerals : minerals.filter(m => m.market === selectedMarket)

  // Calculate market summary from actual data
  const marketSummary = {
    totalMarketCap: minerals.reduce((sum, mineral) => sum + (mineral.marketCap || 0), 0),
    totalVolume24h: minerals.reduce((sum, mineral) => sum + (mineral.volume24h || 0), 0),
    marketsCount: new Set(minerals.map(m => m.market)).size,
    topGainer: minerals.reduce((max, mineral) => 
      (mineral.changePercent24h > (max.changePercent24h || 0)) ? mineral : max, minerals[0] || {} as MineralPrice),
    topLoser: minerals.reduce((min, mineral) => 
      (mineral.changePercent24h < (min.changePercent24h || 0)) ? mineral : min, minerals[0] || {} as MineralPrice)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
        {/* Saudi Government Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-100">🇸🇦</div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Ministry of Industry and Mineral Resources</h1>
                  <p className="text-emerald-100 text-sm">وزارة الصناعة والثروة المعدنية</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Kingdom of Saudi Arabia</p>
                <p className="text-emerald-100 text-xs">المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-emerald-200">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
              <p className="text-emerald-800 font-medium text-lg mb-2">Loading mineral pricing data...</p>
              <p className="text-emerald-600 text-sm">جاري تحميل بيانات أسعار المعادن</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
        {/* Saudi Government Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-100">🇸🇦</div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Ministry of Industry and Mineral Resources</h1>
                  <p className="text-emerald-100 text-sm">وزارة الصناعة والثروة المعدنية</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Kingdom of Saudi Arabia</p>
                <p className="text-emerald-100 text-xs">المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
                <p className="font-medium">{error}</p>
                <p className="text-sm text-red-600 mt-1">خطأ في تحميل البيانات</p>
              </div>
              <Button onClick={handleRefresh} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again | حاول مرة أخرى
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      {/* Saudi Government Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold text-emerald-100">🇸🇦</div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ministry of Industry and Mineral Resources</h1>
                <p className="text-emerald-100 text-sm">وزارة الصناعة والثروة المعدنية</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Kingdom of Saudi Arabia</p>
              <p className="text-emerald-100 text-xs">المملكة العربية السعودية</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-8 p-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-emerald-900">Minerals Pricing Dashboard</h1>
              </div>
              <p className="text-emerald-700 font-medium">نظام أسعار المعادن في الوقت الفعلي</p>
              <p className="text-emerald-600">Real-time pricing for KSA and global mineral markets</p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-emerald-600">Last updated: {formatDate(lastUpdate)}</p>
              </div>
            </div>
          <div className="flex gap-4">
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              API Config | إعدادات
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh | تحديث
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => window.location.href = '/reports'}
            >
              📊 Reports | التقارير
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => window.location.href = '/alerts'}
            >
              🔔 Alerts | التنبيهات
            </Button>
          </div>
        </div>

        {/* Market Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-700">Total Market Cap</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(marketSummary.totalMarketCap)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-700">24h Volume</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(marketSummary.totalVolume24h)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-700">Top Gainer</p>
                <p className="text-lg font-bold text-emerald-900">{marketSummary.topGainer?.name || 'N/A'}</p>
                <p className="text-sm text-green-600">+{(marketSummary.topGainer?.changePercent24h || 0).toFixed(2)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-700">Markets</p>
                <p className="text-2xl font-bold text-emerald-900">{marketSummary.marketsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Filter */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Market Filter</h3>
                <p className="text-sm text-emerald-600">تصفية الأسواق - Filter by market region</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button 
                className={selectedMarket === 'all' ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}
                variant={selectedMarket === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('all')}
              >
                All Markets | جميع الأسواق
              </Button>
              <Button 
                className={selectedMarket === 'KSA' ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}
                variant={selectedMarket === 'KSA' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('KSA')}
              >
                🇸🇦 KSA Market | السوق السعودي
              </Button>
              <Button 
                className={selectedMarket === 'Global' ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}
                variant={selectedMarket === 'Global' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('Global')}
              >
                🌍 Global Market | السوق العالمي
              </Button>
            </div>
          </div>
        </div>

        {/* Minerals Table */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-900">Live Pricing | الأسعار المباشرة</h2>
                <p className="text-sm text-emerald-700">Real-time mineral commodity prices</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-700 font-medium">Live Data</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Mineral | المعدن
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Market | السوق
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Price | السعر
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    24h Change | التغيير
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Volume | الحجم
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Category | الفئة
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Unit | الوحدة
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Location | الموقع
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Operator | المشغل
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-emerald-100">
                {filteredMinerals.map((mineral) => (
                  <tr key={mineral.id} className="hover:bg-emerald-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-emerald-900">{mineral.name}</div>
                        <div className="text-sm text-emerald-600 ml-2 font-medium">({mineral.symbol})</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                        mineral.market === 'KSA' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {mineral.market === 'KSA' ? '🇸🇦 KSA' : '🌍 Global'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-900">
                      {formatCurrency(mineral.currentPrice, mineral.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center font-bold ${
                        mineral.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mineral.changePercent24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        <span>{mineral.changePercent24h >= 0 ? '+' : ''}{mineral.changePercent24h.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-800">
                      {formatCurrency(mineral.volume24h, mineral.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {mineral.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-emerald-800">
                        {mineral.unit || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-emerald-700">
                        {mineral.location || 'Global'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-emerald-700">
                        {mineral.operator || 'International'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* API Configuration Modal */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>API Configuration</DialogTitle>
              <DialogDescription>
                Manage the data sources and APIs used for mineral pricing data
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* API Sources Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Sources</h3>
                <div className="space-y-4">
                  
                  {/* MetalpriceAPI */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-medium">MetalpriceAPI</h4>
                        <p className="text-sm text-gray-500">Real-time precious metals pricing</p>
                        <p className="text-xs text-gray-400">Status: Active • Last updated: {formatDate(lastUpdate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Connected
                      </span>
                    </div>
                  </div>

                  {/* Mock Data Fallback */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                      <div>
                        <h4 className="font-medium">Mock Data (Fallback)</h4>
                        <p className="text-sm text-gray-500">Synthetic data for testing and fallback</p>
                        <p className="text-xs text-gray-400">Status: Standby • Used when APIs fail</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Standby
                      </span>
                    </div>
                  </div>

                  {/* Alpha Vantage (Future) */}
                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-6 w-6 text-gray-400" />
                      <div>
                        <h4 className="font-medium">Alpha Vantage</h4>
                        <p className="text-sm text-gray-500">Commodities and financial data</p>
                        <p className="text-xs text-gray-400">Status: Not configured</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Planned
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Configuration Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Auto Refresh</label>
                      <p className="text-sm text-gray-500">Automatically refresh data every 5 minutes</p>
                    </div>
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Cache Duration</label>
                      <p className="text-sm text-gray-500">How long to cache API responses</p>
                    </div>
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                      5 minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Fallback Mode</label>
                      <p className="text-sm text-gray-500">Use mock data when APIs are unavailable</p>
                    </div>
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>

              {/* API Health Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{minerals.length}</div>
                    <div className="text-sm text-gray-600">Active Minerals</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1</div>
                    <div className="text-sm text-gray-600">API Sources</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Close
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

