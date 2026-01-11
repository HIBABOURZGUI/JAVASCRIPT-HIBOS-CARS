document.addEventListener('DOMContentLoaded', function() {
    if (typeof getDb === 'undefined' || typeof generateUniqueId === 'undefined' || typeof createItem === 'undefined') {
        console.error("Erreur: Les scripts de base (data.js, types.js ou crud.js) sont manquants.");
        return;
    }

    if (typeof emailjs !== 'undefined') {
        emailjs.init('j-nz0Od0hn1t1eIa-');
    }

    getDb();

    if (!window.location.pathname.includes('reset-password')) {
        checkRememberMeCookie();
    }

    handleLoginForm();
    handleRegisterForm();
    handleForgotPasswordModal();

    function checkRememberMeCookie() {
        const rememberMeData = localStorage.getItem('rememberMe');
        
        if (rememberMeData) {
            try {
                const user = JSON.parse(rememberMeData);
                const db = getDb();
                const currentUser = db.clients.find(c => c.id === user.id);
                
                if (currentUser && currentUser.accountStatus !== AccountStatus.BLOCKED) {
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    if (currentUser.role === Role.ADMIN) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'catalogue.html';
                    }
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('currentUser');
                }
            } catch (error) {
                console.error("Erreur lors de la vérification du cookie 'Se souvenir de moi':", error);
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('currentUser');
            }
        }
    }

    function handleLoginForm() {
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                loginError.textContent = '';
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const rememberMe = document.getElementById('remember').checked;
                
                const db = getDb();
                const user = db.clients.find(c => c.email === email && c.password === password);
                
                if (user) {
                    if (user.accountStatus === AccountStatus.BLOCKED) {
                        loginError.textContent = "Votre compte est bloqué. Contactez l'administration.";
                        return;
                    }

                    localStorage.setItem('currentUser', JSON.stringify(user));
                    
                    if (rememberMe) {
                        localStorage.setItem('rememberMe', JSON.stringify(user));
                    } else {
                        localStorage.removeItem('rememberMe');
                    }
                    
                    if (user.role === Role.ADMIN) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'catalogue.html';
                    }
                } else {
                    loginError.textContent = "Email ou mot de passe incorrect.";
                }
            });
        }
    }

    function handleForgotPasswordModal() {
        const modalHTML = `
            <div class="modal fade" id="forgotPasswordModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-gradient text-white border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <h5 class="modal-title fw-bold">
                                <i class="fas fa-key me-2"></i>Réinitialiser le Mot de Passe
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <p class="text-muted mb-4">
                                Entrez votre adresse email et nous vous enverrons les instructions pour réinitialiser votre mot de passe.
                            </p>
                            <form id="forgot-password-form">
                                <div class="form-floating mb-3">
                                    <input type="email" class="form-control" id="forgot-email" placeholder="nom@exemple.com" required>
                                    <label for="forgot-email">
                                        <i class="fas fa-envelope"></i> Adresse Email
                                    </label>
                                </div>
                                <p id="forgot-error" class="text-danger small mb-3"></p>
                                <p id="forgot-success" class="text-success small mb-3"></p>
                            </form>
                        </div>
                        <div class="modal-footer border-top-0 bg-light p-4">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Annuler
                            </button>
                            <button type="button" class="btn text-white" id="forgot-submit-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;">
                                <i class="fas fa-check me-2"></i>Envoyer les Instructions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('forgotPasswordModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        const forgotLink = document.getElementById('forgot-password-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', function(e) {
                e.preventDefault();
                const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
                modal.show();
                document.getElementById('forgot-email').value = '';
                document.getElementById('forgot-error').textContent = '';
                document.getElementById('forgot-success').textContent = '';
            });
        }

        document.getElementById('forgot-submit-btn')?.addEventListener('click', function() {
            const email = document.getElementById('forgot-email').value;
            const errorEl = document.getElementById('forgot-error');
            const successEl = document.getElementById('forgot-success');
            const submitBtn = document.getElementById('forgot-submit-btn');
            
            errorEl.textContent = '';
            successEl.textContent = '';

            if (!email) {
                errorEl.textContent = 'Veuillez entrer votre email.';
                return;
            }

            const db = getDb();
            const user = db.clients.find(c => c.email === email);

            if (!user) {
                errorEl.textContent = 'Cet email n\'est pas associé à un compte.';
                return;
            }

            const resetToken = 'reset_' + generateUniqueId();
            
            const resetData = {
                id: resetToken,
                email: email,
                token: resetToken,
                expiresAt: Date.now() + (24 * 3600 * 1000)
            };
            
            console.log('Création du token:', resetData);
            const created = createItem('resetTokens', resetData);
            console.log('Token créé:', created);
            
            const allTokensCheck = getAllItems('resetTokens');
            console.log('📊 Vérification - Tous les tokens après création:', allTokensCheck);
            console.log('✅ Token trouvé dans BD?', allTokensCheck.find(t => t.token === resetToken) ? 'OUI' : 'NON');

            const resetLink = 'http://localhost:8000/reset-password.html?token=' + resetToken;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...';

            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    email: email,
                    user_name: user.name,
                    user_email: email,
                    reset_link: resetLink
                };
                console.log('Paramètres envoyés à EmailJS:', emailParams);
                
                emailjs.send('service_5nxgftr', 'template_2n7hh0m', emailParams).then(function(response) {
                    successEl.textContent = `Instructions envoyées à ${email}. Vérifiez votre boîte de réception.`;
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Envoyer les Instructions';
                    
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                        modal?.hide();
                    }, 2000);
                }, function(error) {
                    console.error('Erreur EmailJS:', error);
                    errorEl.textContent = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Envoyer les Instructions';
                });
            } else {
                errorEl.textContent = 'Service d\'email non disponible. Veuillez réessayer.';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Envoyer les Instructions';
            }
        });
    }

    function handleRegisterForm() {
        const registerForm = document.getElementById('register-form');
        const registerError = document.getElementById('register-error');

        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                registerError.textContent = '';
                
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const phone = document.getElementById('register-phone').value;

                const db = getDb();
                if (db.clients.some(c => c.email === email)) {
                    registerError.textContent = "Cet email est déjà utilisé.";
                    return;
                }

                const newClient = {
                    id: 'client_' + generateUniqueId(),
                    name: name,
                    email: email,
                    password: password,
                    phone: phone,
                    role: Role.CLIENT,
                    accountStatus: AccountStatus.ACTIVE
                };

                const createdClient = createItem('clients', newClient);

                if (createdClient) {
                    alert(`Compte créé pour ${name} ! Veuillez vous connecter.`);
                    window.location.href = 'index.html';
                } else {
                    registerError.textContent = "Erreur lors de la création du compte. Veuillez réessayer.";
                }
            });
        }
    }
});