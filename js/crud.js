function getAllItems(entityName) {
    const db = getDb();
    if (db[entityName]) {
        return db[entityName];
    }
    console.error(`Entité inconnue: ${entityName}`);
    return [];
}

function getItemById(entityName, id) {
    const items = getAllItems(entityName);
    const stringId = String(id);

    for (let i = 0; i < items.length; i++) {
        if (String(items[i].id) === stringId) {
            return items[i];
        }
    }
    return null;
}

function createItem(entityName, newItemData) {
    console.log(`🔵 createItem() appelé pour: ${entityName}`);
    console.log('   Données reçues:', newItemData);
    
    const db = getDb();
    console.log('   DB chargée. ResetTokens actuel:', db.resetTokens);
    
    if (!db[entityName]) {
        console.error(`Impossible d'ajouter, entité non définie: ${entityName}`);
        return null;
    }
    
    const newItem = newItemData.id ? 
        newItemData :
        { id: generateUniqueId(), ...newItemData };
    
    console.log('   Item final à ajouter:', newItem);
    db[entityName].push(newItem);
    console.log(`   ✅ Item ajouté à DB. Total ${entityName}:`, db[entityName].length);
    
    console.log('   AVANT saveDb() - DB.resetTokens:', db.resetTokens);
    
    saveDb(db);
    
    console.log('   APRÈS saveDb() - Vérification localStorage:');
    const stored = localStorage.getItem('autorent_db_v1');
    if (stored) {
        const parsed = JSON.parse(stored);
        console.log('   ✅ localStorage contient resetTokens:', parsed.resetTokens);
    } else {
        console.error('   ❌ localStorage EST VIDE!');
    }
    
    return newItem;
}

function updateItem(entityName, updatedItem) {
    if (!updatedItem.id) {
        console.error("Erreur CRUD: Tentative de mise à jour sans ID.");
        return false;
    }
    
    const db = getDb();
    
    if (!db[entityName]) return false;
    
    const updatedIdString = String(updatedItem.id);
    let index = -1;

    for (let i = 0; i < db[entityName].length; i++) {
        if (String(db[entityName][i].id) === updatedIdString) {
            index = i;
            break;
        }
    }
    
    console.log(`Tentative de mise à jour de ${entityName} ID: ${updatedItem.id}. Index trouvé: ${index}`);
    
    if (index !== -1) {
        const mergedItem = { ...db[entityName][index], ...updatedItem };
        
        db[entityName][index] = mergedItem; 
        saveDb(db);
        console.log(`Mise à jour réussie de ${entityName}.`);
        return true;
    }
    console.warn(`Échec de la mise à jour de ${entityName}: ID ${updatedItem.id} non trouvé.`);
    return false;
}

function deleteItem(entityName, id) {
    const db = getDb();
    
    if (!db[entityName]) return false;
    
    const initialLength = db[entityName].length;
    
    db[entityName] = db[entityName].filter(item => String(item.id) !== String(id)); 
    
    if (db[entityName].length < initialLength) {
        saveDb(db);
        return true;
    }
    return false;
}

window.getAllItems = getAllItems;
window.getItemById = getItemById;
window.createItem = createItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;