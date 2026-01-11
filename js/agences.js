document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'agencies';
    const container = document.getElementById('agences-crud-container');
    let currentEditingAgency = null;

    function renderAgenciesTable() {
        const agencies = getAllItems(ENTITY_NAME);
        const cars = getAllItems('cars');
        const agencyCarCounts = cars.reduce((acc, car) => {
            if (car.agencyId) {
                acc[car.agencyId] = (acc[car.agencyId] || 0) + 1;
            }
            return acc;
        }, {});

        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher par ville ou nom d'agence...">
                <button id="add-agency-btn" class="btn btn-primary bg-blue-600 hover:bg-blue-700">
                    <i class="fas fa-plus"></i> Ajouter une Nouvelle Agence
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm" id="agences-table">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="name" class="sortable">Nom de l'Agence</th>
                            <th data-key="city" class="sortable">Ville</th>
                            <th data-key="address" class="sortable">Adresse</th>
                            <th>Voitures Stockées</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="agences-table-body">
                        ${renderTableBody(agencies, agencyCarCounts)}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        attachTableEventListeners();
    }
    
    function renderTableBody(agencies, counts) {
        if (agencies.length === 0) {
            return '<tr><td colspan="5" class="text-center p-4 text-muted">Aucune agence trouvée.</td></tr>';
        }

        return agencies.map(agency => `
            <tr data-id="${agency.id}">
                <td>${agency.name}</td>
                <td>${agency.city}</td>
                <td>${agency.address}</td>
                <td><span class="badge bg-secondary">${counts[agency.id] || 0}</span></td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${agency.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${agency.id}" title="Supprimer l'Agence"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function attachTableEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const agencyId = this.dataset.id;
                const carCount = getAllItems('cars').filter(c => c.agencyId === agencyId).length;
                
                if (carCount > 0) {
                    alert(`Impossible de supprimer. ${carCount} voiture(s) est/sont encore associée(s) à cette agence.`);
                    return;
                }

                if (confirm(`Êtes-vous sûr de vouloir supprimer l'agence ${agencyId} ?`)) {
                    handleDelete(agencyId);
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const agencyId = this.dataset.id;
                handleEdit(agencyId);
            });
        });

        document.getElementById('add-agency-btn').addEventListener('click', function() {
            showAgencyForm();
        });
        
        document.getElementById('search-input').addEventListener('input', handleSearch);
    }
    
    function handleDelete(id) {
        if (deleteItem(ENTITY_NAME, id)) {
            alert("Agence supprimée avec succès.");
            renderAgenciesTable();
        } else {
            alert("Erreur lors de la suppression.");
        }
    }

    function showAgencyForm(agency = null) {
        currentEditingAgency = agency;
        const isEditing = agency !== null;

        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">${isEditing ? 'Modifier l\'Agence' : 'Ajouter une Nouvelle Agence'}</h3>
                <form id="agency-form" class="row g-3">
                    <div class="col-md-6"><label class="form-label">Nom</label><input type="text" name="name" class="form-control" value="${agency ? agency.name : ''}" required></div>
                    <div class="col-md-6"><label class="form-label">Ville</label><input type="text" name="city" class="form-control" value="${agency ? agency.city : ''}" required></div>
                    <div class="col-12"><label class="form-label">Adresse Complète</label><input type="text" name="address" class="form-control" value="${agency ? agency.address : ''}" required></div>
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success me-2">${isEditing ? 'Sauvegarder' : 'Créer l\'Agence'}</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        const existingForm = container.querySelector('#agency-form');
        if (existingForm) existingForm.parentElement.remove();
        
        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHtml;
        container.insertAdjacentElement('afterbegin', formContainer);

        const newForm = formContainer.querySelector('#agency-form');
        if (newForm) {
            newForm.addEventListener('submit', handleAgencyFormSubmit);
        }

        document.getElementById('cancel-form-btn').addEventListener('click', () => formContainer.remove());
    }

    function handleEdit(id) {
        const agencyToEdit = getItemById(ENTITY_NAME, id);
        if (agencyToEdit) {
            showAgencyForm(agencyToEdit);
        }
    }
    
    function handleAgencyFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => data[key] = value);
        
        let success = false;
        
        if (currentEditingAgency) {
            const updatedAgency = { ...currentEditingAgency, ...data };
            success = updateItem(ENTITY_NAME, updatedAgency);
        } else {
            success = createItem(ENTITY_NAME, data);
        }
        
        if (success) {
            alert(`Agence ${currentEditingAgency ? 'mise à jour' : 'créée'} avec succès.`);
            currentEditingAgency = null;
            e.target.parentElement.remove(); 
            renderAgenciesTable();
        } else {
            alert("Erreur lors de l'opération.");
        }
    }

    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allAgencies = getAllItems(ENTITY_NAME);
        const cars = getAllItems('cars');
        const agencyCarCounts = cars.reduce((acc, car) => {
            if (car.agencyId) {
                acc[car.agencyId] = (acc[car.agencyId] || 0) + 1;
            }
            return acc;
        }, {});
        
        const filtered = allAgencies.filter(agency => 
            agency.name.toLowerCase().includes(searchText) ||
            agency.city.toLowerCase().includes(searchText) ||
            agency.address.toLowerCase().includes(searchText)
        );
        
        document.getElementById('agences-table-body').innerHTML = renderTableBody(filtered, agencyCarCounts);
    }

    renderAgenciesTable();
});