// Advanced Forecasting Engine for Corn Syrup Production
class ForecastEngine {
    constructor() {
        this.data = [];
        this.processedData = {};
        this.forecastResults = null;
    }

    // Parse CSV data
    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    if (header.toLowerCase().includes('date')) {
                        row[header] = new Date(values[index]);
                    } else {
                        row[header] = parseFloat(values[index]) || 0;
                    }
                });
                data.push(row);
            }
        }

        this.data = data.sort((a, b) => a[headers[0]] - b[headers[0]]);
        this.processData();
        return this.data;
    }

    // Process and clean data
    processData() {
        if (this.data.length === 0) return;

        const dateKey = Object.keys(this.data[0])[0];
        const productionKey = Object.keys(this.data[0]).find(k => 
            k.toLowerCase().includes('production'));
        const demandKey = Object.keys(this.data[0]).find(k => 
            k.toLowerCase().includes('demand'));
        const priceKey = Object.keys(this.data[0]).find(k => 
            k.toLowerCase().includes('price'));

        this.processedData = {
            dates: this.data.map(d => d[dateKey]),
            production: this.data.map(d => d[productionKey] || 0),
            demand: this.data.map(d => d[demandKey] || 0),
            price: this.data.map(d => d[priceKey] || 0)
        };

        // Calculate basic statistics
        this.processedData.stats = this.calculateStatistics();
    }

    // Calculate basic statistics
    calculateStatistics() {
        const production = this.processedData.production;
        const demand = this.processedData.demand;
        
        return {
            avgProduction: this.mean(production),
            avgDemand: this.mean(demand),
            prodStdDev: this.standardDeviation(production),
            demandStdDev: this.standardDeviation(demand),
            trend: this.calculateTrend(demand),
            seasonality: this.detectSeasonality(demand)
        };
    }

    // Linear Regression Forecast
    linearRegressionForecast(periods) {
        const y = this.processedData.demand;
        const x = y.map((_, i) => i);
        
        const n = y.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const forecast = [];
        const lastIndex = x[x.length - 1];
        
        for (let i = 1; i <= periods; i++) {
            const predictedValue = slope * (lastIndex + i) + intercept;
            forecast.push(Math.max(0, predictedValue));
        }

        return {
            method: 'Linear Regression',
            forecast,
            slope,
            intercept,
            r2: this.calculateR2(y, x.map(xi => slope * xi + intercept))
        };
    }

    // Exponential Smoothing Forecast
    exponentialSmoothingForecast(periods, alpha = 0.3) {
        const data = this.processedData.demand;
        if (data.length === 0) return { forecast: [] };

        let smoothed = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
        }

        const forecast = [];
        let lastSmoothed = smoothed[smoothed.length - 1];
        
        for (let i = 0; i < periods; i++) {
            forecast.push(Math.max(0, lastSmoothed));
        }

        return {
            method: 'Exponential Smoothing',
            forecast,
            alpha,
            smoothed
        };
    }

    // Moving Average Forecast
    movingAverageForecast(periods, window = 3) {
        const data = this.processedData.demand;
        if (data.length < window) return { forecast: [] };

        const recentData = data.slice(-window);
        const average = this.mean(recentData);
        
        const forecast = Array(periods).fill(Math.max(0, average));

        return {
            method: 'Moving Average',
            forecast,
            window,
            average
        };
    }

    // Seasonal Decomposition Forecast
    seasonalDecompositionForecast(periods) {
        const data = this.processedData.demand;
        const seasonalPeriod = 12; // Assuming monthly data with yearly seasonality
        
        if (data.length < seasonalPeriod * 2) {
            return this.linearRegressionForecast(periods);
        }

        // Calculate trend using moving average
        const trend = this.calculateMovingAverageTrend(data, seasonalPeriod);
        
        // Calculate seasonal indices
        const seasonalIndices = this.calculateSeasonalIndices(data, trend, seasonalPeriod);
        
        // Extend trend
        const trendSlope = this.calculateTrendSlope(trend);
        const lastTrend = trend[trend.length - 1];
        
        const forecast = [];
        for (let i = 0; i < periods; i++) {
            const trendValue = lastTrend + trendSlope * (i + 1);
            const seasonalIndex = seasonalIndices[i % seasonalPeriod];
            const forecastValue = trendValue * seasonalIndex;
            forecast.push(Math.max(0, forecastValue));
        }

        return {
            method: 'Seasonal Decomposition',
            forecast,
            trend,
            seasonalIndices,
            trendSlope
        };
    }

    // Generate confidence intervals
    generateConfidenceIntervals(forecast, confidenceLevel = 90) {
        const data = this.processedData.demand;
        const stdDev = this.standardDeviation(data);
        const zScore = this.getZScore(confidenceLevel);
        
        return forecast.map(value => ({
            forecast: value,
            upper: value + zScore * stdDev,
            lower: Math.max(0, value - zScore * stdDev)
        }));
    }

    // Helper functions
    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    standardDeviation(arr) {
        const mean = this.mean(arr);
        const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = this.mean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    calculateTrend(data) {
        if (data.length < 2) return 'stable';
        
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        
        const firstAvg = this.mean(firstHalf);
        const secondAvg = this.mean(secondHalf);
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.05) return 'increasing';
        if (change < -0.05) return 'decreasing';
        return 'stable';
    }

    detectSeasonality(data) {
        // Simple seasonality detection based on autocorrelation
        const periods = [12, 6, 4]; // Monthly, bi-annual, quarterly
        let maxCorrelation = 0;
        let bestPeriod = null;

        periods.forEach(period => {
            if (data.length >= period * 2) {
                const correlation = this.autocorrelation(data, period);
                if (correlation > maxCorrelation) {
                    maxCorrelation = correlation;
                    bestPeriod = period;
                }
            }
        });

        return {
            detected: maxCorrelation > 0.3,
            period: bestPeriod,
            strength: maxCorrelation
        };
    }

    autocorrelation(data, lag) {
        const n = data.length - lag;
        const mean1 = this.mean(data.slice(0, n));
        const mean2 = this.mean(data.slice(lag));
        
        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;
        
        for (let i = 0; i < n; i++) {
            const diff1 = data[i] - mean1;
            const diff2 = data[i + lag] - mean2;
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }
        
        return numerator / Math.sqrt(denom1 * denom2);
    }

    calculateR2(actual, predicted) {
        const actualMean = this.mean(actual);
        const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
        const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
        return 1 - (residualSumSquares / totalSumSquares);
    }

    calculateMovingAverageTrend(data, period) {
        const trend = [];
        const halfPeriod = Math.floor(period / 2);
        
        for (let i = halfPeriod; i < data.length - halfPeriod; i++) {
            const sum = data.slice(i - halfPeriod, i + halfPeriod + 1).reduce((a, b) => a + b, 0);
            trend.push(sum / period);
        }
        
        return trend;
    }

    calculateSeasonalIndices(data, trend, period) {
        const indices = Array(period).fill(0);
        const counts = Array(period).fill(0);
        
        const startOffset = Math.floor(period / 2);
        
        for (let i = startOffset; i < Math.min(data.length - startOffset, trend.length + startOffset); i++) {
            const seasonIndex = i % period;
            const trendIndex = i - startOffset;
            
            if (trend[trendIndex] > 0) {
                indices[seasonIndex] += data[i] / trend[trendIndex];
                counts[seasonIndex]++;
            }
        }
        
        // Average the indices and normalize
        const avgIndices = indices.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 1);
        const avgOfAvg = this.mean(avgIndices);
        
        return avgIndices.map(index => index / avgOfAvg);
    }

    calculateTrendSlope(trend) {
        if (trend.length < 2) return 0;
        
        const x = trend.map((_, i) => i);
        const n = trend.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = trend.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * trend[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    getZScore(confidenceLevel) {
        const zScores = {
            80: 1.28,
            90: 1.645,
            95: 1.96,
            99: 2.576
        };
        return zScores[confidenceLevel] || 1.645;
    }

    // Generate production recommendations
    generateRecommendations(forecastResult) {
        const avgForecast = this.mean(forecastResult.forecast);
        const currentAvg = this.processedData.stats.avgDemand;
        const change = ((avgForecast - currentAvg) / currentAvg) * 100;

        const recommendations = [];

        if (change > 10) {
            recommendations.push({
                type: 'capacity',
                priority: 'high',
                message: `Demand is forecasted to increase by ${change.toFixed(1)}%. Consider increasing production capacity.`
            });
        } else if (change < -10) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                message: `Demand is forecasted to decrease by ${Math.abs(change).toFixed(1)}%. Consider optimizing production efficiency.`
            });
        }

        if (forecastResult.method === 'Seasonal Decomposition' && forecastResult.seasonalIndices) {
            const maxSeasonal = Math.max(...forecastResult.seasonalIndices);
            const minSeasonal = Math.min(...forecastResult.seasonalIndices);
            const seasonalVariation = ((maxSeasonal - minSeasonal) / minSeasonal) * 100;

            if (seasonalVariation > 20) {
                recommendations.push({
                    type: 'inventory',
                    priority: 'medium',
                    message: `Strong seasonal patterns detected (${seasonalVariation.toFixed(1)}% variation). Plan inventory accordingly.`
                });
            }
        }

        return recommendations;
    }
}

// Export for use in main application
window.ForecastEngine = ForecastEngine;