// --- 必须要做的：替换为你的 Firebase 配置 ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const collectionName = "global_wishes";

let wishes = [];
let currentFulfillTarget = null;

window.onload = () => {
    // 监听云端数据库：自动同步手机和电脑，且只取最新的 50 条
    db.collection(collectionName)
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot((snapshot) => {
          wishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderWishes();
      });

    const wishModal = document.getElementById("wishModal");
    const fulfillModal = document.getElementById("fulfillModal");

    document.getElementById("btnMakeWish").onclick = () => {
        wishModal.style.display = "block";
        document.getElementById("paymentSection").classList.remove("hidden");
        document.getElementById("wishFormSection").classList.add("hidden");
    };

    document.getElementById("btnFulfillWish").onclick = () => {
        fulfillModal.style.display = "block";
        document.getElementById("searchFulfillSection").classList.remove("hidden");
        document.getElementById("fulfillActionSection").classList.add("hidden");
    };

    document.getElementById("closeWish").onclick = () => wishModal.style.display = "none";
    document.getElementById("closeFulfill").onclick = () => fulfillModal.style.display = "none";
};

// --- 支付与跳转控制 ---
function handlePayment(type, url) {
    if (type === 'fulfill') {
        const amt = document.getElementById('fulfillAmount').value;
        if (!amt || amt <= 0) { alert("Please enter a donation amount."); return; }
        url = url + amt; // 动态拼接 PayPal 金额
    }

    // 1. 强制弹出支付页面
    window.open(url, '_blank');

    // 2. 模拟支付后解锁逻辑（你可以手动确认已付款）
    setTimeout(() => {
        if (confirm("Have you completed the payment? Click OK to proceed.")) {
            if (type === 'wish') {
                document.getElementById("paymentSection").classList.add("hidden");
                document.getElementById("wishFormSection").classList.remove("hidden");
            } else {
                finalizeFulfillment();
            }
        }
    }, 1500);
}

// --- 提交愿望到云端 ---
async function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) { alert("Please fill in both name and wish."); return; }

    const pos = getSafePosition();
    const data = {
        name: name, content: content, category: cat,
        status: 'Active', x: pos.x, y: pos.y,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        dateStr: new Date().toLocaleDateString()
    };

    try {
        await db.collection(collectionName).add(data);
        document.getElementById("wishModal").style.display = "none";
        document.getElementById('userName').value = "";
        document.getElementById('wishContent').value = "";
    } catch (err) { alert("Error saving to cloud: " + err.message); }
}

// --- 搜索逻辑：支持包含所有关键字，清空恢复 ---
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) { renderWishes(); return; }
    
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || 
        w.content.toLowerCase().includes(term)
    );
    renderWishes(filtered);
}

// --- 防重叠渲染逻辑 ---
function getSafePosition() {
    let x, y, overlap;
    let tries = 0;
    do {
        overlap = false;
        x = Math.random() * 75 + 10;
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
        div.setAttribute('data-tooltip', `Owner: ${w.name}\nWish: ${w.content}\nDate: ${w.dateStr}\nStatus: ${w.status}`);
        canvas.appendChild(div);
    });
}

// --- 还愿逻辑 ---
function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase().trim();
    const wish = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');
    if (wish) {
        currentFulfillTarget = wish;
        document.getElementById('wishPreview').innerHTML = `<strong>Owner:</strong> ${wish.name}<br><strong>Wish:</strong> ${wish.content}`;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else { alert("Active wish not found."); }
}

async function finalizeFulfillment() {
    if (currentFulfillTarget) {
        try {
            await db.collection(collectionName).doc(currentFulfillTarget.id).update({ status: 'Fulfilled' });
            document.getElementById("fulfillModal").style.display = "none";
            alert("Payment success! This wish is now golden.");
        } catch (err) { console.error(err); }
    }
}