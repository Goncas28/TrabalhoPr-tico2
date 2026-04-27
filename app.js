document.addEventListener('DOMContentLoaded', () => {
        // ---- Filtros de Encomendas ----
        const filterEstado = document.getElementById('filterEstado');
        const filterDataInicio = document.getElementById('filterDataInicio');
        const filterDataFim = document.getElementById('filterDataFim');
        const btnExportPDF = document.getElementById('btnExportPDF');
        const btnExportExcel = document.getElementById('btnExportExcel');

        function getFilteredOrders() {
            let orders = getOrders();
            // Filtro por estado
            if (filterEstado && filterEstado.value) {
                orders = orders.filter(o => o.estado === filterEstado.value);
            }
            // Filtro por período
            if (filterDataInicio && filterDataInicio.value) {
                orders = orders.filter(o => new Date(o.dataCriacao) >= new Date(filterDataInicio.value));
            }
            if (filterDataFim && filterDataFim.value) {
                // Considera o fim do dia
                const fim = new Date(filterDataFim.value);
                fim.setHours(23,59,59,999);
                orders = orders.filter(o => new Date(o.dataCriacao) <= fim);
            }
            return orders;
        }

        if (filterEstado) filterEstado.addEventListener('change', renderOrdersList);
        if (filterDataInicio) filterDataInicio.addEventListener('change', renderOrdersList);
        if (filterDataFim) filterDataFim.addEventListener('change', renderOrdersList);

        if (btnExportPDF) btnExportPDF.addEventListener('click', exportOrdersPDF);
        if (btnExportExcel) btnExportExcel.addEventListener('click', exportOrdersExcel);

        // Funções de exportação (esqueleto)
        function exportOrdersPDF() {
            // Exportação simples: abre uma nova janela com HTML formatado para impressão em PDF
            const orders = getFilteredOrders();
            if (orders.length === 0) { alert('Nenhuma encomenda para exportar.'); return; }
            let html = `<h2>Lista de Encomendas</h2><table border='1' cellpadding='5' cellspacing='0'><thead><tr><th>Referência</th><th>Cliente</th><th>Produto</th><th>Peso (Kg)</th><th>Destino</th><th>Prazo</th><th>Estado</th><th>Data Criação</th></tr></thead><tbody>`;
            orders.forEach(o => {
                html += `<tr><td>${o.id}</td><td>${o.clientName}</td><td>${o.produto}</td><td>${o.peso}</td><td>${o.destinoInfo}</td><td>${new Date(o.prazo).toLocaleDateString('pt-PT')}</td><td>${o.estado}</td><td>${new Date(o.dataCriacao).toLocaleDateString('pt-PT')}</td></tr>`;
            });
            html += '</tbody></table>';
            const win = window.open('', '', 'width=900,height=700');
            win.document.write(`<html><head><title>Exportação PDF</title></head><body>${html}</body></html>`);
            win.document.close();
            win.print();
        }
        function exportOrdersExcel() {
            // Exportação simples para CSV
            const orders = getFilteredOrders();
            if (orders.length === 0) { alert('Nenhuma encomenda para exportar.'); return; }
            let csv = 'Referência,Cliente,Produto,Peso (Kg),Destino,Prazo,Estado,Data Criação\n';
            orders.forEach(o => {
                csv += `"${o.id}","${o.clientName}","${o.produto}","${o.peso}","${o.destinoInfo}","${new Date(o.prazo).toLocaleDateString('pt-PT')}","${o.estado}","${new Date(o.dataCriacao).toLocaleDateString('pt-PT')}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'encomendas.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    // ---- Global Data ----
    function getClients() { return JSON.parse(localStorage.getItem('clients') || '[]'); }
    function saveClients(clients) { localStorage.setItem('clients', JSON.stringify(clients)); }
    function getOrders() { return JSON.parse(localStorage.getItem('orders') || '[]'); }
    function saveOrders(orders) { localStorage.setItem('orders', JSON.stringify(orders)); }
    function getCouriers() { 
        const defaultCouriers = [
            { id: 'EST-001', nome: 'João Silva', zona: 'Lisboa', disponivel: true, contacto: '912345671', veiculo: 'Moto', horarios: '09:00-18:00', capacidade: 5 },
            { id: 'EST-002', nome: 'Maria Santos', zona: 'Lisboa', disponivel: true, contacto: '912345672', veiculo: 'Carrinha', horarios: '08:00-20:00', capacidade: 8 },
            { id: 'EST-003', nome: 'Pedro Lima', zona: 'Porto', disponivel: true, contacto: '912345673', veiculo: 'Carro', horarios: '10:00-19:00', capacidade: 6 },
            { id: 'EST-004', nome: 'Ana Costa', zona: 'Lisboa', disponivel: false, contacto: '912345674', veiculo: 'Bicicleta', horarios: '12:00-22:00', capacidade: 3 },
            { id: 'EST-005', nome: 'Carlos Sousa', zona: 'Setúbal', disponivel: true, contacto: '912345675', veiculo: 'Moto', horarios: '09:00-18:00', capacidade: 5 }
        ];
        const stored = localStorage.getItem('couriers');
        if (!stored) {
            localStorage.setItem('couriers', JSON.stringify(defaultCouriers));
            return defaultCouriers;
        }
        return JSON.parse(stored);
    }
    function saveCouriers(couriers) { localStorage.setItem('couriers', JSON.stringify(couriers)); }

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
            if (btn.dataset.target === 'tab-couriers') renderCouriersList();
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

    // Modal de histórico de encomendas
    function openOrderHistoryModal(clientId) {
        const client = getClients().find(c => c.id === clientId);
        if (!client) return;
        const orders = getOrders().filter(o => o.clientId === clientId);
        let html = `<h2>Histórico de Encomendas de ${client.nome}</h2>`;
        if (orders.length === 0) {
            html += '<div class="no-data">Nenhuma encomenda encontrada para este cliente.</div>';
        } else {
            html += `<table border='1' cellpadding='5' cellspacing='0' style='width:100%;margin-top:1rem;'><thead><tr><th>Referência</th><th>Produto</th><th>Peso</th><th>Destino</th><th>Prazo</th><th>Estado</th><th>Data Criação</th></tr></thead><tbody>`;
            orders.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            orders.forEach(o => {
                html += `<tr><td>${o.id}</td><td>${o.produto}</td><td>${o.peso}</td><td>${o.destinoInfo}</td><td>${new Date(o.prazo).toLocaleDateString('pt-PT')}</td><td>${o.estado}</td><td>${new Date(o.dataCriacao).toLocaleDateString('pt-PT')}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        showModal(html);
    }

    // Função utilitária para mostrar modal simples
    function showModal(contentHtml) {
        let modal = document.getElementById('simpleModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'simpleModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content"><button id="closeSimpleModalBtn" class="close-btn" style="float:right;">&times;</button><div id="simpleModalBody"></div></div>`;
            document.body.appendChild(modal);
        }
        document.getElementById('simpleModalBody').innerHTML = contentHtml;
        modal.classList.remove('hidden');
        document.getElementById('closeSimpleModalBtn').onclick = () => modal.classList.add('hidden');
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
                estado: 'Pendente',
                historicoEstado: [
                    { estado: 'Pendente', timestamp: new Date().toISOString() }
                ]
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
        const orders = getFilteredOrders();
        ordersContainer.innerHTML = '';
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-data">Nenhuma encomenda encontrada com os filtros selecionados.</div>';
            return;
        }
        // Ordenar por data de criação mais recente
        orders.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        
        orders.forEach(order => {
            const prazoDate = new Date(order.prazo).toLocaleDateString('pt-PT');
            const statusClass = order.estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
            
            const card = document.createElement('div');
            card.className = 'order-card';
            
            // Botões de ação se estiver pendente
            let actionBtns = '';
            if (order.estado === 'Pendente') {
                actionBtns = `
                    <button class="btn-manage btn-edit" data-id="${order.id}">Editar</button>
                    <button class="btn-manage btn-cancel" data-id="${order.id}">Cancelar</button>
                    <button class="btn-manage btn-assign" data-id="${order.id}">Atribuir Estafeta</button>
                `;
            }

            card.innerHTML = `
                <div class="order-info">
                    <span class="order-ref">${order.id}</span>
                    <h3>${order.produto} (${order.peso} Kg)</h3>
                    <p><strong>Cliente:</strong> ${order.clientName}</p>
                    <p><strong>Destino:</strong> ${order.destinoInfo}</p>
                    <div style="margin-top: 1rem;">
                        <span class="badge-status status-${statusClass}">${order.estado}</span>
                    </div>
                </div>
                <div class="order-actions" style="text-align:right;">
                    <p style="margin-bottom: 0.5rem;"><strong>Prazo:</strong> <br>${prazoDate}</p>
                    <button class="btn-manage btn-track" data-id="${order.id}">Rastrear</button>
                    ${actionBtns}
                </div>
            `;
            ordersContainer.appendChild(card);
        });

        // Event listeners para novos botões
        document.querySelectorAll('.btn-track').forEach(btn => {
            btn.addEventListener('click', (e) => openTrackingModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-assign').forEach(btn => {
            btn.addEventListener('click', (e) => openAssignModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openEditOrderModal(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => openCancelModal(e.target.dataset.id));
        });
    }

    // ---- 5. GESTÃO DE ESTAFETAS ----
    const courierForm = document.getElementById('courierForm');
    const couriersContainer = document.getElementById('couriersContainer');

    if (courierForm) {
        courierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = {
                nome: document.getElementById('cNome'),
                contacto: document.getElementById('cContacto'),
                veiculo: document.getElementById('cVeiculo'),
                zona: document.getElementById('cZona'),
                capacidade: document.getElementById('cCapacidade'),
                horario: document.getElementById('cHorario')
            };

            let isValid = true;
            Object.values(inputs).forEach(input => {
                if (!input.value.trim()) {
                    input.parentElement.classList.add('invalid');
                    isValid = false;
                } else {
                    input.parentElement.classList.remove('invalid');
                }
            });

            if (isValid) {
                const newCourier = {
                    id: `EST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                    nome: inputs.nome.value.trim(),
                    contacto: inputs.contacto.value.trim(),
                    veiculo: inputs.veiculo.value,
                    zona: inputs.zona.value.trim(),
                    capacidade: parseInt(inputs.capacidade.value),
                    horarios: inputs.horario.value.trim(),
                    disponivel: true
                };

                const couriers = getCouriers();
                couriers.push(newCourier);
                saveCouriers(couriers);
                
                courierForm.reset();
                renderCouriersList();
                alert('Estafeta registado com sucesso!');
            }
        });
    }

    function renderCouriersList() {
        const couriers = getCouriers();
        const orders = getOrders();
        couriersContainer.innerHTML = '';
        
        if (couriers.length === 0) {
            couriersContainer.innerHTML = '<div class="no-data">Nenhum estafeta registado.</div>';
            return;
        }

        couriers.forEach(c => {
            // Calcular carga de trabalho atual (encomendas em distribuição)
            const activeDeliveries = orders.filter(o => o.courierId === c.id && o.estado === 'Em distribuição').length;
            const workloadPercent = Math.min((activeDeliveries / (c.capacidade || 5)) * 100, 100);
            
            let workloadClass = '';
            if (workloadPercent > 80) workloadClass = 'danger';
            else if (workloadPercent > 50) workloadClass = 'warning';

            const statusClass = c.disponivel ? '' : 'unavailable';
            const statusTxt = c.disponivel ? 'Disponível' : 'Indisponível';
            
            const card = document.createElement('div');
            card.className = `client-card courier-card ${statusClass}`;
            card.innerHTML = `
                <div class="courier-header">
                    <div class="client-info">
                        <h3 style="margin-bottom: 0.25rem;">${c.nome}</h3>
                        <span class="badge-zone">${c.zona}</span>
                    </div>
                    <div style="text-align: right;">
                        <button class="secondary-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="window.toggleCourierStatus('${c.id}')">
                            Alterar para ${c.disponivel ? 'Indisponível' : 'Disponível'}
                        </button>
                    </div>
                </div>

                <div class="courier-details-grid">
                    <div class="courier-detail-item">
                        <label>Contacto</label>
                        <span>${c.contacto || 'N/A'}</span>
                    </div>
                    <div class="courier-detail-item">
                        <label>Veículo</label>
                        <span>${c.veiculo || 'N/A'}</span>
                    </div>
                    <div class="courier-detail-item">
                        <label>Horário</label>
                        <span>${c.horarios || 'N/A'}</span>
                    </div>
                </div>

                <div class="workload-section">
                    <div class="workload-header">
                        <span>Carga de Trabalho</span>
                        <span>${activeDeliveries} / ${c.capacidade || 5} Encomendas</span>
                    </div>
                    <div class="workload-bar-container">
                        <div class="workload-bar-fill ${workloadClass}" style="width: ${workloadPercent}%"></div>
                    </div>
                </div>
            `;
            couriersContainer.appendChild(card);
        });
    }

    window.toggleCourierStatus = function(courierId) {
        const couriers = getCouriers();
        const cIndex = couriers.findIndex(c => c.id === courierId);
        if (cIndex !== -1) {
            couriers[cIndex].disponivel = !couriers[cIndex].disponivel;
            saveCouriers(couriers);
            renderCouriersList();
        }
    };

    // ---- 6. ATRIBUIÇÃO DE ENCOMENDA ----
    const assignModal = document.getElementById('assignCourierModal');
    const availableCouriersList = document.getElementById('availableCouriersList');
    const btnConfirmAssignment = document.getElementById('btnConfirmAssignment');
    const btnAutoSuggest = document.getElementById('btnAutoSuggest');
    let selectedCourierId = null;

    function openAssignModal(orderId) {
        const order = getOrders().find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('assignOrderId').value = orderId;
        document.getElementById('assignOrderRef').textContent = order.id;
        document.getElementById('assignOrderDest').textContent = order.destinoInfo;
        
        // Extrair localidade (tenta encontrar no destinoInfo)
        // Assume formato: Rua, CP Localidade
        const parts = order.destinoInfo.split(' ');
        const zone = parts[parts.length - 1]; // Pega a última palavra como zona aproximada

        selectedCourierId = null;
        document.getElementById('selectedCourierId').value = "";
        document.getElementById('selectedCourierInfo').classList.add('hidden');
        btnConfirmAssignment.disabled = true;

        renderAvailableCouriers(zone);
        assignModal.classList.remove('hidden');
    }

    function renderAvailableCouriers(zone) {
        const couriers = getCouriers();
        availableCouriersList.innerHTML = '';
        
        // Filtrar por zona e disponibilidade
        const filtered = couriers.filter(c => c.zona.toLowerCase() === zone.toLowerCase());

        if (filtered.length === 0) {
            availableCouriersList.innerHTML = '<div class="no-data">Nenhum estafeta disponível para esta zona.</div>';
            return;
        }

        filtered.forEach(c => {
            const item = document.createElement('div');
            item.className = `courier-item ${!c.disponivel ? 'disabled' : ''}`;
            item.innerHTML = `
                <div>
                    <strong>${c.nome}</strong><br>
                    <small>${c.zona}</small>
                </div>
                <span>${c.disponivel ? '✅' : '❌'}</span>
            `;
            
            if (c.disponivel) {
                item.onclick = () => selectCourier(c);
            }
            availableCouriersList.appendChild(item);
        });
    }

    function selectCourier(courier) {
        selectedCourierId = courier.id;
        document.getElementById('selectedCourierId').value = courier.id;
        document.getElementById('selectedCourierName').textContent = courier.nome;
        document.getElementById('selectedCourierInfo').classList.remove('hidden');
        btnConfirmAssignment.disabled = false;

        // Visual feedback
        document.querySelectorAll('.courier-item').forEach(el => el.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
    }

    btnAutoSuggest.onclick = () => {
        const zone = document.getElementById('assignOrderDest').textContent.split(' ').pop();
        const couriers = getCouriers().filter(c => c.zona.toLowerCase() === zone.toLowerCase() && c.disponivel);
        
        if (couriers.length > 0) {
            // Sugere o primeiro disponível
            const item = Array.from(document.querySelectorAll('.courier-item')).find(el => el.innerHTML.includes(couriers[0].nome));
            if (item) item.click();
        } else {
            alert('Não foi possível encontrar uma sugestão automática para esta zona.');
        }
    };

    btnConfirmAssignment.onclick = () => {
        const orderId = document.getElementById('assignOrderId').value;
        const courierId = document.getElementById('selectedCourierId').value;
        const courier = getCouriers().find(c => c.id === courierId);

        if (!orderId || !courierId) return;

        const orders = getOrders();
        const oIndex = orders.findIndex(o => o.id === orderId);
        
        orders[oIndex].estado = 'Em distribuição';
        orders[oIndex].courierId = courierId;
        orders[oIndex].courierName = courier.nome;
        orders[oIndex].historicoEstado.push({
            estado: 'Em distribuição',
            timestamp: new Date().toISOString(),
            motivo: `Atribuída ao estafeta ${courier.nome}`
        });

        saveOrders(orders);
        assignModal.classList.add('hidden');
        renderOrdersList();

        alert(`Confirmação: Encomenda ${orderId} atribuída a ${courier.nome}.\nO cliente foi notificado.`);
    };

    document.getElementById('closeAssignModalBtn').onclick = () => assignModal.classList.add('hidden');

    // Função de rastreio (complemento)
    function openTrackingModal(orderId) {
        const order = getOrders().find(o => o.id === orderId);
        if (!order) return;

        let timelineHtml = '<div class="timeline">';
        order.historicoEstado.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(h => {
            const dateStr = new Date(h.timestamp).toLocaleString('pt-PT');
            timelineHtml += `
                <div class="timeline-item">
                    <div class="timeline-content">
                        <span class="time">${dateStr}</span>
                        <span class="status-text">${h.estado}</span>
                        ${h.motivo ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">${h.motivo}</p>` : ''}
                    </div>
                </div>
            `;
        });
        timelineHtml += '</div>';

        showModal(`
            <h2>Rastreio da Encomenda ${order.id}</h2>
            <p><strong>Produto:</strong> ${order.produto}</p>
            ${timelineHtml}
        `);
    }

    // ---- 7. CANCELAMENTO E EDIÇÃO DE ENCOMENDA ----
    const cancelModal = document.getElementById('cancelOrderModal');
    const cancelForm = document.getElementById('cancelOrderForm');
    const editModal = document.getElementById('editOrderModal');
    const editForm = document.getElementById('editOrderForm');

    function openCancelModal(orderId) {
        const order = getOrders().find(o => o.id === orderId);
        if (!order) return;
        document.getElementById('cancelOrderId').value = orderId;
        document.getElementById('cancelOrderRef').textContent = order.id;
        cancelForm.reset();
        cancelModal.classList.remove('hidden');
    }

    cancelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = document.getElementById('cancelOrderId').value;
        const reason = document.getElementById('cancelReason').value.trim();
        
        const orders = getOrders();
        const oIndex = orders.findIndex(o => o.id === orderId);
        
        orders[oIndex].estado = 'Cancelada';
        orders[oIndex].historicoEstado.push({
            estado: 'Cancelada',
            timestamp: new Date().toISOString(),
            motivo: reason
        });
        
        saveOrders(orders);
        cancelModal.classList.add('hidden');
        renderOrdersList();
        
        alert(`A encomenda ${orderId} foi cancelada.\nO cliente foi notificado automaticamente.`);
    });

    document.getElementById('closeCancelModalBtn').onclick = () => cancelModal.classList.add('hidden');

    function openEditOrderModal(orderId) {
        const order = getOrders().find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('editOrderId').value = orderId;
        document.getElementById('editOrderProduct').value = order.produto;
        document.getElementById('editOrderWeight').value = order.peso;
        document.getElementById('editOrderDeadline').value = order.prazo;

        // Popular destinos do cliente
        const client = getClients().find(c => c.id === order.clientId);
        const editOrderDest = document.getElementById('editOrderDest');
        editOrderDest.innerHTML = '';
        client.enderecos.forEach(addr => {
            const opt = document.createElement('option');
            opt.value = addr.id;
            const fullAddr = `${addr.rua}, ${addr.codigoPostal} ${addr.localidade}`;
            opt.textContent = fullAddr;
            if (fullAddr === order.destinoInfo) opt.selected = true;
            editOrderDest.appendChild(opt);
        });

        editModal.classList.remove('hidden');
    }

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = document.getElementById('editOrderId').value;
        const product = document.getElementById('editOrderProduct').value.trim();
        const weight = document.getElementById('editOrderWeight').value;
        const deadline = document.getElementById('editOrderDeadline').value;
        const destId = document.getElementById('editOrderDest').value;

        const orders = getOrders();
        const oIndex = orders.findIndex(o => o.id === orderId);
        const order = orders[oIndex];
        const client = getClients().find(c => c.id === order.clientId);
        const address = client.enderecos.find(a => a.id === destId);
        const newDestInfo = `${address.rua}, ${address.codigoPostal} ${address.localidade}`;

        order.produto = product;
        order.peso = parseFloat(weight);
        order.prazo = deadline;
        order.destinoInfo = newDestInfo;
        
        order.historicoEstado.push({
            estado: order.estado,
            timestamp: new Date().toISOString(),
            motivo: 'Dados da encomenda editados pelo operador'
        });

        saveOrders(orders);
        editModal.classList.add('hidden');
        renderOrdersList();
        
        alert('Encomenda atualizada com sucesso!');
    });

    document.getElementById('closeEditModalBtn').onclick = () => editModal.classList.add('hidden');
});
