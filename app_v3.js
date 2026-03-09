import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase 配置
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

// 1. 提交许愿逻辑
document.getElementById("manifestBtn").onclick = async () => {
    const text = document.getElementById("wishInput").value;
    if (!text) return alert("Please write your wish first.");

    try {
        await addDoc(collection(db, "wishes"), {
            content: text,
            time: new Date(),
            posX: Math.random() * 80 + 10,
            posY: Math.random() * 60 + 10
        });
        window.location.href = "https://www.paypal.me/ZenoraSpirit/1";
    } catch (e) { console.error("Error: ", e); }
};

// 2. 提交还愿逻辑
document.getElementById("gratitudeBtn").onclick = () => {
    window.location.href = "https://www.paypal.me/ZenoraSpirit";
};

// 3. 实时加载展示
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