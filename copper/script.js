// Copper Mine Optimizer JavaScript

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateTime();
    setInterval(updateTime, 1000);
    setInterval(updateRealTimeData, 30000);
});

// Application initialization
function initializeApp() {
    setupNavigation();
    setupCharts();
    generateSampleData();
    
    // Set current date for report date inputs
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (startDate) startDate.value = today;
    if (endDate) endDate.value = today;
}

// Navigation setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// Time update function
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Real-time data updates
function updateRealTimeData() {
    updateProductionMetrics();
    updateEquipmentStatus();
    updateEnergyData();
    refreshDashboard();
}

// Production metrics updates
function updateProductionMetrics() {
    const currentRate = document.getElementById('current-rate');
    const productionEfficiency = document.getElementById('production-efficiency');
    const dailyProduction = document.getElementById('daily-production');
    
    // Simulate real-time data with small variations
    const baseRate = 102;
    const variation = (Math.random() - 0.5) * 10;
    const newRate = Math.max(85, Math.min(115, baseRate + variation));
    
    if (currentRate) {
        currentRate.textContent = `${newRate.toFixed(1)} tons/hour`;
    }
    
    const efficiency = (newRate / 110 * 100);
    if (productionEfficiency) {
        productionEfficiency.textContent = `${efficiency.toFixed(1)}%`;
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = `${efficiency}%`;
    }
    
    // Update daily production
    if (dailyProduction) {
        const daily = Math.floor(2450 + (Math.random() - 0.5) * 200);
        dailyProduction.textContent = daily.toString();
    }
}

// Equipment status updates
function updateEquipmentStatus() {
    const equipmentItems = document.querySelectorAll('.equipment-item');
    equipmentItems.forEach(item => {
        const efficiencyElement = item.querySelector('.metric-value');
        if (efficiencyElement && !item.querySelector('.status-badge.maintenance')) {
            const currentEff = parseInt(efficiencyElement.textContent);
            const variation = (Math.random() - 0.5) * 4;
            const newEff = Math.max(75, Math.min(98, currentEff + variation));
            efficiencyElement.textContent = `${Math.round(newEff)}%`;
        }
    });
}

// Energy data updates
function updateEnergyData() {
    const currentHour = document.querySelector('.metric-large .metric-value');
    const dailyTotal = document.querySelectorAll('.metric-large .metric-value')[1];
    
    if (currentHour) {
        const base = 1240;
        const variation = (Math.random() - 0.5) * 100;
        const newValue = Math.max(1000, Math.min(1500, base + variation));
        currentHour.textContent = Math.round(newValue).toString();
    }
    
    if (dailyTotal) {
        const base = 28950;
        const variation = (Math.random() - 0.5) * 1000;
        const newValue = Math.max(25000, Math.min(32000, base + variation));
        dailyTotal.textContent = Math.round(newValue).toString();
    }
}

// Chart setup and management
function setupCharts() {
    createProductionChart();
    createGradeChart();
}

// Production trend chart
function createProductionChart() {
    const canvas = document.getElementById('production-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 250;
    
    // Generate sample data for the last 24 hours
    const data = [];
    const labels = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        data.push(90 + Math.random() * 20); // Production rate between 90-110
    }
    
    drawLineChart(ctx, width, height, data, labels, '#2c5530', 'Production Rate (tons/hour)');
}

// Ore grade distribution chart
function createGradeChart() {
    const canvas = document.getElementById('grade-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 200;
    
    // Sample grade distribution data
    const gradeRanges = ['0-0.5%', '0.5-1%', '1-1.5%', '1.5-2%', '2-2.5%', '2.5%+'];
    const frequencies = [5, 15, 25, 35, 15, 5]; // Percentage of samples in each range
    
    drawBarChart(ctx, width, height, frequencies, gradeRanges, '#3e7b3e', 'Grade Distribution');
}

// Generic line chart function
function drawLineChart(ctx, width, height, data, labels, color, title) {
    ctx.clearRect(0, 0, width, height);
    
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    // Draw title
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    
    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = margin.left + (index / (data.length - 1)) * chartWidth;
        const y = height - margin.bottom - ((value - minValue) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
        const x = margin.left + (index / (data.length - 1)) * chartWidth;
        const y = height - margin.bottom - ((value - minValue) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw labels (every 4th hour)
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
        if (index % 4 === 0) {
            const x = margin.left + (index / (data.length - 1)) * chartWidth;
            ctx.fillText(label, x, height - 10);
        }
    });
}

// Generic bar chart function
function drawBarChart(ctx, width, height, data, labels, color, title) {
    ctx.clearRect(0, 0, width, height);
    
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const maxValue = Math.max(...data);
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    
    // Draw title
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
    
    // Draw bars
    ctx.fillStyle = color;
    data.forEach((value, index) => {
        const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
        const barHeight = (value / maxValue) * chartHeight;
        const y = height - margin.bottom - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value labels
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}%`, x + barWidth / 2, y - 5);
        
        ctx.fillStyle = color;
    });
    
    // Draw x-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
        const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2;
        ctx.fillText(label, x, height - 10);
    });
}

// Ore grade calculator
function calculateGrade() {
    const sampleWeight = parseFloat(document.getElementById('sample-weight').value) || 0;
    const copperContent = parseFloat(document.getElementById('copper-content').value) || 0;
    
    if (sampleWeight > 0) {
        const grade = (copperContent / sampleWeight) * 100;
        const resultElement = document.getElementById('grade-result');
        if (resultElement) {
            resultElement.innerHTML = `Copper Grade: <strong>${grade.toFixed(2)}%</strong>`;
        }
    }
}

// Dashboard refresh function
function refreshDashboard() {
    // Update KPI values with small variations
    const kpiElements = [
        { id: 'daily-production', base: 2450, range: 200 },
        { id: 'copper-grade', base: 1.85, range: 0.2, decimals: 2 },
        { id: 'equipment-efficiency', base: 87.3, range: 5, decimals: 1 },
        { id: 'energy-cost', base: 15240, range: 1000, prefix: '$' }
    ];
    
    kpiElements.forEach(kpi => {
        const element = document.getElementById(kpi.id);
        if (element) {
            const variation = (Math.random() - 0.5) * kpi.range;
            const newValue = kpi.base + variation;
            const decimals = kpi.decimals || 0;
            const prefix = kpi.prefix || '';
            
            if (decimals > 0) {
                element.textContent = prefix + newValue.toFixed(decimals);
            } else {
                element.textContent = prefix + Math.round(newValue).toString();
            }
        }
    });
    
    // Add some random alerts occasionally
    if (Math.random() < 0.1) { // 10% chance
        addRandomAlert();
    }
}

// Add random alerts
function addRandomAlert() {
    const alertList = document.getElementById('alert-list');
    if (!alertList) return;
    
    const alerts = [
        { type: 'warning', icon: 'fas fa-exclamation-triangle', message: 'Conveyor belt speed deviation detected' },
        { type: 'info', icon: 'fas fa-info-circle', message: 'Shift change scheduled in 30 minutes' },
        { type: 'warning', icon: 'fas fa-exclamation-triangle', message: 'Temperature spike in Mill C - investigating' }
    ];
    
    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${randomAlert.type}`;
    alertElement.innerHTML = `<i class="${randomAlert.icon}"></i> ${randomAlert.message}`;
    
    alertList.insertBefore(alertElement, alertList.firstChild);
    
    // Remove oldest alert if more than 3
    if (alertList.children.length > 3) {
        alertList.removeChild(alertList.lastChild);
    }
}

// Report generation
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // Simulate report generation
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show success message
        alert(`${reportType} report generated successfully for ${startDate} to ${endDate}`);
    }, 2000);
}

// Sample data generation
function generateSampleData() {
    // This function would typically load data from a backend API
    // For demo purposes, we're using static data with some randomization
    console.log('Sample data loaded for copper mine optimization system');
}

// Utility functions
function formatNumber(num, decimals = 0) {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions for potential API integration
window.CopperMineOptimizer = {
    refreshDashboard,
    calculateGrade,
    generateReport,
    updateRealTimeData
};