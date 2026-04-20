document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('clientForm');
    const successMessage = document.getElementById('successMessage');
    const newRegistrationBtn = document.getElementById('newRegistrationBtn');
    const generatedIdSpan = document.getElementById('generatedId');

    const inputs = {
        nome: document.getElementById('nome'),
        nif: document.getElementById('nif'),
        tipo: document.getElementById('tipo'),
        contacto: document.getElementById('contacto'),
        email: document.getElementById('email')
    };

    // Remove erro ao alterar valor
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', () => {
            input.parentElement.classList.remove('invalid');
        });
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => {
                input.parentElement.classList.remove('invalid');
            });
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;

        // Validar Nome
        if (!inputs.nome.value.trim()) {
            showError('nome');
            isValid = false;
        }

        // Validar NIF (exatamente 9 digitos numéricos)
        const nifRegex = /^\d{9}$/;
        if (!nifRegex.test(inputs.nif.value.trim())) {
            showError('nif');
            isValid = false;
        }

        // Validar Tipo
        if (!inputs.tipo.value) {
            showError('tipo');
            isValid = false;
        }

        // Validar Contacto (pelo menos 9 caracteres)
        const contactoValor = inputs.contacto.value.trim();
        if (contactoValor.length < 9) {
            showError('contacto');
            isValid = false;
        }

        // Validar Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inputs.email.value.trim())) {
            showError('email');
            isValid = false;
        }

        if (isValid) {
            // Gerar ID Único
            const idGerado = generateUniqueID();
            
            // Criar objeto do cliente
            const clientData = {
                id: idGerado,
                nome: inputs.nome.value.trim(),
                nif: inputs.nif.value.trim(),
                tipo: inputs.tipo.value,
                contacto: inputs.contacto.value.trim(),
                email: inputs.email.value.trim(),
                dataRegisto: new Date().toISOString()
            };

            // Guardar no localStorage
            saveClient(clientData);

            // Mostrar Sucesso
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

    function showError(inputId) {
        inputs[inputId].parentElement.classList.add('invalid');
    }

    function generateUniqueID() {
        // Ex: CLI-20231015-ABCD
        const date = new Date();
        const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `CLI-${dateStr}-${randomStr}`;
    }

    function saveClient(client) {
        let clients = [];
        const existingClients = localStorage.getItem('clients');
        if (existingClients) {
            clients = JSON.parse(existingClients);
        }
        clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
    }
});