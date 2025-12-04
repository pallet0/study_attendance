// Web Crypto API를 사용한 암호화/복호화

// SHA-256 해시 생성
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array. from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 비밀번호에서 AES 키 생성 (PBKDF2)
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
}

// AES-GCM 복호화
async function decryptData(encryptedData, password) {
    try {
        const { iv, salt, ciphertext } = encryptedData;
        
        const key = await deriveKey(password, salt);
        
        const decrypted = await crypto. subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0))
            },
            key,
            Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
        );
        
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        return null;
    }
}

// 복호화 시도
async function decrypt() {
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error-message');
    
    if (! password) {
        errorEl.textContent = '비밀번호를 입력해주세요. ';
        return;
    }
    
    // 비밀번호 해시로 해당 사용자 데이터 찾기
    const passwordHash = await sha256(password);
    
    if (! ENCRYPTED_DATA[passwordHash]) {
        errorEl.textContent = '유효하지 않은 비밀번호입니다.';
        return;
    }
    
    // 복호화 시도
    const decrypted = await decryptData(ENCRYPTED_DATA[passwordHash], password);
    
    if (! decrypted) {
        errorEl. textContent = '복호화에 실패했습니다.';
        return;
    }
    
    // 데이터 표시
    displayData(decrypted);
}

// 데이터 화면에 표시
function displayData(data) {
    document.getElementById('login-form').classList. add('hidden');
    document.getElementById('data-display').classList.remove('hidden');
    
    let html = '<table>';
    for (const [key, value] of Object. entries(data)) {
        html += `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`;
    }
    html += '</table>';
    
    document.getElementById('decrypted-data').innerHTML = html;
}

// XSS 방지
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 로그아웃
function logout() {
    document.getElementById('password').value = '';
    document.getElementById('error-message').textContent = '';
    document.getElementById('data-display').classList. add('hidden');
    document.getElementById('login-form').classList. remove('hidden');
}

// Enter 키로 로그인
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password'). addEventListener('keypress', (e) => {
        if (e.key === 'Enter') decrypt();
    });
});