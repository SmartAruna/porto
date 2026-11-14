const products = [
  { id: 1, name: "Kemeja Linen Senja", category: "Fashion", price: 289000, tag: "BEST SELLER", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=80" },
  { id: 2, name: "Tas Anyam Rona", category: "Aksesori", price: 195000, tag: "HANDMADE", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80" },
  { id: 3, name: "Tumbler Terra", category: "Lifestyle", price: 149000, tag: "NEW ARRIVAL", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80" },
  { id: 4, name: "Sandal Everyday", category: "Fashion", price: 229000, tag: "FAVORIT", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80" },
  { id: 5, name: "Kacamata Solara", category: "Aksesori", price: 175000, tag: "CURATED", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80" },
  { id: 6, name: "Jurnal Hari Ini", category: "Lifestyle", price: 89000, tag: "MADE WITH CARE", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80" },
  { id: 7, name: "Outer Pagi Hari", category: "Fashion", price: 349000, tag: "LIMITED", image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=700&q=80" },
  { id: 8, name: "Gelang Bumi", category: "Aksesori", price: 119000, tag: "HANDMADE", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=80" }
];

const productGrid = document.querySelector("#productGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const cartOverlay = document.querySelector("#cartOverlay");
const cartItemsElement = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartSummary = document.querySelector("#cartSummary");
const toast = document.querySelector("#toast");
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

let activeCategory = "Semua";
let cart = [];
let toastTimer;

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
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-tag">${product.tag}</span>
        <button class="favorite-button" data-favorite="${product.id}" aria-label="Tambahkan ${product.name} ke favorit" aria-pressed="false">♡</button>
        <button class="add-button" data-add="${product.id}">+ Tambahkan ke keranjang</button>
      </div>
      <div class="product-info">
        <div><p class="product-name">${product.name}</p><p class="product-category">${product.category}</p></div>
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
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const item = cart.find((entry) => entry.id === productId);
  if (item) item.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast(`${product.name} ditambahkan ke keranjang`);
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#cartCount").textContent = itemCount;
  document.querySelector("#drawerCount").textContent = `(${itemCount})`;
  cartEmpty.hidden = cart.length > 0;
  cartSummary.hidden = cart.length === 0;
  cartItemsElement.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${rupiah.format(item.price)}</span>
        <div class="quantity-control">
          <button data-quantity="${item.id}" data-change="-1" aria-label="Kurangi ${item.name}">−</button>
          <span>${item.quantity}</span>
          <button data-quantity="${item.id}" data-change="1" aria-label="Tambah ${item.name}">+</button>
        </div>
      </div>
      <span class="cart-item-price">${rupiah.format(item.price * item.quantity)}</span>
    </div>
  `).join("");
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  document.querySelector("#cartSubtotal").textContent = rupiah.format(subtotal);
}

function setCartOpen(isOpen) {
  cartOverlay.classList.toggle("open", isOpen);
  cartOverlay.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("cart-open", isOpen);
  if (isOpen) document.querySelector("#closeCart").focus();
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
  if (addButton) addToCart(Number(addButton.dataset.add));
  if (favoriteButton) {
    const isFavorite = favoriteButton.classList.toggle("is-favorite");
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.textContent = isFavorite ? "♥" : "♡";
    showToast(isFavorite ? "Ditambahkan ke daftar favorit" : "Dihapus dari daftar favorit");
  }
});

cartItemsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const item = cart.find((entry) => entry.id === Number(button.dataset.quantity));
  if (!item) return;
  item.quantity += Number(button.dataset.change);
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

document.querySelector("#checkoutButton").addEventListener("click", () => {
  showToast("Terima kasih! Fitur checkout akan segera hadir.");
});

renderProducts();
renderCart();
