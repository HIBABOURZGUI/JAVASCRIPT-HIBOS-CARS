document.addEventListener('DOMContentLoaded', function() {
    if (window.location.search) {
        try {
            window.history.pushState({}, '', window.location.pathname);
        } catch (e) {
            console.warn("Impossible de nettoyer l'URL. L'affichage pourrait être temporairement incorrect.");
        }
    }
    const ENTITY_NAME = 'clients';
    const container = document.getElementById('clients-crud-container');
    let currentEditingClient = null;
    if (typeof getAllItems === 'undefined' || typeof Role === 'undefined' || typeof AccountStatus === 'undefined' || typeof ContractStatus === 'undefined' || !container) {
         console.error("Erreur: Les scripts de base (data.js, types.js, crud.js) sont manquants ou l'ID HTML est incorrect.");
         return;
    }
    function renderClientsTable() {
        const clients = getAllItems(ENTITY_NAME).filter(c => c.role === Role.CLIENT);
        const tableBody = document.getElementById('clients-table-body');
        if (tableBody) {
            tableBody.innerHTML = renderTableBody(clients);
            return;
        }
        let html = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="search-input" class="form-control w-25" placeholder="Rechercher par nom ou email...">
                <button id="export-csv-btn" class="btn btn-secondary bg-gray-500 hover:bg-gray-600 text-white">
                    <i class="fas fa-download"></i> Exporter CSV
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered shadow-sm">
                    <thead class="bg-gray-200">
                        <tr>
                            <th data-key="name" class="sortable">Nom</th>
                            <th data-key="email" class="sortable">Email</th>
                            <th data-key="accountStatus" class="sortable">Statut du Compte</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clients-table-body">
                        ${renderTableBody(clients)}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        attachTableEventListeners();
        attachExportListener(clients);
    }
    function renderTableBody(clients) {
        if (clients.length === 0) {
            return '<tr><td colspan="4" class="text-center p-4 text-muted">Aucun client non-administrateur trouvé.</td></tr>';
        }
        return clients.map(client => `
            <tr data-id="${client.id}">
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${renderStatusBadge(client.accountStatus)}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${client.id}" title="Modifier/Bloquer"><i class="fas fa-user-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${client.id}" title="Supprimer Client"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
    function renderStatusBadge(status) {
        let className = 'badge ';
        const normalizedStatus = status ? status.toUpperCase() : '';
        if (normalizedStatus === AccountStatus.ACTIVE) {
            className += 'bg-success';
        } else if (normalizedStatus === AccountStatus.BLOCKED) {
            className += 'bg-danger';
        } else {
            className += 'bg-secondary';
        }
        return `<span class="${className}">${status}</span>`;
    }
    function attachTableEventListeners() {
        document.querySelector('#clients-table-body')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;
            const clientId = target.dataset.id;
            if (target.classList.contains('delete-btn')) {
                if (confirm(`Êtes-vous sûr de vouloir supprimer le client (ID: ${clientId}) ?`)) {
                    handleDelete(clientId);
                }
            } else if (target.classList.contains('edit-btn')) {
                handleEdit(clientId);
            }
        });
        document.getElementById('search-input')?.addEventListener('input', handleSearch);
    }
    function handleDelete(id) {
        const contracts = getAllItems('contracts');
        const hasActiveContracts = contracts.some(c => String(c.clientId) === String(id) && c.status === ContractStatus.ACTIVE);
        if (hasActiveContracts) {
            alert("Impossible de supprimer : Ce client a des contrats actifs.");
            return;
        }
        if (deleteItem(ENTITY_NAME, id)) {
            alert("Client supprimé avec succès.");
            renderClientsTable();
        } else {
            alert("Erreur lors de la suppression.");
        }
    }
    function showClientForm(client) {
        currentEditingClient = client;
        const formHtml = `
            <div class="card p-4 mb-4 border-primary">
                <h3 class="mb-3">Modifier Client: ${client.name}</h3>
                <form id="client-form" class="row g-3">
                    <input type="hidden" name="id" value="${client.id}">
                    <div class="col-md-6"><label class="form-label">Nom Complet</label><input type="text" name="name" class="form-control" value="${client.name}" required></div>
                    <div class="col-md-6"><label class="form-label">Email</label><input type="email" name="email" class="form-control" value="${client.email}" required></div>
                    <div class="col-md-6"><label class="form-label">Statut du Compte</label>
                        <select name="accountStatus" class="form-select">
                            ${Object.values(AccountStatus).map(s => `
                                <option value="${s}" ${client.accountStatus === s ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                        <small class="text-danger">Bloquer empêchera ce client de louer des voitures.</small>
                    </div>
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-primary me-2">Sauvegarder</button>
                        <button type="button" id="cancel-form-btn" class="btn btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        const existingForm = container.querySelector('#client-form');
        if (existingForm) existingForm.parentElement.remove();
        const formContainerEl = document.createElement('div');
        formContainerEl.innerHTML = formHtml;
        container.insertAdjacentElement('afterbegin', formContainerEl);
        const newForm = formContainerEl.querySelector('#client-form');
        if (newForm) {
            newForm.addEventListener('submit', handleClientFormSubmit);
        }
        document.getElementById('cancel-form-btn')?.addEventListener('click', () => formContainerEl.remove());
    }
    function handleEdit(id) {
        const clientToEdit = getItemById(ENTITY_NAME, id);
        if (clientToEdit) {
            showClientForm(clientToEdit);
        }
    }
    function handleClientFormSubmit(e) {
        e.preventDefault();
        const clientId = String(e.target.querySelector('input[name="id"]').value);
        const newName = e.target.querySelector('input[name="name"]').value;
        const newEmail = e.target.querySelector('input[name="email"]').value;
        const newStatus = e.target.querySelector('select[name="accountStatus"]').value;
        if (!clientId) {
            console.error("Erreur: ID client manquant.");
            alert("Erreur critique : L'ID du client est manquant.");
            return;
        }
        const clientToUpdate = getItemById(ENTITY_NAME, clientId);
        if (!clientToUpdate) {
            console.error("Client non trouvé pour ID:", clientId);
            alert("Erreur critique : Client non trouvé pour la mise à jour.");
            return;
        }
        const updatedClient = {
            ...clientToUpdate,
            name: newName,
            email: newEmail,
            accountStatus: newStatus
        };
        if (updateItem(ENTITY_NAME, updatedClient)) {
            alert("Client mis à jour avec succès.");
            const formWrapper = e.target.closest('div');
            if (formWrapper && formWrapper.parentElement === container) {
                formWrapper.remove();
            }
            renderClientsTable();
        } else {
            alert("Erreur lors de la mise à jour du client.");
        }
    }
    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const allClients = getAllItems(ENTITY_NAME).filter(c => c.role === Role.CLIENT);
        const filtered = allClients.filter(client => 
            client.name.toLowerCase().includes(searchText) ||
            client.email.toLowerCase().includes(searchText)
        );
        document.getElementById('clients-table-body').innerHTML = renderTableBody(filtered);
    }
    function attachExportListener(data) {
        document.getElementById('export-csv-btn')?.addEventListener('click', function() {
            const headers = ['ID', 'Nom', 'Email', 'Statut'];
            const rows = data.map(c => [
                `"${c.id}"`,
                `"${c.name}"`,
                `"${c.email}"`,
                `"${c.accountStatus}"`
            ].join(','));
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'clients_export.csv';
            link.click();
        });
    }
    renderClientsTable();
});