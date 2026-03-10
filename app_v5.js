// --- 核心配置 ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // 请务必替换
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 尝试初始化 Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase initialization failed, running in local mode.");
}

let wishes = [];
let currentFulfillTarget = null;

// --- 解决按钮点击无反应的关键：确保 DOM 加载后绑定 ---
document.addEventListener('DOMContentLoaded', () => {
    const wishModal = document.getElementById("wishModal");
    const fulfillModal = document.getElementById("fulfillModal");
    const btnMakeWish = document.getElementById("btnMakeWish");
    const btnFulfillWish = document.getElementById("btnFulfillWish");

    // 绑定许愿按钮
    btnMakeWish.addEventListener('click', () => {
        wishModal.style.display = "block";
        document.getElementById("paymentSection").classList.remove("hidden");
        document.getElementById("wishFormSection").classList.add("hidden");
    });

    // 绑定还愿按钮
    btnFulfillWish.addEventListener('click', () => {
        fulfillModal.style.display = "block";
        document.getElementById("searchFulfillSection").classList.remove("hidden");
        document.getElementById("fulfillActionSection").classList.add("hidden");
    });

    // 绑定关闭按钮
    document.getElementById("closeWish").onclick = () => wishModal.style.display = "none";
    document.getElementById("closeFulfill").onclick = () => fulfillModal.style.display = "none";

    // 点击外部关闭
    window.onclick = (e) => {
        if (e.target == wishModal) wishModal.style.display = "none";
        if (e.target == fulfillModal) fulfillModal.style.display = "none";
    };

    // 从数据库读取数据（同步手机/电脑）
    if (db) {
        db.collection("wishes").orderBy("createdAt", "desc").limit(50)
        .onSnapshot((snapshot) => {
            wishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderWishes();
        });
    }
});

// --- 支付跳转逻辑 ---
function handlePayment(type) {
    // 这里填入你的真实收款链接
    let payLink = (type === 'wish') ? "https://buy.stripe.com/xxx" : "https://paypal.me/yourid/";
    
    if (type === 'fulfill') {
        const amt = document.getElementById('fulfillAmount').value;
        if (!amt || amt <= 0) { alert("Please enter amount."); return; }
        payLink += amt;
    }

    // 真正跳转
    window.open(payLink, '_blank');

    // 模拟成功后的确认
    setTimeout(() => {
        if (confirm("Have you completed the payment? Click OK to continue.")) {
            if (type === 'wish') {
                document.getElementById("paymentSection").classList.add("hidden");
                document.getElementById("wishFormSection").classList.remove("hidden");
            } else {
                finalizeFulfillment();
            }
        }
    }, 1000);
}

// --- 搜索逻辑 ---
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) { renderWishes(); return; }
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || w.content.toLowerCase().includes(term)
    );
    renderWishes(filtered);
}

// --- 提交愿望 ---
async function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) { alert("Fields required."); return; }

    const pos = getSafePos();
    const data = {
        name, content, category: cat, status: 'Active',
        x: pos.x, y: pos.y, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (db) {
        await db.collection("wishes").add(data);
    } else {
        wishes.push({ ...data, id: Date.now() });
        renderWishes();
    }
    document.getElementById("wishModal").style.display = "none";
}

// --- 防重叠渲染 ---
function getSafePos() {
    let x, y, overlap;
    let tries = 0;
    do {
        overlap = false;
        x = Math.random() * 80 + 10;
        y = Math.random() * 60 + 15;
        for (let w of wishes) {
            if (Math.abs(w.x - x) < 12 && Math.abs(w.y - y) < 6) { overlap = true; break; }
        }
        tries++;
    } while (overlap && tries < 30);
    return { x, y };
}

function renderWishes(data = null) {
    const canvas = document.getElementById('wish-canvas');
    canvas.innerHTML = '';
    const list = data || wishes;
    list.forEach(w => {
        const div = document.createElement('div');
        div.className = `wish-tag ${w.category} ${w.status === 'Fulfilled' ? 'fulfilled' : ''}`;
        div.style.left = `${w.x}%`;
        div.style.top = `${w.y}%`;
        div.innerText = w.name;
        div.setAttribute('data-tooltip', `Owner: ${w.name}\nWish: ${w.content}`);
        canvas.appendChild(div);
    });
}

function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase().trim();
    const wish = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');
    if (wish) {
        currentFulfillTarget = wish;
        document.getElementById('wishPreview').innerHTML = `<strong>Owner:</strong> ${wish.name}<br><strong>Wish:</strong> ${wish.content}`;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else { alert("Wish not found."); }
}

async function finalizeFulfillment() {
    if (currentFulfillTarget && db) {
        await db.collection("wishes").doc(currentFulfillTarget.id).update({ status: 'Fulfilled' });
    }
    document.getElementById("fulfillModal").style.display = "none";
}