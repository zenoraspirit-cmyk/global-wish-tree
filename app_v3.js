let wishes = [];
let currentFulfillTarget = null;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // In a real app, fetch from Firestore here
    renderWishes();

    // Modal listeners
    const wishModal = document.getElementById("wishModal");
    const btnMakeWish = document.getElementById("btnMakeWish");
    const spanClose = document.getElementsByClassName("close")[0];

    btnMakeWish.onclick = () => {
        wishModal.style.display = "block";
        document.getElementById("paymentSection").classList.remove("hidden");
        document.getElementById("wishFormSection").classList.add("hidden");
    };

    spanClose.onclick = () => { wishModal.style.display = "none"; };
    
    document.getElementById("btnFulfillWish").onclick = () => {
        document.getElementById("fulfillModal").style.display = "block";
    };
});

function handlePayment(type) {
    // Simulation of payment trigger
    const amount = type === 'wish' ? 1 : document.getElementById('fulfillAmount').value;
    
    if (type === 'fulfill' && (!amount || amount <= 0)) {
        alert("Please enter a valid amount.");
        return;
    }

    // This is where you trigger Stripe/PayPal
    const success = confirm(`Redirecting to Payment Gateway for $${amount}... Click OK to simulate success.`);
    
    if (success) {
        if (type === 'wish') {
            document.getElementById("paymentSection").classList.add("hidden");
            document.getElementById("wishFormSection").classList.remove("hidden");
        } else {
            finalizeFulfillment();
        }
    }
}

function submitWish() {
    const name = document.getElementById('userName').value;
    const content = document.getElementById('wishContent').value;
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) {
        alert("Please fill all fields.");
        return;
    }

    const newWish = {
        id: Date.now(),
        name: name,
        content: content,
        category: cat,
        time: new Date().toLocaleString(),
        status: 'Pending',
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 10
    };

    wishes.push(newWish);
    // Save to Firestore logic here
    
    renderWishes();
    document.getElementById("wishModal").style.display = "none";
    // Reset form
    document.getElementById('userName').value = "";
    document.getElementById('wishContent').value = "";
}

function renderWishes(filterData = null) {
    const canvas = document.getElementById('wish-canvas');
    canvas.innerHTML = '';
    const dataToRender = filterData || wishes;

    dataToRender.forEach(wish => {
        const div = document.createElement('div');
        div.className = `wish-tag ${wish.category} ${wish.status === 'Fulfilled' ? 'fulfilled' : ''}`;
        div.style.left = `${wish.x}%`;
        div.style.top = `${wish.y}%`;
        div.innerText = wish.name;

        // Tooltip Data
        const tooltip = `Name: ${wish.name}\nWish: ${wish.content}\nTime: ${wish.time}\nStatus: ${wish.status}`;
        div.setAttribute('data-tooltip', tooltip);

        canvas.appendChild(div);
    });
}

function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) {
        renderWishes();
        return;
    }
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || 
        w.content.toLowerCase().includes(term)
    );
    renderWishes(filtered);
}

function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase();
    const wish = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');

    if (wish) {
        currentFulfillTarget = wish;
        document.getElementById('wishPreview').innerHTML = `
            <strong>Name:</strong> ${wish.name}<br>
            <strong>Wish:</strong> ${wish.content}<br>
            <strong>Date:</strong> ${wish.time}
        `;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else {
        alert("No active wish found for this name/email.");
    }
}

function finalizeFulfillment() {
    if (currentFulfillTarget) {
        const index = wishes.findIndex(w => w.id === currentFulfillTarget.id);
        if (index !== -1) {
            wishes[index].status = 'Fulfilled';
            // Update Firestore logic here
            renderWishes();
            closeFulfill();
            alert("Thank you! Your wish now glows with gold.");
        }
    }
}

function closeFulfill() {
    document.getElementById("fulfillModal").style.display = "none";
    document.getElementById('searchFulfillSection').classList.remove('hidden');
    document.getElementById('fulfillActionSection').classList.add('hidden');
    currentFulfillTarget = null;
}