document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'contracts';
    const container = document.getElementById('contrats-crud-container');
    let currentEditingContract = null;
    let currentCarPricePerDay = 0;
    function getContractsWithDetails() {
        const contracts = getAllItems(ENTITY_NAME);
        const cars = getAllItems('cars');
        const clients = getAllItems('clients');
        return contracts.map(contract => {
            const car = cars.find(c => c.id === contract.carId);
            const client = clients.find(c => c.id === contract.clientId);
            return {
                ...contract,
                clientName: client ? client.name : 'Client Inconnu',
                carModel: car ? `${car.brand} ${car.model} (${car.plate})` : 'Voiture Inconnue',
                carPricePerDay: car ? car.pricePerDay : 0
            };
        });
    }
    function calculateTotalAmount(startDate, endDate, pricePerDay) {
        if (!startDate || !endDate || pricePerDay <= 0) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays * pricePerDay : 0;
    }
    function renderContractsTable() {
        const contracts = getContractsWithDetails();
        const allFormWrappers = container.querySelectorAll('form#contract-form');
        allFormWrappers.forEach(form => {
            const wrapper = form.closest('div');
            if (wrapper && wrapper.parentElement === container) {
                wrapper.remove();
            }
        });
        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher (Client, Modèle, ID)...">
                <div>
                    <button id="export-csv-btn" class="btn btn-secondary me-2 bg-gray-500 hover:bg-gray-600 text-white">
                        <i class="fas fa-download"></i> Exporter CSV
                    </button>
                    <button id="add-contract-btn" class="btn btn-primary bg-blue-600 hover:bg-blue-700">
                        <i class="fas fa-plus"></i> Créer un Contrat
                    </button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm" id="contracts-table">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="id" class="sortable">ID</th>
                            <th data-key="clientName" class="sortable">Client</th>
                            <th data-key="carModel" class="sortable">Voiture (Modèle/Plaque)</th>
                            <th data-key="startDate" class="sortable">Début</th>
                            <th data-key="endDate" class="sortable">Fin</th>
                            <th data-key="totalAmount" class="sortable">Montant Total (MAD)</th>
                            <th data-key="status" class="sortable">Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="contracts-table-body">
                        ${renderTableBody(contracts)}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        attachTableEventListeners(contracts);
    }
    function renderTableBody(contracts) {
        if (contracts.length === 0) {
            return '<tr><td colspan="8" class="text-center p-4 text-muted">Aucun contrat trouvé.</td></tr>';
        }
        return contracts.map(contract => `
            <tr data-id="${contract.id}">
                <td>${contract.id}</td>
                <td>${contract.clientName}</td>
                <td>${contract.carModel}</td>
                <td>${contract.startDate}</td>
                <td>${contract.endDate}</td>
                <td>${contract.totalAmount.toFixed(2)}</td>
                <td>${renderStatusBadge(contract.status)}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${contract.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${contract.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
    function renderStatusBadge(status) {
        let className = 'badge ';
        switch (status) {
            case ContractStatus.ACTIVE:
                className += 'bg-success';
                break;
            case ContractStatus.COMPLETED:
                className += 'bg-secondary';
                break;
            case ContractStatus.CANCELLED:
                className += 'bg-danger';
                break;
            default:
                className += 'bg-light text-dark';
        }
        return `<span class="${className}">${status}</span>`;
    }
    function attachTableEventListeners(data) {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const contractId = this.dataset.id;
                if (confirm(`Êtes-vous sûr de vouloir supprimer le contrat ${contractId} ?`)) {
                    handleDelete(contractId);
                }
            });
        });
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const contractId = this.dataset.id;
                handleEdit(contractId);
            });
        });
        document.getElementById('search-input').addEventListener('input', handleSearch);
        document.getElementById('add-contract-btn').addEventListener('click', () => showContractForm());
        attachExportListener(data);
    }
    function handleDelete(id) {
        if (deleteItem(ENTITY_NAME, id)) {
            alert("Contrat supprimé.");
            renderContractsTable();
        } else {
            alert("Erreur lors de la suppression.");
        }
    }
    function showContractForm(contract = null) {
        currentEditingContract = contract;
        const isEditing = contract !== null;
        
        // Récupérer les données liées pour les listes déroulantes
        const availableCars = getAllItems('cars').filter(c => c.status === CarStatus.AVAILABLE || (contract && c.id === contract.carId));
        const clients = getAllItems('clients').filter(c => c.role === Role.CLIENT && c.accountStatus === AccountStatus.ACTIVE);
        const assurances = getAllItems('assurances');
        const accessories = getAllItems('accessories');

        // HTML pour les options de voiture
        const carOptions = availableCars.map(car => `
            <option value="${car.id}" data-price="${car.pricePerDay}" ${contract && contract.carId === car.id ? 'selected' : ''}>
                ${car.brand} ${car.model} (${car.pricePerDay} MAD/jour)
            </option>
        `).join('');
        
        // HTML pour les options de client
        const clientOptions = clients.map(client => `
            <option value="${client.id}" ${contract && contract.clientId === client.id ? 'selected' : ''}>
                ${client.name} (${client.email})
            </option>
        `).join('');

        // HTML pour les options d'assurance (Standard par défaut)
        const assuranceOptions = assurances.map(ass => `
            <option value="${ass.id}" ${ass.name === 'Standard' ? 'selected' : ''}>${ass.name} - ${ass.dailyCost} MAD/jour</option>
        `).join('');

        // HTML pour les options d'accessoires (checkboxes)
        const accessoriesHtml = accessories.map(acc => `
            <div class="form-check">
                <input class="form-check-input accessory-checkbox" type="checkbox" name="accessories" value="${acc.id}" id="acc-${acc.id}" data-price="${acc.price}">
                <label class="form-check-label" for="acc-${acc.id}">${acc.name} (+${acc.price} MAD)</label>
            </div>
        `).join('');

        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">${isEditing ? 'Modifier le Contrat' : 'Créer un Nouveau Contrat'}</h3>
                <form id="contract-form" class="row g-3">
                    <input type="hidden" name="id" value="${contract ? contract.id : ''}">

                    <div class="col-md-6"><label class="form-label">Client</label>
                        <select name="clientId" class="form-select" required>
                            <option value="">-- Sélectionner un client --</option>
                            ${clientOptions}
                        </select>
                    </div>
                    
                    <div class="col-md-6"><label class="form-label">Voiture (Disponible)</label>
                        <select id="car-select" name="carId" class="form-select" required>
                            <option value="">-- Sélectionner une voiture --</option>
                            ${carOptions}
                        </select>
                    </div>
                    
                    <div class="col-md-4"><label class="form-label">Date de Début</label><input type="date" id="start-date" name="startDate" class="form-control" value="${contract ? contract.startDate : ''}" required></div>
                    <div class="col-md-4"><label class="form-label">Date de Fin</label><input type="date" id="end-date" name="endDate" class="form-control" value="${contract ? contract.endDate : ''}" required></div>
                    
                    <div class="col-md-4"><label class="form-label">Statut</label>
                        <select name="status" class="form-select">
                            ${Object.values(ContractStatus).map(s => `
                                <option value="${s}" ${contract && contract.status === s ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="col-12"><label class="form-label">Assurance</label>
                        <select name="assuranceId" class="form-select" id="assurance-select">
                            ${assuranceOptions}
                        </select>
                    </div>

                    <div class="col-12"><label class="form-label">Accessoires (Optionnels)</label>
                        <div class="p-3 border rounded bg-light">
                            ${accessoriesHtml}
                        </div>
                    </div>

                    <div class="col-12 mt-3 p-3 bg-light rounded">
                        <strong>Montant Total Estimé : </strong> <span id="total-amount-display" class="text-xl font-bold text-success">${contract ? contract.totalAmount.toFixed(2) : '0.00'} MAD</span>
                        <input type="hidden" name="totalAmount" id="total-amount-input" value="${contract ? contract.totalAmount : 0}">
                    </div>
                    
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success me-2">${isEditing ? 'Sauvegarder' : 'Créer le Contrat'}</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHtml;
        
        // Supprime l'ancien formulaire si présent
        const existingForm = container.querySelector('#contract-form');
        if (existingForm) existingForm.parentElement.remove();
        
        container.insertAdjacentElement('afterbegin', formContainer);
        const initialSelectedOption = document.querySelector('#car-select option:checked');
        if (initialSelectedOption) {
            currentCarPricePerDay = parseFloat(initialSelectedOption.dataset.price) || 0;
        }
        attachDynamicCalculationListeners(formContainer);
        const newForm = formContainer.querySelector('#contract-form');
        if (newForm) {
            newForm.addEventListener('submit', handleContractFormSubmit);
        }
    }
    function handleContractFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => data[key] = key === 'totalAmount' ? parseFloat(value) : value);
        let success = false;
        if (!currentEditingContract) {
            const { id, ...dataWithoutId } = data;
            const createdContract = createItem(ENTITY_NAME, dataWithoutId);
            success = createdContract !== null;
            if (success) {
                const carId = data.carId;
                const car = getItemById('cars', carId);
                if (car) {
                    updateItem('cars', { ...car, status: CarStatus.RENTED });
                }
            }
        } else {
            const updatedContract = { ...currentEditingContract, ...data };
            success = updateItem(ENTITY_NAME, updatedContract);
            if (currentEditingContract.status !== 'COMPLETED' && updatedContract.status === 'COMPLETED') {
                const car = getItemById('cars', updatedContract.carId);
                if (car) {
                    updateItem('cars', { ...car, status: CarStatus.AVAILABLE });
                }
            }
        }
        if (success) {
            alert(`Contrat ${currentEditingContract ? 'mis à jour' : 'créé'} avec succès.`);
            const allForms = container.querySelectorAll('#contract-form');
            allForms.forEach(form => {
                const wrapper = form.closest('div');
                if (wrapper && wrapper.parentElement === container) {
                    wrapper.remove();
                }
            });
            renderContractsTable();
        } else {
            alert("Erreur lors de l'opération de contrat.");
        }
    }
    function handleEdit(id) {
        const contractToEdit = getContractsWithDetails().find(c => c.id === id);
        if (contractToEdit) {
            showContractForm(contractToEdit);
        }
    }
    function attachDynamicCalculationListeners(formContainer) {
        const updateCalculations = () => {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            let total = calculateTotalAmount(startDate, endDate, currentCarPricePerDay);
            const assuranceSelect = document.getElementById('assurance-select');
            if (assuranceSelect && assuranceSelect.value) {
                const selectedAssurance = getAllItems('assurances').find(a => a.id === assuranceSelect.value);
                if (selectedAssurance) {
                    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const assuranceCost = Math.max(1, diffDays) * selectedAssurance.dailyCost;
                    total += assuranceCost;
                }
            }
            const selectedAccessories = document.querySelectorAll('.accessory-checkbox:checked');
            selectedAccessories.forEach(checkbox => {
                const price = parseFloat(checkbox.dataset.price) || 0;
                total += price;
            });
            document.getElementById('total-amount-display').textContent = total.toFixed(2) + ' MAD';
            document.getElementById('total-amount-input').value = total;
        };
        formContainer.querySelector('#car-select').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            currentCarPricePerDay = parseFloat(selectedOption.dataset.price) || 0;
            updateCalculations();
        });
        formContainer.querySelector('#assurance-select').addEventListener('change', updateCalculations);
        formContainer.querySelectorAll('.accessory-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateCalculations);
        });
        formContainer.querySelector('#start-date').addEventListener('change', updateCalculations);
        formContainer.querySelector('#end-date').addEventListener('change', updateCalculations);
        formContainer.querySelector('#cancel-form-btn').addEventListener('click', () => formContainer.remove());
    }
    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allContracts = getContractsWithDetails();
        const filtered = allContracts.filter(contract => 
            contract.clientName.toLowerCase().includes(searchText) ||
            contract.carModel.toLowerCase().includes(searchText) ||
            contract.id.toLowerCase().includes(searchText)
        );
        document.getElementById('contracts-table-body').innerHTML = renderTableBody(filtered);
    }
    function attachExportListener(data) {
        document.getElementById('export-csv-btn').addEventListener('click', function() {
            const headers = ['ID', 'Client', 'Voiture', 'Date Debut', 'Date Fin', 'Montant Total', 'Statut'];
            const rows = data.map(c => [
                `"${c.id}"`,
                `"${c.clientName}"`,
                `"${c.carModel}"`,
                `"${c.startDate}"`,
                `"${c.endDate}"`,
                `"${c.totalAmount.toFixed(2)}"`,
                `"${c.status}"`
            ].join(','));
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'contrats_export.csv';
            link.click();
        });
    }
    renderContractsTable();
});