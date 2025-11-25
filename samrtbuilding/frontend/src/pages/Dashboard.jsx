import { useQuery } from '@tanstack/react-query'
import { energyService } from '../services/energyService'
import { analyticsService } from '../services/analyticsService'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BoltIcon, CubeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'

const StatCard = ({ title, value, unit, icon: Icon, trend, trendValue }) => (
  <div className="bg-card rounded-lg border border-border p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-primary/10 rounded-lg">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-destructive' : 'text-green-500'}`}>
          {trend === 'up' ? (
            <ArrowTrendingUpIcon className="w-4 h-4" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{trendValue}%</span>
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
    <p className="text-3xl font-bold text-foreground">
      {value} <span className="text-lg text-muted-foreground">{unit}</span>
    </p>
  </div>
)

const Dashboard = () => {
  const { data: currentUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['currentUsage'],
    queryFn: energyService.getCurrentUsage,
    refetchInterval: 5000,
  })

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: analyticsService.getDashboardStats,
    refetchInterval: 30000,
  })

  const { data: historicalData, isLoading: historicalLoading } = useQuery({
    queryKey: ['historicalData'],
    queryFn: () => {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
      return energyService.getHistoricalData(
        startDate.toISOString(),
        endDate.toISOString(),
        'hour'
      )
    },
    refetchInterval: 60000,
  })

  if (usageLoading || statsLoading || historicalLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const chartData = (Array.isArray(historicalData) ? historicalData : []).map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    power: item.powerKw,
    cost: item.cost || item.powerKw * 0.12 * 0.083,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time energy monitoring and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Power"
          value={currentUsage?.currentPower?.toFixed(2) || 0}
          unit="kW"
          icon={BoltIcon}
          trend={currentUsage?.trend}
          trendValue={currentUsage?.trendValue}
        />
        <StatCard
          title="Today's Consumption"
          value={dashboardStats?.todayConsumption?.toFixed(2) || 0}
          unit="kWh"
          icon={CubeIcon}
        />
        <StatCard
          title="Today's Cost"
          value={dashboardStats?.todayCost?.toFixed(2) || 0}
          unit="$"
          icon={BoltIcon}
        />
        <StatCard
          title="Active Zones"
          value={dashboardStats?.activeZones || 0}
          unit="zones"
          icon={CubeIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Power Consumption (24h)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="power"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorPower)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Cost Analysis (24h)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Zone Consumption
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardStats?.zoneConsumption || []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="consumption" fill="#3b82f6" name="Consumption (kWh)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard
