// --- Firebase 配置 ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 安全初始化
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Database connection failed, using local mode.");
}

let wishes = [];
let currentFulfillTarget = null;

// 使用原生绑定确保点击有效
window.onload = function() {
    const wishModal = document.getElementById("wishModal");
    const fulfillModal = document.getElementById("fulfillModal");

    document.getElementById("btnMakeWish").onclick = function() {
        wishModal.style.display = "block";
        document.getElementById("paymentSection").classList.remove("hidden");
        document.getElementById("wishFormSection").classList.add("hidden");
    };

    document.getElementById("btnFulfillWish").onclick = function() {
        fulfillModal.style.display = "block";
        document.getElementById("searchFulfillSection").classList.remove("hidden");
        document.getElementById("fulfillActionSection").classList.add("hidden");
    };

    document.getElementById("closeWish").onclick = () => wishModal.style.display = "none";
    document.getElementById("closeFulfill").onclick = () => fulfillModal.style.display = "none";

    // 实时同步云端数据
    if (db) {
        db.collection("global_wishes")
          .orderBy("createdAt", "desc")
          .limit(50)
          .onSnapshot(snapshot => {
              wishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              renderWishes();
          }, error => {
              console.log("Database Sync Error: ", error.message);
          });
    }
};

// 支付处理
function handlePayment(type) {
    let url = (type === 'wish') ? "https://buy.stripe.com/xxx" : "https://paypal.me/yourid/";
    
    if (type === 'fulfill') {
        const amt = document.getElementById('fulfillAmount').value;
        if (!amt || amt <= 0) { alert("Please enter amount."); return; }
        url += amt;
    }

    // 真正跳转支付界面
    window.open(url, '_blank');

    // 支付确认模拟
    setTimeout(() => {
        if (confirm("If payment is finished, click OK to continue.")) {
            if (type === 'wish') {
                document.getElementById("paymentSection").classList.add("hidden");
                document.getElementById("wishFormSection").classList.remove("hidden");
            } else {
                finalizeFulfillment();
            }
        }
    }, 1000);
}

// 提交愿望
async function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) return alert("Please fill all fields.");

    const pos = getSafePos();
    const data = {
        name, content, category: cat, status: 'Active',
        x: pos.x, y: pos.y, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (db) {
            await db.collection("global_wishes").add(data);
        } else {
            wishes.push({...data, id: Date.now()});
            renderWishes();
        }
        document.getElementById("wishModal").style.display = "none";
    } catch (err) {
        alert("Action failed: " + err.message);
    }
}

// 渲染愿望标签
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

// 搜索逻辑
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) return renderWishes();
    const filtered = wishes.filter(w => w.name.toLowerCase().includes(term) || w.content.toLowerCase().includes(term));
    renderWishes(filtered);
}

// 随机位置（防重叠）
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