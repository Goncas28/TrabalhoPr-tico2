document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const form = document.getElementById('clientForm');
    const successMessage = document.getElementById('successMessage');
    const newRegistrationBtn = document.getElementById('newRegistrationBtn');
    const generatedIdSpan = document.getElementById('generatedId');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const clientsContainer = document.getElementById('clientsContainer');
    
    // Modal Elements
    const addressModal = document.getElementById('addressModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalClientName = document.getElementById('modalClientName');
    const modalClientId = document.getElementById('modalClientId');
    const addressesList = document.getElementById('addressesList');
    const addressForm = document.getElementById('addressForm');
    const addressFormTitle = document.getElementById('addressFormTitle');
    const addrEditingId = document.getElementById('addrEditingId');
    const cancelAddrEditBtn = document.getElementById('cancelAddrEditBtn');

    let currentClientId = null;

    // ---- TAB NAVIGATION ----
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');

            if (btn.dataset.target === 'tab-list') {
                renderClientsList();
            }
        });
    });

    // ---- CLIENT REGISTRATION ----
    const inputs = {
        nome: document.getElementById('nome'),
        nif: document.getElementById('nif'),
        tipo: document.getElementById('tipo'),
        contacto: document.getElementById('contacto'),
        email: document.getElementById('email')
    };

    Object.values(inputs).forEach(input => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
        if (input.tagName === 'SELECT') input.addEventListener('change', () => input.parentElement.classList.remove('invalid'));
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        if (!inputs.nome.value.trim()) { showError('nome'); isValid = false; }
        if (!/^\d{9}$/.test(inputs.nif.value.trim())) { showError('nif'); isValid = false; }
        if (!inputs.tipo.value) { showError('tipo'); isValid = false; }
        if (inputs.contacto.value.trim().length < 9) { showError('contacto'); isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email.value.trim())) { showError('email'); isValid = false; }

        if (isValid) {
            const idGerado = `CLI-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const clientData = {
                id: idGerado,
                nome: inputs.nome.value.trim(),
                nif: inputs.nif.value.trim(),
                tipo: inputs.tipo.value,
                contacto: inputs.contacto.value.trim(),
                email: inputs.email.value.trim(),
                dataRegisto: new Date().toISOString(),
                enderecos: [] // NOVO: Array para guardar endereços
            };

            const clients = getClients();
            clients.push(clientData);
            saveClients(clients);

            generatedIdSpan.textContent = idGerado;
            form.style.display = 'none';
            successMessage.classList.remove('hidden');
        }
    });

    newRegistrationBtn.addEventListener('click', () => {
        form.reset();
        successMessage.classList.add('hidden');
        form.style.display = 'block';
    });

    function showError(inputId) { inputs[inputId].parentElement.classList.add('invalid'); }

    // ---- CLIENT LIST & ADDRESS MANAGEMENT ----
    function getClients() {
        return JSON.parse(localStorage.getItem('clients') || '[]');
    }
    function saveClients(clients) {
        localStorage.setItem('clients', JSON.stringify(clients));
    }

    function renderClientsList() {
        const clients = getClients();
        clientsContainer.innerHTML = '';

        if (clients.length === 0) {
            clientsContainer.innerHTML = '<div class="no-data">Nenhum cliente registado.</div>';
            return;
        }

        clients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-info">
                    <h3>${client.nome}</h3>
                    <p>NIF: ${client.nif} | ${client.enderecos ? client.enderecos.length : 0} endereço(s)</p>
                </div>
                <div class="client-actions">
                    <button class="btn-manage" data-id="${client.id}">Gerir Endereços</button>
                </div>
            `;
            clientsContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-manage').forEach(btn => {
            btn.addEventListener('click', (e) => openAddressModal(e.target.dataset.id));
        });
    }

    // ---- MODAL LOGIC ----
    function openAddressModal(clientId) {
        currentClientId = clientId;
        const client = getClients().find(c => c.id === clientId);
        if (!client) return;

        modalClientName.textContent = client.nome;
        modalClientId.textContent = client.id;
        
        resetAddressForm();
        renderAddresses(client);
        
        addressModal.classList.remove('hidden');
    }

    closeModalBtn.addEventListener('click', () => addressModal.classList.add('hidden'));

    function renderAddresses(client) {
        addressesList.innerHTML = '';
        const enderecos = client.enderecos || [];

        if (enderecos.length === 0) {
            addressesList.innerHTML = '<div class="no-data">Nenhum endereço registado para este cliente.</div>';
            return;
        }

        enderecos.forEach(addr => {
            const isMain = addr.isMain ? 'main-addr' : '';
            const mainBadge = addr.isMain ? '<span class="badge">Principal</span>' : '';
            
            const div = document.createElement('div');
            div.className = `addr-item ${isMain}`;
            div.innerHTML = `
                <div class="addr-details">
                    <p><strong>${addr.rua}</strong></p>
                    <p>${addr.codigoPostal} ${addr.localidade}</p>
                    ${mainBadge}
                </div>
                <div class="addr-actions">
                    <button class="icon-btn star ${addr.isMain ? 'is-main' : ''}" title="Definir Principal" onclick="window.setMainAddress('${addr.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${addr.isMain ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button class="icon-btn edit" title="Editar" onclick="window.loadAddressToEdit('${addr.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn delete" title="Remover" onclick="window.removeAddress('${addr.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            addressesList.appendChild(div);
        });
    }

    // Form Address Validation & Submit
    const addrInputs = {
        rua: document.getElementById('addrRua'),
        localidade: document.getElementById('addrLocalidade'),
        cp: document.getElementById('addrCP')
    };

    Object.values(addrInputs).forEach(input => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
    });

    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        if (!addrInputs.rua.value.trim()) { addrInputs.rua.parentElement.classList.add('invalid'); isValid = false; }
        if (!addrInputs.localidade.value.trim()) { addrInputs.localidade.parentElement.classList.add('invalid'); isValid = false; }
        
        // Validação Código Postal (XXXX-XXX)
        const cpRegex = /^\d{4}-\d{3}$/;
        if (!cpRegex.test(addrInputs.cp.value.trim())) { 
            addrInputs.cp.parentElement.classList.add('invalid'); 
            isValid = false; 
        }

        if (isValid) {
            const clients = getClients();
            const clientIndex = clients.findIndex(c => c.id === currentClientId);
            if (clientIndex === -1) return;

            if (!clients[clientIndex].enderecos) {
                clients[clientIndex].enderecos = [];
            }

            const isEditing = addrEditingId.value !== "";
            const isFirstAddress = clients[clientIndex].enderecos.length === 0;

            if (isEditing) {
                // Atualizar existente
                const addrIndex = clients[clientIndex].enderecos.findIndex(a => a.id === addrEditingId.value);
                if (addrIndex > -1) {
                    clients[clientIndex].enderecos[addrIndex].rua = addrInputs.rua.value.trim();
                    clients[clientIndex].enderecos[addrIndex].localidade = addrInputs.localidade.value.trim();
                    clients[clientIndex].enderecos[addrIndex].codigoPostal = addrInputs.cp.value.trim();
                }
            } else {
                // Criar novo
                const newAddr = {
                    id: 'ADDR-' + Date.now(),
                    rua: addrInputs.rua.value.trim(),
                    localidade: addrInputs.localidade.value.trim(),
                    codigoPostal: addrInputs.cp.value.trim(),
                    isMain: isFirstAddress // Se for o primeiro, é o principal por defeito
                };
                clients[clientIndex].enderecos.push(newAddr);
            }

            saveClients(clients);
            renderAddresses(clients[clientIndex]);
            renderClientsList(); // Atualiza a contagem na lista
            resetAddressForm();
        }
    });

    cancelAddrEditBtn.addEventListener('click', resetAddressForm);

    function resetAddressForm() {
        addressForm.reset();
        addrEditingId.value = "";
        addressFormTitle.textContent = "Adicionar Novo Endereço";
        cancelAddrEditBtn.classList.add('hidden');
        Object.values(addrInputs).forEach(input => input.parentElement.classList.remove('invalid'));
    }

    // Globals for inline onclick HTML (necessário por causa do innerHTML dinâmico)
    window.removeAddress = function(addrId) {
        if (!confirm('Tem a certeza que deseja remover este endereço?')) return;
        const clients = getClients();
        const clientIndex = clients.findIndex(c => c.id === currentClientId);
        if (clientIndex === -1) return;

        clients[clientIndex].enderecos = clients[clientIndex].enderecos.filter(a => a.id !== addrId);
        
        // Se removeu o principal e ainda há outros, definir o primeiro como principal
        const hasMain = clients[clientIndex].enderecos.some(a => a.isMain);
        if (!hasMain && clients[clientIndex].enderecos.length > 0) {
            clients[clientIndex].enderecos[0].isMain = true;
        }

        saveClients(clients);
        renderAddresses(clients[clientIndex]);
        renderClientsList();
    };

    window.loadAddressToEdit = function(addrId) {
        const client = getClients().find(c => c.id === currentClientId);
        const addr = client.enderecos.find(a => a.id === addrId);
        if (!addr) return;

        addrInputs.rua.value = addr.rua;
        addrInputs.localidade.value = addr.localidade;
        addrInputs.cp.value = addr.codigoPostal;
        addrEditingId.value = addr.id;

        addressFormTitle.textContent = "Editar Endereço";
        cancelAddrEditBtn.classList.remove('hidden');
    };

    window.setMainAddress = function(addrId) {
        const clients = getClients();
        const clientIndex = clients.findIndex(c => c.id === currentClientId);
        if (clientIndex === -1) return;

        clients[clientIndex].enderecos.forEach(addr => {
            addr.isMain = (addr.id === addrId);
        });

        saveClients(clients);
        renderAddresses(clients[clientIndex]);
    };
});