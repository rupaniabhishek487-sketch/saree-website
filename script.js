// --- Supabase Configuration & Initialization ---
const SUPABASE_URL = 'https://omuwfgyeqjenreojqtbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdXdmZ3llcWplbnJlb2pxdGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI2MzcsImV4cCI6MjA3MjEyODYzN30.EtKzbfFhrcaHfaaIbrVloRU95FncyrAEAogMhAX4csA';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Local State Management ---
let state = {
    sarees: [],
    orders: JSON.parse(localStorage.getItem('userOrders')) || {},
};

// --- Main Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    setupUniversalListeners();
    switch (page) {
        case 'index.html': initLoginPage(); break;
        case 'admin.html': initAdminLoginPage(); break;
        case 'home.html': securePage(initHomePage); break;
        case 'product.html': securePage(initProductPage); break;
        case 'orders.html': securePage(initOrdersPage); break;
        case 'admin-dashboard.html': initAdminDashboard(); break;
    }
});

// --- Security & Page Guards ---
async function securePage(pageFunction) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'index.html'; } 
    else { await loadSareesFromDB(); pageFunction(session.user); }
}

// --- Universal Listeners ---
function setupUniversalListeners() {
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.onscroll = () => { scrollToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none"; };
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
}

// --- Auth Functions ---
async function handleLogout(e) { 
    e.preventDefault(); 
    sessionStorage.removeItem('isAdminAuthenticated'); 
    localStorage.removeItem('userOrders'); 
    const { error } = await supabase.auth.signOut();
    if (!error) { window.location.href = 'index.html'; }
}

function initLoginPage() { 
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            document.getElementById('username').value = savedEmail;
            document.getElementById('remember-me').checked = true;
        }
        loginForm.addEventListener('submit', handleLogin);
    }
}
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = 'Logging in...';

    if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { errorEl.textContent = "Invalid email or password."; } 
    else { window.location.href = 'home.html'; }
}

function initAdminLoginPage() { 
    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminLogin);
    }
}
function handleAdminLogin(e) {
    e.preventDefault();
    const ADMIN_PASS = "SareeAdmin2025";
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('admin-login-error');
    if (password === ADMIN_PASS) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        window.location.href = 'admin-dashboard.html';
    } else { errorEl.textContent = "Incorrect password."; }
}

// --- Data Fetching ---
async function loadSareesFromDB() {
    const { data, error } = await supabase.from('sarees').select('*').order('created_at', { ascending: false });
    if (!error) { state.sarees = data; }
    else { console.error("Error fetching sarees:", error); }
}

// --- Admin Dashboard Logic ---
async function initAdminDashboard() {
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') { window.location.href = 'admin.html'; return; }
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href');
            if (e.target.id === 'logout-btn' || targetId === '#') return;
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            sections.forEach(sec => sec.style.display = ('#' + sec.id === targetId) ? 'block' : 'none');
        });
    });
    document.getElementById('add-saree-form').addEventListener('submit', handleAddSaree);
    document.getElementById('edit-saree-form').addEventListener('submit', handleUpdateSaree);
    document.getElementById('register-party-form').addEventListener('submit', handleRegisterParty);
    document.getElementById('export-csv-btn')?.addEventListener('click', exportOrdersToCSV);
    document.getElementById('add-image-link-btn').addEventListener('click', () => addDynamicInput('image-links-container'));
    document.getElementById('add-color-btn').addEventListener('click', () => addDynamicInput('colors-container'));
    document.getElementById('all-sarees-table-body').addEventListener('click', handleSareeTableClick);
    document.getElementById('all-parties-table-body').addEventListener('click', handlePartyTableClick);
    document.getElementById('admin-orders-table-body').addEventListener('change', handleOrderStatusChange);
    await loadSareesFromDB();
    renderAllSareesTable();
    renderRegisteredPartiesTable();
    renderAdminOrdersTable();
}

function handleSareeTableClick(e) {
    // CORRECTED: Looking for 'delete' and 'edit' classes
    if (e.target.classList.contains('delete')) {
        const sareeId = e.target.dataset.id;
        const sareeName = e.target.closest('tr').cells[0].textContent;
        showConfirmationModal(`Are you sure you want to delete the saree "${sareeName}"?`, () => deleteSaree(sareeId));
    } else if (e.target.classList.contains('edit')) {
        const sareeId = e.target.dataset.id;
        openEditSareeModal(sareeId);
    }
}

async function deleteSaree(sareeId) {
    const { error } = await supabase.from('sarees').delete().eq('id', sareeId);
    if (error) { alert(`Error deleting saree: ${error.message}`); } 
    else { await loadSareesFromDB(); renderAllSareesTable(); }
}

function handlePartyTableClick(e) {
    // CORRECTED: Looking for 'delete' class
    if (e.target.classList.contains('delete')) {
        const partyId = e.target.dataset.id;
        const partyName = e.target.closest('tr').cells[0].textContent;
        showConfirmationModal(`Are you sure you want to delete the party "${partyName}"? This will delete their login and all past orders.`, () => deleteParty(partyId));
    }
}

async function deleteParty(partyId) {
    const { error } = await supabase.rpc('delete_party', { party_id: partyId });
    if (error) { alert(`Error deleting party: ${error.message}`); } 
    else { await renderRegisteredPartiesTable(); }
}

function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal-admin');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    messageEl.textContent = message;
    modal.style.display = 'block';
    const confirmHandler = () => { onConfirm(); hideModal(); };
    const hideModal = () => { modal.style.display = 'none'; confirmBtn.removeEventListener('click', confirmHandler); };
    confirmBtn.addEventListener('click', confirmHandler, { once: true });
    cancelBtn.onclick = hideModal;
    window.onclick = (event) => { if (event.target == modal) { hideModal(); } };
}

function renderAllSareesTable() {
    const tableBody = document.getElementById('all-sarees-table-body');
    if (!tableBody) return;
    document.getElementById('total-sarees-stat').textContent = state.sarees.length;
    tableBody.innerHTML = state.sarees.map(s => `<tr><td>${s.name}</td><td>${s.category}</td><td>₹${Number(s.price).toLocaleString('en-IN')}</td><td>${s.weaver_name}</td><td>${new Date(s.created_at).toLocaleDateString()}</td><td><button class="action-btn edit" data-id="${s.id}">Edit</button><button class="action-btn delete" data-id="${s.id}">Delete</button></td></tr>`).join('');
}

async function renderRegisteredPartiesTable() {
    const tableBody = document.getElementById('all-parties-table-body');
    if (!tableBody) return;
    const { data, error } = await supabase.from('parties').select('*');
    if (error) { tableBody.innerHTML = `<tr><td colspan="5">Failed to load parties.</td></tr>`; return; }
    document.getElementById('total-parties-stat').textContent = data.length;
    tableBody.innerHTML = data.length > 0 ? data.map(p => `<tr><td>${p.party_name}</td><td>${p.email}</td><td>${p.gst_number}</td><td>${p.address}</td><td><button class="action-btn delete" data-id="${p.id}">Delete</button></td></tr>`).join('') : `<tr><td colspan="5">No parties registered.</td></tr>`;
}

async function renderAdminOrdersTable() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if(!tableBody) return;
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { tableBody.innerHTML = `<tr><td colspan="6">Failed to load orders.</td></tr>`; return; }
    document.getElementById('total-orders-stat').textContent = data.length;
    if (data.length === 0) { tableBody.innerHTML = `<tr><td colspan="6">No orders placed.</td></tr>`; return; }
    const statuses = ['Pending', 'Processing', 'Shipped', 'Completed'];
    tableBody.innerHTML = data.map(order => {
        const itemsSummary = order.order_items.map(item => `${item.quantity} x ${item.sareeName} (${item.color})`).join('<br>');
        const statusOptions = statuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');
        return `<tr><td>${order.id}</td><td>${order.party_details.party_name}</td><td>${itemsSummary}</td><td>₹${order.grand_total.toLocaleString('en-IN')}</td><td>${new Date(order.created_at).toLocaleString()}</td><td><select class="order-status-select" data-order-id="${order.id}">${statusOptions}</select></td></tr>`;
    }).join('');
}

async function handleOrderStatusChange(e) {
    if (e.target.classList.contains('order-status-select')) {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.value;
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (error) { alert('Failed to update status.'); }
    }
}

function openEditSareeModal(sareeId) {
    const saree = state.sarees.find(s => s.id === sareeId);
    if (!saree) return;
    const modal = document.getElementById('edit-saree-modal');
    document.getElementById('editSareeId').value = saree.id;
    document.getElementById('editSareeName').value = saree.name;
    document.getElementById('editSareeCategory').value = saree.category;
    document.getElementById('editSareePrice').value = saree.price;
    document.getElementById('editWeaverName').value = saree.weaver_name;
    document.getElementById('editSareeDescription').value = saree.description || '';
    modal.style.display = 'block';
    modal.querySelector('.close-button').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
}

async function handleUpdateSaree(e) {
    e.preventDefault();
    const statusEl = document.getElementById('edit-saree-status');
    statusEl.textContent = 'Saving...';
    statusEl.className = 'form-status-message';
    const sareeId = document.getElementById('editSareeId').value;
    const updatedSaree = {
        name: document.getElementById('editSareeName').value,
        category: document.getElementById('editSareeCategory').value,
        price: Number(document.getElementById('editSareePrice').value),
        weaver_name: document.getElementById('editWeaverName').value,
        description: document.getElementById('editSareeDescription').value,
    };
    const { error } = await supabase.from('sarees').update(updatedSaree).eq('id', sareeId);
    if (error) {
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.classList.add('error');
    } else {
        statusEl.textContent = 'Changes saved successfully!';
        statusEl.classList.add('success');
        await loadSareesFromDB();
        renderAllSareesTable();
        setTimeout(() => document.getElementById('edit-saree-modal').style.display = 'none', 1500);
    }
}

async function handleAddSaree(e) {
    e.preventDefault();
    const statusEl = document.getElementById('add-saree-status');
    statusEl.textContent = 'Adding Saree...';
    statusEl.className = 'form-status-message';
    const images = Array.from(document.querySelectorAll('#image-links-container .dynamic-input-row input')).map(input => input.value);
    const colors = Array.from(document.querySelectorAll('#colors-container .dynamic-input-row input')).map(input => input.value);
    const newSaree = { name: document.getElementById('sareeName').value, category: document.getElementById('sareeCategory').value, price: Number(document.getElementById('sareePrice').value), weaver_name: document.getElementById('weaverName').value, description: document.getElementById('sareeDescription').value, images, colors };
    const { error } = await supabase.from('sarees').insert(newSaree);
    if (error) { statusEl.textContent = `Error: ${error.message}`; statusEl.classList.add('error'); } 
    else {
        statusEl.textContent = 'Saree added successfully!';
        statusEl.classList.add('success');
        e.target.reset();
        document.getElementById('image-links-container').innerHTML = '<div class="dynamic-input-row"><input type="url" placeholder="https://example.com/image.jpg" required></div>';
        document.getElementById('colors-container').innerHTML = '<div class="dynamic-input-row"><input type="text" placeholder="e.g., Maroon" required></div>';
        await loadSareesFromDB();
        renderAllSareesTable();
    }
}

async function handleRegisterParty(e) {
    e.preventDefault();
    const statusEl = document.getElementById('register-party-status');
    statusEl.textContent = 'Registering...';
    statusEl.className = 'form-status-message';
    const email = document.getElementById('partyEmail').value;
    const password = document.getElementById('partyPassword').value;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) { statusEl.textContent = `Auth Error: ${authError.message}`; statusEl.classList.add('error'); return; }
    if (authData.user) {
        const { error: dbError } = await supabase.from('parties').insert({ id: authData.user.id, party_name: document.getElementById('partyName').value, address: document.getElementById('partyAddress').value, gst_number: document.getElementById('partyGst').value, email: email });
        if (dbError) { statusEl.textContent = `Database Error: ${dbError.message}`; statusEl.classList.add('error'); } 
        else { statusEl.textContent = 'Party registered successfully!'; statusEl.classList.add('success'); e.target.reset(); await renderRegisteredPartiesTable(); }
    } else { statusEl.textContent = 'User could not be created.'; statusEl.classList.add('error'); }
}

async function exportOrdersToCSV() {
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data) { alert("Could not fetch orders to export."); return; }
    let csvContent = "data:text/csv;charset=utf-8,OrderID,Date,PartyName,GST,Address,Items,Total,Status\n";
    data.forEach(order => {
        const itemsStr = order.order_items.map(i => `${i.quantity}x ${i.sareeName} (${i.color})`).join('; ');
        const row = [order.id, new Date(order.created_at).toLocaleString(), `"${order.party_details.party_name}"`, order.party_details.gst_number, `"${order.party_details.address.replace(/\n/g, ' ')}"`, `"${itemsStr}"`, order.grand_total, order.status].join(',');
        csvContent += row + "\r\n";
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "saree_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Home Page functions
async function initHomePage(user) {
    const { data } = await supabase.from('parties').select('party_name').eq('id', user.id).single();
    if (data) document.getElementById('welcome-message').textContent = `Welcome, ${data.party_name}`;
    document.getElementById('search-bar')?.addEventListener('input', updateProductGrid);
    document.getElementById('sort-options')?.addEventListener('change', updateProductGrid);
    const categories = [...new Set(state.sarees.map(s => s.category))];
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) { categoryGrid.innerHTML = categories.map(cat => `<a href="#" class="category-link" data-category="${cat}">${cat}</a>`).join(''); }
    updateProductGrid();
}
function updateProductGrid() {
    const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-options')?.value || 'date-desc';
    let filteredSarees = state.sarees.filter(saree => saree.name.toLowerCase().includes(searchTerm));
    switch (sortValue) {
        case 'price-asc': filteredSarees.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filteredSarees.sort((a, b) => b.price - a.price); break;
        default: break;
    }
    renderSarees(filteredSarees);
}
function renderSarees(sarees) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = sarees.length === 0 ? `<p class="empty-cart-message">No sarees found.</p>` : sarees.map(saree => `<div class="product-card" onclick="window.location.href='product.html?id=${saree.id}'"><div class="product-image-container"><img src="${saree.images[0]}" alt="${saree.name}"></div><div class="product-info"><h3>${saree.name}</h3><p>${saree.description ? saree.description.substring(0, 80) + '...' : ''}</p><div class="product-price">₹${Number(saree.price).toLocaleString('en-IN')}</div></div></div>`).join('');
}
// Orders Page Functions
async function initOrdersPage(user) {
    const { data } = await supabase.from('parties').select('*').eq('id', user.id).single();
    if (data) { document.getElementById('party-details-review').innerHTML = `<h3>Your details for this order:</h3><p><strong>Name:</strong> ${data.party_name}</p><p><strong>Address:</strong> ${data.address}</p><p><strong>GST No:</strong> ${data.gst_number}</p>`; }
    const modal = document.getElementById('confirmation-modal');
    const closeButtons = document.querySelectorAll('.close-button, #modal-close-btn');
    const closeAndRedirect = () => { modal.style.display = "none"; window.location.href = 'home.html'; };
    closeButtons.forEach(btn => btn.onclick = closeAndRedirect);
    window.onclick = event => { if (event.target == modal) closeAndRedirect(); };
    renderOrderTable(user);
    renderPastOrders(user);
}
async function placeOrder(user) {
    const userOrderItems = state.orders[user.id] || [];
    if (userOrderItems.length === 0) return alert("Your cart is empty.");
    const { data: partyData } = await supabase.from('parties').select('*').eq('id', user.id).single();
    if (!partyData) { alert("Could not verify your party details."); return; }
    const itemsWithDetails = userOrderItems.map(item => {
        const saree = state.sarees.find(s => s.id === item.id);
        return { ...item, sareeName: saree.name, unitPrice: saree.price, totalPrice: item.quantity * saree.price }
    });
    const grandTotal = itemsWithDetails.reduce((total, item) => total + item.totalPrice, 0);
    const { error } = await supabase.from('orders').insert({ party_id: user.id, party_details: partyData, order_items: itemsWithDetails, grand_total: grandTotal });
    if (error) { alert(`Error placing order: ${error.message}`); } 
    else {
        delete state.orders[user.id];
        localStorage.setItem('userOrders', JSON.stringify(state.orders));
        document.getElementById('confirmation-modal').style.display = "block";
    }
}
function renderOrderTable(user) {
    const container = document.getElementById('current-order-container');
    const orderItemsBody = document.getElementById('order-items-body');
    const orderTotalSection = document.getElementById('order-total-section');
    const userOrder = state.orders[user.id] || [];
    if (userOrder.length === 0) { container.innerHTML = `<p class="empty-cart-message">Your current order is empty. Add items from the collection to get started.</p>`; return; }
    let total = 0;
    orderItemsBody.innerHTML = userOrder.map((item, index) => {
        const saree = state.sarees.find(s => s.id === item.id);
        if (!saree) return '';
        const itemTotal = Number(saree.price) * item.quantity;
        total += itemTotal;
        return `<tr><td>${saree.name}</td><td>${item.color}</td><td><input type="number" value="${item.quantity}" min="1" class="quantity-input" data-index="${index}"></td><td>₹${Number(saree.price).toLocaleString('en-IN')}</td><td>₹${itemTotal.toLocaleString('en-IN')}</td><td><button class="remove-item-btn" data-index="${index}">✖</button></td></tr>`;
    }).join('');
    orderTotalSection.innerHTML = `<p>Grand Total: ₹${total.toLocaleString('en-IN')}</p><button class="btn" id="place-order-btn">Place Order</button>`;
    document.querySelectorAll('.quantity-input').forEach(input => input.addEventListener('change', e => updateOrderItemQuantity(user, e.target.dataset.index, parseInt(e.target.value))));
    document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', e => removeOrderItem(user, e.target.dataset.index)));
    document.getElementById('place-order-btn').addEventListener('click', () => placeOrder(user));
}
async function renderPastOrders(user) {
    const container = document.getElementById('past-orders-container');
    const { data, error } = await supabase.from('orders').select('*').eq('party_id', user.id).order('created_at', { ascending: false });
    if (error) { container.innerHTML = `<p class="empty-cart-message">Could not load past orders.</p>`; return; }
    if (data.length === 0) { container.innerHTML = `<p class="empty-cart-message">You have no past orders.</p>`; return; }
    container.innerHTML = `<table class="orders-table"><thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
        ${data.map(order => `<tr><td>#${order.id}</td><td>${new Date(order.created_at).toLocaleDateString()}</td><td>${order.order_items.length} items</td><td>₹${order.grand_total.toLocaleString('en-IN')}</td><td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td></tr>`).join('')}
    </tbody></table>`;
}
function updateOrderItemQuantity(user, index, quantity) { if (quantity > 0) { state.orders[user.id][index].quantity = quantity; localStorage.setItem('userOrders', JSON.stringify(state.orders)); renderOrderTable(user); } }
function removeOrderItem(user, index) { state.orders[user.id].splice(index, 1); localStorage.setItem('userOrders', JSON.stringify(state.orders)); renderOrderTable(user); }
function addToOrder(user, sareeId, color, quantity) {
    if (!user) return;
    const userId = user.id;
    if (!state.orders[userId]) state.orders[userId] = [];
    const existingItemIndex = state.orders[userId].findIndex(item => item.id === sareeId && item.color === color);
    if (existingItemIndex > -1) { state.orders[userId][existingItemIndex].quantity += quantity; } 
    else { state.orders[userId].push({ id: sareeId, color, quantity }); }
    localStorage.setItem('userOrders', JSON.stringify(state.orders));
}
// Product Page Logic
function initProductPage(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const sareeId = parseInt(urlParams.get('id'));
    const saree = state.sarees.find(s => s.id === sareeId);
    if (!saree) { document.getElementById('product-detail-container').innerHTML = `<p>Saree not found.</p>`; return; }
    const container = document.getElementById('product-detail-container');
    container.innerHTML = `<div class="product-detail-grid"><div class="product-image-gallery"><div class="main-image"><img src="${saree.images[0]}" alt="${saree.name}" id="main-saree-image"></div><div class="thumbnails">${saree.images.map((img, index) => `<img src="${img}" alt="Thumbnail ${index + 1}" class="${index === 0 ? 'active' : ''}">`).join('')}</div></div><div class="product-details-content"><h1>${saree.name}</h1><p class="price">₹${Number(saree.price).toLocaleString('en-IN')}</p><p class="description">${saree.description || ''}</p><div class="options-group"><label>Color</label><div class="color-swatches">${saree.colors.map((color, index) => `<div class="color-swatch" data-color="${color}" title="${color}" style="background-color: ${color.toLowerCase().replace(/[\s()]/g, '')}"></div>`).join('')}</div></div><div class="options-group"><label>Quantity</label><div class="quantity-selector"><button id="quantity-minus">−</button><input type="number" id="quantity-input" value="1" min="1"><button id="quantity-plus">+</button></div></div><button class="btn" id="add-to-order-btn"><i class="fas fa-shopping-bag"></i> Add to Order</button></div></div>`;
    const mainImage = document.getElementById('main-saree-image');
    const thumbnails = document.querySelectorAll('.thumbnails img');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => { mainImage.src = thumb.src; thumbnails.forEach(t => t.classList.remove('active')); thumb.classList.add('active'); });
    });
    const colorSwatches = document.querySelectorAll('.color-swatch');
    if (colorSwatches.length > 0) { colorSwatches[0].classList.add('active'); }
    colorSwatches.forEach(swatch => { swatch.addEventListener('click', () => { colorSwatches.forEach(s => s.classList.remove('active')); swatch.classList.add('active'); }); });
    const quantityInput = document.getElementById('quantity-input');
    document.getElementById('quantity-minus').addEventListener('click', () => { let currentValue = parseInt(quantityInput.value); if (currentValue > 1) quantityInput.value = currentValue - 1; });
    document.getElementById('quantity-plus').addEventListener('click', () => { quantityInput.value = parseInt(quantityInput.value) + 1; });
    document.getElementById('add-to-order-btn').addEventListener('click', () => {
        const selectedColorEl = document.querySelector('.color-swatch.active');
        if (!selectedColorEl) { alert('Please select a color.'); return; }
        const selectedColor = selectedColorEl.dataset.color;
        const quantity = parseInt(quantityInput.value);
        addToOrder(user, saree.id, selectedColor, quantity);
        alert(`${quantity} x ${saree.name} (${selectedColor}) added to your order!`);
    });
    const relatedGrid = document.getElementById('related-products-grid');
    const relatedSarees = state.sarees.filter(s => s.category === saree.category && s.id !== saree.id).slice(0, 4);
    relatedGrid.innerHTML = relatedSarees.map(rs => `<div class="product-card" onclick="window.location.href='product.html?id=${rs.id}'"><div class="product-image-container"><img src="${rs.images[0]}" alt="${rs.name}"></div><div class="product-info"><h3>${rs.name}</h3><p class="product-price">₹${Number(rs.price).toLocaleString('en-IN')}</p></div></div>`).join('');
}
