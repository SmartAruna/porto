const sampleProducts = [
  { id: 1, name: "Kemeja Linen Senja", category: "Fashion", price: 289000, tag: "BEST SELLER", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=80" },
  { id: 2, name: "Tas Anyam Rona", category: "Aksesori", price: 195000, tag: "HANDMADE", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80" },
  { id: 3, name: "Tumbler Terra", category: "Lifestyle", price: 149000, tag: "NEW ARRIVAL", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80" },
  { id: 4, name: "Sandal Everyday", category: "Fashion", price: 229000, tag: "FAVORIT", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80" },
  { id: 5, name: "Kacamata Solara", category: "Aksesori", price: 175000, tag: "CURATED", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80" },
  { id: 6, name: "Jurnal Hari Ini", category: "Lifestyle", price: 89000, tag: "MADE WITH CARE", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80" },
  { id: 7, name: "Outer Pagi Hari", category: "Fashion", price: 349000, tag: "LIMITED", image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=700&q=80" },
  { id: 8, name: "Gelang Bumi", category: "Aksesori", price: 119000, tag: "HANDMADE", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=80" }
];

const apiBaseUrl = document.querySelector("#naraAppScript").dataset.apiBase.replace(/\/+$/, "");
const productGrid = document.querySelector("#productGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const cartOverlay = document.querySelector("#cartOverlay");
const cartItemsElement = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartSummary = document.querySelector("#cartSummary");
const toast = document.querySelector("#toast");
const authDialog = document.querySelector("#authDialog");
const authForm = document.querySelector("#authForm");
const authError = document.querySelector("#authError");
const authSubmit = document.querySelector("#authSubmit");
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

let products = sampleProducts;
let activeCategory = "Semua";
let cart = [];
let currentUser = null;
let accessToken = null;
let authMode = "login";
let apiProductsLoaded = false;
let cartUsesApi = false;
let toastTimer;

try {
  accessToken = sessionStorage.getItem("naraAccessToken");
} catch (error) {
  console.warn("Session storage is unavailable; login will last until this page is closed.", error);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

async function apiRequest(path, { method = "GET", body, authenticated = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authenticated && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Server terlalu lama merespons. Silakan coba lagi.");
    }
    throw new Error("Tidak dapat menghubungi server. Pastikan API aktif dan alamatnya benar.");
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authenticated && accessToken) expireSession();
    throw new Error(payload?.error?.message || "Permintaan gagal. Silakan coba lagi.");
  }
  return payload;
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const filtered = products.filter((product) => {
    const matchesCategory = activeCategory === "Semua" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category}`.toLocaleLowerCase("id").includes(query);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = filtered.map((product) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        <span class="product-tag">${escapeHtml(product.tag)}</span>
        <button class="favorite-button" data-favorite="${escapeHtml(product.id)}" aria-label="Tambahkan ${escapeHtml(product.name)} ke favorit" aria-pressed="false">♡</button>
        <button class="add-button" data-add="${escapeHtml(product.id)}">+ Tambahkan ke keranjang</button>
      </div>
      <div class="product-info">
        <div><p class="product-name">${escapeHtml(product.name)}</p><p class="product-category">${escapeHtml(product.category)}</p></div>
        <p class="product-price">${rupiah.format(product.price)}</p>
      </div>
    </article>
  `).join("");
  emptyState.hidden = filtered.length !== 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#cartCount").textContent = itemCount;
  document.querySelector("#drawerCount").textContent = `(${itemCount})`;
  cartEmpty.hidden = cart.length > 0;
  cartSummary.hidden = cart.length === 0;
  cartItemsElement.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="">
      <div class="cart-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${rupiah.format(item.price)}</span>
        <div class="quantity-control">
          <button data-quantity="${escapeHtml(item.id)}" data-change="-1" aria-label="Kurangi ${escapeHtml(item.name)}">−</button>
          <span>${item.quantity}</span>
          <button data-quantity="${escapeHtml(item.id)}" data-change="1" aria-label="Tambah ${escapeHtml(item.name)}">+</button>
        </div>
      </div>
      <span class="cart-item-price">${rupiah.format(item.price * item.quantity)}</span>
    </div>
  `).join("");
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  document.querySelector("#cartSubtotal").textContent = rupiah.format(subtotal);
}

function normalizeProduct(product) {
  const image = new URL(product.imageUrl);
  if (image.protocol !== "https:" && image.protocol !== "http:") {
    throw new Error("URL gambar produk dari API tidak valid.");
  }
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    tag: product.tag,
    image: image.href,
    stock: product.stock
  };
}

async function loadProducts() {
  try {
    const response = await apiRequest("/products?limit=50", { authenticated: false });
    if (!Array.isArray(response?.data)) throw new Error("Respons katalog tidak valid.");
    products = response.data.map(normalizeProduct);
    apiProductsLoaded = true;
    renderProducts();
    if (currentUser) await syncGuestCart();
  } catch (error) {
    apiProductsLoaded = false;
    console.warn("Using sample products because the API catalog is unavailable:", error.message);
    products = sampleProducts;
    renderProducts();
  }
}

async function loadRemoteCart() {
  const response = await apiRequest("/cart");
  if (!Array.isArray(response?.data)) throw new Error("Respons keranjang tidak valid.");
  cart = response.data.map((item) => ({
    id: item.productId,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    image: item.imageUrl,
    quantity: item.quantity
  }));
  cartUsesApi = true;
  renderCart();
}

async function syncGuestCart() {
  if (!currentUser || !apiProductsLoaded) return;
  const guestCart = cart.filter((item) => products.some((product) => String(product.id) === String(item.id)));
  try {
    for (const item of guestCart) {
      await apiRequest(`/cart/items/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        body: { quantity: item.quantity }
      });
    }
    await loadRemoteCart();
  } catch (error) {
    showToast(error.message);
  }
}

async function addToCart(productId) {
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) return;

  if (currentUser && apiProductsLoaded) {
    const existing = cart.find((item) => String(item.id) === String(productId));
    try {
      await apiRequest(`/cart/items/${encodeURIComponent(productId)}`, {
        method: "PUT",
        body: { quantity: (existing?.quantity ?? 0) + 1 }
      });
      await loadRemoteCart();
      showToast(`${product.name} ditambahkan ke keranjang`);
    } catch (error) {
      showToast(error.message);
    }
    return;
  }

  const item = cart.find((entry) => String(entry.id) === String(productId));
  if (item) item.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast(`${product.name} ditambahkan ke keranjang`);
}

function setCartOpen(isOpen) {
  if (!isOpen) document.querySelector("#cartButton").focus();
  cartOverlay.classList.toggle("open", isOpen);
  cartOverlay.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("cart-open", isOpen);
  if (isOpen) document.querySelector("#closeCart").focus();
}

function updateAccountButton() {
  const button = document.querySelector("#accountButton");
  button.textContent = currentUser ? currentUser.name : "Masuk";
  button.title = currentUser ? `Akun ${currentUser.name}` : "Masuk atau daftar";
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  document.querySelector("#nameField").hidden = !isRegister;
  document.querySelector("#authName").required = isRegister;
  document.querySelector("#authPassword").autocomplete = isRegister ? "new-password" : "current-password";
  document.querySelector("#authTitle").textContent = isRegister ? "Mulai cerita barumu." : "Senang bertemu lagi.";
  document.querySelector("#authDescription").textContent = isRegister
    ? "Buat akun untuk menyimpan keranjang dan menikmati belanja lebih mudah."
    : "Masuk untuk melihat keranjang dan melanjutkan belanja.";
  authSubmit.innerHTML = `${isRegister ? "Daftar" : "Masuk"} <span>↗</span>`;
  document.querySelector("#authSwitch").textContent = isRegister
    ? "Sudah punya akun? Masuk"
    : "Belum punya akun? Daftar";
  authError.hidden = true;
  authError.textContent = "";
}

function openAuthDialog() {
  document.querySelector("#authFormPanel").hidden = Boolean(currentUser);
  document.querySelector("#authUserPanel").hidden = !currentUser;
  if (currentUser) {
    document.querySelector("#authGreeting").textContent = `Halo, ${currentUser.name}.`;
    document.querySelector("#authUserEmail").textContent = currentUser.email;
  } else {
    setAuthMode("login");
  }
  authDialog.showModal();
}

function expireSession() {
  accessToken = null;
  currentUser = null;
  cartUsesApi = false;
  try {
    sessionStorage.removeItem("naraAccessToken");
  } catch (error) {
    console.warn("Could not clear the stored login session:", error);
  }
  updateAccountButton();
}

async function restoreSession() {
  if (!accessToken) return;
  try {
    const response = await apiRequest("/auth/me");
    currentUser = response.data.user;
    updateAccountButton();
    await syncGuestCart();
  } catch (error) {
    if (accessToken) console.warn("Could not restore the login session:", error.message);
  }
}

document.querySelector(".category-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".category-button").forEach((item) => item.classList.toggle("selected", item === button));
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");
  if (addButton) void addToCart(addButton.dataset.add);
  if (favoriteButton) {
    const isFavorite = favoriteButton.classList.toggle("is-favorite");
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.textContent = isFavorite ? "♥" : "♡";
    showToast(isFavorite ? "Ditambahkan ke daftar favorit" : "Dihapus dari daftar favorit");
  }
});

cartItemsElement.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const item = cart.find((entry) => String(entry.id) === button.dataset.quantity);
  if (!item) return;
  const quantity = item.quantity + Number(button.dataset.change);

  if (cartUsesApi && currentUser) {
    try {
      if (quantity <= 0) {
        await apiRequest(`/cart/items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      } else {
        await apiRequest(`/cart/items/${encodeURIComponent(item.id)}`, {
          method: "PUT",
          body: { quantity }
        });
      }
      await loadRemoteCart();
    } catch (error) {
      showToast(error.message);
    }
    return;
  }

  item.quantity = quantity;
  if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== item.id);
  renderCart();
});

document.querySelector("#cartButton").addEventListener("click", () => setCartOpen(true));
document.querySelector("#closeCart").addEventListener("click", () => setCartOpen(false));
document.querySelector("#closeCartBackdrop").addEventListener("click", () => setCartOpen(false));
document.querySelector("#continueShopping").addEventListener("click", () => setCartOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setCartOpen(false);
});

document.querySelector(".search-toggle").addEventListener("click", () => {
  document.querySelector("#produk").scrollIntoView({ behavior: "smooth" });
  window.setTimeout(() => searchInput.focus(), 350);
});

document.querySelector("#mobileMenu").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("open");
  button.setAttribute("aria-expanded", String(isOpen));
});

document.querySelector(".main-nav").addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  document.querySelector(".main-nav").classList.remove("open");
  document.querySelector("#mobileMenu").setAttribute("aria-expanded", "false");
});

document.querySelector("#accountButton").addEventListener("click", openAuthDialog);
document.querySelector("#closeAuth").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === authDialog) authDialog.close();
});
document.querySelector("#authSwitch").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});
document.querySelector("#logoutButton").addEventListener("click", () => {
  expireSession();
  authDialog.close();
  showToast("Kamu sudah keluar dari akun.");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.hidden = true;
  authSubmit.disabled = true;
  authSubmit.textContent = authMode === "register" ? "Membuat akun..." : "Memeriksa akun...";

  const payload = {
    email: document.querySelector("#authEmail").value.trim(),
    password: document.querySelector("#authPassword").value
  };
  if (authMode === "register") payload.name = document.querySelector("#authName").value.trim();

  try {
    const response = await apiRequest(`/auth/${authMode === "register" ? "register" : "login"}`, {
      method: "POST",
      body: payload,
      authenticated: false
    });
    accessToken = response.data.accessToken;
    currentUser = response.data.user;
    try {
      sessionStorage.setItem("naraAccessToken", accessToken);
    } catch (error) {
      console.warn("Login will last until this page is closed because session storage is unavailable.", error);
    }
    updateAccountButton();
    authDialog.close();
    await syncGuestCart();
    showToast(`Selamat datang, ${currentUser.name}!`);
  } catch (error) {
    authError.textContent = error.message;
    authError.hidden = false;
  } finally {
    authSubmit.disabled = false;
    authSubmit.innerHTML = `${authMode === "register" ? "Daftar" : "Masuk"} <span>↗</span>`;
  }
});

document.querySelector("#checkoutButton").addEventListener("click", () => {
  showToast("Terima kasih! Fitur checkout akan segera hadir.");
});

renderProducts();
renderCart();
updateAccountButton();
void loadProducts().then(restoreSession);
