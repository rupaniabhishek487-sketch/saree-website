/* --- Global Styles & Variables --- */
:root {
    --primary-color: #333;
    --secondary-color: #7a7a7a;
    --accent-color: #c5a47e; /* Gold accent */
    --background-color: #fdfdfd;
    --card-background: #ffffff;
    --border-color: #eaeaea;
    --font-primary: 'Poppins', sans-serif;
    --font-secondary: 'Montserrat', sans-serif;
    --shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    --shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
}

body {
    font-family: var(--font-secondary);
    background-color: var(--background-color);
    color: var(--primary-color);
    margin: 0;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* --- Animations --- */
.fade-in {
    animation: fadeInAnimation 0.8s ease-in-out;
}
@keyframes fadeInAnimation {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* --- Buttons --- */
.btn {
    display: inline-block;
    background-color: var(--accent-color);
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: var(--border-radius);
    font-family: var(--font-primary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
}
.btn:hover {
    background-color: #b38f67;
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
}

/* --- Header & Navigation --- */
.sticky-nav {
    position: sticky;
    top: 0;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
}
.logo {
    font-family: var(--font-primary);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-color);
    text-decoration: none;
}
.nav-links {
    list-style: none;
    display: flex;
    margin: 0;
    padding: 0;
}
.nav-links li {
    margin-left: 30px;
}
.nav-links a {
    text-decoration: none;
    color: var(--secondary-color);
    font-weight: 500;
    padding: 5px 0;
    position: relative;
    transition: color 0.3s ease;
}
.nav-links a:hover, .nav-links a.active {
    color: var(--primary-color);
}
.nav-links a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--accent-color);
    transition: width 0.3s ease;
}
.nav-links a:hover::after, .nav-links a.active::after {
    width: 100%;
}

/* --- Banner Section --- */
.banner {
    padding: 80px 0;
    text-align: center;
    background: #f4f0ec; /* Fallback */
}
.banner h1 {
    font-family: var(--font-primary);
    font-size: 3rem;
    margin-bottom: 15px;
}
.banner p {
    font-size: 1.1rem;
    color: var(--secondary-color);
    max-width: 600px;
    margin: 0 auto;
}

/* --- Categories Section --- */
.categories-section {
    padding: 60px 0;
    text-align: center;
}
.categories-section h2, .product-section h2 {
    font-family: var(--font-primary);
    font-size: 2.2rem;
    margin-bottom: 40px;
}
.category-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}
.category-link {
    background-color: var(--card-background);
    padding: 15px 30px;
    border-radius: 50px;
    text-decoration: none;
    color: var(--primary-color);
    font-weight: 500;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
}
.category-link:hover {
    background-color: var(--accent-color);
    color: white;
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
}

/* --- Product Grid --- */
.product-section {
    padding: 60px 0;
}
.filter-sort-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 20px;
}
.search-bar-container {
    position: relative;
    flex-grow: 1;
    max-width: 400px;
}
.search-bar-container i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--secondary-color);
}
#search-bar {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: var(--font-secondary);
    font-size: 1rem;
}
.sort-container {
    display: flex;
    align-items: center;
    gap: 10px;
}
#sort-options {
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: white;
}
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
}
.product-card {
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    cursor: pointer;
}
.product-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-hover);
}
.product-image-container {
    overflow: hidden;
}
.product-card img {
    width: 100%;
    height: auto;
    display: block;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    transition: transform 0.4s ease;
}
.product-card:hover img {
    transform: scale(1.05);
}
.product-info {
    padding: 20px;
}
.product-info h3 {
    margin: 0 0 10px 0;
    font-family: var(--font-primary);
    font-size: 1.2rem;
}
.product-info p {
    margin: 0 0 15px 0;
    font-size: 0.9rem;
    color: var(--secondary-color);
}
.product-price {
    font-weight: 600;
    font-size: 1.2rem;
    color: var(--accent-color);
}

/* --- Footer --- */
footer {
    background-color: #f4f4f4;
    text-align: center;
    padding: 20px 0;
    margin-top: 60px;
    font-size: 0.9rem;
    color: var(--secondary-color);
}

/* --- Scroll to Top Button --- */
#scrollToTopBtn {
    display: none;
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1001;
    border: none;
    outline: none;
    background-color: var(--accent-color);
    color: white;
    cursor: pointer;
    padding: 10px;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 24px;
    box-shadow: var(--shadow-hover);
    transition: background-color 0.3s ease;
}
#scrollToTopBtn:hover {
    background-color: #b38f67;
}

/* --- Login Page --- */
.login-body {
    background-color: #f4f0ec;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
.login-container {
    width: 100%;
    max-width: 400px;
}
.login-box {
    background-color: white;
    padding: 40px;
    border-radius: var(--border-radius);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    text-align: center;
}
.login-title {
    font-family: var(--font-primary);
    font-size: 2rem;
    margin: 0 0 10px 0;
}
.login-subtitle {
    color: var(--secondary-color);
    margin-bottom: 30px;
}
.input-group {
    margin-bottom: 20px;
    text-align: left;
}
.input-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}
.input-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    box-sizing: border-box;
}
.btn-login {
    width: 100%;
    padding: 14px;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}
.btn-login:hover {
    background-color: #b38f67;
}
.login-error-message {
    color: #d9534f;
    margin-top: 15px;
    font-size: 0.9rem;
    height: 1.2em; /* Reserve space */
}

/* --- Responsive Design --- */
@media (max-width: 768px) {
    .nav-links {
        display: none; /* Simple hide for mobile, can be replaced with a hamburger menu */
    }
    .banner h1 {
        font-size: 2.2rem;
    }
    .filter-sort-controls {
        flex-direction: column;
        align-items: stretch;
    }
    .search-bar-container {
        max-width: none;
    }
}
