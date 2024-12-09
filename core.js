function savePasswords(passwords) {
    localStorage.setItem('passwords', JSON.stringify(passwords));
}

// Função para carregar as senhas do localStorage
function loadPasswords() {
    const storedPasswords = localStorage.getItem('passwords');
    return storedPasswords ? JSON.parse(storedPasswords) : [];
}

// Função para adicionar uma nova senha
function addPassword(event) {
    event.preventDefault();

    const siteName = document.getElementById('SiteName').value;
    const siteUrl = document.getElementById('SiteUrl').value;
    const email = document.getElementById('Email').value;
    const password = document.getElementById('Password').value;

    const passwords = loadPasswords();
    const newPassword = { siteName, siteUrl, email, password };
    passwords.push(newPassword);

    savePasswords(passwords);
    displayPasswords();
    document.getElementById('addPasswordForm').reset();
    $('#AddPass').modal('hide');
}

// Função para editar uma senha
function editPassword(event) {
    event.preventDefault();

    const siteName = document.getElementById('editSiteName').value;
    const siteUrl = document.getElementById('editSiteUrl').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    const passwordId = document.getElementById('editPasswordId').value;

    const passwords = loadPasswords();
    passwords[passwordId] = { siteName, siteUrl, email, password };

    savePasswords(passwords);
    displayPasswords();
    document.getElementById('editPasswordForm').reset();
    $('#DetailsPass').modal('hide');
}

// Função para deletar uma senha
function deletePassword(id) {
    const passwords = loadPasswords();
    passwords.splice(id, 1);
    savePasswords(passwords);
    displayPasswords();
}

// Função para preencher a lista de senhas
function displayPasswords() {
    const passwords = loadPasswords();
    const passwordList = document.getElementById('passwordList');
    passwordList.innerHTML = '';

    passwords.forEach((password, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${password.siteName}</td>
            <td>${password.siteUrl}</td>
            <td>${password.email}</td>
            <td>
                <div style="display: flex; gap: 0.3rem;">
                    <i class='bx bx-detail' style="font-size: 1.5rem; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#DetailsPass" onclick="loadEditForm(${index})"></i>
                    <i class='bx bx-trash' style="font-size: 1.5rem; cursor: pointer;" onclick="deletePassword(${index})"></i>
                </div>

            </td>
        `;
        passwordList.appendChild(row);
    });
}

// Função para carregar os dados da senha no modal de edição
function loadEditForm(index) {
    const passwords = loadPasswords();
    const password = passwords[index];

    document.getElementById('editSiteName').value = password.siteName;
    document.getElementById('editSiteUrl').value = password.siteUrl;
    document.getElementById('editEmail').value = password.email;
    document.getElementById('editPassword').value = password.password;
    document.getElementById('editPasswordId').value = index;
}

// Adiciona evento de submit para o formulário de adicionar senha
document.getElementById('addPasswordForm').addEventListener('submit', addPassword);

// Inicializa a lista de senhas quando a página é carregada
window.onload = function () {
    displayPasswords();
}