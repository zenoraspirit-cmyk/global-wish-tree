import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// !!! 请在这里替换为您真实的 Firebase 配置 !!!
const firebaseConfig = {
    apiKey: "在此填入你的APIKEY",
    authDomain: "在此填入你的AUTHDOMAIN",
    projectId: "在此填入你的PROJECTID",
    storageBucket: "在此填入你的STORAGEBUCKET",
    messagingSenderId: "在此填入你的SENDERID",
    appId: "在此填入你的APPID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const wishesArea = document.getElementById("wish-display");

// 1. 提交许愿逻辑
document.getElementById("manifestBtn").onclick = async () => {
    const text = document.getElementById("wishInput").value.trim();
    if (!text) return alert("写下你的愿望再点击吧。");

    try {
        await addDoc(collection(db, "wishes"), {
            content: text,
            time: new Date(),
            posX: Math.random() * 80 + 10,
            posY: Math.random() * 60 + 10
        });
        // 成功保存后跳转支付
        window.location.href = "https://www.paypal.me/ZenoraSpirit/1";
    } catch (e) { 
        console.error("Error: ", e);
        alert("保存失败，请检查 Firebase 配置。");
    }
};

// 2. 提交还愿逻辑
document.getElementById("gratitudeBtn").onclick = () => {
    window.location.href = "https://www.paypal.me/ZenoraSpirit";
};

// 3. 实时加载展示逻辑
onSnapshot(query(collection(db, "wishes"), orderBy("time", "desc"), limit(50)), (snapshot) => {
    wishesArea.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const wishTag = document.createElement("div");
        wishTag.className = "wish";
        wishTag.innerText = data.content;
        wishTag.style.left = `${data.posX}%`;
        wishTag.style.top = `${data.posY}%`;
        wishesArea.appendChild(wishTag);
    });
});