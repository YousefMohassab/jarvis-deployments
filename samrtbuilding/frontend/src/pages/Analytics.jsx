import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { energyService } from '../services/energyService'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const MetricCard = ({ title, value, unit, change, icon: Icon, color = 'primary' }) => {
  const isPositive = change >= 0
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    blue: 'bg-blue-500/10 text-blue-500',
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">
            {value}
            <span className="text-lg text-muted-foreground ml-1">{unit}</span>
          </p>
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
            <ArrowTrendingUpIcon
              className={`w-4 h-4 ${!isPositive && 'rotate-180'}`}
            />
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['consumptionTrends', selectedPeriod],
    queryFn: () => analyticsService.getConsumptionTrends(selectedPeriod),
  })

  const { data: efficiency, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['efficiencyMetrics'],
    queryFn: analyticsService.getEfficiencyMetrics,
  })

  const { data: costAnalysis, isLoading: costLoading } = useQuery({
    queryKey: ['costAnalysis', dateRange],
    queryFn: () => analyticsService.getCostAnalysis(dateRange.startDate, dateRange.endDate),
  })

  const { data: peakDemand, isLoading: peakLoading } = useQuery({
    queryKey: ['peakDemand'],
    queryFn: analyticsService.getPeakDemandAnalysis,
  })

  const handleGenerateReport = async (reportType) => {
    setIsGeneratingReport(true)
    try {
      await analyticsService.generateReport(reportType, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period: selectedPeriod,
      })
      toast.success('Report generated successfully! Check your downloads.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (trendsLoading || efficiencyLoading || costLoading || peakLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const trendChartData = trends?.data?.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    consumption: item.consumption,
    cost: item.cost,
    target: item.target,
  })) || []

  const costBreakdownData = costAnalysis?.breakdown?.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: COLORS[index % COLORS.length],
  })) || []

  const peakHoursData = peakDemand?.hourlyData?.map((item) => ({
    hour: item.hour,
    demand: item.demand,
    isPeak: item.demand === peakDemand?.maxDemand,
  })) || []

  const efficiencyScore = efficiency?.overallScore || 0
  const efficiencyColor = efficiencyScore >= 80 ? 'green' : efficiencyScore >= 60 ? 'orange' : 'destructive'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive energy consumption and cost analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleGenerateReport('consumption')}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg border border-border p-4">
        <div className="flex items-center space-x-2 flex-1">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="flex space-x-2">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Consumption"
          value={trends?.summary?.totalConsumption?.toFixed(2) || 0}
          unit="kWh"
          change={trends?.summary?.consumptionChange}
          icon={BoltIcon}
          color="primary"
        />
        <MetricCard
          title="Total Cost"
          value={costAnalysis?.totalCost?.toFixed(2) || 0}
          unit="$"
          change={costAnalysis?.costChange}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <MetricCard
          title="Efficiency Score"
          value={efficiencyScore}
          unit="%"
          change={efficiency?.scoreChange}
          icon={ChartBarIcon}
          color={efficiencyColor === 'destructive' ? 'orange' : efficiencyColor}
        />
        <MetricCard
          title="Peak Demand"
          value={peakDemand?.maxDemand?.toFixed(2) || 0}
          unit="kW"
          change={peakDemand?.demandChange}
          icon={ArrowTrendingUpIcon}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Consumption Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="consumption"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorConsumption)"
                name="Consumption (kWh)"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10b981"
                strokeDasharray="5 5"
                name="Target (kWh)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Cost Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#10b981"
                strokeWidth={2}
                name="Cost ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Cost Breakdown by Category
          </h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {costBreakdownData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Peak Demand Hours
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="demand" name="Demand (kW)">
                {peakHoursData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPeak ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-muted-foreground">Normal Hours</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-destructive" />
              <span className="text-muted-foreground">Peak Hours</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Efficiency Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {efficiency?.metrics?.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{metric.name}</span>
                <span className="text-sm font-bold text-foreground">{metric.value}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    metric.value >= 80
                      ? 'bg-green-500'
                      : metric.value >= 60
                      ? 'bg-orange-500'
                      : 'bg-destructive'
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Key Insights</h2>
        <div className="space-y-3">
          {trends?.insights?.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'warning'
                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-600'
                  : insight.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-600'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
              }`}
            >
              <p className="font-medium">{insight.title}</p>
              <p className="text-sm mt-1 opacity-90">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Analytics
