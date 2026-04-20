document.addEventListener('DOMContentLoaded', () => {
    // ---- Global Data ----
    function getClients() { return JSON.parse(localStorage.getItem('clients') || '[]'); }
    function saveClients(clients) { localStorage.setItem('clients', JSON.stringify(clients)); }
    function getOrders() { return JSON.parse(localStorage.getItem('orders') || '[]'); }
    function saveOrders(orders) { localStorage.setItem('orders', JSON.stringify(orders)); }

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
                </div>
            `;
            clientsContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-manage').forEach(btn => {
            btn.addEventListener('click', (e) => openAddressModal(e.target.dataset.id));
        });
    }

    // [Omitted full modal logic here but included the essential functions below]
    // Modal Address functions 
    const addressModal = document.getElementById('addressModal');
    const addressForm = document.getElementById('addressForm');
    
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
        const cIndex = clients.findIndex(c => c.id === currentClientId);
        clients[cIndex].enderecos.forEach(a => a.isMain = (a.id === addrId));
        saveClients(clients);
        renderAddresses(clients[cIndex]);
    }

    // ---- 3. NOVA ENCOMENDA ----
    const orderForm = document.getElementById('orderForm');
    const orderClient = document.getElementById('orderClient');
    const orderDest = document.getElementById('orderDest');
    const orderProduct = document.getElementById('orderProduct');
    const orderWeight = document.getElementById('orderWeight');
    const orderDeadline = document.getElementById('orderDeadline');
    const orderSuccess = document.getElementById('orderSuccessMessage');

    // Popular Dropdown de Clientes
    function populateOrderClientSelect() {
        const clients = getClients();
        orderClient.innerHTML = '<option value="" disabled selected>Selecione um cliente...</option>';
        orderDest.innerHTML = '<option value="" disabled selected>Primeiro selecione um cliente...</option>';
        orderDest.disabled = true;

        if (clients.length === 0) {
            orderClient.innerHTML = '<option value="" disabled selected>Nenhum cliente disponível. Registe um primeiro.</option>';
            return;
        }

        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.nome} (${c.nif})`;
            orderClient.appendChild(opt);
        });
    }

    // Atualizar Destinos ao Selecionar Cliente
    orderClient.addEventListener('change', () => {
        orderClient.parentElement.classList.remove('invalid');
        const clientId = orderClient.value;
        const client = getClients().find(c => c.id === clientId);
        
        orderDest.innerHTML = '';
        
        if (!client || !client.enderecos || client.enderecos.length === 0) {
            orderDest.innerHTML = '<option value="" disabled selected>Cliente sem endereços registados!</option>';
            orderDest.disabled = true;
            return;
        }

        orderDest.disabled = false;
        client.enderecos.forEach(addr => {
            const opt = document.createElement('option');
            opt.value = addr.id;
            // Destaca o principal
            const isMainTxt = addr.isMain ? ' (Principal)' : '';
            opt.textContent = `${addr.rua}, ${addr.codigoPostal} ${addr.localidade}${isMainTxt}`;
            if (addr.isMain) opt.selected = true; // Auto-selecionar o principal
            orderDest.appendChild(opt);
        });
        orderDest.parentElement.classList.remove('invalid');
    });

    [orderProduct, orderWeight, orderDeadline, orderDest].forEach(input => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
        input.addEventListener('change', () => input.parentElement.classList.remove('invalid'));
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        if (!orderClient.value) { orderClient.parentElement.classList.add('invalid'); isValid = false; }
        if (!orderProduct.value.trim()) { orderProduct.parentElement.classList.add('invalid'); isValid = false; }
        if (!orderWeight.value || orderWeight.value <= 0) { orderWeight.parentElement.classList.add('invalid'); isValid = false; }
        if (!orderDeadline.value) { orderDeadline.parentElement.classList.add('invalid'); isValid = false; }
        if (!orderDest.value) { orderDest.parentElement.classList.add('invalid'); isValid = false; }

        if (isValid) {
            const client = getClients().find(c => c.id === orderClient.value);
            const address = client.enderecos.find(a => a.id === orderDest.value);

            // Gerar Referência Única
            const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
            const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            const orderRef = `ENC-${dateStr}-${randStr}`;

            const orderData = {
                id: orderRef,
                clientId: client.id,
                clientName: client.nome,
                produto: orderProduct.value.trim(),
                peso: parseFloat(orderWeight.value),
                destinoInfo: `${address.rua}, ${address.codigoPostal} ${address.localidade}`,
                prazo: orderDeadline.value,
                dataCriacao: new Date().toISOString(),
                estado: 'Pendente' // Podemos expandir mais tarde
            };

            const orders = getOrders();
            orders.push(orderData);
            saveOrders(orders);

            document.getElementById('generatedOrderRef').textContent = orderRef;
            orderForm.style.display = 'none';
            orderSuccess.classList.remove('hidden');
        }
    });

    document.getElementById('newOrderBtn').addEventListener('click', () => {
        orderForm.reset();
        orderDest.innerHTML = '<option value="" disabled selected>Primeiro selecione um cliente...</option>';
        orderDest.disabled = true;
        orderSuccess.classList.add('hidden');
        orderForm.style.display = 'block';
    });

    // ---- 4. LISTA DE ENCOMENDAS ----
    const ordersContainer = document.getElementById('ordersContainer');

    function renderOrdersList() {
        const orders = getOrders();
        ordersContainer.innerHTML = '';
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-data">Nenhuma encomenda registada.</div>';
            return;
        }

        // Ordenar por data de criação mais recente
        orders.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

        orders.forEach(order => {
            const prazoDate = new Date(order.prazo).toLocaleDateString('pt-PT');
            
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-info">
                    <span class="order-ref">${order.id}</span>
                    <h3>${order.produto} (${order.peso} Kg)</h3>
                    <p><strong>Cliente:</strong> ${order.clientName}</p>
                    <p><strong>Destino:</strong> ${order.destinoInfo}</p>
                </div>
                <div class="order-status" style="text-align:right;">
                    <p><strong>Prazo:</strong> <br>${prazoDate}</p>
                </div>
            `;
            ordersContainer.appendChild(card);
        });
    }
});
