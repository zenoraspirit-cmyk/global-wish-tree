// --- Firebase 配置 (请确保这里的 ID 是你自己的) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 初始化
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase load failed.");
}

let wishes = [];
let currentFulfillTarget = null;

// 确保 DOM 加载后绑定按钮，解决点击无效问题
window.addEventListener('DOMContentLoaded', () => {
    const wishModal = document.getElementById("wishModal");
    const fulfillModal = document.getElementById("fulfillModal");

    // 我要许愿按钮
    document.getElementById("btnMakeWish").onclick = () => {
        wishModal.style.display = "block";
        document.getElementById("paymentSection").classList.remove("hidden");
        document.getElementById("wishFormSection").classList.add("hidden");
    };

    // 我要还愿按钮
    document.getElementById("btnFulfillWish").onclick = () => {
        fulfillModal.style.display = "block";
        document.getElementById("searchFulfillSection").classList.remove("hidden");
        document.getElementById("fulfillActionSection").classList.add("hidden");
    };

    // 关闭按钮
    document.getElementById("closeWish").onclick = () => wishModal.style.display = "none";
    document.getElementById("closeFulfill").onclick = () => fulfillModal.style.display = "none";

    // 实时监听云端：手机和电脑端永远同步
    if (db) {
        db.collection("global_wishes")
          .orderBy("createdAt", "desc")
          .limit(50) // 自动清理：只显示最新的 50 条，避免眼花缭乱
          .onSnapshot(snapshot => {
              wishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              renderWishes();
          }, err => {
              console.error("Firestore error:", err);
          });
    }
});

// 支付与跳转逻辑：修复链接打不开的问题
function handlePayment(type) {
    // 替换为你的真实链接
    let payURL = (type === 'wish') ? "https://buy.stripe.com/xxx" : "https://paypal.me/yourname/";
    
    if (type === 'fulfill') {
        const amt = document.getElementById('fulfillAmount').value;
        if (!amt || amt <= 0) return alert("Please enter amount.");
        payURL += amt;
    }

    // 强制新窗口打开支付
    window.open(payURL, '_blank');

    // 模拟成功确认
    setTimeout(() => {
        if (confirm("If payment is finished, click OK to continue.")) {
            if (type === 'wish') {
                document.getElementById("paymentSection").classList.add("hidden");
                document.getElementById("wishFormSection").classList.remove("hidden");
            } else {
                finalizeFulfillment();
            }
        }
    }, 1500);
}

// 提交愿望：数据永久保存
async function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) return alert("Please fill all fields.");

    const pos = getSafePos();
    const data = {
        name, content, category: cat, status: 'Active',
        x: pos.x, y: pos.y, 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (db) {
            await db.collection("global_wishes").add(data);
        }
        document.getElementById("wishModal").style.display = "none";
    } catch (err) {
        alert("Permission denied! Please check Firebase Rules.");
    }
}

// 渲染标签
function renderWishes(data = null) {
    const canvas = document.getElementById('wish-canvas');
    canvas.innerHTML = '';
    const list = data || wishes;
    list.forEach(w => {
        const div = document.createElement('div');
        div.className = `wish-tag ${w.category} ${w.status === 'Fulfilled' ? 'fulfilled' : ''}`;
        div.style.left = w.x + '%';
        div.style.top = w.y + '%';
        div.innerText = w.name;
        div.setAttribute('data-tooltip', `Wish: ${w.content}`);
        canvas.appendChild(div);
    });
}

// 模糊搜索逻辑
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) return renderWishes();
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || w.content.toLowerCase().includes(term)
    );
    renderWishes(filtered);
}

// 防重叠坐标计算
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

// 查找还愿目标
function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase().trim();
    const target = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');
    if (target) {
        currentFulfillTarget = target;
        document.getElementById('wishPreview').innerHTML = `<b>Target:</b> ${target.name}<br><b>Wish:</b> ${target.content}`;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else {
        alert("No active wish found.");
    }
}

async function finalizeFulfillment() {
    if (currentFulfillTarget && db) {
        await db.collection("global_wishes").doc(currentFulfillTarget.id).update({ status: 'Fulfilled' });
    }
    document.getElementById("fulfillModal").style.display = "none";
}