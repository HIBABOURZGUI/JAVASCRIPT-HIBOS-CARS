document.addEventListener('DOMContentLoaded', function() {
    const ENTITY_NAME = 'cars';
    const tableBody = document.getElementById('flotte-table-body');
    const formCard = document.getElementById('car-form-card');
    const formContainer = document.getElementById('car-form');
    const formTitle = document.getElementById('car-form-title');
    const formCancelBtn = document.getElementById('cancel-edit-btn');
    const imagePreview = document.getElementById('current-image-preview');
    let currentEditingCarId = null;
    if (typeof getAllItems === 'undefined' || !tableBody || !formCard) {
        console.error("Erreur: Les scripts de base (data.js, types.js, crud.js) sont manquants ou les ID HTML ne sont pas trouvés.");
        return;
    }
    function populateSelectors() {
        const db = getDb();
        const agencySelect = document.getElementById('car-agency');
        const statusSelect = document.getElementById('car-status');
        agencySelect.innerHTML = '<option value="" disabled selected>Choisir une agence</option>';
        statusSelect.innerHTML = '<option value="" disabled selected>Choisir un statut</option>';
        db.agencies.forEach(agency => {
            const option = new Option(`${agency.name} (${agency.city})`, agency.id);
            agencySelect.add(option);
        });
        Object.values(CarStatus).forEach(status => {
            const option = new Option(status, status);
            statusSelect.add(option);
        });
    }
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    function renderFlotteTable(cars = getAllItems(ENTITY_NAME)) {
        tableBody.innerHTML = renderTableBody(cars);
        attachTableEventListeners();
    }
    function renderTableBody(cars) {
        if (cars.length === 0) {
            return '<tr><td colspan="6" class="text-center p-4 text-muted">Aucune voiture trouvée.</td></tr>';
        }
        return cars.map(car => `
            <tr data-id="${car.id}">
                <td>${car.brand}</td>
                <td>${car.model}</td>
                <td>${car.plate}</td>
                <td>${car.pricePerDay.toFixed(2)} DH</td>
                <td>${renderStatusBadge(car.status)}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${car.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${car.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
    function renderStatusBadge(status) {
        let className = 'badge ';
        switch (status) {
            case CarStatus.AVAILABLE: className += 'bg-success'; break;
            case CarStatus.RENTED: className += 'bg-warning text-dark'; break;
            case CarStatus.MAINTENANCE: className += 'bg-danger'; break;
            default: className += 'bg-secondary';
        }
        return `<span class="${className}">${status}</span>`;
    }
    function attachTableEventListeners() {
        document.getElementById('flotte-table-container').addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;
            const carId = target.dataset.id;
            if (target.classList.contains('delete-btn')) {
                if (confirm(`Êtes-vous sûr de vouloir supprimer la voiture avec l'ID ${carId} ?`)) {
                    handleDelete(carId);
                }
            } else if (target.classList.contains('edit-btn')) {
                handleEdit(carId);
            }
        });
        document.getElementById('add-car-btn')?.addEventListener('click', function() {
            resetForm();
            formCard.classList.remove('d-none');
        });
        document.getElementById('search-input')?.addEventListener('input', handleSearch);
    }
    function attachFormListeners() {
        formContainer?.addEventListener('submit', handleFormSubmission);
        formCancelBtn?.addEventListener('click', function() {
            resetForm();
            formCard.classList.add('d-none');
        });
    }
    function handleDelete(id) {
        const db = getDb();
        const activeContract = db.contracts.some(c => c.carId === id && c.status === ContractStatus.ACTIVE);
        if (activeContract) {
            alert("Impossible de supprimer : cette voiture est actuellement sous contrat actif.");
            return;
        }
        if (deleteItem(ENTITY_NAME, id)) {
            alert("Voiture supprimée avec succès.");
            renderFlotteTable(); 
        } else {
            alert("Erreur lors de la suppression.");
        }
    }
    async function handleFormSubmission(e) {
        e.preventDefault();
        const imageInput = document.getElementById('car-image');
        const file = imageInput.files[0];
        let imageBase64 = null;
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Veuillez sélectionner un fichier image valide.");
                return;
            }
            try {
                imageBase64 = await fileToBase64(file);
            } catch (error) {
                alert("Erreur lors du chargement de l'image.");
                return;
            }
        }
        const carData = {
            brand: document.getElementById('car-brand').value,
            model: document.getElementById('car-model').value,
            plate: document.getElementById('car-plate').value,
            pricePerDay: parseFloat(document.getElementById('car-price').value),
            status: document.getElementById('car-status').value,
            agencyId: document.getElementById('car-agency').value,
            imagePath: imageBase64
        };
        let success = false;
        if (currentEditingCarId) {
            const existingCar = getItemById(ENTITY_NAME, currentEditingCarId);
            carData.imagePath = carData.imagePath || existingCar.imagePath;
            const updatedCar = { id: currentEditingCarId, ...existingCar, ...carData };
            success = updateItem(ENTITY_NAME, updatedCar);
            alert(success ? "Voiture modifiée avec succès." : "Erreur de mise à jour.");
        } else {
            success = createItem(ENTITY_NAME, carData);
            alert(success ? "Nouvelle voiture ajoutée avec succès." : "Erreur d'ajout.");
        }
        if (success) {
            formCard.classList.add('d-none');
            resetForm();
            renderFlotteTable();
        }
    }
    function handleEdit(id) {
        const carToEdit = getItemById(ENTITY_NAME, id);
        if (carToEdit) {
            currentEditingCarId = id;
            formTitle.textContent = "Modifier le Véhicule";
            formCancelBtn.style.display = 'inline-block';
            formCard.classList.remove('d-none');
            document.getElementById('car-brand').value = carToEdit.brand;
            document.getElementById('car-model').value = carToEdit.model;
            document.getElementById('car-plate').value = carToEdit.plate;
            document.getElementById('car-price').value = carToEdit.pricePerDay;
            document.getElementById('car-status').value = carToEdit.status;
            document.getElementById('car-agency').value = carToEdit.agencyId;
            imagePreview.innerHTML = carToEdit.imagePath 
                ? `<p class="fw-semibold mt-2">Image Actuelle:</p><img src="${carToEdit.imagePath}" alt="Image actuelle" style="max-width: 150px; height: auto; border-radius: 8px;">`
                : `<p class="text-muted small mt-2">Aucune image stockée pour l'édition.</p>`;
        }
    }
    function resetForm() {
        formContainer.reset();
        currentEditingCarId = null;
        formTitle.textContent = "Ajouter un Nouveau Véhicule";
        formCancelBtn.style.display = 'none';
        imagePreview.innerHTML = '';
        document.getElementById('car-image').value = '';
    }
    function handleSearch(e) {
        const searchText = e.target.value.toLowerCase();
        const cars = getAllItems(ENTITY_NAME);
        const filtered = cars.filter(car => 
            car.brand.toLowerCase().includes(searchText) ||
            car.model.toLowerCase().includes(searchText) ||
            car.plate.toLowerCase().includes(searchText)
        );
        document.getElementById('flotte-table-body').innerHTML = renderTableBody(filtered);
    }
    populateSelectors();
    renderFlotteTable();
    attachTableEventListeners();
    attachFormListeners();
});