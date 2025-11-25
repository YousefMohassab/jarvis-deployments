const fs = require('fs');
const path = require('path');

// Generate comprehensive energy readings for the past 90 days
// 15-minute intervals = 96 readings per day per equipment
// 47 equipment items = 4,512 readings per day
// 90 days = 406,080 total readings

const equipmentData = [
  // Building 1 - Corporate Headquarters
  { id: 1, zoneId: 1, buildingId: 1, basePower: 45.5, variance: 8, type: 'hvac' },
  { id: 2, zoneId: 1, buildingId: 1, basePower: 45.5, variance: 8, type: 'hvac' },
  { id: 3, zoneId: 2, buildingId: 1, basePower: 65.2, variance: 12, type: 'hvac' },
  { id: 4, zoneId: 2, buildingId: 1, basePower: 65.2, variance: 12, type: 'hvac' },
  { id: 5, zoneId: 3, buildingId: 1, basePower: 52.8, variance: 10, type: 'hvac' },
  { id: 6, zoneId: 4, buildingId: 1, basePower: 38.6, variance: 5, type: 'precision_cooling' },
  { id: 7, zoneId: 4, buildingId: 1, basePower: 38.6, variance: 5, type: 'precision_cooling' },
  { id: 8, zoneId: 4, buildingId: 1, basePower: 225.0, variance: 15, type: 'ups' },
  { id: 9, zoneId: 5, buildingId: 1, basePower: 8.5, variance: 2, type: 'lighting' },
  { id: 10, zoneId: 5, buildingId: 1, basePower: 85.3, variance: 15, type: 'hvac' },
  { id: 11, zoneId: 6, buildingId: 1, basePower: 125.5, variance: 35, type: 'kitchen' },
  { id: 12, zoneId: 6, buildingId: 1, basePower: 58.2, variance: 12, type: 'hvac' },
  { id: 13, zoneId: 6, buildingId: 1, basePower: 18.5, variance: 3, type: 'refrigeration' },
  { id: 14, zoneId: 7, buildingId: 1, basePower: 68.4, variance: 14, type: 'hvac' },
  { id: 15, zoneId: 7, buildingId: 1, basePower: 12.3, variance: 5, type: 'av_system' },
  { id: 16, zoneId: 8, buildingId: 1, basePower: 42.5, variance: 10, type: 'hvac' },

  // Building 2 - Manufacturing Facility
  { id: 17, zoneId: 9, buildingId: 2, basePower: 185.5, variance: 25, type: 'industrial_motor' },
  { id: 18, zoneId: 9, buildingId: 2, basePower: 185.5, variance: 25, type: 'industrial_motor' },
  { id: 19, zoneId: 9, buildingId: 2, basePower: 28.5, variance: 5, type: 'conveyor' },
  { id: 20, zoneId: 9, buildingId: 2, basePower: 225.8, variance: 30, type: 'industrial_hvac' },
  { id: 21, zoneId: 10, buildingId: 2, basePower: 185.5, variance: 25, type: 'industrial_motor' },
  { id: 22, zoneId: 10, buildingId: 2, basePower: 185.5, variance: 25, type: 'industrial_motor' },
  { id: 23, zoneId: 10, buildingId: 2, basePower: 28.5, variance: 5, type: 'conveyor' },
  { id: 24, zoneId: 10, buildingId: 2, basePower: 225.8, variance: 30, type: 'industrial_hvac' },
  { id: 25, zoneId: 11, buildingId: 2, basePower: 45.5, variance: 5, type: 'led_lighting' },
  { id: 26, zoneId: 11, buildingId: 2, basePower: 155.2, variance: 20, type: 'industrial_hvac' },
  { id: 27, zoneId: 11, buildingId: 2, basePower: 32.5, variance: 12, type: 'material_handling' },
  { id: 28, zoneId: 12, buildingId: 2, basePower: 48.5, variance: 10, type: 'laboratory' },
  { id: 29, zoneId: 12, buildingId: 2, basePower: 52.8, variance: 8, type: 'precision_hvac' },
  { id: 30, zoneId: 13, buildingId: 2, basePower: 78.5, variance: 15, type: 'hvac' },

  // Building 3 - R&D Center
  { id: 31, zoneId: 14, buildingId: 3, basePower: 15.5, variance: 5, type: 'laboratory' },
  { id: 32, zoneId: 14, buildingId: 3, basePower: 15.5, variance: 5, type: 'laboratory' },
  { id: 33, zoneId: 14, buildingId: 3, basePower: 38.5, variance: 6, type: 'precision_hvac' },
  { id: 34, zoneId: 15, buildingId: 3, basePower: 12.5, variance: 4, type: 'laboratory' },
  { id: 35, zoneId: 15, buildingId: 3, basePower: 12.5, variance: 4, type: 'laboratory' },
  { id: 36, zoneId: 15, buildingId: 3, basePower: 38.5, variance: 6, type: 'precision_hvac' },
  { id: 37, zoneId: 16, buildingId: 3, basePower: 45.5, variance: 10, type: 'test_equipment' },
  { id: 38, zoneId: 16, buildingId: 3, basePower: 45.5, variance: 10, type: 'test_equipment' },
  { id: 39, zoneId: 16, buildingId: 3, basePower: 38.5, variance: 6, type: 'precision_hvac' },
  { id: 40, zoneId: 17, buildingId: 3, basePower: 125.5, variance: 15, type: 'clean_room_hvac' },
  { id: 41, zoneId: 17, buildingId: 3, basePower: 32.5, variance: 8, type: 'clean_room_equipment' },
  { id: 42, zoneId: 18, buildingId: 3, basePower: 185.5, variance: 20, type: 'server' },
  { id: 43, zoneId: 18, buildingId: 3, basePower: 85.5, variance: 10, type: 'precision_cooling' },
  { id: 44, zoneId: 18, buildingId: 3, basePower: 85.5, variance: 10, type: 'precision_cooling' },
  { id: 45, zoneId: 19, buildingId: 3, basePower: 52.5, variance: 12, type: 'hvac' },
  { id: 46, zoneId: 20, buildingId: 3, basePower: 78.5, variance: 18, type: 'workshop' },
  { id: 47, zoneId: 20, buildingId: 3, basePower: 52.8, variance: 10, type: 'industrial_hvac' },
];

function getHourlyMultiplier(hour) {
  // Simulate daily usage patterns
  // Night: 0-6 (60-70% load)
  // Morning ramp: 6-9 (70-95% load)
  // Day: 9-18 (90-100% load)
  // Evening: 18-22 (75-85% load)
  // Night: 22-24 (60-70% load)

  if (hour >= 0 && hour < 6) return 0.60 + Math.random() * 0.10;
  if (hour >= 6 && hour < 9) return 0.70 + (hour - 6) * 0.08 + Math.random() * 0.05;
  if (hour >= 9 && hour < 18) return 0.90 + Math.random() * 0.10;
  if (hour >= 18 && hour < 22) return 0.75 + Math.random() * 0.10;
  return 0.60 + Math.random() * 0.10;
}

function getDayOfWeekMultiplier(dayOfWeek) {
  // Weekends have reduced load
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0.4 + Math.random() * 0.2;
  return 1.0;
}

function getSeasonalMultiplier(month) {
  // HVAC load varies by season
  // Winter (Dec-Feb) and Summer (Jun-Aug) have higher cooling/heating loads
  if (month === 11 || month === 0 || month === 1) return 1.15; // Winter
  if (month >= 5 && month <= 7) return 1.20; // Summer
  if (month === 2 || month === 3 || month === 4) return 0.95; // Spring
  return 0.90; // Fall
}

function calculatePowerReading(equipment, timestamp) {
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();
  const month = timestamp.getMonth();

  const hourlyMult = getHourlyMultiplier(hour);
  const dayMult = getDayOfWeekMultiplier(dayOfWeek);
  const seasonalMult = equipment.type.includes('hvac') || equipment.type.includes('cooling')
    ? getSeasonalMultiplier(month)
    : 1.0;

  // Add some random variance
  const randomVariance = -equipment.variance + Math.random() * (equipment.variance * 2);

  const powerKw = equipment.basePower * hourlyMult * dayMult * seasonalMult + randomVariance;

  // Ensure power is never negative
  return Math.max(0, powerKw);
}

function generateEnergyReadings() {
  const header = 'id,equipmentId,zoneId,buildingId,timestamp,powerKw,voltageV,currentA,powerFactor,energyKwh,cost,temperature,status\n';
  let csvContent = header;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 90);

  let recordId = 1;

  console.log('Generating energy readings...');
  console.log(`Start: ${startDate.toISOString()}`);
  console.log(`End: ${endDate.toISOString()}`);

  // Iterate through each 15-minute interval
  const interval = 15 * 60 * 1000; // 15 minutes in milliseconds

  for (let timestamp = new Date(startDate); timestamp <= endDate; timestamp = new Date(timestamp.getTime() + interval)) {
    // Generate reading for each equipment
    for (const equipment of equipmentData) {
      const powerKw = calculatePowerReading(equipment, timestamp);
      const voltageV = 480 + (Math.random() - 0.5) * 20; // Typical industrial voltage
      const powerFactor = 0.85 + Math.random() * 0.12; // 0.85 - 0.97
      const currentA = (powerKw * 1000) / (voltageV * powerFactor * Math.sqrt(3)); // 3-phase
      const energyKwh = powerKw * 0.25; // 15 minutes = 0.25 hours
      const costPerKwh = 0.12; // $0.12 per kWh
      const cost = energyKwh * costPerKwh;

      // Temperature varies by zone and equipment type
      let temperature = 20 + Math.random() * 5;
      if (equipment.type.includes('server') || equipment.type === 'precision_cooling') {
        temperature = 18 + Math.random() * 2;
      } else if (equipment.type === 'clean_room_hvac') {
        temperature = 19 + Math.random() * 2;
      }

      const status = Math.random() > 0.001 ? 'normal' : 'warning'; // 0.1% warning rate

      const row = `${recordId},${equipment.id},${equipment.zoneId},${equipment.buildingId},${timestamp.toISOString()},${powerKw.toFixed(2)},${voltageV.toFixed(1)},${currentA.toFixed(2)},${powerFactor.toFixed(3)},${energyKwh.toFixed(3)},${cost.toFixed(4)},${temperature.toFixed(1)},${status}\n`;

      csvContent += row;
      recordId++;
    }

    // Log progress every 1000 intervals
    if (recordId % 50000 === 0) {
      console.log(`Generated ${recordId} records... (${timestamp.toISOString()})`);
    }
  }

  console.log(`Total records generated: ${recordId - 1}`);

  // Write to file
  const outputPath = path.join(__dirname, 'energy_readings.csv');
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Energy readings written to: ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

// Run the generator
generateEnergyReadings();
