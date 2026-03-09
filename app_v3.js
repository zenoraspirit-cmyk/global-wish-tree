import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 请在此处填入你的 Firebase 配置
const firebaseConfig = {
    apiKey: "你的APIKEY",
    authDomain: "你的AUTHDOMAIN",
    projectId: "你的PROJECTID",
    storageBucket: "你的STORAGEBUCKET",
    messagingSenderId: "你的SENDERID",
    appId: "你的APPID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const wishesArea = document.getElementById("wish-display");

const categoryColors = {
    Wealth: "#FFD700", Love: "#FFB6C1", Marriage: "#FF69B4", Career: "#87CEEB",
    Health: "#90EE90", Family: "#FFA07A", Success: "#DA70D6", "Good Luck": "#FFFFE0",
    Dreams: "#E6E6FA", "Inner Peace": "#F0FFFF", Protection: "#B0C4DE", "Spiritual Growth": "#D8BFD8"
};

let allWishes = [];
let selectedWishIdToRepay = null;

window.closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    selectedWishIdToRepay = null;
    document.getElementById("gratitudeBtn").disabled = true;
};

document.getElementById("openManifestModal").onclick = () => document.getElementById("manifestModal").style.display = "block";
document.getElementById("openGratitudeModal").onclick = () => document.getElementById("gratitudeModal").style.display = "block";

// 1. 许愿并支付 $1
document.getElementById("manifestBtn").onclick = async () => {
    const nick = document.getElementById("nickName").value.trim();
    const cat = document.getElementById("wishCategory").value;
    const content = document.getElementById("wishInput").value.trim();

    if (!nick || !content) return alert("Please fill in all fields.");

    // 检查重复（不区分大小写）
    const q = query(collection(db, "wishes"), where("nickname_lower", "==", nick.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) return alert("This Nickname/Email is already in use.");

    // 跳转 PayPal 支付
    window.location.href = "https://www.paypal.me/ZenoraSpirit/1";

    try {
        await addDoc(collection(db, "wishes"), {
            nickname: nick, nickname_lower: nick.toLowerCase(),
            category: cat, content: content,
            time: new Date().toLocaleString(), isFulfilled: false,
            posX: Math.random() * 80 + 10, posY: Math.random() * 60 + 10
        });
    } catch (e) { console.error(e); }
};

// 2. 还愿逻辑
document.getElementById("gratitudeIdentity").oninput = async (e) => {
    const val = e.target.value.toLowerCase();
    const list = document.getElementById("user-wishes-to-repay");
    list.innerHTML = "";
    if (val.length < 2) return;

    const q = query(collection(db, "wishes"), where("nickname_lower", "==", val), where("isFulfilled", "==", false));
    const snap = await getDocs(q);
    
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const item = document.createElement("div");
        item.className = "selector-item";
        item.innerText = `[${d.category}] ${d.time.split(',')[0]}: ${d.content.substring(0, 20)}...`;
        item.onclick = () => {
            document.querySelectorAll('.selector-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            selectedWishIdToRepay = docSnap.id;
            document.getElementById("gratitudeBtn").disabled = false;
        };
        list.appendChild(item);
    });
};

document.getElementById("gratitudeBtn").onclick = async () => {
    const amount = document.getElementById("gratitudeAmount").value;
    if (amount < 1) return alert("Minimum payment is $1");
    
    if (selectedWishIdToRepay) {
        window.location.href = `https://www.paypal.me/ZenoraSpirit/${amount}`;
        await updateDoc(doc(db, "wishes", selectedWishIdToRepay), { isFulfilled: true });
    }
};

// 3. 渲染标签
onSnapshot(query(collection(db, "wishes"), orderBy("time", "desc"), limit(40)), (snapshot) => {
    allWishes = [];
    snapshot.forEach(doc => allWishes.push({ id: doc.id, ...doc.data() }));
    renderWishes(allWishes);
});

function renderWishes(wishes) {
    wishesArea.innerHTML = "";
    wishes.forEach(data => {
        const tag = document.createElement("div");
        tag.className = "wish " + (data.isFulfilled ? "fulfilled" : "");
        tag.innerText = data.nickname;
        tag.style.backgroundColor = categoryColors[data.category] || "#FFF";

        const status = data.isFulfilled ? "FULFILLED" : "PRAYING...";
        tag.title = `[${status}]\nDate: ${data.time}\nCategory: ${data.category}\nWish: ${data.content}`;

        const speed = (Math.random() * 2 + 3).toFixed(2) + "s";
        tag.style.setProperty('--speed', speed);
        tag.style.animation = `float ${speed} infinite ease-in-out`;

        tag.style.left = data.posX + "%";
        tag.style.top = data.posY + "%";
        wishesArea.appendChild(tag);
    });
}

// 4. 搜索
document.getElementById("searchInput").oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const dropdown = document.getElementById("search-results");
    dropdown.innerHTML = "";
    if (!term) { dropdown.style.display = "none"; return; }

    const found = allWishes.filter(w => w.nickname_lower.includes(term));
    if (found.length > 0) {
        dropdown.style.display = "block";
        found.forEach(w => {
            const item = document.createElement("div");
            item.className = "dropdown-item";
            item.innerText = `${w.nickname} (${w.category})`;
            item.onclick = () => alert(`Wish: ${w.content}\nStatus: ${w.isFulfilled?'Fulfilled':'Praying'}`);
            dropdown.appendChild(item);
        });
    } else { dropdown.style.display = "none"; }
};