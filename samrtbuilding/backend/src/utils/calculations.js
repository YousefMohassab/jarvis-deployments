/**
 * Energy calculation utilities for Smart Building Energy Management
 */

/**
 * Calculate energy consumption in kWh
 * @param {number} power - Power in kW
 * @param {number} duration - Duration in hours
 * @returns {number} Energy in kWh
 */
function calculateEnergyConsumption(power, duration) {
  return power * duration;
}

/**
 * Calculate cost based on energy consumption and rate
 * @param {number} energyKWh - Energy in kWh
 * @param {number} ratePerKWh - Rate per kWh in currency
 * @returns {number} Cost
 */
function calculateEnergyCost(energyKWh, ratePerKWh) {
  return energyKWh * ratePerKWh;
}

/**
 * Calculate energy savings percentage
 * @param {number} baseline - Baseline consumption
 * @param {number} current - Current consumption
 * @returns {number} Savings percentage
 */
function calculateSavingsPercentage(baseline, current) {
  if (baseline === 0) return 0;
  return ((baseline - current) / baseline) * 100;
}

/**
 * Calculate efficiency ratio
 * @param {number} outputEnergy - Output energy
 * @param {number} inputEnergy - Input energy
 * @returns {number} Efficiency as percentage
 */
function calculateEfficiency(outputEnergy, inputEnergy) {
  if (inputEnergy === 0) return 0;
  return (outputEnergy / inputEnergy) * 100;
}

/**
 * Calculate power factor
 * @param {number} realPower - Real power in kW
 * @param {number} apparentPower - Apparent power in kVA
 * @returns {number} Power factor (0-1)
 */
function calculatePowerFactor(realPower, apparentPower) {
  if (apparentPower === 0) return 0;
  return Math.min(realPower / apparentPower, 1);
}

/**
 * Calculate peak demand
 * @param {Array} readings - Array of power readings
 * @param {number} intervalMinutes - Interval between readings
 * @returns {Object} Peak demand information
 */
function calculatePeakDemand(readings, intervalMinutes = 15) {
  if (!readings || readings.length === 0) {
    return { peak: 0, timestamp: null, average: 0 };
  }

  const values = readings.map(r => r.value || r);
  const peak = Math.max(...values);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;

  const peakIndex = values.indexOf(peak);
  const timestamp = readings[peakIndex]?.timestamp || null;

  return {
    peak,
    average,
    timestamp,
    intervalMinutes
  };
}

/**
 * Calculate load factor
 * @param {number} averageLoad - Average load
 * @param {number} peakLoad - Peak load
 * @returns {number} Load factor as percentage
 */
function calculateLoadFactor(averageLoad, peakLoad) {
  if (peakLoad === 0) return 0;
  return (averageLoad / peakLoad) * 100;
}

/**
 * Calculate HVAC energy consumption based on zone parameters
 * @param {Object} zone - Zone parameters
 * @returns {number} Estimated energy consumption in kWh
 */
function calculateHVACConsumption(zone) {
  const {
    area = 1000, // sq ft
    currentTemp,
    setpointTemp,
    outdoorTemp,
    occupancy = 0,
    insulationFactor = 1.0
  } = zone;

  // Simplified calculation for demonstration
  const tempDiff = Math.abs(currentTemp - setpointTemp);
  const outdoorEffect = Math.abs(currentTemp - outdoorTemp) * 0.1;
  const occupancyLoad = occupancy * 0.1; // 0.1 kW per person

  const baseLoad = (area / 1000) * 2; // 2 kW per 1000 sq ft
  const tempLoad = tempDiff * 0.5; // 0.5 kW per degree difference

  const totalLoad = (baseLoad + tempLoad + outdoorEffect + occupancyLoad) / insulationFactor;

  return Math.max(0, totalLoad);
}

/**
 * Calculate optimal setpoint based on occupancy and weather
 * @param {Object} params - Calculation parameters
 * @returns {number} Optimal setpoint temperature
 */
function calculateOptimalSetpoint(params) {
  const {
    currentSetpoint,
    occupancy = 0,
    outdoorTemp,
    timeOfDay, // 0-23
    targetComfort = 72, // Base comfort temperature
    maxAdjustment = 4 // Max degrees to adjust
  } = params;

  let adjustment = 0;

  // Adjust for occupancy
  if (occupancy === 0) {
    adjustment += 3; // Save energy when unoccupied
  } else if (occupancy > 10) {
    adjustment -= 1; // Cool more when crowded
  }

  // Adjust for outdoor temperature
  if (Math.abs(outdoorTemp - targetComfort) > 20) {
    adjustment += 1; // Reduce HVAC load during extreme weather
  }

  // Adjust for time of day
  if (timeOfDay >= 22 || timeOfDay <= 6) {
    adjustment += 2; // Night setback
  }

  const optimalSetpoint = targetComfort + Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

  return Math.round(optimalSetpoint);
}

/**
 * Calculate carbon emissions from energy consumption
 * @param {number} energyKWh - Energy in kWh
 * @param {number} emissionFactor - kg CO2 per kWh (default: 0.92 for US grid average)
 * @returns {number} Carbon emissions in kg CO2
 */
function calculateCarbonEmissions(energyKWh, emissionFactor = 0.92) {
  return energyKWh * emissionFactor;
}

/**
 * Calculate simple moving average
 * @param {Array} values - Array of values
 * @param {number} period - Period for moving average
 * @returns {Array} Moving average values
 */
function calculateMovingAverage(values, period = 7) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculate energy forecast using simple linear regression
 * @param {Array} historicalData - Array of {timestamp, value} objects
 * @param {number} hoursAhead - Hours to forecast ahead
 * @returns {Array} Forecasted values
 */
function forecastEnergy(historicalData, hoursAhead = 24) {
  if (!historicalData || historicalData.length < 2) {
    return [];
  }

  // Simple linear regression
  const n = historicalData.length;
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecast
  const forecast = [];
  const lastTimestamp = new Date(historicalData[historicalData.length - 1].timestamp);

  for (let i = 1; i <= hoursAhead; i++) {
    const forecastTimestamp = new Date(lastTimestamp.getTime() + i * 3600000);
    const forecastValue = Math.max(0, slope * (n + i - 1) + intercept);

    forecast.push({
      timestamp: forecastTimestamp,
      value: forecastValue,
      type: 'forecast'
    });
  }

  return forecast;
}

/**
 * Calculate degree days (heating or cooling)
 * @param {number} avgTemp - Average temperature
 * @param {number} baseTemp - Base temperature (65°F for HDD, 65°F for CDD)
 * @param {string} type - 'heating' or 'cooling'
 * @returns {number} Degree days
 */
function calculateDegreeDays(avgTemp, baseTemp = 65, type = 'heating') {
  if (type === 'heating') {
    return Math.max(0, baseTemp - avgTemp);
  } else {
    return Math.max(0, avgTemp - baseTemp);
  }
}

/**
 * Calculate return on investment for energy efficiency measures
 * @param {number} initialCost - Initial investment cost
 * @param {number} annualSavings - Annual energy savings
 * @param {number} years - Investment period in years
 * @param {number} discountRate - Discount rate (default 0.05)
 * @returns {Object} ROI metrics
 */
function calculateROI(initialCost, annualSavings, years = 10, discountRate = 0.05) {
  let npv = -initialCost;

  for (let year = 1; year <= years; year++) {
    npv += annualSavings / Math.pow(1 + discountRate, year);
  }

  const paybackPeriod = initialCost / annualSavings;
  const roi = ((annualSavings * years - initialCost) / initialCost) * 100;

  return {
    npv,
    paybackPeriod,
    roi,
    totalSavings: annualSavings * years
  };
}

module.exports = {
  calculateEnergyConsumption,
  calculateEnergyCost,
  calculateSavingsPercentage,
  calculateEfficiency,
  calculatePowerFactor,
  calculatePeakDemand,
  calculateLoadFactor,
  calculateHVACConsumption,
  calculateOptimalSetpoint,
  calculateCarbonEmissions,
  calculateMovingAverage,
  forecastEnergy,
  calculateDegreeDays,
  calculateROI
};
