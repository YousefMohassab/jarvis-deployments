// Safety Management System - Comprehensive mining safety monitoring
import { EventEmitter } from 'events';

export class SafetyManager extends EventEmitter {
    constructor() {
        super();
        this.safetyMetrics = {
            daysWithoutIncident: 127,
            incidentCount: 0,
            trainingCompliance: 94.3,
            ppeCompliance: 98.7,
            safetyScore: 96.2,
            environmentalCompliance: 92.8
        };
        
        this.safetyStandards = this.initializeSafetyStandards();
        this.emergencyProcedures = this.initializeEmergencyProcedures();
        this.trainingRecords = new Map();
        this.incidentHistory = [];
        this.activeHazards = new Map();
    }
    
    initializeSafetyStandards() {
        return {
            // OSHA and MSHA compliance standards
            airQuality: {
                pm25: { max: 35, unit: 'μg/m³' },
                pm10: { max: 150, unit: 'μg/m³' },
                co: { max: 35, unit: 'ppm' },
                no2: { max: 100, unit: 'ppb' },
                so2: { max: 75, unit: 'ppb' },
                o3: { max: 70, unit: 'ppb' }
            },
            noise: {
                twa8Hour: { max: 90, unit: 'dB' },
                peak: { max: 140, unit: 'dB' },
                action: { level: 85, unit: 'dB' }
            },
            vibration: {
                handsArms: { max: 5, unit: 'm/s²' },
                wholeBody: { max: 1.15, unit: 'm/s²' }
            },
            lighting: {
                general: { min: 10, unit: 'lux' },
                taskAreas: { min: 50, unit: 'lux' },
                emergency: { min: 2, unit: 'lux' }
            },
            temperature: {
                max: 35, // °C
                min: 5,  // °C
                humidity: { max: 95, unit: '%' }
            },
            chemicalExposure: {
                cyanide: { max: 5, unit: 'mg/m³' },
                mercury: { max: 0.1, unit: 'mg/m³' },
                silicaDust: { max: 0.1, unit: 'mg/m³' },
                diesel: { max: 160, unit: 'μg/m³' }
            },
            structuralSafety: {
                slopeStability: { minFactor: 1.3 },
                supportPressure: { max: 150, unit: 'kPa' },
                groundMovement: { max: 5, unit: 'mm/day' }
            }
        };
    }
    
    initializeEmergencyProcedures() {
        return {
            evacuation: {
                routes: ['Primary Exit - North', 'Secondary Exit - East', 'Emergency Exit - South'],
                assemblyPoints: ['Surface Parking A', 'Surface Parking B', 'Emergency Shelter'],
                evacuationTime: { target: 15, max: 30, unit: 'minutes' }
            },
            fireEmergency: {
                detectionSystems: ['Smoke Detectors', 'Heat Sensors', 'CO Monitors'],
                suppressionSystems: ['Sprinkler System', 'Foam System', 'CO2 System'],
                responseTime: { target: 5, max: 10, unit: 'minutes' }
            },
            medicalEmergency: {
                firstAidStations: 8,
                trainedPersonnel: 15,
                responseTime: { target: 3, max: 5, unit: 'minutes' },
                hospitalDistance: 12, // km
                helicopterLanding: true
            },
            chemicalSpill: {
                containmentKits: 12,
                neutralizingAgents: ['Lime', 'Activated Carbon', 'Absorbent Pads'],
                responseTeam: 6,
                responseTime: { target: 10, max: 20, unit: 'minutes' }
            },
            structuralCollapse: {
                escapeRoutes: ['Main Ramp', 'Emergency Shaft', 'Ventilation Shaft'],
                rescueEquipment: ['Hydraulic Jacks', 'Cutting Tools', 'Communication Systems'],
                responseTime: { target: 20, max: 60, unit: 'minutes' }
            }
        };
    }
    
    async getSafetyMetrics() {
        // Update metrics based on current conditions
        await this.updateSafetyMetrics();
        return this.safetyMetrics;
    }
    
    async updateSafetyMetrics() {
        // Calculate training compliance
        this.safetyMetrics.trainingCompliance = this.calculateTrainingCompliance();
        
        // Update PPE compliance (simulated from monitoring systems)
        this.safetyMetrics.ppeCompliance = 96 + Math.random() * 4;
        
        // Calculate overall safety score
        this.safetyMetrics.safetyScore = this.calculateSafetyScore();
        
        // Environmental compliance
        this.safetyMetrics.environmentalCompliance = this.calculateEnvironmentalCompliance();
        
        return this.safetyMetrics;
    }
    
    calculateTrainingCompliance() {
        const totalPersonnel = 150;
        let trainedPersonnel = 0;
        
        // Simulate training records
        for (let i = 1; i <= totalPersonnel; i++) {
            const personnelId = `EMP-${String(i).padStart(3, '0')}`;
            const trainingStatus = this.getPersonnelTrainingStatus(personnelId);
            
            if (trainingStatus.compliant) {
                trainedPersonnel++;
            }
        }
        
        return (trainedPersonnel / totalPersonnel) * 100;
    }
    
    getPersonnelTrainingStatus(personnelId) {
        // Simulate personnel training records
        const requiredTrainings = [
            'Basic Safety Orientation',
            'Equipment Operation',
            'Emergency Procedures',
            'Chemical Safety',
            'First Aid/CPR',
            'Environmental Awareness',
            'Hazard Recognition'
        ];
        
        const completedTrainings = requiredTrainings.filter(() => Math.random() > 0.1); // 90% completion rate
        const isCompliant = completedTrainings.length >= requiredTrainings.length * 0.85; // 85% minimum
        
        return {
            personnelId,
            required: requiredTrainings,
            completed: completedTrainings,
            compliant: isCompliant,
            lastUpdate: new Date().toISOString()
        };
    }
    
    calculateSafetyScore() {
        const weights = {
            incidentRate: 0.3,
            trainingCompliance: 0.25,
            ppeCompliance: 0.2,
            environmentalCompliance: 0.15,
            emergencyReadiness: 0.1
        };
        
        const scores = {
            incidentRate: Math.max(0, 100 - (this.safetyMetrics.incidentCount * 10)),
            trainingCompliance: this.safetyMetrics.trainingCompliance,
            ppeCompliance: this.safetyMetrics.ppeCompliance,
            environmentalCompliance: this.safetyMetrics.environmentalCompliance,
            emergencyReadiness: this.calculateEmergencyReadiness()
        };
        
        let weightedScore = 0;
        Object.keys(weights).forEach(key => {
            weightedScore += scores[key] * weights[key];
        });
        
        return Math.min(100, weightedScore);
    }
    
    calculateEmergencyReadiness() {
        // Assess emergency preparedness based on equipment, training, and procedures
        const factors = {
            emergencyEquipment: 95, // % functional
            trainedPersonnel: 92,   // % certified
            drillParticipation: 88, // % participation in drills
            responseTime: 90,       // % meeting response time targets
            communicationSystems: 98 // % operational
        };
        
        const average = Object.values(factors).reduce((sum, value) => sum + value, 0) / Object.keys(factors).length;
        return average;
    }
    
    calculateEnvironmentalCompliance() {
        // Simulate environmental compliance scoring
        const complianceAreas = {
            airQuality: 94,
            waterQuality: 96,
            noiseControl: 89,
            wasteManagement: 92,
            landReclamation: 88
        };
        
        const average = Object.values(complianceAreas).reduce((sum, value) => sum + value, 0) / Object.keys(complianceAreas).length;
        return average + (Math.random() - 0.5) * 4; // Add some variation
    }
    
    async reportIncident(incidentData) {
        const incident = {
            id: `INC-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: incidentData.type || 'General',
            severity: incidentData.severity || 'Low',
            description: incidentData.description,
            location: incidentData.location,
            personnelInvolved: incidentData.personnelInvolved || [],
            equipmentInvolved: incidentData.equipmentInvolved,
            injuries: incidentData.injuries || 0,
            propertyDamage: incidentData.propertyDamage || 0,
            environmentalImpact: incidentData.environmentalImpact || false,
            nearMiss: incidentData.nearMiss || false,
            reportedBy: incidentData.reportedBy,
            witnesses: incidentData.witnesses || [],
            immediateActions: incidentData.immediateActions || [],
            status: 'Under Investigation',
            investigator: null,
            rootCause: null,
            correctiveActions: [],
            preventiveMeasures: [],
            costEstimate: incidentData.costEstimate || 0,
            regulatoryNotification: this.requiresRegulatoryNotification(incidentData),
            attachments: incidentData.attachments || []
        };
        
        // Add to incident history
        this.incidentHistory.unshift(incident);
        
        // Update safety metrics
        if (!incident.nearMiss) {
            this.safetyMetrics.incidentCount++;
            this.safetyMetrics.daysWithoutIncident = 0;
        }
        
        // Trigger automatic responses based on severity
        await this.processIncidentResponse(incident);
        
        // Emit incident event
        this.emit('incident-reported', incident);
        
        return incident;
    }
    
    requiresRegulatoryNotification(incidentData) {
        // Determine if incident requires regulatory notification (MSHA, OSHA, EPA)
        const conditions = [
            incidentData.injuries > 0,
            incidentData.severity === 'Critical',
            incidentData.environmentalImpact,
            incidentData.propertyDamage > 100000,
            incidentData.type === 'Fatality',
            incidentData.type === 'Chemical Spill'
        ];
        
        return conditions.some(condition => condition === true);
    }
    
    async processIncidentResponse(incident) {
        switch (incident.severity) {
            case 'Critical':
                await this.initiateCriticalResponse(incident);
                break;
            case 'High':
                await this.initiateHighSeverityResponse(incident);
                break;
            case 'Medium':
                await this.initiateMediumSeverityResponse(incident);
                break;
            default:
                await this.initiateStandardResponse(incident);
        }
    }
    
    async initiateCriticalResponse(incident) {
        console.log(`CRITICAL INCIDENT: ${incident.type} - ${incident.description}`);
        
        // Immediate actions for critical incidents
        const actions = [
            'Emergency services contacted',
            'Area secured and personnel evacuated',
            'Management team notified',
            'Regulatory authorities contacted',
            'Media response team activated',
            'Family notification initiated (if applicable)',
            'Investigation team assembled',
            'Operations suspended in affected area'
        ];
        
        incident.immediateActions = actions;
        incident.investigator = 'Safety Director';
        
        // Emit critical alert
        this.emit('critical-incident', incident);
    }
    
    async initiateHighSeverityResponse(incident) {
        console.log(`HIGH SEVERITY INCIDENT: ${incident.type} - ${incident.description}`);
        
        const actions = [
            'Safety personnel dispatched to scene',
            'Area secured pending investigation',
            'Management notified within 2 hours',
            'Investigation initiated within 24 hours',
            'Preliminary report due within 48 hours'
        ];
        
        incident.immediateActions = actions;
        incident.investigator = 'Senior Safety Officer';
    }
    
    async initiateMediumSeverityResponse(incident) {
        console.log(`MEDIUM SEVERITY INCIDENT: ${incident.type} - ${incident.description}`);
        
        const actions = [
            'Safety officer assigned to investigate',
            'Scene documented and preserved',
            'Initial report completed',
            'Corrective actions identified',
            'Follow-up scheduled within 7 days'
        ];
        
        incident.immediateActions = actions;
        incident.investigator = 'Safety Officer';
    }
    
    async initiateStandardResponse(incident) {
        console.log(`STANDARD INCIDENT: ${incident.type} - ${incident.description}`);
        
        const actions = [
            'Incident logged and documented',
            'Supervisor notified',
            'Basic investigation completed',
            'Lessons learned shared with team'
        ];
        
        incident.immediateActions = actions;
        incident.investigator = 'Shift Supervisor';
    }
    
    async handleAlert(alert) {
        // Process safety-related alerts from monitoring systems
        console.log(`Processing safety alert: ${alert.title}`);
        
        if (alert.severity === 'critical') {
            // Create automatic incident report for critical safety alerts
            const incidentData = {
                type: 'Safety Alert',
                severity: 'High',
                description: `Automatic incident generated from critical alert: ${alert.message}`,
                location: alert.location || 'Unknown',
                equipmentInvolved: alert.sensorId,
                reportedBy: 'Monitoring System',
                nearMiss: true
            };
            
            await this.reportIncident(incidentData);
        }
        
        // Update active hazards
        this.updateActiveHazards(alert);
    }
    
    updateActiveHazards(alert) {
        const hazardKey = `${alert.category}_${alert.sensorId}`;
        
        if (alert.severity === 'critical' || alert.severity === 'warning') {
            this.activeHazards.set(hazardKey, {
                ...alert,
                firstDetected: this.activeHazards.get(hazardKey)?.firstDetected || new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        } else {
            // Remove resolved hazards
            this.activeHazards.delete(hazardKey);
        }
    }
    
    getActiveHazards() {
        return Array.from(this.activeHazards.values());
    }
    
    getIncidentHistory(limit = 50) {
        return this.incidentHistory.slice(0, limit);
    }
    
    getIncidentStatistics(period = 'month') {
        const now = new Date();
        let filterDate;
        
        switch (period) {
            case 'week':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                filterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        const filteredIncidents = this.incidentHistory.filter(incident => 
            new Date(incident.timestamp) >= filterDate
        );
        
        const statistics = {
            totalIncidents: filteredIncidents.length,
            nearMisses: filteredIncidents.filter(i => i.nearMiss).length,
            actualIncidents: filteredIncidents.filter(i => !i.nearMiss).length,
            injuries: filteredIncidents.reduce((sum, i) => sum + i.injuries, 0),
            severityBreakdown: {
                critical: filteredIncidents.filter(i => i.severity === 'Critical').length,
                high: filteredIncidents.filter(i => i.severity === 'High').length,
                medium: filteredIncidents.filter(i => i.severity === 'Medium').length,
                low: filteredIncidents.filter(i => i.severity === 'Low').length
            },
            typeBreakdown: {},
            averageDaysWithoutIncident: this.safetyMetrics.daysWithoutIncident,
            incidentRate: (filteredIncidents.length / (period === 'year' ? 365 : period === 'month' ? 30 : 7)) * 1000 // per 1000 days
        };
        
        // Calculate type breakdown
        filteredIncidents.forEach(incident => {
            statistics.typeBreakdown[incident.type] = (statistics.typeBreakdown[incident.type] || 0) + 1;
        });
        
        return statistics;
    }
    
    async conductSafetyInspection(inspectionData) {
        const inspection = {
            id: `INSP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: inspectionData.type || 'Routine',
            area: inspectionData.area,
            inspector: inspectionData.inspector,
            checklist: inspectionData.checklist || [],
            findings: inspectionData.findings || [],
            recommendations: inspectionData.recommendations || [],
            complianceScore: this.calculateComplianceScore(inspectionData.findings),
            actionItems: inspectionData.actionItems || [],
            nextInspectionDate: this.calculateNextInspectionDate(inspectionData.type),
            status: 'Completed'
        };
        
        // Process findings and create action items
        inspection.findings.forEach(finding => {
            if (finding.severity === 'Critical' || finding.severity === 'High') {
                inspection.actionItems.push({
                    description: finding.description,
                    priority: finding.severity,
                    assignedTo: finding.assignedTo || 'Safety Team',
                    dueDate: this.calculateActionDueDate(finding.severity),
                    status: 'Open'
                });
            }
        });
        
        this.emit('inspection-completed', inspection);
        
        return inspection;
    }
    
    calculateComplianceScore(findings) {
        if (!findings || findings.length === 0) return 100;
        
        const severityWeights = {
            'Critical': 25,
            'High': 15,
            'Medium': 10,
            'Low': 5
        };
        
        let totalDeductions = 0;
        findings.forEach(finding => {
            totalDeductions += severityWeights[finding.severity] || 0;
        });
        
        return Math.max(0, 100 - totalDeductions);
    }
    
    calculateNextInspectionDate(inspectionType) {
        const intervals = {
            'Daily': 1,
            'Weekly': 7,
            'Monthly': 30,
            'Quarterly': 90,
            'Annual': 365,
            'Routine': 30
        };
        
        const days = intervals[inspectionType] || 30;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        
        return nextDate.toISOString().split('T')[0]; // Return date only
    }
    
    calculateActionDueDate(severity) {
        const dueDays = {
            'Critical': 1,
            'High': 7,
            'Medium': 30,
            'Low': 60
        };
        
        const days = dueDays[severity] || 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        
        return dueDate.toISOString().split('T')[0]; // Return date only
    }
    
    generateSafetyReport(reportType = 'monthly') {
        const report = {
            id: `RPT-${Date.now()}`,
            type: reportType,
            generatedAt: new Date().toISOString(),
            period: this.getReportPeriod(reportType),
            metrics: this.safetyMetrics,
            statistics: this.getIncidentStatistics(reportType),
            activeHazards: this.getActiveHazards(),
            recentIncidents: this.getIncidentHistory(10),
            recommendations: this.generateSafetyRecommendations(),
            compliance: {
                overall: this.safetyMetrics.safetyScore,
                training: this.safetyMetrics.trainingCompliance,
                ppe: this.safetyMetrics.ppeCompliance,
                environmental: this.safetyMetrics.environmentalCompliance
            }
        };
        
        return report;
    }
    
    getReportPeriod(reportType) {
        const now = new Date();
        const periods = {
            'daily': { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now },
            'weekly': { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
            'monthly': { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now },
            'quarterly': { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now },
            'annual': { start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), end: now }
        };
        
        const period = periods[reportType] || periods['monthly'];
        return {
            start: period.start.toISOString().split('T')[0],
            end: period.end.toISOString().split('T')[0]
        };
    }
    
    generateSafetyRecommendations() {
        const recommendations = [];
        
        // Analyze metrics and generate recommendations
        if (this.safetyMetrics.trainingCompliance < 95) {
            recommendations.push({
                category: 'Training',
                priority: 'High',
                recommendation: 'Improve safety training compliance through targeted refresher courses',
                expectedImpact: 'Reduce incident risk by 15-20%'
            });
        }
        
        if (this.safetyMetrics.incidentCount > 5) {
            recommendations.push({
                category: 'Prevention',
                priority: 'High',
                recommendation: 'Implement enhanced hazard identification and risk assessment procedures',
                expectedImpact: 'Reduce incident frequency by 25%'
            });
        }
        
        if (this.safetyMetrics.environmentalCompliance < 90) {
            recommendations.push({
                category: 'Environmental',
                priority: 'Medium',
                recommendation: 'Upgrade environmental monitoring systems and control measures',
                expectedImpact: 'Improve compliance score by 5-8%'
            });
        }
        
        // Add hazard-specific recommendations
        this.activeHazards.forEach(hazard => {
            recommendations.push({
                category: 'Hazard Mitigation',
                priority: hazard.severity === 'critical' ? 'Critical' : 'High',
                recommendation: `Address active hazard: ${hazard.title}`,
                location: hazard.location,
                expectedImpact: 'Eliminate immediate safety risk'
            });
        });
        
        return recommendations;
    }
}