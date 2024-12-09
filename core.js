function savePasswords(passwords) {
    localStorage.setItem('passwords', JSON.stringify(passwords));
}

function loadPasswords() {
    const storedPasswords = localStorage.getItem('passwords');
    return storedPasswords ? JSON.parse(storedPasswords) : [];
}

function addPassword(event) {
    event.preventDefault();

    const form = document.getElementById('addPasswordForm');

    if (form.checkValidity()) {
        const siteName = document.getElementById('SiteName').value;
        const siteUrl = document.getElementById('SiteUrl').value;
        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        const passwords = loadPasswords();
        const newPassword = { siteName, siteUrl, email, password };
        passwords.push(newPassword);

        savePasswords(passwords);
        displayPasswords();
        $('#AddPass').modal('hide');
        document.getElementById('addPasswordForm').reset();
    }
}

function editPassword(event) {
    event.preventDefault();

    const form = document.getElementById('editPasswordForm');

    if (form.checkValidity()) {
        var siteName = document.getElementById('editSiteName').value;
        var siteUrl = document.getElementById('editSiteUrl').value;
        var email = document.getElementById('editEmail').value;
        var password = document.getElementById('editPassword').value;
        var passwordId = parseInt(document.getElementById('editPasswordId').value);

        var passwords = loadPasswords();

        passwords[passwordId] = { siteName, siteUrl, email, password };
        savePasswords(passwords);

        displayPasswords();
        $('#DetailsPass').modal('hide');
        document.getElementById('editPasswordForm').reset();
    }
}

function deletePassword(id) {
    if (confirm("Tem a certeza que deseja apagar esta palavra-passe?")) {
        const passwords = loadPasswords();
        passwords.splice(id, 1);
        savePasswords(passwords);
        displayPasswords();
    }
}

function displayPasswords() {
    const passwords = loadPasswords();
    const passwordList = document.getElementById('passwordList');
    passwordList.innerHTML = '';

    passwords.forEach((password, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
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

function loadEditForm(index) {
    const passwords = loadPasswords();
    const password = passwords[index];

    document.getElementById('editPasswordId').value = index;
    document.getElementById('editSiteName').value = password.siteName;
    document.getElementById('editSiteUrl').value = password.siteUrl;
    document.getElementById('editEmail').value = password.email;
    document.getElementById('editPassword').value = password.password;
    document.getElementById('editPasswordForm').addEventListener('submit', editPassword);
}

function generatePassword() {
    const randomPassword = Array(16)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    document.getElementById('Password').value = randomPassword;
}

function generateEditPassword() {
    const randomPassword = Array(16)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    document.getElementById('editPassword').value = randomPassword;
}

document.getElementById('addPasswordForm').addEventListener('submit', addPassword);

window.onload = function () {
    displayPasswords();
}