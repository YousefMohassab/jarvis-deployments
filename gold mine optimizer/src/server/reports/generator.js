// Report Generator - Comprehensive analytics and reporting system
import { EventEmitter } from 'events';

export class ReportGenerator extends EventEmitter {
    constructor() {
        super();
        this.reportTemplates = this.initializeTemplates();
        this.reportHistory = [];
        this.scheduledReports = new Map();
    }
    
    initializeTemplates() {
        return {
            production: {
                name: 'Production Report',
                description: 'Comprehensive production analysis and optimization recommendations',
                sections: ['summary', 'production_metrics', 'equipment_performance', 'cost_analysis', 'optimization_opportunities'],
                frequency: ['daily', 'weekly', 'monthly', 'quarterly'],
                defaultFormat: 'pdf'
            },
            equipment: {
                name: 'Equipment Performance Report',
                description: 'Equipment efficiency, maintenance, and operational analysis',
                sections: ['equipment_overview', 'efficiency_trends', 'maintenance_analysis', 'cost_breakdown', 'recommendations'],
                frequency: ['weekly', 'monthly'],
                defaultFormat: 'pdf'
            },
            safety: {
                name: 'Safety & Compliance Report',
                description: 'Safety metrics, incidents, compliance status, and improvement recommendations',
                sections: ['safety_summary', 'incident_analysis', 'compliance_status', 'training_metrics', 'action_plans'],
                frequency: ['monthly', 'quarterly'],
                defaultFormat: 'pdf'
            },
            environmental: {
                name: 'Environmental Impact Report',
                description: 'Environmental monitoring, compliance, and sustainability metrics',
                sections: ['environmental_summary', 'compliance_metrics', 'monitoring_data', 'impact_assessment', 'improvement_plans'],
                frequency: ['monthly', 'quarterly', 'annual'],
                defaultFormat: 'pdf'
            },
            financial: {
                name: 'Financial Performance Report',
                description: 'Cost analysis, profitability, and financial optimization insights',
                sections: ['financial_summary', 'cost_breakdown', 'profitability_analysis', 'budget_variance', 'forecasting'],
                frequency: ['monthly', 'quarterly'],
                defaultFormat: 'excel'
            },
            optimization: {
                name: 'AI Optimization Report',
                description: 'Machine learning insights, optimization recommendations, and performance predictions',
                sections: ['optimization_summary', 'ai_insights', 'performance_predictions', 'implementation_roadmap', 'roi_analysis'],
                frequency: ['weekly', 'monthly'],
                defaultFormat: 'pdf'
            },
            executive: {
                name: 'Executive Dashboard Report',
                description: 'High-level KPIs, strategic insights, and executive summary',
                sections: ['executive_summary', 'kpi_dashboard', 'strategic_insights', 'risk_assessment', 'recommendations'],
                frequency: ['weekly', 'monthly'],
                defaultFormat: 'pdf'
            }
        };
    }
    
    async generateReport(reportType, options = {}) {
        try {
            console.log(`Generating ${reportType} report...`);
            
            const template = this.reportTemplates[reportType];
            if (!template) {
                throw new Error(`Unknown report type: ${reportType}`);
            }
            
            const reportData = await this.gatherReportData(reportType, options);
            const report = await this.buildReport(template, reportData, options);
            
            // Store in history
            this.reportHistory.unshift(report);
            if (this.reportHistory.length > 100) {
                this.reportHistory.pop();
            }
            
            this.emit('report-generated', report);
            
            return report;
            
        } catch (error) {
            console.error(`Report generation failed for ${reportType}:`, error);
            throw error;
        }
    }
    
    async gatherReportData(reportType, options) {
        const period = options.period || 'month';
        const startDate = options.startDate || this.getDefaultStartDate(period);
        const endDate = options.endDate || new Date().toISOString();
        
        // Gather data based on report type
        switch (reportType) {
            case 'production':
                return await this.gatherProductionData(startDate, endDate);
            case 'equipment':
                return await this.gatherEquipmentData(startDate, endDate);
            case 'safety':
                return await this.gatherSafetyData(startDate, endDate);
            case 'environmental':
                return await this.gatherEnvironmentalData(startDate, endDate);
            case 'financial':
                return await this.gatherFinancialData(startDate, endDate);
            case 'optimization':
                return await this.gatherOptimizationData(startDate, endDate);
            case 'executive':
                return await this.gatherExecutiveData(startDate, endDate);
            default:
                throw new Error(`Unsupported report type: ${reportType}`);
        }
    }
    
    async gatherProductionData(startDate, endDate) {
        // Simulate comprehensive production data gathering
        await this.delay(500);
        
        return {
            period: { start: startDate, end: endDate },
            summary: {
                totalGoldProduced: 742.3, // oz
                totalOreProcessed: 431250, // tons
                averageRecoveryRate: 91.7, // %
                averageOreGrade: 2.34, // g/t
                operationalDays: 30,
                totalOperatingHours: 1680,
                averageEfficiency: 89.2 // %
            },
            dailyProduction: this.generateDailyProductionData(30),
            equipmentContribution: {
                'Primary Excavator': 35.2,
                'Secondary Excavator': 28.7,
                'Haul Trucks': 22.1,
                'Processing Plant': 14.0
            },
            trends: {
                productionTrend: 'increasing', // +5.2%
                efficiencyTrend: 'stable', // +1.1%
                costTrend: 'decreasing' // -3.4%
            },
            challenges: [
                'Weather delays reduced production by 2.3 days',
                'Equipment maintenance caused 18 hours downtime',
                'Ore grade variation in Pit B affected recovery'
            ],
            achievements: [
                'Exceeded monthly production target by 8.3%',
                'Improved recovery rate by 2.1% vs previous month',
                'Reduced cost per ounce by $45'
            ]
        };
    }
    
    async gatherEquipmentData(startDate, endDate) {
        await this.delay(400);
        
        return {
            period: { start: startDate, end: endDate },
            overview: {
                totalEquipment: 15,
                operationalEquipment: 13,
                equipmentInMaintenance: 2,
                averageEfficiency: 87.3,
                totalOperatingHours: 8760,
                maintenanceCost: 156780
            },
            equipmentPerformance: [
                {
                    id: 'EXC-001',
                    name: 'Primary Excavator',
                    efficiency: 92.5,
                    operatingHours: 1247,
                    maintenanceCost: 15000,
                    availability: 95.2,
                    performance: 'excellent'
                },
                {
                    id: 'TRK-001',
                    name: 'Haul Truck #1',
                    efficiency: 88.3,
                    operatingHours: 987,
                    maintenanceCost: 8500,
                    availability: 92.1,
                    performance: 'good'
                },
                {
                    id: 'CRU-001',
                    name: 'Primary Crusher',
                    efficiency: 75.0,
                    operatingHours: 2156,
                    maintenanceCost: 25000,
                    availability: 85.7,
                    performance: 'needs_attention'
                }
            ],
            maintenanceAnalysis: {
                scheduledMaintenance: 12,
                unscheduledMaintenance: 5,
                preventiveMaintenance: 15,
                maintenanceEffectiveness: 87.5,
                mtbf: 456, // Mean Time Between Failures (hours)
                mttr: 4.2   // Mean Time To Repair (hours)
            },
            costAnalysis: {
                totalMaintenanceCost: 156780,
                costPerHour: 17.89,
                laborCosts: 62712,
                partsCosts: 78234,
                contractorCosts: 15834
            }
        };
    }
    
    async gatherSafetyData(startDate, endDate) {
        await this.delay(300);
        
        return {
            period: { start: startDate, end: endDate },
            summary: {
                daysWithoutIncident: 127,
                totalIncidents: 2,
                nearMisses: 8,
                injuries: 0,
                safetyScore: 96.2,
                trainingCompliance: 94.3,
                ppeCompliance: 98.7
            },
            incidentAnalysis: {
                incidentsByType: {
                    'Equipment Related': 1,
                    'Environmental': 1,
                    'Personnel': 0,
                    'Chemical': 0
                },
                incidentsBySeverity: {
                    'Critical': 0,
                    'High': 0,
                    'Medium': 1,
                    'Low': 1
                },
                rootCauses: [
                    'Inadequate maintenance procedures',
                    'Weather-related conditions',
                    'Communication gaps'
                ]
            },
            complianceMetrics: {
                osha: 94.5,
                msha: 96.2,
                environmental: 92.8,
                internal: 97.1
            },
            trainingMetrics: {
                completionRate: 94.3,
                refresherTraining: 89.7,
                newEmployeeTraining: 100,
                certificationCompliance: 91.2
            },
            recommendations: [
                'Implement enhanced equipment inspection protocols',
                'Increase frequency of safety communication meetings',
                'Upgrade environmental monitoring systems',
                'Conduct additional hazard identification training'
            ]
        };
    }
    
    async gatherEnvironmentalData(startDate, endDate) {
        await this.delay(350);
        
        return {
            period: { start: startDate, end: endDate },
            summary: {
                overallCompliance: 92.8,
                airQualityScore: 88.5,
                waterQualityScore: 96.2,
                noiseComplianceScore: 85.7,
                wasteManagementScore: 94.3
            },
            airQuality: {
                pm25: { average: 28.5, limit: 35, compliance: true },
                pm10: { average: 89.2, limit: 150, compliance: true },
                nox: { average: 45.3, limit: 100, compliance: true },
                so2: { average: 12.1, limit: 75, compliance: true }
            },
            waterQuality: {
                ph: { average: 7.2, range: [6.5, 8.5], compliance: true },
                turbidity: { average: 4.5, limit: 10, compliance: true },
                dissolvedOxygen: { average: 8.2, minimum: 6, compliance: true },
                heavyMetals: { detected: false, compliance: true }
            },
            noiseMonitoring: {
                averageLevel: 82.5, // dB
                peakLevel: 95.2,
                complianceRate: 85.7,
                exceedances: 3
            },
            wasteManagement: {
                totalWaste: 2456, // tons
                recycled: 1847, // tons
                recyclingRate: 75.2, // %
                hazardousWaste: 45, // tons
                wasteReduction: 12.3 // % vs previous period
            },
            sustainability: {
                carbonFootprint: 125.8, // tons CO2
                energyIntensity: 45.6, // kWh/ton
                waterIntensity: 2.1, // L/ton
                renewableEnergyUse: 15.3 // %
            }
        };
    }
    
    async gatherFinancialData(startDate, endDate) {
        await this.delay(450);
        
        return {
            period: { start: startDate, end: endDate },
            summary: {
                totalRevenue: 1568420, // USD
                totalCosts: 942150,
                grossProfit: 626270,
                profitMargin: 39.9,
                costPerOunce: 1247,
                revenuePerOunce: 2100
            },
            costBreakdown: {
                laborCosts: 312500,
                equipmentCosts: 189340,
                energyCosts: 145200,
                materialsCosts: 167890,
                maintenanceCosts: 89420,
                overheadCosts: 37800
            },
            profitability: {
                grossProfitMargin: 39.9,
                operatingProfitMargin: 35.2,
                ebitda: 598340,
                roi: 18.7,
                paybackPeriod: 3.2 // years
            },
            budgetVariance: {
                revenueVariance: 5.2, // % over budget
                costVariance: -3.1, // % under budget
                profitVariance: 8.7 // % over budget
            },
            kpis: {
                revenuePerTon: 3.64,
                costPerTon: 2.19,
                profitPerTon: 1.45,
                revenueGrowth: 12.3, // % YoY
                costEfficiency: 94.7 // %
            }
        };
    }
    
    async gatherOptimizationData(startDate, endDate) {
        await this.delay(600);
        
        return {
            period: { start: startDate, end: endDate },
            summary: {
                optimizationScore: 87.3,
                implementedRecommendations: 12,
                pendingRecommendations: 5,
                projectedSavings: 234500,
                actualSavings: 189230
            },
            aiInsights: [
                {
                    category: 'Production',
                    insight: 'Optimal crusher speed identified at 78% capacity',
                    impact: '+3.2% efficiency',
                    confidence: 0.92,
                    status: 'implemented'
                },
                {
                    category: 'Equipment',
                    insight: 'Predictive maintenance prevented 2 equipment failures',
                    impact: '$45,000 cost avoidance',
                    confidence: 0.87,
                    status: 'ongoing'
                },
                {
                    category: 'Energy',
                    insight: 'Peak load shifting reduced energy costs by 8%',
                    impact: '$12,340 monthly savings',
                    confidence: 0.94,
                    status: 'implemented'
                }
            ],
            performancePredictions: {
                next30Days: {
                    goldProduction: 785, // oz
                    efficiency: 89.7, // %
                    costPerOunce: 1198, // USD
                    confidence: 0.88
                },
                next90Days: {
                    goldProduction: 2340, // oz
                    efficiency: 91.2, // %
                    costPerOunce: 1165, // USD
                    confidence: 0.82
                }
            },
            optimizationOpportunities: [
                {
                    area: 'Ore Blending',
                    description: 'Dynamic ore blending optimization',
                    potentialSavings: 67800,
                    implementationCost: 15000,
                    paybackPeriod: 2.7, // months
                    priority: 'high'
                },
                {
                    area: 'Water Management',
                    description: 'Implement closed-loop water recycling',
                    potentialSavings: 34200,
                    implementationCost: 125000,
                    paybackPeriod: 43.8, // months
                    priority: 'medium'
                }
            ],
            modelPerformance: {
                productionForecast: { accuracy: 94.2, mape: 5.8 },
                equipmentHealth: { accuracy: 91.7, precision: 89.3 },
                costPrediction: { accuracy: 87.9, rmse: 45.2 },
                optimizationEngine: { effectiveness: 92.4, adoptionRate: 78.6 }
            }
        };
    }
    
    async gatherExecutiveData(startDate, endDate) {
        await this.delay(400);
        
        // Aggregate data from all other report types
        const [production, financial, safety, optimization] = await Promise.all([
            this.gatherProductionData(startDate, endDate),
            this.gatherFinancialData(startDate, endDate),
            this.gatherSafetyData(startDate, endDate),
            this.gatherOptimizationData(startDate, endDate)
        ]);
        
        return {
            period: { start: startDate, end: endDate },
            executiveSummary: {
                goldProduced: production.summary.totalGoldProduced,
                revenue: financial.summary.totalRevenue,
                profitMargin: financial.summary.profitMargin,
                safetyScore: safety.summary.safetyScore,
                operationalEfficiency: production.summary.averageEfficiency,
                optimizationScore: optimization.summary.optimizationScore
            },
            keyPerformanceIndicators: {
                production: {
                    value: production.summary.totalGoldProduced,
                    target: 720,
                    variance: 3.1,
                    trend: 'positive'
                },
                profitability: {
                    value: financial.summary.profitMargin,
                    target: 35,
                    variance: 14.0,
                    trend: 'positive'
                },
                safety: {
                    value: safety.summary.safetyScore,
                    target: 95,
                    variance: 1.3,
                    trend: 'stable'
                },
                efficiency: {
                    value: production.summary.averageEfficiency,
                    target: 85,
                    variance: 4.9,
                    trend: 'positive'
                }
            },
            strategicInsights: [
                'Production exceeded targets by 3.1%, driven by equipment efficiency improvements',
                'Profit margins improved by 14% due to cost optimization initiatives',
                'Safety performance remains strong with 127 days without incidents',
                'AI optimization recommendations delivered $189k in realized savings'
            ],
            riskAssessment: {
                operationalRisks: [
                    { risk: 'Equipment aging', level: 'medium', mitigation: 'Accelerated replacement program' },
                    { risk: 'Weather dependency', level: 'low', mitigation: 'Improved forecasting and planning' }
                ],
                financialRisks: [
                    { risk: 'Gold price volatility', level: 'high', mitigation: 'Hedging strategy implementation' },
                    { risk: 'Cost inflation', level: 'medium', mitigation: 'Long-term supplier contracts' }
                ],
                regulatoryRisks: [
                    { risk: 'Environmental compliance', level: 'low', mitigation: 'Proactive monitoring and reporting' },
                    { risk: 'Safety regulations', level: 'low', mitigation: 'Continuous training and improvement' }
                ]
            },
            recommendations: [
                {
                    priority: 'high',
                    area: 'Production',
                    recommendation: 'Implement Phase 2 of optimization program',
                    expectedROI: '285%',
                    timeframe: '6 months'
                },
                {
                    priority: 'medium',
                    area: 'Technology',
                    recommendation: 'Upgrade to autonomous haulage system',
                    expectedROI: '180%',
                    timeframe: '18 months'
                },
                {
                    priority: 'medium',
                    area: 'Sustainability',
                    recommendation: 'Increase renewable energy adoption',
                    expectedROI: '95%',
                    timeframe: '24 months'
                }
            ]
        };
    }
    
    async buildReport(template, data, options) {
        const report = {
            id: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type: template.name,
            generatedAt: new Date().toISOString(),
            period: data.period,
            format: options.format || template.defaultFormat,
            sections: {},
            metadata: {
                generatedBy: options.generatedBy || 'System',
                version: '1.0',
                dataSource: 'Gold Mine Optimizer Database',
                confidentiality: options.confidentiality || 'Internal'
            }
        };
        
        // Build each section based on the template
        for (const sectionName of template.sections) {
            report.sections[sectionName] = await this.buildReportSection(sectionName, data, options);
        }
        
        // Add charts and visualizations
        report.visualizations = this.generateVisualizationConfigs(template, data);
        
        // Calculate report statistics
        report.statistics = this.calculateReportStatistics(data);
        
        return report;
    }
    
    async buildReportSection(sectionName, data, options) {
        switch (sectionName) {
            case 'summary':
            case 'executive_summary':
                return this.buildSummarySection(data);
            case 'production_metrics':
                return this.buildProductionMetricsSection(data);
            case 'equipment_performance':
            case 'equipment_overview':
                return this.buildEquipmentSection(data);
            case 'safety_summary':
                return this.buildSafetySection(data);
            case 'financial_summary':
                return this.buildFinancialSection(data);
            case 'optimization_summary':
            case 'ai_insights':
                return this.buildOptimizationSection(data);
            case 'kpi_dashboard':
                return this.buildKPIDashboardSection(data);
            case 'recommendations':
                return this.buildRecommendationsSection(data);
            default:
                return { title: sectionName.replace(/_/g, ' ').toUpperCase(), content: 'Section content placeholder' };
        }
    }
    
    buildSummarySection(data) {
        return {
            title: 'Executive Summary',
            content: {
                overview: data.summary || data.executiveSummary,
                highlights: data.achievements || data.strategicInsights,
                challenges: data.challenges || [],
                keyMetrics: data.keyPerformanceIndicators || {}
            }
        };
    }
    
    buildProductionMetricsSection(data) {
        return {
            title: 'Production Metrics',
            content: {
                summary: data.summary,
                dailyProduction: data.dailyProduction,
                trends: data.trends,
                equipmentContribution: data.equipmentContribution
            }
        };
    }
    
    buildEquipmentSection(data) {
        return {
            title: 'Equipment Performance',
            content: {
                overview: data.overview,
                performance: data.equipmentPerformance,
                maintenance: data.maintenanceAnalysis,
                costs: data.costAnalysis
            }
        };
    }
    
    buildSafetySection(data) {
        return {
            title: 'Safety & Compliance',
            content: {
                summary: data.summary,
                incidents: data.incidentAnalysis,
                compliance: data.complianceMetrics,
                training: data.trainingMetrics,
                recommendations: data.recommendations
            }
        };
    }
    
    buildFinancialSection(data) {
        return {
            title: 'Financial Performance',
            content: {
                summary: data.summary,
                costs: data.costBreakdown,
                profitability: data.profitability,
                variance: data.budgetVariance,
                kpis: data.kpis
            }
        };
    }
    
    buildOptimizationSection(data) {
        return {
            title: 'AI Optimization Insights',
            content: {
                summary: data.summary,
                insights: data.aiInsights,
                predictions: data.performancePredictions,
                opportunities: data.optimizationOpportunities,
                modelPerformance: data.modelPerformance
            }
        };
    }
    
    buildKPIDashboardSection(data) {
        return {
            title: 'Key Performance Indicators',
            content: {
                kpis: data.keyPerformanceIndicators,
                trends: data.trends,
                targets: data.targets || {}
            }
        };
    }
    
    buildRecommendationsSection(data) {
        return {
            title: 'Recommendations',
            content: {
                recommendations: data.recommendations || [],
                priorities: this.prioritizeRecommendations(data.recommendations || []),
                actionItems: this.generateActionItems(data.recommendations || [])
            }
        };
    }
    
    generateVisualizationConfigs(template, data) {
        const visualizations = [];
        
        // Add common charts based on data type
        if (data.dailyProduction) {
            visualizations.push({
                type: 'line',
                title: 'Daily Production Trend',
                data: data.dailyProduction,
                xAxis: 'date',
                yAxis: 'production'
            });
        }
        
        if (data.equipmentPerformance) {
            visualizations.push({
                type: 'bar',
                title: 'Equipment Efficiency',
                data: data.equipmentPerformance,
                xAxis: 'name',
                yAxis: 'efficiency'
            });
        }
        
        if (data.costBreakdown) {
            visualizations.push({
                type: 'pie',
                title: 'Cost Distribution',
                data: Object.entries(data.costBreakdown).map(([key, value]) => ({ category: key, value }))
            });
        }
        
        return visualizations;
    }
    
    calculateReportStatistics(data) {
        return {
            dataPoints: this.countDataPoints(data),
            completeness: this.calculateDataCompleteness(data),
            accuracy: this.estimateDataAccuracy(data),
            generationTime: new Date().toISOString()
        };
    }
    
    countDataPoints(obj, count = 0) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count = this.countDataPoints(obj[key], count);
            } else {
                count++;
            }
        }
        return count;
    }
    
    calculateDataCompleteness(data) {
        // Simple heuristic for data completeness
        const requiredFields = ['summary', 'period'];
        const presentFields = requiredFields.filter(field => data[field]);
        return (presentFields.length / requiredFields.length) * 100;
    }
    
    estimateDataAccuracy(data) {
        // Placeholder for data accuracy estimation
        return 95.5; // Assume high accuracy for simulated data
    }
    
    prioritizeRecommendations(recommendations) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return recommendations.sort((a, b) => {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    
    generateActionItems(recommendations) {
        return recommendations.map(rec => ({
            action: rec.recommendation || rec.description,
            priority: rec.priority,
            expectedImpact: rec.expectedImpact || rec.impact,
            timeframe: rec.timeframe || this.estimateTimeframe(rec.priority),
            assignee: rec.assignee || 'TBD',
            status: 'Pending'
        }));
    }
    
    estimateTimeframe(priority) {
        const timeframes = {
            'high': '1-2 weeks',
            'medium': '1-2 months',
            'low': '3-6 months'
        };
        return timeframes[priority] || '1 month';
    }
    
    generateDailyProductionData(days) {
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                production: 20 + Math.random() * 10,
                efficiency: 80 + Math.random() * 15,
                oreGrade: 2.0 + Math.random() * 0.8
            });
        }
        return data;
    }
    
    getDefaultStartDate(period) {
        const now = new Date();
        const periods = {
            'day': 1,
            'week': 7,
            'month': 30,
            'quarter': 90,
            'year': 365
        };
        
        const days = periods[period] || 30;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return startDate.toISOString();
    }
    
    getReportHistory(limit = 20) {
        return this.reportHistory.slice(0, limit);
    }
    
    scheduleReport(reportType, schedule, options = {}) {
        const scheduleId = `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        this.scheduledReports.set(scheduleId, {
            id: scheduleId,
            type: reportType,
            schedule: schedule, // cron-like format: '0 9 * * MON' for every Monday at 9 AM
            options: options,
            createdAt: new Date().toISOString(),
            active: true,
            lastGenerated: null,
            nextGeneration: this.calculateNextGeneration(schedule)
        });
        
        console.log(`Scheduled ${reportType} report with ID: ${scheduleId}`);
        return scheduleId;
    }
    
    calculateNextGeneration(schedule) {
        // Simplified schedule calculation - in production, use a proper cron library
        const now = new Date();
        now.setDate(now.getDate() + 1); // Next day for demo
        return now.toISOString();
    }
    
    getScheduledReports() {
        return Array.from(this.scheduledReports.values());
    }
    
    cancelScheduledReport(scheduleId) {
        const schedule = this.scheduledReports.get(scheduleId);
        if (schedule) {
            schedule.active = false;
            console.log(`Cancelled scheduled report: ${scheduleId}`);
            return true;
        }
        return false;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}