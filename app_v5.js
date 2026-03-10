let wishes = [];
let currentFulfillTarget = null;

window.onload = () => {
    // 初始渲染
    renderWishes();

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

    window.onclick = (e) => {
        if (e.target == wishModal) wishModal.style.display = "none";
        if (e.target == fulfillModal) fulfillModal.style.display = "none";
    };
};

// --- 1. 支付拦截逻辑 ---
function handlePayment(type) {
    const amount = type === 'wish' ? 1 : document.getElementById('fulfillAmount').value;
    if (type === 'fulfill' && (!amount || amount <= 0)) {
        alert("Please enter a valid amount.");
        return;
    }

    // 真正的支付跳转应在此处对接 API (如 window.location.href = StripeLink)
    // 此处为模拟流程
    const success = confirm(`[PAYMENT GATEWAY] Total: $${amount}\n\nProceed with simulated payment?`);
    
    if (success) {
        if (type === 'wish') {
            // 只有支付成功才显示表单
            document.getElementById("paymentSection").classList.add("hidden");
            document.getElementById("wishFormSection").classList.remove("hidden");
        } else {
            // 只有支付成功才完成还愿变色
            finalizeFulfillment();
        }
    } else {
        alert("Payment cancelled. You cannot proceed without payment.");
    }
}

function submitWish() {
    const name = document.getElementById('userName').value.trim();
    const content = document.getElementById('wishContent').value.trim();
    const cat = document.getElementById('wishCategory').value;

    if (!name || !content) {
        alert("Name and Wish content are required.");
        return;
    }

    const pos = getRandomNonOverlappingPos();
    const newWish = {
        id: Date.now(),
        name: name,
        content: content,
        category: cat,
        time: new Date().toLocaleString(),
        status: 'Active',
        x: pos.x,
        y: pos.y
    };

    wishes.push(newWish);
    renderWishes();
    document.getElementById("wishModal").style.display = "none";
    // 清空表单
    document.getElementById('userName').value = "";
    document.getElementById('wishContent').value = "";
}

// --- 2. 实时模糊搜索逻辑 ---
function searchWishes() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    
    // 如果没有输入，显示所有
    if (term === "") {
        renderWishes();
        return;
    }

    // 只要姓名或内容包含关键字就显示（不区分大小写）
    const filtered = wishes.filter(w => 
        w.name.toLowerCase().includes(term) || 
        w.content.toLowerCase().includes(term)
    );
    
    renderWishes(filtered);
}

// --- 3. 标签防重叠逻辑 ---
function getRandomNonOverlappingPos() {
    let x, y, isOverlapping;
    let attempts = 0;
    const margin = 10; // 标签间距

    do {
        isOverlapping = false;
        // 限制在屏幕 10% - 85% 范围内，避免贴边
        x = Math.random() * 75 + 10;
        y = Math.random() * 60 + 15;

        // 检查与现有愿望的距离
        for (let w of wishes) {
            const dx = Math.abs(w.x - x);
            const dy = Math.abs(w.y - y);
            if (dx < 12 && dy < 6) { // 设定碰撞检测范围
                isOverlapping = true;
                break;
            }
        }
        attempts++;
    } while (isOverlapping && attempts < 50); // 最多尝试50次找空位

    return { x, y };
}

function renderWishes(dataToRender = null) {
    const canvas = document.getElementById('wish-canvas');
    canvas.innerHTML = '';
    const list = dataToRender || wishes;

    list.forEach(wish => {
        const div = document.createElement('div');
        div.className = `wish-tag ${wish.category} ${wish.status === 'Fulfilled' ? 'fulfilled' : ''}`;
        div.style.left = `${wish.x}%`;
        div.style.top = `${wish.y}%`;
        div.innerText = wish.name;

        const tooltip = `Owner: ${wish.name}\nWish: ${wish.content}\nDate: ${wish.time}\nStatus: ${wish.status}`;
        div.setAttribute('data-tooltip', tooltip);

        canvas.appendChild(div);
    });
}

function findWishToFulfill() {
    const term = document.getElementById('searchFulfillName').value.toLowerCase().trim();
    const wish = wishes.find(w => w.name.toLowerCase() === term && w.status !== 'Fulfilled');

    if (wish) {
        currentFulfillTarget = wish;
        document.getElementById('wishPreview').innerHTML = `
            <strong>Target:</strong> ${wish.name}<br>
            <strong>Wish:</strong> ${wish.content}
        `;
        document.getElementById('searchFulfillSection').classList.add('hidden');
        document.getElementById('fulfillActionSection').classList.remove('hidden');
    } else {
        alert("No active wish found for this name/email.");
    }
}

function finalizeFulfillment() {
    if (currentFulfillTarget) {
        const idx = wishes.findIndex(w => w.id === currentFulfillTarget.id);
        if (idx !== -1) {
            wishes[idx].status = 'Fulfilled';
            renderWishes();
            document.getElementById("fulfillModal").style.display = "none";
            alert("Thank you for fulfilling the wish! The tag is now golden.");
        }
    }
}