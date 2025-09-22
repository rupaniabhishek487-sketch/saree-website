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
let selectedCategory = 'All';

// --- Main Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop() || 'index.html';
    
    switch (page) {
        case 'index.html': initLoginPage(); break;
        case 'admin.html': initAdminLoginPage(); break;
        case 'home.html': securePage(initHomePage); break;
        case 'product.html': securePage(initProductPage); break;
        case 'orders.html': securePage(initOrdersPage); break;
        case 'admin-dashboard.html': securePage(initAdminDashboard); break;
    }
    
    setupUniversalListeners();
});

// --- Security & Page Guards ---
async function securePage(pageFunction) {
    if (window.location.pathname.includes('admin-dashboard.html')) {
        if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
            window.location.href = 'admin.html';
        } else {
            initAdminDashboard();
        }
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'index.html'; } 
    else { await loadSareesFromDB(); pageFunction(session.user); }
}

// --- Universal Listeners & Mobile Nav ---
function setupUniversalListeners() {
    // Simple dropdown toggle
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.getElementById('main-nav');
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const expanded = mainNav.classList.contains('active');
        mobileToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    }
    
    document.querySelectorAll('#logout-btn').forEach(btn => btn.addEventListener('click', handleLogout));

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
    window.location.href = 'index.html';
}

function initLoginPage() { 
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            try {
                const { email, pass } = JSON.parse(atob(rememberedUser));
                document.getElementById('username').value = email;
                document.getElementById('password').value = pass;
                document.getElementById('remember-me').checked = true;
            } catch (e) {
                localStorage.removeItem('rememberedUser');
            }
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
        const userCredentials = { email: email, pass: password };
        localStorage.setItem('rememberedUser', btoa(JSON.stringify(userCredentials)));
    } else {
        localStorage.removeItem('rememberedUser');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { errorEl.textContent = "Invalid email or password."; } 
    else { window.location.href = 'home.html'; }
}

function getAdminPass() {
    const savedPass = localStorage.getItem('adminPassword');
    return savedPass ? atob(savedPass) : "SareeAdmin2025";
}

function initAdminLoginPage() { 
    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) {
        const rememberAdmin = localStorage.getItem('rememberAdmin');
        if(rememberAdmin) {
            document.getElementById('admin-password').value = getAdminPass();
            document.getElementById('admin-remember-me').checked = true;
        }
        adminForm.addEventListener('submit', handleAdminLogin);
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const ADMIN_PASS = getAdminPass();
    const password = document.getElementById('admin-password').value;
    const rememberMe = document.getElementById('admin-remember-me').checked;
    const errorEl = document.getElementById('admin-login-error');

    if (password === ADMIN_PASS) {
        if(rememberMe) {
            localStorage.setItem('rememberAdmin', 'true');
        } else {
            localStorage.removeItem('rememberAdmin');
        }
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        window.location.href = 'admin-dashboard.html';
    } else { 
        errorEl.textContent = "Incorrect password."; 
    }
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
    document.getElementById('change-password-form').addEventListener('submit', handleChangeAdminPassword);
    document.getElementById('export-csv-btn')?.addEventListener('click', exportOrdersToCSV);
    document.getElementById('add-image-link-btn').addEventListener('click', () => addDynamicInput('image-links-container', 'url', 'https://example.com/image.jpg'));
    document.getElementById('add-color-btn').addEventListener('click', () => addDynamicInput('colors-container', 'text', 'e.g., Maroon'));
    document.getElementById('all-sarees-table-body').addEventListener('click', handleSareeTableClick);
    document.getElementById('all-parties-table-body').addEventListener('click', handlePartyTableClick);
    document.getElementById('admin-orders-table-body').addEventListener('change', handleOrderStatusChange);
    await loadSareesFromDB();
    renderAllSareesTable();
    renderRegisteredPartiesTable();
    renderAdminOrdersTable();
}

function handleChangeAdminPassword(e) {
    e.preventDefault();
    const statusEl = document.getElementById('change-password-status');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    const ADMIN_PASS = getAdminPass();

    if (currentPassword !== ADMIN_PASS) {
        statusEl.textContent = "Current password is incorrect.";
        statusEl.className = 'form-status-message error';
        return;
    }
    if (!newPassword || newPassword.length < 6) {
        statusEl.textContent = "New password must be at least 6 characters long.";
        statusEl.className = 'form-status-message error';
        return;
    }
    if (newPassword !== confirmNewPassword) {
        statusEl.textContent = "New passwords do not match.";
        statusEl.className = 'form-status-message error';
        return;
    }

    localStorage.setItem('adminPassword', btoa(newPassword));
    statusEl.textContent = "Password updated successfully!";
    statusEl.className = 'form-status-message success';
    e.target.reset();
}


function addDynamicInput(containerId, inputType, placeholder) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'dynamic-input-row';
    const input = document.createElement('input');
    input.type = inputType;
    input.placeholder = placeholder;
    input.required = true;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '−';
    removeBtn.onclick = () => row.remove();
    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

function handleSareeTableClick(e) {
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
    const statuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
    tableBody.innerHTML = data.map(order => {
        const orderDetails = order.order_items.map(item => `
            <div><strong>Type:</strong> ${item.type}</div>
            <div><strong>Design:</strong> ${item.design}</div>
            <div><strong>Colors:</strong> ${item.colors.join(', ')}</div>
            <div><strong>Qty:</strong> ${item.quantity}</div>
        `).join('<hr style="margin: 5px 0; border-color: #eee;">');

        return `<tr>
            <td>${order.id}</td>
            <td>${order.party_details.party_name}</td>
            <td>${orderDetails}${order.note ? `<span class="customer-note-display"><em>Note: ${order.note}</em></span>` : ''}</td>
            <td>₹${order.grand_total.toLocaleString('en-IN')}</td>
            <td>${new Date(order.created_at).toLocaleString()}</td>
            <td><select class="order-status-select" data-order-id="${order.id}">${statuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
            <td><button class="action-btn delete" data-order-id="${order.id}">Delete</button></td>
        </tr>`;
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
    const saree = state.sarees.find(s => s.id === parseInt(sareeId));
    if (!saree) { return; }
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
    const updatedSaree = { name: document.getElementById('editSareeName').value, category: document.getElementById('editSareeCategory').value, price: Number(document.getElementById('editSareePrice').value), weaver_name: document.getElementById('editWeaverName').value, description: document.getElementById('editSareeDescription').value, };
    const { error } = await supabase.from('sarees').update(updatedSaree).eq('id', sareeId);
    if (error) { statusEl.textContent = `Error: ${error.message}`; statusEl.classList.add('error'); } 
    else {
        statusEl.textContent = 'Changes saved successfully!';
        statusEl.classList.add('success');
        await loadSareesFromDB();
        renderAllSareesTable();
        setTimeout(() => { document.getElementById('edit-saree-modal').style.display = 'none'; statusEl.textContent = ''; statusEl.className = 'form-status-message'; }, 1500);
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
    let csvContent = "data:text/csv;charset=utf-8,OrderID,Date,PartyName,GST,Address,Items,Total,Status,Note\n";
    data.forEach(order => {
        const itemsStr = order.order_items.map(i => `Type:${i.type}, Design:${i.design}, Colors:${i.colors.join(';')}, Qty:${i.quantity}`).join(' | ');
        const row = [order.id, new Date(order.created_at).toLocaleString(), `"${order.party_details.party_name}"`, order.party_details.gst_number, `"${order.party_details.address.replace(/\n/g, ' ')}"`, `"${itemsStr}"`, order.grand_total, order.status, `"${order.note || ''}"`].join(',');
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
    const categories = ['All', ...new Set(state.sarees.map(s => s.category))];
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) { 
        categoryGrid.innerHTML = categories.map(cat => `<a href="#" class="category-link ${cat === 'All' ? 'active' : ''}" data-category="${cat}">${cat}</a>`).join('');
        categoryGrid.addEventListener('click', e => {
            if (e.target.matches('.category-link')) {
                e.preventDefault();
                selectedCategory = e.target.dataset.category;
                categoryGrid.querySelectorAll('.category-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
                updateProductGrid();
            }
        });
    }
    updateProductGrid();
}
function updateProductGrid() {
    const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-options')?.value || 'date-desc';
    let filteredSarees = state.sarees;
    if (selectedCategory && selectedCategory !== 'All') {
        filteredSarees = state.sarees.filter(saree => saree.category === selectedCategory);
    }
    if (searchTerm) {
        filteredSarees = filteredSarees.filter(saree => saree.name.toLowerCase().includes(searchTerm));
    }
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
    const closeButtons = document.querySelectorAll('.close-button, #modal-close-btn-user');
    const closeAndRedirect = () => { modal.style.display = "none"; window.location.href = 'orders.html'; };
    closeButtons.forEach(btn => btn.onclick = closeAndRedirect);
    window.onclick = event => { if (event.target == modal) closeAndRedirect(); };
    renderOrderTable(user);
    renderPastOrders(user);
    document.getElementById('past-orders-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-cancel')) {
            const orderId = e.target.dataset.orderId;
            showUserConfirmationModal('Confirm Cancellation', `Are you sure you want to cancel Order #${orderId}?`, false, () => cancelOrder(orderId, user));
        }
    });
}
async function placeOrder(user) {
    const userOrderItems = state.orders[user.id] || [];
    if (userOrderItems.length === 0) return alert("Your cart is empty.");
    const { data: partyData } = await supabase.from('parties').select('*').eq('id', user.id).single();
    if (!partyData) { alert("Could not verify your party details."); return; }
    const grandTotal = userOrderItems.reduce((total, item) => {
        const saree = state.sarees.find(s => s.id === item.sareeId);
        return total + (saree.price * item.quantity);
    }, 0);
    const note = userOrderItems[0]?.note || '';
    const { error } = await supabase.from('orders').insert({ party_id: user.id, party_details: partyData, order_items: userOrderItems, grand_total: grandTotal, note: note, status: 'Pending' });
    if (error) { alert(`Error placing order: ${error.message}`); } 
    else {
        delete state.orders[user.id];
        localStorage.setItem('userOrders', JSON.stringify(state.orders));
        showUserConfirmationModal("Order Placed Successfully!", "Thank you. Your order has been submitted for processing.", true);
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
        const saree = state.sarees.find(s => s.id === item.sareeId);
        if (!saree) return '';
        const itemTotal = Number(saree.price) * item.quantity;
        total += itemTotal;
        const details = item.type === 'Mix' ? 'All Designs, All Colors' : `Design #${item.design}, Colors: ${item.colors.join(', ')}`;
        return `<tr><td>${saree.name}<small>${details}</small></td><td>${item.quantity}</td><td>₹${Number(saree.price).toLocaleString('en-IN')}</td><td>₹${itemTotal.toLocaleString('en-IN')}</td><td><button class="remove-item-btn" data-index="${index}">✖</button></td></tr>`;
    }).join('');
    orderTotalSection.innerHTML = `<p>Grand Total: ₹${total.toLocaleString('en-IN')}</p><button class="btn" id="place-order-btn">Place Order</button>`;
    document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', e => removeOrderItem(user, e.target.dataset.index)));
    document.getElementById('place-order-btn').addEventListener('click', () => placeOrder(user));
}
async function renderPastOrders(user) {
    const container = document.getElementById('past-orders-container');
    const { data, error } = await supabase.from('orders').select('*').eq('party_id', user.id).order('created_at', { ascending: false });
    if (error) { container.innerHTML = `<p class="empty-cart-message">Could not load past orders.</p>`; return; }
    if (data.length === 0) { container.innerHTML = `<p class="empty-cart-message">You have no past orders.</p>`; return; }
    container.innerHTML = `<table class="orders-table"><thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${data.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>₹${order.grand_total.toLocaleString('en-IN')}</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${order.status === 'Pending' ? `<button class="btn btn-cancel" data-order-id="${order.id}">Cancel</button>` : ''}</td>
            </tr>
        `).join('')}
    </tbody></table>`;
}
function removeOrderItem(user, index) { state.orders[user.id].splice(index, 1); localStorage.setItem('userOrders', JSON.stringify(state.orders)); renderOrderTable(user); }
function addToOrder(user, orderItem) {
    const userId = user.id;
    if (!state.orders[userId]) state.orders[userId] = [];
    state.orders[userId].push(orderItem);
    localStorage.setItem('userOrders', JSON.stringify(state.orders));
}
// Product Page Logic
function initProductPage(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const sareeId = parseInt(urlParams.get('id'));
    const saree = state.sarees.find(s => s.id === sareeId);
    if (!saree) { document.getElementById('product-detail-container').innerHTML = `<p>Saree not found.</p>`; return; }
    const container = document.getElementById('product-detail-container');
    
    container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-image-gallery">
                <img id="main-product-image" src="${saree.images[0]}" alt="${saree.name}">
                <div class="design-thumbnails">${saree.images.map((img, index) => `<img src="${img}" alt="Design ${index + 1}" data-design-id="${index + 1}">`).join('')}</div>
            </div>
            <div class="product-details-content">
                <h1>${saree.name}</h1>
                <p class="price">₹${Number(saree.price).toLocaleString('en-IN')}</p>
                <p class="description">${saree.description || ''}</p>
                
                <div class="order-options">
                    <label><input type="radio" id="order-mix" name="orderType" checked> Mix Order</label>
                    <label><input type="radio" id="order-individual" name="orderType"> Individual Design</label>
                </div>

                <div class="options-container">
                    <div class="color-options" style="display: none;">
                        <label>Select Colors:</label>
                        <div class="color-swatches">${saree.colors.map(color => `<span data-color="${color}">${color}</span>`).join('')}</div>
                    </div>
                </div>

                <div class="quantity-input">
                    <label>Quantity: <input type="number" id="order-qty" min="1" value="1"></label>
                </div>

                <div class="customer-note">
                    <label for="order-note">Special Note / Instructions</label>
                    <textarea id="order-note" rows="3" placeholder="Write any special instructions..."></textarea>
                </div>

                <button id="submit-order" class="btn">Add to Order</button>
            </div>
        </div>`;

    const mainImage = document.getElementById('main-product-image');
    const thumbImgs = document.querySelectorAll('.design-thumbnails img');
    let selectedDesign = 'all'; 

    thumbImgs.forEach(img => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        mainImage.src = img.src;
        if (indivRadio.checked) {
            thumbImgs.forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
            selectedDesign = img.dataset.designId;
        }
      });
    });

    mainImage?.addEventListener('click', () => {
      const lightbox = document.querySelector('.image-lightbox');
      if (lightbox) {
        lightbox.querySelector('img').src = mainImage.src;
        lightbox.classList.add('active');
      }
    });
    document.querySelector('.image-lightbox')?.addEventListener('click', e => {
      e.currentTarget.classList.remove('active');
    });

    const mixRadio = document.getElementById('order-mix');
    const indivRadio = document.getElementById('order-individual');
    const colorOptions = document.querySelector('.color-options');

    mixRadio?.addEventListener('change', () => {
      if (mixRadio.checked) {
        selectedDesign = 'all';
        colorOptions.style.display = 'none';
        thumbImgs.forEach(img => img.classList.remove('selected'));
      }
    });
    indivRadio?.addEventListener('change', () => {
      if (indivRadio.checked) {
        colorOptions.style.display = 'block';
        selectedDesign = null;
      }
    });

    let selectedColors = [];
    document.querySelectorAll('.color-options span').forEach(span => {
      span.addEventListener('click', () => {
        span.classList.toggle('active');
        const color = span.dataset.color;
        if (span.classList.contains('active')) {
          selectedColors.push(color);
        } else {
          selectedColors = selectedColors.filter(c => c !== color);
        }
      });
    });

    document.getElementById('submit-order')?.addEventListener('click', () => {
      const option = mixRadio.checked ? "Mix" : "Individual";
      const qty = document.getElementById('order-qty').value;
      const note = document.getElementById('order-note').value;
      
      if(option === "Individual" && !selectedDesign) {
          alert("Please select a design for Individual Order.");
          return;
      }
      if(option === "Individual" && selectedColors.length === 0) {
          alert("Please select at least one color for Individual Order.");
          return;
      }

      const order = {
        sareeId: saree.id,
        type: option,
        design: selectedDesign,
        colors: option === "Mix" ? saree.colors : selectedColors,
        quantity: parseInt(qty),
        note: note
      };

      addToOrder(user, order);
      alert(`Added ${saree.name} to your order!`);
       document.getElementById('order-qty').value = 1;
       document.getElementById('order-note').value = '';
       document.querySelectorAll('.color-options span.active').forEach(s => s.classList.remove('active'));
       thumbImgs.forEach(i => i.classList.remove('selected'));
       mixRadio.checked = true;
       colorOptions.style.display = 'none';
       selectedColors = [];
       selectedDesign = 'all';
    });

    const relatedGrid = document.getElementById('related-products-grid');
    const relatedSarees = state.sarees.filter(s => s.category === saree.category && s.id !== saree.id).slice(0, 4);
    relatedGrid.innerHTML = relatedSarees.map(rs => `<div class="product-card" onclick="window.location.href='product.html?id=${rs.id}'"><div class="product-image-container"><img src="${rs.images[0]}" alt="${rs.name}"></div><div class="product-info"><h3>${rs.name}</h3><p class="product-price">₹${Number(rs.price).toLocaleString('en-IN')}</p></div></div>`).join('');
}

function showUserConfirmationModal(title, message, isSuccess = false, onConfirm = null) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('confirmation-modal-title');
    const modalMsg = document.getElementById('confirmation-modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn-user');
    const cancelBtn = document.getElementById('modal-cancel-btn-user');
    const okBtn = document.getElementById('modal-close-btn-user');

    modalTitle.textContent = title;
    modalMsg.textContent = message;
    
    if (isSuccess) {
        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        okBtn.style.display = 'inline-block';
    } else {
        confirmBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        okBtn.style.display = 'none';

        const confirmHandler = () => {
            if(onConfirm) onConfirm();
            modal.style.display = 'none';
        };
        confirmBtn.addEventListener('click', confirmHandler, { once: true });
        cancelBtn.onclick = () => modal.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

async function cancelOrder(orderId, user) {
    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId).eq('party_id', user.id);
    if (error) {
        alert('Failed to cancel order. It may have already been processed.');
    } else {
        showUserConfirmationModal('Order Cancelled', `Your order #${orderId} has been successfully cancelled.`, true);
        renderPastOrders(user);
    }
}
