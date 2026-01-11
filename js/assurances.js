document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'assurances';
    const container = document.getElementById('assurances-crud-container');
    let currentEditingAssurance = null;

    function renderAssurancesTable() {
        const assurances = getAllItems(ENTITY_NAME);

        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher par nom...">
                <button id="add-assurance-btn" class="btn btn-primary bg-blue-600 hover:bg-blue-700">
                    <i class="fas fa-plus"></i> Ajouter une Assurance
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm" id="assurances-table">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="name" class="sortable">Nom</th>
                            <th data-key="dailyCost" class="sortable">Coût Quotidien (MAD)</th>
                            <th data-key="coverage" class="sortable">Couverture</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="assurances-table-body">
                        ${renderTableBody(assurances)}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        attachTableEventListeners();
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        document.getElementById('add-assurance-btn').addEventListener('click', () => {
            showAssuranceForm();
        });
    }
    
    function renderTableBody(assurances) {
        return assurances.map(ass => `
            <tr>
                <td>${ass.name}</td>
                <td>${ass.dailyCost}</td>
                <td>${ass.coverage}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${ass.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${ass.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function attachTableEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                handleEdit(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Confirmer la suppression ?')) {
                    deleteItem(ENTITY_NAME, id);
                    renderAssurancesTable();
                }
            });
        });
    }

    function showAssuranceForm(assurance = null) {
        currentEditingAssurance = assurance;
        const isEditing = assurance !== null;

        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">${isEditing ? 'Modifier l\'Assurance' : 'Ajouter une Assurance'}</h3>
                <form id="assurance-form" class="row g-3">
                    <div class="col-md-6"><label class="form-label">Nom</label><input type="text" name="name" class="form-control" value="${assurance ? assurance.name : ''}" required></div>
                    <div class="col-md-6"><label class="form-label">Coût Quotidien (MAD)</label><input type="number" name="dailyCost" class="form-control" value="${assurance ? assurance.dailyCost : ''}" required></div>
                    <div class="col-12"><label class="form-label">Couverture</label><input type="text" name="coverage" class="form-control" value="${assurance ? assurance.coverage : ''}" required></div>
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success me-2">${isEditing ? 'Sauvegarder' : 'Créer'}</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        const existingForm = container.querySelector('#assurance-form');
        if (existingForm) existingForm.parentElement.remove();
        
        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHtml;
        container.insertAdjacentElement('afterbegin', formContainer);

        const newForm = formContainer.querySelector('#assurance-form');
        if (newForm) {
            newForm.addEventListener('submit', handleAssuranceFormSubmit);
        }

        document.getElementById('cancel-form-btn').addEventListener('click', () => formContainer.remove());
    }

    function handleEdit(id) {
        const assuranceToEdit = getItemById(ENTITY_NAME, id);
        if (assuranceToEdit) {
            showAssuranceForm(assuranceToEdit);
        }
    }
    
    function handleAssuranceFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = (key === 'name' || key === 'coverage') ? value : Number(value);
        });
        
        let success = false;
        
        if (currentEditingAssurance) {
            const updatedAssurance = { ...currentEditingAssurance, ...data };
            success = updateItem(ENTITY_NAME, updatedAssurance);
        } else {
            success = createItem(ENTITY_NAME, data);
        }
        
        if (success) {
            alert(`Assurance ${currentEditingAssurance ? 'mise à jour' : 'créée'} avec succès.`);
            currentEditingAssurance = null;
            e.target.parentElement.remove(); 
            renderAssurancesTable();
        } else {
            alert("Erreur lors de l'opération.");
        }
    }

    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allAssurances = getAllItems(ENTITY_NAME);
        const filtered = allAssurances.filter(ass => ass.name.toLowerCase().includes(searchText));
        attachTableEventListeners();
    }

    renderAssurancesTable();
});
