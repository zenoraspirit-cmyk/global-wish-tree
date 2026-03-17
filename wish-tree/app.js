import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const supabaseClient = supabase.createClient('https://hiwegspjpvaylkdxfknn.supabase.co', 'sb_publishable_8LdQZYLD9_KXzsuIcXRyWw_RBgHa5AM');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// --- 1. 动态人数递增算法 ---
function updateWishCounter() {
    const baseDate = new Date('2026-01-01'); // 设定初始日期
    const now = new Date();
    // 计算从初始日期到现在过了多少个月
    const monthsPassed = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth());
    
    let totalWishes = 2000;
    // 模拟每月递增 (这里用一个基于月份的确定性随机数，保证每次刷新数字是递增且相对固定的)
    for(let i = 0; i < monthsPassed; i++) {
        const seed = (i + 1) * 12345;
        const monthlyIncrease = 1000 + (seed % 9001); // 产生 1000-10000 之间的数
        totalWishes += monthlyIncrease;
    }
    document.getElementById('counter-num').innerText = totalWishes.toLocaleString();
}
updateWishCounter();

// --- 2. 漫天小雪系统 ---
const snowCount = 2000;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(snowCount * 3);
for(let i=0; i<snowCount; i++) {
    snowPos[i*3] = (Math.random()-0.5)*50;
    snowPos[i*3+1] = Math.random()*30;
    snowPos[i*3+2] = (Math.random()-0.5)*50;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 }));
scene.add(snow);

// --- 3. 圣树加载与完美对齐 ---
let controls;
const loader = new GLTFLoader();
loader.load('tree.glb', (gltf) => {
    const tree = gltf.scene;
    scene.add(tree);
    const box = new THREE.Box3().setFromObject(tree);
    const size = box.getSize(new THREE.Vector3());
    tree.position.y = -box.min.y; // 底部对齐

    const fov = camera.fov * (Math.PI / 180);
    let distance = (size.y / 2) / Math.tan(fov / 2);
    camera.position.set(0, size.y * 0.5, distance * 1.1); // 高度对齐

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, size.y * 0.5, 0);
    controls.minPolarAngle = Math.PI/2; controls.maxPolarAngle = Math.PI/2;
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
});

// --- 4. 业务逻辑 ---
async function submitWish() {
    const nick = document.getElementById('wish-nickname').value.trim() || "Traveller";
    const type = document.getElementById('wish-type').value;
    const content = document.getElementById('wish-content').value.trim() || "...";

    document.getElementById('wish-modal').classList.add('hidden');
    
    // 显示回执
    document.getElementById('detail-body').innerHTML = `
        <p><b>Nickname:</b> ${nick}</p>
        <p><b>Content:</b> ${content}</p>
        <p><b>Time:</b> ${new Date().toLocaleString()}</p>
        <p><b>Status:</b> <span style="color:#ffd700">Praying...</span></p>
    `;
    document.getElementById('detail-modal').classList.remove('hidden');

    // 尝试播放音乐 (应对浏览器自动播放限制)
    const audio = document.getElementById('bg-music');
    if (audio.paused) audio.play();

    await supabaseClient.from('wishes').insert([{ nickname: nick, type: type, content: content, is_fulfilled: false, created_at: new Date() }]);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    const pos = snow.geometry.attributes.position.array;
    for(let i=0; i<snowCount; i++) {
        pos[i*3+1] -= 0.03;
        if(pos[i*3+1] < -2) pos[i*3+1] = 25;
    }
    snow.geometry.attributes.position.needsUpdate = true;
    if(controls) controls.update();
    renderer.render(scene, camera);
}
animate();

window.onload = () => {
    document.getElementById('make-wish-btn').onclick = () => {
        document.getElementById('wish-modal').classList.remove('hidden');
        // 第一次点击互动时尝试播放音乐
        const audio = document.getElementById('bg-music');
        if (audio.paused) audio.play();
    };
    document.getElementById('submit-wish-action').onclick = submitWish;
    document.getElementById('detail-close-btn').onclick = () => document.getElementById('detail-modal').classList.add('hidden');
    document.querySelectorAll('.close-modal-btn').forEach(b => b.onclick = () => b.closest('.modal').classList.add('hidden'));
};