let publicKey, privateKey, aesKey;


//#region Declare a publicKey, privateKey to use the RSA
async function generateKeyPair() {
    // Verificar se as chaves já existem no localStorage
    const publicKeyStored = localStorage.getItem("publicKey");
    const privateKeyStored = localStorage.getItem("privateKey");

    if (publicKeyStored && privateKeyStored) {
        // Recuperar chaves existentes do localStorage
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
        console.log("RSA keys recovered from localStorage");
    } else {
        // Gerar novas chaves se não existirem
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

        // Salvar chaves no localStorage
        const publicKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey("spki", publicKey));
        const privateKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey("pkcs8", privateKey));

        localStorage.setItem("publicKey", publicKeyBase64);
        localStorage.setItem("privateKey", privateKeyBase64);

        console.log("RSA keys generated and stored in localStorage");
    }

    console.log("Public Key:", publicKey);
    console.log("Private Key:", privateKey);
}

//#endregion

//#region Declare a secretKey to use the AES
async function initializeAESKey() {
    try {
        console.log("Generating AES Key...");
        const keyData = crypto.getRandomValues(new Uint8Array(32)); // 256 bits

        aesKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );

        console.log("AES Key successfully generated:", keyData);

        const encryptedAESKey = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            keyData
        );

        console.log("AES Key encrypted with RSA public key:", encryptedAESKey);

        // Armazena a chave criptografada no localStorage
        const encryptedAESKeyBase64 = arrayBufferToBase64(encryptedAESKey);
        localStorage.setItem("encryptedAESKey", encryptedAESKeyBase64);

        console.log("Encrypted AES Key stored in localStorage.");
    } catch (error) {
        console.error("Error during AES Key initialization:", error);
    }
}

async function recoverAESKey() {
    const encryptedAESKeyBase64 = localStorage.getItem("encryptedAESKey");

    if (!encryptedAESKeyBase64) {
        throw new Error("Encrypted AES Key not found!");
    }

    console.log("Encrypted AES Key (Base64):", encryptedAESKeyBase64);

    // Converter de Base64 para ArrayBuffer
    const encryptedAESKey = base64ToArrayBuffer(encryptedAESKeyBase64);
    console.log("Encrypted AES Key (ArrayBuffer):", encryptedAESKey);

    // Descriptografar
    try {
        const decryptedAESKey = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAESKey
        );

        aesKey = await crypto.subtle.importKey(
            "raw",
            decryptedAESKey,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );

        console.log("AES key recovered successfully: ", aesKey);
    } catch (error) {
        console.error("Failed to decrypt AES Key:", error);
        throw error; // Repassa o erro
    }
}


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

    if (form.checkValidity()) {
        var siteName = document.getElementById('editSiteName').value;
        var siteUrl = document.getElementById('editSiteUrl').value;
        var email = document.getElementById('editEmail').value;
        var password = document.getElementById('editPassword').value;
        var passwordId = parseInt(document.getElementById('editPasswordId').value);
        const { encryptedPassword, iv } = await encryptPassword(password, aesKey);

        var passwords = loadPasswords();
        passwords[passwordId] = { siteName, siteUrl, email, encryptedPassword: arrayBufferToBase64(encryptedPassword), iv: arrayBufferToBase64(iv) };
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
async function generatePassword() {
    const randomPassword = Array(16)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');

    document.getElementById('Password').value = randomPassword;
}

async function generateEditPassword() {
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

    if (!aesKey) {
        console.error("AES Key is not ready!");
        return;
    }

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


async function main() {
    try {
        console.log("Generating RSA key pair...");
        await generateKeyPair();

        console.log("Checking for existing AES key...");
        if (localStorage.getItem("encryptedAESKey")) {
            console.log("Encrypted AES Key found. Recovering...");
            await recoverAESKey();
        } else {
            console.log("No AES Key found. Initializing...");
            await initializeAESKey();
        }

        console.log("Initialization complete.", aesKey);
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}



window.onload = async function () {
    await main();
    ListPasswords();
    document.getElementById('addPasswordForm').addEventListener('submit', addPassword);
}