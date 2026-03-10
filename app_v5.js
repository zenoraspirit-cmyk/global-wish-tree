// --- 1. Firebase Configuration ---
// IMPORTANT: Replace these with your actual keys from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- 2. Stripe Link Configuration ---
const STRIPE_LINK = "https://buy.stripe.com/test_28EaEX9EQ8cl1Ih6yr2kw01";

// Initialize Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase load error.");
}

let wishes = [];
let currentFulfillTarget = null;

// --- 3. Interaction Logic ---

window.onload = function() {
    const wishModal = document.getElementById("wishModal");
    const fulfillModal = document.getElementById("fulfillModal");

    // Fix for button clicks not responding
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

    // Global Sync: Fetch latest 50 wishes for mobile/PC sync
    if (db) {
        db.collection("global_wishes")
          .orderBy("createdAt", "desc")
          .limit(50) 
          .onSnapshot(snapshot => {
              wishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              renderWishes();
          }, err => {
              console.error("Database sync failed:", err.message);
          });
    }
};

// Handle Stripe Redirection
function handlePayment(type) {
    if (type === 'fulfill') {
        const amt = document.getElementById('fulfillAmount').value;
        if (!amt || amt <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
    }

    // Redirect to your Stripe link
    window.open(STRIPE_LINK, '_blank');

    // Simulate verification
    setTimeout(() => {
        if (confirm("Have you completed the payment?")) {
            if (type === 'wish') {
                document.getElementById("paymentSection").classList.add("hidden");
                document.getElementById("wishFormSection").classList.remove("hidden");
            } else {
                finalizeFulfillment();
            }
        }
    }, 1500);
}

// Submit to Firestore
async function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) {
        alert("Please fill in all fields.");
        return;
    }

    const pos = getSafePos();
    const data = {
        name: name,
        content: content,
        category: cat,
        status: 'Active',
        x: pos.x,
        y: pos.y, 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (db) {
            await db.collection("global_wishes").add(data);
            document.getElementById("wishModal").style.display = "none";
        }
    } catch (err) {
        alert("Action failed. Please check your Firebase Database Rules.");
    }
}

// Draw wishes on screen
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

// Search Feature
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) return renderWishes();
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || w.content.toLowerCase().includes(term)
    );
    renderWishes(filtered);
}

// Anti-overlap positioning
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

// Fulfillment Search
function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase().trim();
    const target = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');
    if (target) {
        currentFulfillTarget = target;
        document.getElementById('wishPreview').innerHTML = `<b>Wisher:</b> ${target.name}<br><b>Wish:</b> ${target.content}`;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else {
        alert("No active wish found for this name.");
    }
}

async function finalizeFulfillment() {
    if (currentFulfillTarget && db) {
        await db.collection("global_wishes").doc(currentFulfillTarget.id).update({ status: 'Fulfilled' });
        document.getElementById("fulfillModal").style.display = "none";
        alert("The wish is now Gold!");
    }
}