// --- Supabase Configuration & Initialization ---
const SUPABASE_URL = 'https://omuwfgyeqjenreojqtbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdXdmZ3llcWplbnJlb2pxdGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI2MzcsImV4cCI6MjA3MjEyODYzN30.EtKzbfFhrcaHfaaIbrVloRU95FncyrAEAogMhAX4csA';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


// --- Mock Database (Products are still local for demonstration) ---
const DB = {
    sarees: [
        { id: 1, name: 'Royal Banarasi Silk', category: 'Banarasi', description: 'A timeless classic...', price: 12500, colors: ['Red', 'Royal Blue', 'Green'], images: ['https://placehold.co/600x800/ffcccb/333?text=Saree1-A', 'https://placehold.co/600x800/add8e6/333?text=Saree1-B'], weaverName: 'Ramesh Lal', datePosted: '2025-08-28T10:00:00Z' },
        { id: 2, name: 'Elegant Kanjivaram', category: 'Kanjivaram', description: 'Crafted in the looms of Kanchipuram...', price: 18000, colors: ['Maroon', 'Peacock Green'], images: ['https://placehold.co/600x800/800000/fff?text=Saree2-A'], weaverName: 'S. Murugan', datePosted: '2025-08-29T11:30:00Z' },
        { id: 3, name: 'Vibrant Bandhani', category: 'Bandhani', description: 'A beautiful tie-dye saree from Gujarat...', price: 7500, colors: ['Yellow', 'Pink'], images: ['https://placehold.co/600x800/ffff00/333?text=Saree3'], weaverName: 'Meena Patel', datePosted: '2025-08-27T15:00:00Z' },
        { id: 4, name: 'Classic Chanderi', category: 'Chanderi', description: 'A blend of comfort and elegance.', price: 9200, colors: ['Pastel Blue', 'Cream'], images: ['https://placehold.co/600x800/b0e0e6/333?text=Saree4'], weaverName: 'Ramesh Lal', datePosted: '2025-08-26T09:00:00Z' },
        { id: 5, name: 'Traditional Paithani', category: 'Paithani', description: 'A masterpiece from Maharashtra.', price: 25000, colors: ['Purple', 'Gold'], images: ['https://placehold.co/600x800/800080/fff?text=Saree5-A'], weaverName: 'Sunita Rao', datePosted: '2025-08-29T14:00:00Z' }
    ],
    orders: JSON.parse(localStorage.getItem('userOrders')) || {},
};

// --- Main Entry Point ---
// This new structure is more robust. It waits for the DOM to be fully loaded
// before attempting to run any page-specific logic, preventing race conditions.
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop();

    // Attach listeners that are present on multiple pages
    setupUniversalListeners();

    // Run logic based on which page is currently loaded
    switch (page) {
        case 'index.html':
        case '':
            initLoginPage();
            break;
        case 'admin.html':
            initAdminLoginPage();
            break;
        case 'home.html':
            securePage(initHomePage);
            break;
        case 'product.html':
            securePage(initProductPage);
            break;
        case 'orders.html':
            securePage(initOrdersPage);
            break;
        case 'admin-dashboard.html':
            initAdminDashboard();
            break;
    }
});

// --- Security & Page Guards ---
async function securePage(pageFunction) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
    } else {
        pageFunction(session.user);
    }
}

// --- Universal Listeners ---
function setupUniversalListeners() {
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.onscroll = () => {
            scrollToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none";
        };
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
}


// --- Auth Functions ---
async function handleLogout(e) { 
    e.preventDefault(); 
    sessionStorage.removeItem('isAdminAuthenticated'); 
    localStorage.removeItem('userOrders'); 
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    }
}

function initLoginPage() { 
    document.getElementById('login-form')?.addEventListener('submit', handleLogin); 
}
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        errorEl.textContent = "Invalid email or password.";
    } else {
        window.location.href = 'home.html';
    }
}

// Admin login is separate and does not use Supabase auth
function initAdminLoginPage() { 
    const form = document.getElementById('admin-login-form');
    if (form) {
        form.addEventListener('submit', handleAdminLogin);
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
    } else { 
        errorEl.textContent = "Incorrect password."; 
    }
}

// --- Home Page Logic ---
async function initHomePage(user) {
    const { data, error } = await supabase.from('parties').select('party_name').eq('id', user.id).single();
    if(data) document.getElementById('welcome-message').textContent = `Welcome, ${data.party_name}`;
    
    document.getElementById('search-bar')?.addEventListener('input', updateProductGrid);
    document.getElementById('sort-options')?.addEventListener('change', updateProductGrid);
    updateProductGrid();

    const categories = [...new Set(DB.sarees.map(s => s.category))];
    const categoryGrid = document.getElementById('category-grid');
    if(categoryGrid) {
      categoryGrid.innerHTML = categories.map(cat => `<a href="#" class="category-link" data-category="${cat}">${cat}</a>`).join('');
    }
}

function updateProductGrid() {
    const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-options')?.value || 'date-desc';
    let filteredSarees = DB.sarees.filter(saree => saree.name.toLowerCase().includes(searchTerm));
    
    switch (sortValue) {
        case 'price-asc': filteredSarees.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filteredSarees.sort((a, b) => b.price - a.price); break;
        default: filteredSarees.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted)); break;
    }
    renderSarees(filteredSarees);
}

function renderSarees(sarees) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = sarees.length === 0 
        ? `<p class="empty-cart-message">No sarees found.</p>`
        : sarees.map(saree => `
            <div class="product-card" onclick="window.location.href='product.html?id=${saree.id}'">
                <div class="product-image-container"><img src="${saree.images[0]}" alt="${saree.name}"></div>
                <div class="product-info"><h3>${saree.name}</h3><p>${saree.description.substring(0, 80)}...</p><div class="product-price">₹${saree.price.toLocaleString('en-IN')}</div></div>
            </div>`).join('');
}

// --- Admin Dashboard Logic ---
function initAdminDashboard() {
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') { window.location.href = 'admin.html'; return; }
    
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetId = e.target.getAttribute('href');
             if (e.target.id === 'logout-btn') { return; } // The universal listener handles this
            if(targetId === '#') { return; };
            navLinks.forEach(l => l.classList.remove('active')); e.target.classList.add('active');
            sections.forEach(sec => sec.style.display = ('#' + sec.id === targetId) ? 'block' : 'none');
        });
    });

    document.getElementById('register-party-form').addEventListener('submit', handleRegisterParty);
    document.getElementById('export-csv-btn')?.addEventListener('click', exportOrdersToCSV);
    
    document.getElementById('all-sarees-table-body').innerHTML = DB.sarees.map(s => `<tr><td>${s.name}</td><td>${s.category}</td><td>₹${s.price.toLocaleString('en-IN')}</td><td>${s.weaverName}</td><td>${new Date(s.datePosted).toLocaleDateString()}</td><td><button class="delete-saree-btn" data-id="${s.id}">Delete</button></td></tr>`).join('');
    renderRegisteredPartiesTable();
    renderAdminOrdersTable();
}

async function handleRegisterParty(e) {
    e.preventDefault();
    const statusEl = document.getElementById('register-party-status');
    statusEl.textContent = 'Registering...';
    statusEl.className = 'form-status-message';
    
    const email = document.getElementById('partyEmail').value;
    const password = document.getElementById('partyPassword').value;

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
        statusEl.textContent = `Auth Error: ${authError.message}`;
        statusEl.classList.add('error');
        return;
    }

    if(authData.user) {
        const { error: dbError } = await supabase.from('parties').insert({
            id: authData.user.id,
            party_name: document.getElementById('partyName').value,
            address: document.getElementById('partyAddress').value,
            gst_number: document.getElementById('partyGst').value,
            email: email
        });

        if (dbError) {
            statusEl.textContent = `Database Error: ${dbError.message}`;
            statusEl.classList.add('error');
        } else {
            statusEl.textContent = 'Party registered successfully!';
            statusEl.classList.add('success');
            e.target.reset();
            renderRegisteredPartiesTable();
        }
    } else {
        statusEl.textContent = 'User could not be created.';
        statusEl.classList.add('error');
    }
}

async function renderRegisteredPartiesTable() {
    const tableBody = document.getElementById('all-parties-table-body');
    if(!tableBody) return;
    const { data, error } = await supabase.from('parties').select('*');
    if (error) { tableBody.innerHTML = `<tr><td colspan="4">Failed to load parties.</td></tr>`; return; }
    
    document.getElementById('total-parties-stat').textContent = data.length;
    if (data.length === 0) { tableBody.innerHTML = `<tr><td colspan="4">No parties registered.</td></tr>`; return; }
    tableBody.innerHTML = data.map(p => `<tr><td>${p.party_name}</td><td>${p.email}</td><td>${p.gst_number}</td><td>${p.address}</td></tr>`).join('');
}

async function renderAdminOrdersTable() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if(!tableBody) return;
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { tableBody.innerHTML = `<tr><td colspan="7">Failed to load orders.</td></tr>`; return; }

    document.getElementById('total-orders-stat').textContent = data.length;
    if (data.length === 0) { tableBody.innerHTML = `<tr><td colspan="7">No orders placed.</td></tr>`; return; }
    
    tableBody.innerHTML = data.map(order => {
        const itemsSummary = order.order_items.map(item => `${item.quantity} x ${item.sareeName} (${item.color})`).join('<br>');
        return `<tr><td>${order.id}</td><td>${order.party_details.party_name}</td><td>${order.party_details.gst_number}</td><td>${order.party_details.address}</td><td>${itemsSummary}</td><td>₹${order.grand_total.toLocaleString('en-IN')}</td><td>${new Date(order.created_at).toLocaleString()}</td></tr>`;
    }).join('');
}

async function exportOrdersToCSV() {
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data) { alert("Could not fetch orders to export."); return; }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "OrderID,Date,PartyName,GST,Address,Items,Total\n"; // Header row

    data.forEach(order => {
        const itemsStr = order.order_items.map(i => `${i.quantity}x ${i.sareeName} (${i.color})`).join('; ');
        const row = [
            order.id,
            new Date(order.created_at).toLocaleString(),
            `"${order.party_details.party_name}"`,
            order.party_details.gst_number,
            `"${order.party_details.address.replace(/\n/g, ' ')}"`,
            `"${itemsStr}"`,
            order.grand_total
        ].join(',');
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "saree_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Orders Page Logic ---
async function initOrdersPage(user) {
    const detailsContainer = document.getElementById('party-details-review');
    const { data, error } = await supabase.from('parties').select('*').eq('id', user.id).single();

    if(error) { detailsContainer.innerHTML = `<p class="error">Could not load your details.</p>`; }
    else { detailsContainer.innerHTML = `<h3>Your details for this order:</h3><p><strong>Name:</strong> ${data.party_name}</p><p><strong>Address:</strong> ${data.address}</p><p><strong>GST No:</strong> ${data.gst_number}</p>`; }
    
    renderOrderTable(user);
}

async function placeOrder(user) {
    const userOrderItems = DB.orders[user.id] || [];
    if (userOrderItems.length === 0) return alert("Your cart is empty.");

    const { data: partyData, error: partyError } = await supabase.from('parties').select('*').eq('id', user.id).single();
    if (partyError) { alert("Could not verify your party details."); return; }
    
    const itemsWithDetails = userOrderItems.map(item => {
        const saree = DB.sarees.find(s => s.id === item.id);
        return { ...item, sareeName: saree.name, unitPrice: saree.price, totalPrice: item.quantity * saree.price }
    });
    const grandTotal = itemsWithDetails.reduce((total, item) => total + item.totalPrice, 0);

    const { error: insertError } = await supabase.from('orders').insert({
        party_id: user.id,
        party_details: partyData,
        order_items: itemsWithDetails,
        grand_total: grandTotal
    });

    if (insertError) { alert(`Error placing order: ${insertError.message}`); }
    else {
        delete DB.orders[user.id];
        localStorage.setItem('userOrders', JSON.stringify(DB.orders));
        document.getElementById('confirmation-modal').style.display = "block";
    }
}

function renderOrderTable(user) {
    const orderItemsBody = document.getElementById('order-items-body');
    const orderTotalSection = document.getElementById('order-total-section');
    const userOrder = DB.orders[user.id] || [];

    if (userOrder.length === 0) {
        document.querySelector('.order-summary-box').innerHTML = `<p class="empty-cart-message">Your order is empty.</p>`;
        return;
    }

    let total = 0;
    orderItemsBody.innerHTML = userOrder.map((item, index) => {
        const saree = DB.sarees.find(s => s.id === item.id);
        if (!saree) return '';
        const itemTotal = saree.price * item.quantity;
        total += itemTotal;
        return `<tr><td>${saree.name}</td><td>${item.color}</td><td><input type="number" value="${item.quantity}" min="1" class="quantity-input" data-index="${index}"></td><td>₹${saree.price.toLocaleString('en-IN')}</td><td>₹${itemTotal.toLocaleString('en-IN')}</td><td><button class="remove-item-btn" data-index="${index}">✖</button></td></tr>`;
    }).join('');

    orderTotalSection.innerHTML = `<p>Grand Total: ₹${total.toLocaleString('en-IN')}</p><button class="btn" id="place-order-btn">Place Order</button>`;
    
    document.querySelectorAll('.quantity-input').forEach(input => input.addEventListener('change', (e) => updateOrderItemQuantity(user, e.target.dataset.index, parseInt(e.target.value))));
    document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', (e) => removeOrderItem(user, e.target.dataset.index)));
    document.getElementById('place-order-btn').addEventListener('click', () => placeOrder(user));

    const modal = document.getElementById('confirmation-modal');
    const closeButtons = document.querySelectorAll('.close-button, #modal-close-btn');
    closeButtons.forEach(btn => btn.onclick = () => { modal.style.display = "none"; window.location.href = 'home.html'; });
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; window.location.href = 'home.html'; } };
}

function updateOrderItemQuantity(user, index, quantity) { if (quantity > 0) { DB.orders[user.id][index].quantity = quantity; localStorage.setItem('userOrders', JSON.stringify(DB.orders)); renderOrderTable(user); } }
function removeOrderItem(user, index) { DB.orders[user.id].splice(index, 1); localStorage.setItem('userOrders', JSON.stringify(DB.orders)); renderOrderTable(user); }

function addToOrder(user, sareeId, color, quantity) {
    if (!user) return;
    const userId = user.id;
    if (!DB.orders[userId]) DB.orders[userId] = [];
    const existingItemIndex = DB.orders[userId].findIndex(item => item.id === sareeId && item.color === color);
    if (existingItemIndex > -1) {
        DB.orders[userId][existingItemIndex].quantity += quantity;
    } else {
        DB.orders[userId].push({ id: sareeId, color, quantity });
    }
    localStorage.setItem('userOrders', JSON.stringify(DB.orders));
}

// --- Product Page Logic ---
function initProductPage(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const sareeId = parseInt(urlParams.get('id'));
    const saree = DB.sarees.find(s => s.id === sareeId);
    if (!saree) { document.getElementById('product-detail-container').innerHTML = `<p>Saree not found.</p>`; return; }

    const container = document.getElementById('product-detail-container');
    container.innerHTML = `
        <div class="product-image-slider">
            <div class="slider-main-image"><img src="${saree.images[0]}" alt="${saree.name}" id="main-saree-image"></div>
            <div class="slider-thumbnails">${saree.images.map((img, index) => `<img src="${img}" alt="Thumbnail ${index+1}" class="${index === 0 ? 'active' : ''}">`).join('')}</div>
        </div>
        <div class="product-details-content">
            <h1>${saree.name}</h1><p class="product-price">₹${saree.price.toLocaleString('en-IN')}</p><p>${saree.description}</p>
            <div class="product-options">
                <div class="form-group"><label for="color-select">Color</label><select id="color-select">${saree.colors.map(color => `<option value="${color}">${color}</option>`).join('')}</select></div>
                <div class="form-group"><label for="quantity-input">Quantity</label><input type="number" id="quantity-input" value="1" min="1"></div>
                <button class="btn" id="add-to-order-btn">Add to Order</button>
            </div>
        </div>`;
    
    document.querySelectorAll('.slider-thumbnails img').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.getElementById('main-saree-image').src = thumb.src;
            document.querySelectorAll('.slider-thumbnails img').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    document.getElementById('add-to-order-btn').addEventListener('click', () => {
        const selectedColor = document.getElementById('color-select').value;
        const quantity = parseInt(document.getElementById('quantity-input').value);
        addToOrder(user, saree.id, selectedColor, quantity);
        alert(`${quantity} x ${saree.name} (${selectedColor}) added to your order!`);
    });

    const relatedGrid = document.getElementById('related-products-grid');
    const relatedSarees = DB.sarees.filter(s => s.category === saree.category && s.id !== saree.id).slice(0, 4);
    relatedGrid.innerHTML = relatedSarees.map(rs => `
        <div class="product-card" onclick="window.location.href='product.html?id=${rs.id}'">
            <div class="product-image-container"><img src="${rs.images[0]}" alt="${rs.name}"></div>
            <div class="product-info"><h3>${rs.name}</h3><p class="product-price">₹${rs.price.toLocaleString('en-IN')}</p></div>
        </div>`).join('');
}

