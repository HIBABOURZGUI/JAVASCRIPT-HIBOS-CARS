document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'accessories';
    const container = document.getElementById('accessories-crud-container');
    let currentEditingAccessory = null;

    function renderAccessoriesTable() {
        const accessories = getAllItems(ENTITY_NAME);

        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher par nom...">
                <button id="add-accessory-btn" class="btn btn-primary bg-blue-600 hover:bg-blue-700">
                    <i class="fas fa-plus"></i> Ajouter un Accessoire
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm" id="accessories-table">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="name" class="sortable">Nom</th>
                            <th data-key="price" class="sortable">Prix (MAD)</th>
                            <th data-key="stock" class="sortable">Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="accessories-table-body">
                        ${renderTableBody(accessories)}
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
        
        document.getElementById('add-accessory-btn').addEventListener('click', () => {
            showAccessoryForm();
        });
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
                    renderAccessoriesTable();
                }
            });
        });
    }

    function showAccessoryForm(accessory = null) {
        currentEditingAccessory = accessory;
        const isEditing = accessory !== null;

        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">${isEditing ? 'Modifier l\'Accessoire' : 'Ajouter un Accessoire'}</h3>
                <form id="accessory-form" class="row g-3">
                    <div class="col-md-6"><label class="form-label">Nom</label><input type="text" name="name" class="form-control" value="${accessory ? accessory.name : ''}" required></div>
                    <div class="col-md-6"><label class="form-label">Prix (MAD)</label><input type="number" name="price" class="form-control" value="${accessory ? accessory.price : ''}" required></div>
                    <div class="col-md-6"><label class="form-label">Stock</label><input type="number" name="stock" class="form-control" value="${accessory ? accessory.stock : ''}" required></div>
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success me-2">${isEditing ? 'Sauvegarder' : 'Créer'}</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        const existingForm = container.querySelector('#accessory-form');
        if (existingForm) existingForm.parentElement.remove();
        
        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHtml;
        container.insertAdjacentElement('afterbegin', formContainer);

        const newForm = formContainer.querySelector('#accessory-form');
        if (newForm) {
            newForm.addEventListener('submit', handleAccessoryFormSubmit);
        }

        document.getElementById('cancel-form-btn').addEventListener('click', () => formContainer.remove());
    }

    function handleEdit(id) {
        const accessoryToEdit = getItemById(ENTITY_NAME, id);
        if (accessoryToEdit) {
            showAccessoryForm(accessoryToEdit);
        }
    }
    
    function handleAccessoryFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = isNaN(value) ? value : Number(value);
        });
        
        let success = false;
        
        if (currentEditingAccessory) {
            const updatedAccessory = { ...currentEditingAccessory, ...data };
            success = updateItem(ENTITY_NAME, updatedAccessory);
        } else {
            success = createItem(ENTITY_NAME, data);
        }
        
        if (success) {
            alert(`Accessoire ${currentEditingAccessory ? 'mis à jour' : 'créé'} avec succès.`);
            currentEditingAccessory = null;
            e.target.parentElement.remove(); 
            renderAccessoriesTable();
        } else {
            alert("Erreur lors de l'opération.");
        }
    }

    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allAccessories = getAllItems(ENTITY_NAME);
        const filtered = allAccessories.filter(acc => acc.name.toLowerCase().includes(searchText));
        document.getElementById('accessories-table-body').innerHTML = renderTableBody(filtered);
        attachTableEventListeners();
    }

    renderAccessoriesTable();
});
