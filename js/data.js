const STORAGE_KEY = 'autorent_db_v1';
const STORAGE_VERSION_KEY = 'autorent_db_version';
const CURRENT_VERSION = 3;

function generateUniqueId() {
    return Math.random().toString(36).substring(2, 11);
}

const migrations = {
    1: (data) => data,
    2: (data) => {
        if (data.agencies) {
            data.agencies = data.agencies.map(agency => {
                if (agency.id === 'a1') {
                    return { ...agency, name: 'SIDI MAAROUF', city: 'Casablanca', address: 'SIDI MAAROUF CASA' };
                }
                if (agency.id === 'a2') {
                    return { ...agency, name: 'OULFA', city: 'Casablanca', address: 'OULFA CASA' };
                }
                return agency;
            });
        }
        return data;
    },
    3: (data) => migrations[2](data)
};

function applyMigrations(data, fromVersion) {
    let currentData = data;
    for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
        if (migrations[v]) {
            console.log(`Applying migration ${v}...`);
            currentData = migrations[v](currentData);
        }
    }
    return currentData;
}

const INITIAL_DATA = {
    clients: [
        { id: 'admin1', name: 'Super Admin', email: 'ak@gmail.com', password: 'aymen@kamal', role: 'ADMIN', accountStatus: 'ACTIVE' },
        { id: 'aykcars', name: 'Aykars', email: 'ayka@gmail.com', password: '123456', role: 'CLIENT', accountStatus: 'ACTIVE' },
        { id: 'client_B', name: 'Bob Martin', email: 'bob@test.com', password: 'pass', role: 'CLIENT', accountStatus: 'BLOCKED' },
    ],
    cars: [
        { id: 'v1', brand: 'Renault', model: 'Clio V', plate: 'ا - 23456 - 1', pricePerDay: 350, status: 'AVAILABLE', agencyId: 'a1', imagePath: 'assets/car_images/renault_clio_5.jpg' },
        { id: 'v2', brand: 'Peugeot', model: '208', plate: 'ب - 78901 - 6', pricePerDay: 400, status: 'RENTED', agencyId: 'a1', imagePath: 'assets/car_images/peugeot_208.jpg' },
        { id: 'v3', brand: 'KIA', model: 'Picanto', plate: 'ج - 34567 - 6', pricePerDay: 250, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/kia_picanto.jpg' },
        { id: 'v4', brand: 'Dacia', model: 'Sandero', plate: 'د - 89012 - 1', pricePerDay: 300, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/dacia_sandero.jpg' },
        { id: 'v5', brand: 'Dacia', model: 'Logan', plate: 'ه - 45678 - 6', pricePerDay: 300, status: 'AVAILABLE', agencyId: 'a1', imagePath: 'assets/car_images/dacia_logan.jpg' },
        { id: 'v14', brand: 'Seat', model: 'Leon FR', plate: 'ن - 11223 - 1', pricePerDay: 700, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/seat_leon_fr.jpg' },
        { id: 'v15', brand: 'Opel', model: 'Corsa', plate: 'س - 44556 - 6', pricePerDay: 350, status: 'AVAILABLE', agencyId: 'a1', imagePath: 'assets/car_images/opel_corsa.jpg' },
        { id: 'v6', brand: 'Hyundai', model: 'Elantra', plate: 'و - 90123 - 1', pricePerDay: 550, status: 'MAINTENANCE', agencyId: 'a1', imagePath: 'assets/car_images/hyundai_elantra.jpg' },
        { id: 'v7', brand: 'Volkswagen', model: 'T-Roc', plate: 'ز - 56789 - 6', pricePerDay: 750, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/vw_troc.jpg' },
        { id: 'v8', brand: 'Volkswagen', model: 'Golf 8.5 R-Line', plate: 'ح - 12345 - 1', pricePerDay: 850, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/vw_golf_8.jpg' },
        { id: 'v9', brand: 'KIA', model: 'Sportage', plate: 'ط - 67890 - 6', pricePerDay: 900, status: 'RENTED', agencyId: 'a1', imagePath: 'assets/car_images/kia_sportage.jpg' },
        { id: 'v10', brand: 'Hyundai', model: 'Tucson', plate: 'ي - 23456 - 1', pricePerDay: 950, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/hyundai_tucson.jpg' },
        { id: 'v11', brand: 'Volkswagen', model: 'Tiguan', plate: 'ك - 78901 - 6', pricePerDay: 1100, status: 'AVAILABLE', agencyId: 'a1', imagePath: 'assets/car_images/vw_tiguan.jpg' },
        { id: 'v12', brand: 'Audi', model: 'Q8', plate: 'ل - 34567 - 1', pricePerDay: 3000, status: 'AVAILABLE', agencyId: 'a2', imagePath: 'assets/car_images/audi_q8.jpg' },
        { id: 'v13', brand: 'Volkswagen', model: 'Touareg', plate: 'م - 89012 - 6', pricePerDay: 1800, status: 'AVAILABLE', agencyId: 'a1', imagePath: 'assets/car_images/vw_touareg.jpg' },
    ],
    agencies: [
        { id: 'a1', name: 'SIDI MAAROUF', city: 'Casablanca', address: 'SIDI MAAROUF CASA' },
        { id: 'a2', name: 'OULFA', city: 'Casablanca', address: 'OULFA CASA' },
    ],
    contracts: [
        { id: 'ct1', clientId: 'client_A', carId: 'v2', startDate: '2025-11-20', endDate: '2025-12-10', totalAmount: 2600, status: 'ACTIVE' },
        { id: 'ct2', clientId: 'client_A', carId: 'v5', startDate: '2025-10-01', endDate: '2025-10-05', totalAmount: 200, status: 'COMPLETED' },
    ],
    maintenances: [
        { id: 'm1', carId: 'v3', type: 'Révision Annuelle', cost: 350, startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: 'm2', carId: 'v3', type: 'Remplacement Pneu', cost: 180, startDate: '2025-08-10', endDate: '2025-08-10' },
    ],
    assurances: [
        { id: 'as1', name: 'Standard', dailyCost: 5, coverage: 'Responsabilité civile minimale' },
        { id: 'as2', name: 'Premium', dailyCost: 15, coverage: 'Dommages et vol complet' },
    ],
    accessories: [
        { id: 'ac1', name: 'Siège Bébé', price: 15, stock: 10 },
        { id: 'ac2', name: 'GPS Navigator', price: 10, stock: 25 },
    ],
    invoices: [
        { id: 'inv1', contractId: 'ct2', amount: 200, status: 'PAID', date: '2025-10-05' },
    ],
    resetTokens: [],
    temp_verification: [] 
};

function getDb() {
    console.log('🔵 getDb() appelé');
    console.log('   STORAGE_KEY:', STORAGE_KEY);
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedVersion = parseInt(localStorage.getItem(STORAGE_VERSION_KEY) || '0', 10);
    
    console.log('   localStorage.getItem() retourne:', stored ? `${stored.length} caractères` : 'NULL');
    console.log('   stored Version:', storedVersion);
    
    let db;
    
    if (!stored) {
        console.log('   ⚠️ localStorage VIDE! Utilisation INITIAL_DATA');
        db = JSON.parse(JSON.stringify(INITIAL_DATA));
    } else {
        try {
            db = JSON.parse(stored);
            console.log('   ✅ Données chargées depuis localStorage');
            console.log('   resetTokens dans DB chargée:', db.resetTokens ? db.resetTokens.length : 'undefined');
        } catch (e) {
            console.error("Erreur lors du parsing des données, réinitialisation.", e);
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_VERSION_KEY);
            return getDb();
        }
    }
    
    if (storedVersion < CURRENT_VERSION) {
        console.log(`Upgrading database from version ${storedVersion} to ${CURRENT_VERSION}`);
        db = applyMigrations(db, storedVersion);
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }

    let hasChanges = false;
    const requiredCollections = Object.keys(INITIAL_DATA);
    
    for (const collection of requiredCollections) {
        if (!db[collection]) {
            console.warn(`⚠️ Collection manquante détectée: ${collection}. Initialisation...`);
            db[collection] = INITIAL_DATA[collection] ? JSON.parse(JSON.stringify(INITIAL_DATA[collection])) : [];
            hasChanges = true;
        }
    }
    
    if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        console.log('✅ Collections et tokens nettoyés et sauvegardés');
    }
    
    return db;
}

function saveDb(data) {
    console.log('🟢 saveDb() appelé');
    console.log('   Données à sauvegarder - resetTokens:', data.resetTokens ? `${data.resetTokens.length} tokens` : 'UNDEFINED!');
    console.log('   Entités dans data:', Object.keys(data));
    
    const jsonStr = JSON.stringify(data);
    console.log('   JSON stringifié:', jsonStr.length, 'caractères');
    console.log('   resetTokens inclus dans JSON?', jsonStr.includes('resetTokens') ? 'OUI' : 'NON');
    
    localStorage.setItem(STORAGE_KEY, jsonStr);
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    
    console.log('   ✅ Sauvegardé dans localStorage');
}

function resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_VERSION_KEY);
    console.log("Base de données réinitialisée");
}

function updateContractsAndVehicles() {
    const db = getDb();
    const today = new Date();
    let dbModified = false;

    db.contracts.forEach(contract => {
        if (contract.status === 'ACTIVE') {
            const endDate = new Date(contract.endDate);
            
            if (endDate < today) {
                contract.status = 'COMPLETED';
                dbModified = true;
                console.log(`Contrat ${contract.id} marqué comme COMPLETED (date dépassée)`);
                
                const car = db.cars.find(c => c.id === contract.carId);
                if (car && car.status === 'RENTED') {
                    car.status = 'AVAILABLE';
                    console.log(`Voiture ${car.id} marquée comme AVAILABLE`);
                }
            }
        }
    });

    if (dbModified) {
        saveDb(db);
    }
}

function calculateTotalRevenue() {
    const db = getDb();
    return db.contracts
        .filter(c => c.status === 'COMPLETED')
        .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
}

function calculateMonthlyRevenue() {
    const db = getDb();
    const revenueByMonth = {};
    
    db.contracts
        .filter(c => c.status === 'COMPLETED')
        .forEach(ct => {
            const date = new Date(ct.endDate);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (ct.totalAmount || 0);
        });
    
    return revenueByMonth;
}

updateContractsAndVehicles();
setInterval(updateContractsAndVehicles, 5 * 60 * 1000);

window.getDb = getDb;
window.saveDb = saveDb;
window.generateUniqueId = generateUniqueId;
window.resetDatabase = resetDatabase;
window.updateContractsAndVehicles = updateContractsAndVehicles;
window.calculateTotalRevenue = calculateTotalRevenue;
window.calculateMonthlyRevenue = calculateMonthlyRevenue;