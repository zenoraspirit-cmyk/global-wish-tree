import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 这是你刚才截图里的真实配置
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

// 许愿逻辑：保存到数据库 + 跳转 PayPal
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
        // 自动跳转你指定的 PayPal
        window.location.href = "https://www.paypal.me/ZenoraSpirit/1";
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Submission failed, please check database rules.");
    }
};

// 还愿逻辑
document.getElementById("gratitudeBtn").onclick = () => {
    window.location.href = "https://www.paypal.me/ZenoraSpirit";
};

// 实时加载愿望：从数据库抓取并在屏幕上漂浮
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
