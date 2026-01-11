document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = 'index.html';
        return; 
    }

    if (currentUser.role !== Role.ADMIN) {
        if (!window.location.pathname.includes('catalogue.html') && !window.location.pathname.includes('contrats-client.html')) {
            window.location.href = 'catalogue.html';
            return;
        }
    }

    function renderGlobalLayout(user) {
        const menuItems = [
            { name: "Dashboard", href: "dashboard.html", icon: '<i class="fas fa-qrcode fa-fw"></i>' },
            { name: "Flotte (Voitures)", href: "flotte.html", icon: '<i class="fas fa-satellite-dish fa-fw"></i>' },
            { name: "Contrats", href: "contrats.html", icon: '<i class="fas fa-scroll fa-fw"></i>' },
            { name: "Clients", href: "clients.html", icon: '<i class="fas fa-fingerprint fa-fw"></i>' },
            { name: "Agences", href: "agences.html", icon: '<i class="fas fa-city fa-fw"></i>' },
            { name: "Maintenance", href: "maintenance.html", icon: '<i class="fas fa-microchip fa-fw"></i>' },
            { name: "Accessoires", href: "accessories.html", icon: '<i class="fas fa-boxes fa-fw"></i>' },
            { name: "Assurances", href: "assurances.html", icon: '<i class="fas fa-shield-alt fa-fw"></i>' },
        ];

        let navHtml = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
                <div class="container-fluid">
                    <a class="navbar-brand text-primary fw-bold" href="dashboard.html">AYKA CARS</a>
                    <div class="d-flex align-items-center">
                        <span class="navbar-text me-3 d-none d-sm-inline">Bienvenue, ${user.name} (${user.role})</span>
                        <button id="logout-btn" class="btn btn-danger btn-sm">
                            <i class="fas fa-sign-out-alt"></i> Déconnexion
                        </button>
                    </div>
                </div>
            </nav>
        `;

        let sidebarHtml = `
            <aside class="d-flex flex-column p-3 text-white bg-dark sidebar-fixed" style="width: 250px;">
                <h2 class="text-center mb-4 border-bottom pb-2">AYKA CARS</h2>
                <nav class="nav nav-pills flex-column mb-auto text-center">
                    ${menuItems.map(item => `
                        <a href="${item.href}" class="nav-link text-center text-white ${window.location.pathname.includes(item.href) ? 'active bg-primary' : 'hover:bg-secondary'} mb-2 p-3 rounded">
                            ${item.icon} ${item.name}
                        </a>
                    `).join('')}
                </nav>
            </aside>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', navHtml);
        
        const mainContent = document.body.innerHTML;

        document.body.innerHTML = `
            <div class="d-flex">
                ${sidebarHtml}
                <main class="flex-grow-1 p-4">
                    </main>
            </div>
        `;
        
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = mainContent;
        }

        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    }

    function handleLogout() {
        if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }
    
    if (currentUser.role === Role.ADMIN) {
        renderGlobalLayout(currentUser);
    }
});