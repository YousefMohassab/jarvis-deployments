'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Calendar, FileText, Filter, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const mockReports = [
    {
      id: '1',
      title: 'Weekly Precious Metals Analysis',
      type: 'weekly',
      dateRange: { start: '2024-12-25', end: '2025-01-01' },
      minerals: ['Gold', 'Silver', 'Platinum'],
      createdAt: '2025-01-01T09:00:00Z',
      status: 'completed',
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      title: 'Monthly Market Overview',
      type: 'monthly', 
      dateRange: { start: '2024-12-01', end: '2024-12-31' },
      minerals: ['Gold', 'Silver', 'Copper'],
      createdAt: '2024-12-31T23:59:00Z',
      status: 'completed',
      fileSize: '5.8 MB',
    },
    {
      id: '3',
      title: 'Daily Gold Report',
      type: 'daily',
      dateRange: { start: '2025-01-01', end: '2025-01-01' },
      minerals: ['Gold'],
      createdAt: '2025-01-01T08:30:00Z',
      status: 'generating',
    }
  ]

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      alert('Report generated successfully!')
    }, 2000)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      generating: 'bg-yellow-100 text-yellow-800', 
      failed: 'bg-red-100 text-red-800'
    } as const
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and manage mineral pricing reports</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Generate New Report Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Report
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Minerals</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Gold', 'Silver', 'Copper', 'Platinum', 'Palladium', 'Oil'].map((mineral) => (
                <label key={mineral} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked={mineral === 'Gold'}
                  />
                  <span className="text-sm font-medium text-gray-700">{mineral}</span>
                </label>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Reports History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Report History</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {mockReports
                .filter(report => report.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{report.title}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}</span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {report.type}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium">Minerals: </span>
                          {report.minerals.join(', ')}
                        </div>
                        
                        <div>
                          <span className="font-medium">Created: </span>
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                        
                        {report.fileSize && (
                          <div>
                            <span className="font-medium">Size: </span>
                            {report.fileSize}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {report.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}