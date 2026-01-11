document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('catalogue-list-container');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (typeof getAllItems === 'undefined' || typeof CarStatus === 'undefined' || typeof AccountStatus === 'undefined' || typeof ContractStatus === 'undefined') {
        if (container) {
            container.innerHTML = '<p class="text-danger text-center">Erreur: Les scripts de base (types.js ou crud.js) sont manquants ou mal ordonnés.</p>';
        }
        return;
    }
    let searchStartDate = null;
    let searchEndDate = null;
    function initializeDefaultDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        searchStartDate = formatDateToInput(today);
        searchEndDate = formatDateToInput(tomorrow);
    }
    function formatDateToInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    function checkAvailability(carId, startDate, endDate) {
        const allContracts = getAllItems('contracts');
        const demandStart = new Date(startDate);
        const demandEnd = new Date(endDate);
        const hasConflict = allContracts.some(contract => {
            if (contract.status !== ContractStatus.ACTIVE) {
                return false;
            }
            if (contract.carId !== carId) {
                return false;
            }
            const contractStart = new Date(contract.startDate);
            const contractEnd = new Date(contract.endDate);
            return (demandStart <= contractEnd) && (demandEnd >= contractStart);
        });
        return !hasConflict;
    }
    function updateExpiredContracts() {
        const allContracts = getAllItems('contracts');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        allContracts.forEach(contract => {
            if (contract.status === ContractStatus.ACTIVE) {
                const endDate = new Date(contract.endDate);
                endDate.setHours(0, 0, 0, 0);
                if (endDate < today) {
                    updateItem('contracts', { ...contract, status: ContractStatus.COMPLETED });
                    const car = getItemById('cars', contract.carId);
                    if (car) {
                        updateItem('cars', { ...car, status: CarStatus.AVAILABLE });
                    }
                }
            }
        });
    }
    function renderCatalogue() {
        updateExpiredContracts();
        if (!searchStartDate || !searchEndDate) {
            initializeDefaultDates();
        }
        const allCars = getAllItems('cars');
        let authButtonHtml = '';
        if (currentUser) {
            authButtonHtml = `<button id="logout-btn" class="btn btn-secondary"><i class="fas fa-sign-out-alt me-2"></i> Déconnexion</button>`;
        } else {
            authButtonHtml = `<a href="index.html" class="btn btn-secondary"><i class="fas fa-sign-in-alt me-2"></i> Connexion / Inscription</a>`;
        }
        const authMessage = currentUser ? 
            `<p class="text-success fw-semibold mb-4"><i class="fas fa-check-circle me-2"></i>Bienvenue, ${currentUser.name} ! Vous pouvez réserver directement.</p>` :
            `<p class="text-muted fw-semibold mb-4">Connectez-vous pour commencer la réservation !</p>`;
        const searchSection = `
            <div class="card shadow-sm mb-4 p-4 bg-light">
                <h5 class="fw-bold text-dark mb-3"><i class="fas fa-search me-2"></i>Rechercher par Dates</h5>
                <div class="row g-3">
                    <div class="col-md-5">
                        <label class="form-label fw-semibold text-dark">Date de Début</label>
                        <input type="date" id="search-start-date" class="form-control" value="${searchStartDate}">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label fw-semibold text-dark">Date de Fin</label>
                        <input type="date" id="search-end-date" class="form-control" value="${searchEndDate}">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button id="search-btn" class="btn btn-primary w-100"><i class="fas fa-search me-2"></i>Chercher</button>
                    </div>
                </div>
            </div>
        `;
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h1 class="h2 fw-bold text-dark">Catalogue des Véhicules</h1>
                ${authButtonHtml} 
            </div>
            ${authMessage}
            ${searchSection}
            <div id="car-cards-list" class="row g-4">
                ${renderCarCards(allCars)}
            </div>
        `;
        if (container) {
            container.innerHTML = html;
        }
        document.getElementById('search-btn')?.addEventListener('click', () => {
            const startInput = document.getElementById('search-start-date').value;
            const endInput = document.getElementById('search-end-date').value;
            if (startInput && endInput) {
                searchStartDate = startInput;
                searchEndDate = endInput;
                renderCatalogue();
            } else {
                alert('Veuillez sélectionner les deux dates.');
            }
        });
        if (currentUser) {
            document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        }
    }
    function renderCarCards(cars) {
        const currency = "DH";
        if (cars.length === 0) {
            return `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        Désolé, aucune voiture n'est disponible pour le moment. Réessayez plus tard.
                    </div>
                </div>
            `;
        }
        return cars.map(car => {
            const isAvailable = checkAvailability(car.id, searchStartDate, searchEndDate);
            const unavailableClass = !isAvailable ? 'unavailable-card' : '';
            const unavailableBadge = !isAvailable ? '<span class="unavailable-badge">INDISPONIBLE</span>' : '';
            return `
                <div class="col-sm-12 col-md-6 col-lg-4 ${unavailableClass}" style="position: relative;">
                    <div class="card shadow-sm h-100">
                        ${unavailableBadge}
                        <img src="${car.imagePath}" class="card-img-top" alt="${car.brand} ${car.model}" style="height: 220px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-primary fw-bold">${car.brand} ${car.model}</h5>
                            <div class="mt-auto pt-3 border-top">
                                <h4 class="fw-bold mb-2">${car.pricePerDay} ${currency} / jour</h4>
                                ${renderActionButton(car, isAvailable)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    function renderActionButton(car, isAvailable) {
        if (!isAvailable) {
            return '<button class="btn btn-danger w-100 mt-2" disabled><i class="fas fa-ban me-2"></i>INDISPONIBLE</button>';
        }
        return `<button class="btn btn-success w-100 mt-2 reserve-btn" data-id="${car.id}" data-price="${car.pricePerDay}" onclick="handleReservationClick('${car.id}')"><i class="fas fa-calendar me-2"></i>Réserver</button>`;
    }
    window.handleReservationClick = function(carId) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            alert('Veuillez vous connecter pour réserver');
            window.location.href = 'index.html';
            return;
        }
        if (user.accountStatus === AccountStatus.BLOCKED) {
            alert('Votre compte est bloqué. Vous ne pouvez pas réserver.');
            return;
        }
        const car = getItemById('cars', carId);
        const price = car.pricePerDay;
        showReservationModal(car, price);
    }
    function handleLogout() {
        if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html'; 
        }
    }
    function attachBookingListeners() {
        document.querySelectorAll('.reserve-btn').forEach(button => {
            button.addEventListener('click', function() {
                const carId = this.dataset.id;
                const price = parseFloat(this.dataset.price);
                const car = getItemById('cars', carId);
                showReservationModal(car, price);
            });
        });
    }
    function showReservationModal(car, pricePerDay) {
        const assurances = getAllItems('assurances');
        const accessories = getAllItems('accessories');
        const assuranceOptions = assurances.map(ass => `
            <div class="form-check mb-2">
                <input class="form-check-input assurance-option" type="radio" name="assurance" value="${ass.id}" id="ass-${ass.id}" ${ass.name === 'Standard' ? 'checked' : ''} data-cost="${ass.dailyCost}">
                <label class="form-check-label fw-semibold text-dark" for="ass-${ass.id}">
                    <i class="fas fa-shield-alt text-primary"></i> ${ass.name}
                    <span class="badge bg-success ms-2">${ass.dailyCost} MAD/jour</span>
                </label>
                <small class="d-block ms-4 text-secondary">${ass.coverage}</small>
            </div>
        `).join('');
        const accessoriesHtml = accessories.map(acc => `
            <div class="form-check mb-2">
                <input class="form-check-input accessory-option" type="checkbox" name="accessories" value="${acc.id}" id="acc-${acc.id}" data-price="${acc.price}">
                <label class="form-check-label fw-semibold text-dark" for="acc-${acc.id}">
                    <i class="fas fa-box text-info"></i> ${acc.name}
                    <span class="badge bg-info ms-2">+${acc.price} MAD</span>
                </label>
            </div>
        `).join('');
        const modalHtml = `
            <div class="modal fade" id="reservationModal-${car.id}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-gradient text-white border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div>
                                <h5 class="modal-title fw-bold mb-1 text-white">
                                    <i class="fas fa-car me-2"></i>Réservation: ${car.brand} ${car.model}
                                </h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="row g-4">
                                <div class="col-12">
                                    <div class="alert alert-light border-2 border-primary py-3 px-4 rounded-3" role="alert">
                                        <h6 class="fw-bold text-primary mb-2"><i class="fas fa-info-circle me-2"></i>Prix de Location</h6>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="fs-5 fw-bold text-dark">${pricePerDay} MAD</span>
                                            <span class="text-secondary">/jour</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-semibold text-dark mb-2">
                                        <i class="fas fa-calendar-check text-success me-2"></i>Date de Début
                                    </label>
                                    <input type="date" id="start-date-input" class="form-control form-control-lg border-2" value="${searchStartDate}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-semibold text-dark mb-2">
                                        <i class="fas fa-calendar-times text-danger me-2"></i>Date de Fin
                                    </label>
                                    <input type="date" id="end-date-input" class="form-control form-control-lg border-2" value="${searchEndDate}" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold text-dark mb-3">
                                        <i class="fas fa-shield-alt text-primary me-2"></i>Sélectionner une Assurance
                                    </label>
                                    <div class="border-2 border-light p-4 rounded-3 bg-light">
                                        ${assuranceOptions}
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold text-dark mb-3">
                                        <i class="fas fa-gift text-info me-2"></i>Ajouter des Accessoires (Optionnels)
                                    </label>
                                    <div class="border-2 border-light p-4 rounded-3 bg-light">
                                        ${accessoriesHtml}
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="card border-0 shadow-sm bg-light">
                                        <div class="card-body p-4">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span class="text-dark fw-semibold">Montant Total Estimé</span>
                                                <small class="text-secondary">(actualisé automatiquement)</small>
                                            </div>
                                            <h2 class="text-success fw-bold mb-0" id="total-price-display">0.00 MAD</h2>
                                            <input type="hidden" id="total-price-input" value="0">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-top-2 bg-light p-4">
                            <button type="button" class="btn btn-lg btn-outline-secondary rounded-pill px-5" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Annuler
                            </button>
                            <button type="button" class="btn btn-lg text-white rounded-pill px-5" id="confirm-reservation-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;">
                                <i class="fas fa-check me-2"></i>Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(`reservationModal-${car.id}`));
        attachModalCalculationListeners(car.id, pricePerDay);
        document.getElementById('confirm-reservation-btn').addEventListener('click', () => {
            const startDate = document.getElementById('start-date-input').value;
            const endDate = document.getElementById('end-date-input').value;
            const assuranceId = document.querySelector('input[name="assurance"]:checked')?.value;
            const selectedAccessories = Array.from(document.querySelectorAll('.accessory-option:checked')).map(cb => cb.value);
            const totalPrice = parseFloat(document.getElementById('total-price-input').value);
            if (!startDate || !endDate) {
                alert('Veuillez sélectionner les dates.');
                return;
            }
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            if (startDateObj >= endDateObj) {
                alert('Erreur: La date de début doit être antérieure à la date de fin.');
                return;
            }
            const today = new Date();
            const todayFormatted = formatDateToInput(today);
            if (startDate < todayFormatted) {
                alert('Erreur: La date de début doit être supérieure ou égale à aujourd\'hui (' + todayFormatted + ').');
                return;
            }
            if (!checkAvailability(car.id, startDate, endDate)) {
                alert('Désolé, la voiture n\'est pas disponible pour les dates choisies.');
                return;
            }
            handleBooking(car.id, startDate, endDate, assuranceId, selectedAccessories, totalPrice);
            modal.hide();
            document.getElementById(`reservationModal-${car.id}`).remove();
        });
        modal.show();
    }
    function attachModalCalculationListeners(carId, pricePerDay) {
        const startInput = document.getElementById('start-date-input');
        const endInput = document.getElementById('end-date-input');
        const assuranceInputs = document.querySelectorAll('.assurance-option');
        const accessoryInputs = document.querySelectorAll('.accessory-option');
        const calculateTotal = () => {
            if (!startInput.value || !endInput.value) return;
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            if (end <= start) {
                document.getElementById('total-price-display').textContent = '0.00 MAD';
                return;
            }
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            let total = diffDays * pricePerDay;
            const selectedAssurance = document.querySelector('input[name="assurance"]:checked');
            if (selectedAssurance) {
                const assuranceCost = parseFloat(selectedAssurance.dataset.cost);
                total += diffDays * assuranceCost;
            }
            document.querySelectorAll('.accessory-option:checked').forEach(checkbox => {
                total += parseFloat(checkbox.dataset.price);
            });
            document.getElementById('total-price-display').textContent = total.toFixed(2) + ' MAD';
            document.getElementById('total-price-input').value = total.toFixed(2);
        };
        startInput.addEventListener('change', calculateTotal);
        endInput.addEventListener('change', calculateTotal);
        assuranceInputs.forEach(input => input.addEventListener('change', calculateTotal));
        accessoryInputs.forEach(input => input.addEventListener('change', calculateTotal));
        calculateTotal();
    }
    function handleBooking(carId, startDateStr, endDateStr, assuranceId, accessoryIds, totalAmount) {
        const newContract = {
            clientId: currentUser.id,
            carId: carId,
            startDate: startDateStr,
            endDate: endDateStr,
            assuranceId: assuranceId,
            accessories: accessoryIds,
            totalAmount: totalAmount,
            status: ContractStatus.ACTIVE
        };
        const createdContract = createItem('contracts', newContract);
        if (createdContract) {
            const carToUpdate = getItemById('cars', carId);
            if (carToUpdate) {
                updateItem('cars', { ...carToUpdate, status: CarStatus.RENTED });
            }
            alert(`Réservation confirmée ! Total: ${totalAmount.toFixed(2)} MAD. La voiture est maintenant louée.`);
            renderCatalogue();
        } else {
            alert("Erreur lors de la création de la réservation.");
        }
    }
    renderCatalogue();
});