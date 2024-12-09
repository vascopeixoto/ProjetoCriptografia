//#region Declare a Secret Key to use the AES

let aesKey;

async function initializeAESKey() {
    const keyData = new Uint8Array([
        12, 34, 56, 78, 90, 123, 45, 67, 89, 101, 23, 45, 67, 89, 12, 34,
        56, 78, 90, 123, 45, 67, 89, 101, 23, 45, 67, 89, 12, 34, 56, 78
    ]);

    aesKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

initializeAESKey();

//#endregion

//#region Encrypt and Decrypt Methods
async function encryptPassword(password, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(password)
    );
    return { encryptedPassword: encryptedData, iv };
}

async function decryptPassword(encryptedPassword, iv, key) {
    const decoder = new TextDecoder();
    const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedPassword
    );
    return decoder.decode(decryptedData);
}
//#endregion

//#region Converter ArrayBufferToBase64 & Base64ToArrayBuffer
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
}
//#endregion

//#region Add, Edit, Delete & List Passwords
async function addPassword(event) {
    event.preventDefault();

    const form = document.getElementById('addPasswordForm');

    if (form.checkValidity()) {
        const siteName = document.getElementById('SiteName').value;
        const siteUrl = document.getElementById('SiteUrl').value;
        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;
        const { encryptedPassword, iv } = await encryptPassword(password, aesKey);
        const passwords = loadPasswords();
        const newPassword = { siteName, siteUrl, email, encryptedPassword: arrayBufferToBase64(encryptedPassword), iv: arrayBufferToBase64(iv)};
        passwords.push(newPassword);

        savePasswords(passwords);
        ListPasswords();
        $('#AddPass').modal('hide');
        document.getElementById('addPasswordForm').reset();
    }
}

async function editPassword(event) {
    event.preventDefault();

    const form = document.getElementById('editPasswordForm');

    if (form.checkValidity()) {
        var siteName = document.getElementById('editSiteName').value;
        var siteUrl = document.getElementById('editSiteUrl').value;
        var email = document.getElementById('editEmail').value;
        var password = document.getElementById('editPassword').value;
        var passwordId = parseInt(document.getElementById('editPasswordId').value);
        const { encryptedPassword, iv } = await encryptPassword(password, aesKey);

        var passwords = loadPasswords();
        passwords[passwordId] = { siteName, siteUrl, email,  encryptedPassword: arrayBufferToBase64(encryptedPassword), iv: arrayBufferToBase64(iv) };
        savePasswords(passwords);

        ListPasswords();
        $('#DetailsPass').modal('hide');
        document.getElementById('editPasswordForm').reset();
    }
}

function deletePassword(id) {
    if (confirm("Tem a certeza que deseja apagar esta palavra-passe?")) {
        const passwords = loadPasswords();
        passwords.splice(id, 1);
        savePasswords(passwords);
        ListPasswords();
    }
}

function ListPasswords() {
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
//#endregion

//#region Utilities
function savePasswords(passwords) {
    localStorage.setItem('passwords', JSON.stringify(passwords));
}

function loadPasswords() {
    const storedPasswords = localStorage.getItem('passwords');
    return storedPasswords ? JSON.parse(storedPasswords) : [];
}
//#endregion

//#region Generate Password
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
//#endregion

//#region PopulateEditModal
function loadEditForm(index) {
    const passwords = loadPasswords();
    const passwordObj = passwords[index];

    document.getElementById('editPasswordId').value = index;
    document.getElementById('editSiteName').value = passwordObj.siteName;
    document.getElementById('editSiteUrl').value = passwordObj.siteUrl;
    document.getElementById('editEmail').value = passwordObj.email;
    decryptPassword(
        base64ToArrayBuffer(passwordObj.encryptedPassword),
        base64ToArrayBuffer(passwordObj.iv),
        aesKey
    ).then((password) => {
        document.getElementById('editPassword').value = password;
    });
    document.getElementById('editPasswordForm').addEventListener('submit', editPassword);
}
//#endregion 

document.getElementById('addPasswordForm').addEventListener('submit', addPassword);

window.onload = function () {
    ListPasswords();
}