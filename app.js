document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // TAB NAVIGATION
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');

            // Hook on activation
            if (btn.dataset.target === 'tab-list') renderClientsList();
            if (btn.dataset.target === 'tab-order') populateOrderClientSelect();
            if (btn.dataset.target === 'tab-orders-list') renderOrdersList();
        });
    });

    // ---- 1. REGISTAR CLIENTE ----
    const clientForm = document.getElementById('clientForm');
    const clientSuccess = document.getElementById('successMessage');
    const cInputs = {
        nome: document.getElementById('nome'),
        nif: document.getElementById('nif'),
        tipo: document.getElementById('tipo'),
        contacto: document.getElementById('contacto'),
        email: document.getElementById('email')
    };

    Object.values(cInputs).forEach(input => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
        if (input.tagName === 'SELECT') input.addEventListener('change', () => input.parentElement.classList.remove('invalid'));
    });

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
        if (!cInputs.nome.value.trim()) { cInputs.nome.parentElement.classList.add('invalid'); isValid = false; }
        if (!/^\d{9}$/.test(cInputs.nif.value.trim())) { cInputs.nif.parentElement.classList.add('invalid'); isValid = false; }
        if (!cInputs.tipo.value) { cInputs.tipo.parentElement.classList.add('invalid'); isValid = false; }
        if (cInputs.contacto.value.trim().length < 9) { cInputs.contacto.parentElement.classList.add('invalid'); isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cInputs.email.value.trim())) { cInputs.email.parentElement.classList.add('invalid'); isValid = false; }

        if (isValid) {
            const idGerado = `CLI-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const clientData = {
                id: idGerado,
                nome: cInputs.nome.value.trim(),
                nif: cInputs.nif.value.trim(),
                tipo: cInputs.tipo.value,
                contacto: cInputs.contacto.value.trim(),
                email: cInputs.email.value.trim(),
                dataRegisto: new Date().toISOString(),
                enderecos: []
            };

            const clients = getClients();
            clients.push(clientData);
            saveClients(clients);

            document.getElementById('generatedId').textContent = idGerado;
            clientForm.style.display = 'none';
            clientSuccess.classList.remove('hidden');
        }
    });

    document.getElementById('newRegistrationBtn').addEventListener('click', () => {
        clientForm.reset();
        clientSuccess.classList.add('hidden');
        clientForm.style.display = 'block';
    });

    // ---- 2. LISTA DE CLIENTES & MODAL ENDEREÇOS ----
    const clientsContainer = document.getElementById('clientsContainer');
    let currentClientId = null;

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
                    <button class="btn-history" data-id="${client.id}">Histórico de Encomendas</button>
                </div>
            `;
            clientsContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-manage').forEach(btn => {
            btn.addEventListener('click', (e) => openAddressModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', (e) => openOrderHistoryModal(e.target.dataset.id));
        });
    }

    // ---- MODAL LOGIC ----
    function openAddressModal(clientId) {
        currentClientId = clientId;
        const client = getClients().find(c => c.id === clientId);
        if (!client) return;
        document.getElementById('modalClientName').textContent = client.nome;
        document.getElementById('modalClientId').textContent = client.id;
        addressForm.reset();
        document.getElementById('addrEditingId').value = "";
        renderAddresses(client);
        addressModal.classList.remove('hidden');
    }

    document.getElementById('closeModalBtn').addEventListener('click', () => addressModal.classList.add('hidden'));

    function renderAddresses(client) {
        const list = document.getElementById('addressesList');
        list.innerHTML = '';
        const enderecos = client.enderecos || [];
        if (enderecos.length === 0) {
            list.innerHTML = '<div class="no-data">Nenhum endereço registado para este cliente.</div>';
            return;
        }

        enderecos.forEach(addr => {
            const isMain = addr.isMain ? 'main-addr' : '';
            const mainBadge = addr.isMain ? '<span class="badge">Principal</span>' : '';
            list.innerHTML += `
                <div class="addr-item ${isMain}">
                    <div class="addr-details">
                        <p><strong>${addr.rua}</strong></p>
                        <p>${addr.codigoPostal} ${addr.localidade}</p>
                        ${mainBadge}
                    </div>
                    <div class="addr-actions">
                        <button class="icon-btn star ${addr.isMain ? 'is-main' : ''}" onclick="window.setMainAddress('${addr.id}')">★</button>
                        <button class="icon-btn delete" onclick="window.removeAddress('${addr.id}')">❌</button>
                    </div>
                </div>
            `;
        });
    }

    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rua = document.getElementById('addrRua').value.trim();
        const loc = document.getElementById('addrLocalidade').value.trim();
        const cp = document.getElementById('addrCP').value.trim();
        
        if (!rua || !loc || !/^\d{4}-\d{3}$/.test(cp)) {
            alert('Preencha os campos corretamente. C. Postal: XXXX-XXX');
            return;
        }

        const clients = getClients();
        const cIndex = clients.findIndex(c => c.id === currentClientId);
        if (cIndex === -1) return;
        
        if (!clients[cIndex].enderecos) clients[cIndex].enderecos = [];
        
        const newAddr = {
            id: 'ADDR-' + Date.now(),
            rua: rua, localidade: loc, codigoPostal: cp,
            isMain: clients[cIndex].enderecos.length === 0
        };
        clients[cIndex].enderecos.push(newAddr);
        saveClients(clients);
        renderAddresses(clients[cIndex]);
        renderClientsList();
        addressForm.reset();
    });

    window.removeAddress = function(addrId) {
        if (!confirm('Remover?')) return;
        const clients = getClients();
        const cIndex = clients.findIndex(c => c.id === currentClientId);
        clients[cIndex].enderecos = clients[cIndex].enderecos.filter(a => a.id !== addrId);
        if (clients[cIndex].enderecos.length > 0 && !clients[cIndex].enderecos.some(a => a.isMain)) {
            clients[cIndex].enderecos[0].isMain = true;
        }
        saveClients(clients);
        renderAddresses(clients[cIndex]);
        renderClientsList();
    }
    
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