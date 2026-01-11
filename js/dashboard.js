document.addEventListener('DOMContentLoaded', function() {
    function calculateTotalRevenue() {
        const db = getDb();
        return db.contracts
            .filter(c => c.status === ContractStatus.COMPLETED)
            .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    }
    function calculateActiveContracts() {
        const db = getDb();
        return db.contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
    }
    function calculateAvailableCars() {
        const db = getDb();
        return db.cars.filter(c => c.status === CarStatus.AVAILABLE).length;
    }
    function calculateTotalClients() {
        const db = getDb();
        return db.clients.filter(c => c.role === Role.CLIENT).length;
    }
    function renderKPIs() {
        const totalRevenue = calculateTotalRevenue();
        const activeContracts = calculateActiveContracts();
        const availableCars = calculateAvailableCars();
        const totalClients = calculateTotalClients();
        const revenueEl = document.getElementById('kpi-revenue');
        if (revenueEl) {
            revenueEl.textContent = totalRevenue.toLocaleString('fr-FR') + ' MAD';
        }
        const activeContractsEl = document.getElementById('kpi-active-contracts');
        if (activeContractsEl) {
            activeContractsEl.textContent = activeContracts;
        }
        const availableCarsEl = document.getElementById('kpi-available-cars');
        if (availableCarsEl) {
            availableCarsEl.textContent = availableCars;
        }
        const totalClientsEl = document.getElementById('kpi-total-clients');
        if (totalClientsEl) {
            totalClientsEl.textContent = totalClients;
        }
    }
    function getAnalyticsData() {
        const db = getDb();
        const carStatusData = {
            AVAILABLE: db.cars.filter(c => c.status === CarStatus.AVAILABLE).length,
            RENTED: db.cars.filter(c => c.status === CarStatus.RENTED).length,
            MAINTENANCE: db.cars.filter(c => c.status === CarStatus.MAINTENANCE).length,
        };
        const revenueByMonth = calculateMonthlyRevenue();
        const maintenanceCostsByType = db.maintenances.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + m.cost;
            return acc;
        }, {});
        const carRentCounts = {};
        db.contracts.forEach(ct => {
            const car = db.cars.find(c => c.id === ct.carId);
            if (car) {
                const modelName = `${car.brand} ${car.model}`;
                carRentCounts[modelName] = (carRentCounts[modelName] || 0) + 1;
            }
        });
        const topModels = Object.entries(carRentCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([model, count]) => ({ model, count }));
        const carsByAgency = db.cars.reduce((acc, car) => {
            const agency = db.agencies.find(a => a.id === car.agencyId);
            const agencyName = agency ? agency.name : 'Non Assigné';
            acc[agencyName] = (acc[agencyName] || 0) + 1;
            return acc;
        }, {});
        return {
            chartsData: {
                carStatusData,
                revenueByMonth,
                maintenanceCostsByType,
                topModels,
                carsByAgency
            }
        };
    }
    function renderCarStatusChart(data) {
        const ctx = document.getElementById('chart-fleet-status').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Disponible', 'Louée', 'Maintenance'],
                datasets: [{
                    data: [data.AVAILABLE, data.RENTED, data.MAINTENANCE],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                }
            }
        });
    }
    function renderRevenueTrendChart(data) {
        const ctx = document.getElementById('chart-revenue-trend').getContext('2d');
        const sortedData = Object.entries(data)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .slice(-6);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedData.map(([month]) => month),
                datasets: [{
                    label: 'Revenus (MAD)',
                    data: sortedData.map(([, amount]) => amount),
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    function renderMaintenanceCostChart(data) {
        const ctx = document.getElementById('chart-maintenance-cost');
        if (!ctx) return;
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Coût Total (MAD)',
                    data: Object.values(data),
                    backgroundColor: '#EF4444',
                }]
            },
            options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
        });
    }
    function renderTopModelsChart(data) {
        const ctx = document.getElementById('chart-top-models');
        if (!ctx) return;
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.map(item => item.model),
                datasets: [{
                    label: 'Nombre de Locations',
                    data: data.map(item => item.count),
                    backgroundColor: '#3B82F6',
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: { x: { beginAtZero: true } }
            }
        });
    }
    function renderAgencyOccupationChart(data) {
        const ctx = document.getElementById('chart-agency-occup');
        if (!ctx) return;
        new Chart(ctx.getContext('2d'), {
            type: 'polarArea',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'right' }
                },
                scales: { r: { beginAtZero: true } }
            }
        });
    }
    function initializeDashboard() {
        renderKPIs();
        const { chartsData } = getAnalyticsData();
        renderCarStatusChart(chartsData.carStatusData);
        renderRevenueTrendChart(chartsData.revenueByMonth);
        renderMaintenanceCostChart(chartsData.maintenanceCostsByType);
        renderTopModelsChart(chartsData.topModels);
        renderAgencyOccupationChart(chartsData.carsByAgency);
    }
    initializeDashboard();
});