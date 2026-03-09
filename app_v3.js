import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase 身份证信息
const firebaseConfig = {
  apiKey: "AIzaSyB2Tcqf74vURDSFFOpDjJA0eMtIrl3lN-0",
  authDomain: "wish-tree-b8dc9.firebaseapp.com",
  projectId: "wish-tree-b8dc9",
  storageBucket: "wish-tree-b8dc9.firebasestorage.app",
  messagingSenderId: "1068406016994",
  appId: "1:1068406016994:web:7123d046c73f23ab0f07bb",
  measurementId: "G-0B9GX7M298"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const wishesArea = document.getElementById("wish-display");

// 点击“Manifest”按钮：保存愿望并跳转支付 $1
document.getElementById("manifestBtn").onclick = async () => {
    const text = document.getElementById("wishInput").value;
    if (!text.trim()) return alert("Please type your wish first.");
    
    try {
        await addDoc(collection(db, "wishes"), {
            content: text,
            time: new Date(),
            posX: Math.random() * 70 + 15,
            posY: Math.random() * 50 + 15
        });
        // 跳转到支付 1 美元页面
        window.location.href = "https://www.paypal.me/ZenoraSpirit/1";
    } catch (e) {
        console.error("Database Error:", e);
        alert("Submission failed. Please check Firebase rules.");
    }
};

// 点击“Fulfill”按钮：跳转到随意金额支付页面
document.getElementById("gratitudeBtn").onclick = () => {
    window.location.href = "https://www.paypal.me/ZenoraSpirit";
};

// 实时获取数据库里的愿望并显示
onSnapshot(query(collection(db, "wishes"), orderBy("time", "desc"), limit(40)), (snapshot) => {
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