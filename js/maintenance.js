document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'maintenances';
    const container = document.getElementById('maintenance-crud-container');
    let currentEditingMaintenance = null;

    function getMaintenanceWithDetails() {
        const maintenances = getAllItems(ENTITY_NAME);
        const cars = getAllItems('cars');

        return maintenances.map(m => {
            const car = cars.find(c => c.id === m.carId);

            return {
                ...m,
                carModel: car ? `${car.brand} ${car.model} (${car.plate})` : 'Voiture Inconnue',
                carStatus: car ? car.status : 'N/A'
            };
        });
    }
    
    function renderMaintenanceTable() {
        const maintenances = getMaintenanceWithDetails();
        
        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher par type, modèle, ou coût...">
                <button id="add-maintenance-btn" class="btn btn-primary bg-blue-600 hover:bg-blue-700">
                    <i class="fas fa-plus"></i> Enregistrer une Opération
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="carModel" class="sortable">Voiture</th>
                            <th data-key="type" class="sortable">Type d'Opération</th>
                            <th data-key="cost" class="sortable">Coût (€)</th>
                            <th data-key="startDate" class="sortable">Début</th>
                            <th data-key="endDate" class="sortable">Fin</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="maintenance-table-body">
                        ${renderTableBody(maintenances)}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        attachTableEventListeners();
    }
    
    function renderTableBody(maintenances) {
        if (maintenances.length === 0) {
            return '<tr><td colspan="6" class="text-center p-4 text-muted">Aucun enregistrement de maintenance trouvé.</td></tr>';
        }

        return maintenances.map(m => `
            <tr data-id="${m.id}">
                <td>${m.carModel}</td>
                <td>${m.type}</td>
                <td>${m.cost.toFixed(2)}</td>
                <td>${m.startDate}</td>
                <td>${m.endDate}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${m.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${m.id}" title="Supprimer l'enregistrement"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function attachTableEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const maintenanceId = this.dataset.id;
                if (confirm(`Êtes-vous sûr de vouloir supprimer l'enregistrement de maintenance ${maintenanceId} ?`)) {
                    handleDelete(maintenanceId);
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const maintenanceId = this.dataset.id;
                handleEdit(maintenanceId);
            });
        });

        document.getElementById('add-maintenance-btn').addEventListener('click', function() {
            showMaintenanceForm();
        });
        
        document.getElementById('search-input').addEventListener('input', handleSearch);
    }
    
    function handleDelete(id) {
        if (deleteItem(ENTITY_NAME, id)) {
            alert("Enregistrement de maintenance supprimé.");
            renderMaintenanceTable();
        } else {
            alert("Erreur lors de la suppression.");
        }
    }

    function showMaintenanceForm(maintenance = null) {
        currentEditingMaintenance = maintenance;
        const isEditing = maintenance !== null;
        
        const allCars = getAllItems('cars');

        const carOptions = allCars.map(car => `
            <option value="${car.id}" ${maintenance && maintenance.carId === car.id ? 'selected' : ''}>
                ${car.brand} ${car.model} (${car.plate} - Statut: ${car.status})
            </option>
        `).join('');

        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">${isEditing ? 'Modifier l\'Opération' : 'Nouvelle Opération de Maintenance'}</h3>
                <form id="maintenance-form" class="row g-3">
                    <div class="col-md-6"><label class="form-label">Voiture concernée</label>
                        <select name="carId" id="car-select-maintenance" class="form-select" required>
                            <option value="">-- Sélectionner une voiture --</option>
                            ${carOptions}
                        </select>
                    </div>
                    
                    <div class="col-md-6"><label class="form-label">Type d'Opération</label><input type="text" name="type" class="form-control" value="${maintenance ? maintenance.type : ''}" required></div>
                    
                    <div class="col-md-4"><label class="form-label">Coût (€)</label><input type="number" name="cost" class="form-control" value="${maintenance ? maintenance.cost : ''}" required min="0"></div>
                    <div class="col-md-4"><label class="form-label">Date de Début</label><input type="date" name="startDate" class="form-control" value="${maintenance ? maintenance.startDate : ''}" required></div>
                    <div class="col-md-4"><label class="form-label">Date de Fin (Estimée/Réelle)</label><input type="date" name="endDate" class="form-control" value="${maintenance ? maintenance.endDate : ''}" required></div>
                    
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success me-2">${isEditing ? 'Sauvegarder' : 'Enregistrer'}</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        const existingForm = container.querySelector('#maintenance-form');
        if (existingForm) existingForm.parentElement.remove();
        
        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHtml;
        container.insertAdjacentElement('afterbegin', formContainer);

        document.getElementById('cancel-form-btn').addEventListener('click', () => formContainer.remove());
    }

    function handleEdit(id) {
        const maintenanceToEdit = getItemById(ENTITY_NAME, id);
        if (maintenanceToEdit) {
            showMaintenanceForm(maintenanceToEdit);
        }
    }
    
    container.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'maintenance-form') {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {};
            formData.forEach((value, key) => data[key] = key === 'cost' ? parseFloat(value) : value);
            
            let success = false;
            let maintenanceObj;
            
            if (currentEditingMaintenance) {
                maintenanceObj = { ...currentEditingMaintenance, ...data };
                success = updateItem(ENTITY_NAME, maintenanceObj);
            } else {
                success = createItem(ENTITY_NAME, data);
                maintenanceObj = success;
            }
            
            if (success) {
                alert(`Opération ${currentEditingMaintenance ? 'mise à jour' : 'enregistrée'} avec succès.`);

                const car = getItemById('cars', data.carId);
                
                if (!currentEditingMaintenance && car && car.status !== CarStatus.MAINTENANCE) {
                    updateItem('cars', { ...car, status: CarStatus.MAINTENANCE });
                }
                
                currentEditingMaintenance = null;
                e.target.parentElement.remove(); 
                renderMaintenanceTable();
                
            } else {
                alert("Erreur lors de l'opération.");
            }
        }
    });

    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allMaintenances = getMaintenanceWithDetails();
        
        const filtered = allMaintenances.filter(m => 
            m.type.toLowerCase().includes(searchText) ||
            m.carModel.toLowerCase().includes(searchText) ||
            String(m.cost).includes(searchText)
        );
        
        document.getElementById('maintenance-table-body').innerHTML = renderTableBody(filtered);
    }

    renderMaintenanceTable();
});