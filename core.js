//Declarar as chaves
let publicKey, privateKey, secretKey;

//#region Declare a publicKey, privateKey to use the RSA

async function generateAsyncKeys() {
    // Verificar se as chaves já existem no localStorage
    const publicKeyStored = localStorage.getItem("publicKey");
    const privateKeyStored = localStorage.getItem("privateKey");

    if (publicKeyStored && privateKeyStored) {
        // Recuperar as chaves do localStorage
        publicKey = await crypto.subtle.importKey(
            "spki",
            base64ToArrayBuffer(publicKeyStored),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
        privateKey = await crypto.subtle.importKey(
            "pkcs8",
            base64ToArrayBuffer(privateKeyStored),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
    } else {
        // Gerar novas as novas chaves
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;

        // Guardar as chaves no localStorage
        const publicKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey("spki", publicKey));
        const privateKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey("pkcs8", privateKey));

        localStorage.setItem("publicKey", publicKeyBase64);
        localStorage.setItem("privateKey", privateKeyBase64);
    }
}

//#endregion

//#region Declare a secretKey to use the AES

async function initializesecretKey() {
    try {
        //Gerar chave secreta
        const keyData = crypto.getRandomValues(new Uint8Array(32));

        secretKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );

        // Criptografar chave secreta com a chave publica
        const encryptedsecretKey = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            keyData
        );

        // Guardar a chave secreta no localStorage
        const encryptedsecretKeyBase64 = arrayBufferToBase64(encryptedsecretKey);
        localStorage.setItem("encryptedsecretKey", encryptedsecretKeyBase64);

    } catch (error) {
        console.error("Error during AES Key initialization:", error);
        throw error;
    }
}

async function recoversecretKey() {

    // Recuperar chave secreta do local storage
    const encryptedsecretKeyBase64 = localStorage.getItem("encryptedsecretKey");

    if (!encryptedsecretKeyBase64) {
        throw new Error("Encrypted AES Key not found!");
    }

    // Converter de Base64 para ArrayBuffer
    const encryptedsecretKey = base64ToArrayBuffer(encryptedsecretKeyBase64);

    try {
        // Descriptografar a chave com a chave privada
        const decryptedsecretKey = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedsecretKey
        );

        secretKey = await crypto.subtle.importKey(
            "raw",
            decryptedsecretKey,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );

    } catch (error) {
        console.error("Failed to decrypt AES Key:", error);
        throw error;
    }
}


//#endregion

//#region Encrypt and Decrypt Methods
async function encryptPassword(password, key) {

    //Gerar uma hash e criptografar a pass com a chave secreta
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
    //Descriptografar a pass com a chave secreta
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

    //Valida se o form está valido e recupera os valores do mesmo
    if (form.checkValidity()) {
        const siteName = document.getElementById('SiteName').value;
        const siteUrl = document.getElementById('SiteUrl').value;
        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        //Criptografa a pass e guarda a pass e o hash usado na encriptacao
        const { encryptedPassword, iv } = await encryptPassword(password, secretKey);
        const passwords = loadPasswords();
        //Guarda todos os dados da pass no localstorage e lista novamente as pass
        const newPassword = { siteName, siteUrl, email, encryptedPassword: arrayBufferToBase64(encryptedPassword), iv: arrayBufferToBase64(iv) };
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

    //Valida se o form está valido e recupera os valores do mesmo
    if (form.checkValidity()) {
        var siteName = document.getElementById('editSiteName').value;
        var siteUrl = document.getElementById('editSiteUrl').value;
        var email = document.getElementById('editEmail').value;
        var password = document.getElementById('editPassword').value;
        var passwordId = parseInt(document.getElementById('editPasswordId').value);

        //Criptografa a pass e guarda a pass e o hash usado na encriptacao
        const { encryptedPassword, iv } = await encryptPassword(password, secretKey);
        var passwords = loadPasswords();

        //Substitui todos os dados da pass no localstorage e lista novamente as pass
        passwords[passwordId] = { siteName, siteUrl, email, encryptedPassword: arrayBufferToBase64(encryptedPassword), iv: arrayBufferToBase64(iv) };
        savePasswords(passwords);
        ListPasswords();
        $('#DetailsPass').modal('hide');
        document.getElementById('editPasswordForm').reset();
    }
}

function deletePassword(id) {
    // Mostra uma confirmação apaga a pass e lista novamente as pass
    if (confirm("Tem a certeza que deseja apagar esta palavra-passe?")) {
        const passwords = loadPasswords();
        passwords.splice(id, 1);
        savePasswords(passwords);
        ListPasswords();
    }
}

function ListPasswords() {

    //vai buscar as pass ao localstorage
    const passwords = loadPasswords();
    const passwordList = document.getElementById('passwordList');
    passwordList.innerHTML = '';

    // Adiciona as novas colunas com a informacao das pass na tabela
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
    //guarda as pass como json no local storage
    localStorage.setItem('passwords', JSON.stringify(passwords));
}

function loadPasswords() {
    //Recupera as pass e devolve
    const storedPasswords = localStorage.getItem('passwords');
    return storedPasswords ? JSON.parse(storedPasswords) : [];
}
//#endregion

//#region Generate Password
async function generatePassword() {
    // Gera um hash e preenche o input da password
    const randomPassword = Array(16)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    document.getElementById('Password').value = randomPassword;
}

async function generateEditPassword() {
    // Gera um hash e preenche o input da password
    const randomPassword = Array(16)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    document.getElementById('editPassword').value = randomPassword;
}
//#endregion

//#region PopulateEditModal
function loadEditForm(index) {
    // vai buscar a pass e preenche o formulario
    const passwords = loadPasswords();
    const passwordObj = passwords[index];

    //verifica se a chave secreta existe
    if (!secretKey) {
        console.error("AES Key is not ready!");
        return;
    }

    document.getElementById('editPasswordId').value = index;
    document.getElementById('editSiteName').value = passwordObj.siteName;
    document.getElementById('editSiteUrl').value = passwordObj.siteUrl;
    document.getElementById('editEmail').value = passwordObj.email;

    // descriptografa a pass para mostrar a pass correta
    decryptPassword(
        base64ToArrayBuffer(passwordObj.encryptedPassword),
        base64ToArrayBuffer(passwordObj.iv),
        secretKey
    ).then((password) => {
        document.getElementById('editPassword').value = password;
    });
    document.getElementById('editPasswordForm').addEventListener('submit', editPassword);
}
//#endregion 

async function main() {
    //gera as chaves privadas e publicas, verifica se existe chave secreta, senao existir tambem gera uma chave secreta
    try {
        await generateAsyncKeys();

        if (localStorage.getItem("encryptedsecretKey")) {
            await recoversecretKey();
        } else {
            await initializesecretKey();
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// inicia as chaves e mostra as passwords
window.onload = async function () {
    await main();
    ListPasswords();
    document.getElementById('addPasswordForm').addEventListener('submit', addPassword);
}