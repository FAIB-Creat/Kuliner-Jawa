const apiUrl = "https://admin-warung-tempat-makan.vercel.app/api";

document.addEventListener("DOMContentLoaded", async () => {
  await renderMenu("makanan");
  await renderMenu("minuman");

  updateCartIcon();
  renderCart();

  // Toggle cart panel
  const cartPanel = document.querySelector("#cart-panel");
  const cartIcon = document.querySelector("#cart");

  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    cartPanel.classList.toggle("cart__panel--hidden");
  });

  // Checkout
  document
    .querySelector("#checkout-btn")
    .addEventListener("click", async () => {
      const cart = getCart();
      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      const response = await fetch(`${apiUrl}/payment`, {
        method: "POST",
        body: JSON.stringify({
          cart: cart.map((c) => ({ id: c.id, quantity: c.quantity })),
        }),
      });

      const data = await response.json();

      window.snap.pay(data.token);

      localStorage.removeItem("cart");
      renderCart();
      updateCartIcon();
    });

  // Click outside to close cart
  document.addEventListener("click", (event) => {
    if (cartPanel.classList.contains("cart__panel--hidden")) return;
    if (cartPanel.contains(event.target) || cartIcon.contains(event.target)) {
      return;
    }
    cartPanel.classList.add("cart__panel--hidden");
  });
});

async function renderMenu(type) {
  try {
    const section = document.querySelector(`#${type}`);
    const list = section.querySelector(".menu__grid");
    const template = document.querySelector("#menu-template");

    const response = await fetch(`${apiUrl}/menu?type=${type}`);
    const data = (await response.json()).data;

    data.forEach((item) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".menu__image").src = item.image;
      clone.querySelector(".menu__image").alt = item.name;
      clone.querySelector(".menu__name").textContent = item.name;

      let price = item.price;
      let formattedPrice = "Rp" + price.toLocaleString("id-ID");
      clone.querySelector(".menu__price").textContent = formattedPrice;

      const button = clone.querySelector(".menu__button");
      updateButtonState(button, item.id);

      button.addEventListener("click", () => {
        if (isInCart(item.id)) {
          removeFromCart(item.id);
        } else {
          addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          });
        }
        renderCart();
      });

      list.appendChild(clone);
    });
  } catch (error) {
    console.error(`Gagal ambil data ${type}:`, error);
  }
}

// === Cart ===
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartIcon();
}

function clearCart() {
  localStorage.removeItem("cart");
  updateCartIcon();
}

function isInCart(id) {
  return getCart().some((item) => item.id === id);
}

function addToCart(item) {
  const cart = getCart();
  if (!isInCart(item.id)) {
    cart.push(item);
    saveCart(cart);
  }
}

function updateQuantity(id, change) {
  const cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === id);
  if (itemIndex !== -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart(cart);
  }
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

function updateCartIcon() {
  const cartIcon = document.querySelector(".cart__button");
  const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
  cartIcon.setAttribute("data-count", total);
}

function updateButtonState(button, itemId) {
  button.textContent = isInCart(itemId) ? "Hapus dari Keranjang" : "Beli";
}

function renderCart() {
  const cart = getCart();
  const list = document.querySelector(".cart__list");
  list.innerHTML = "";

  if (cart.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Keranjang masih kosong";
    emptyItem.className = "cart__item cart__item--empty";
    list.appendChild(emptyItem);
  } else {
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart__item";

      // Create item info
      const itemInfo = document.createElement("div");
      itemInfo.className = "cart__item-info";
      itemInfo.innerHTML = `
        <span class="cart__item-name">${item.name}</span>
        <span class="cart__item-price">Rp${(
          item.price * item.quantity
        ).toLocaleString("id-ID")}</span>
      `;

      // Create controls
      const controls = document.createElement("div");
      controls.className = "cart__item-controls";

      // Decrease quantity button
      const decreaseBtn = document.createElement("button");
      decreaseBtn.className = "cart__quantity-btn";
      decreaseBtn.textContent = "-";
      decreaseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        updateQuantity(item.id, -1);
      });

      // Quantity display
      const quantitySpan = document.createElement("span");
      quantitySpan.className = "cart__quantity";
      quantitySpan.textContent = item.quantity;

      // Increase quantity button
      const increaseBtn = document.createElement("button");
      increaseBtn.className = "cart__quantity-btn";
      increaseBtn.textContent = "+";
      increaseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        updateQuantity(item.id, 1);
      });

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "cart__remove-button";
      removeBtn.innerHTML = "<i class='bx bx-x'></i>";
      removeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        removeFromCart(item.id);
      });

      // Append controls
      controls.appendChild(decreaseBtn);
      controls.appendChild(quantitySpan);
      controls.appendChild(increaseBtn);
      controls.appendChild(removeBtn);

      // Append to list item
      li.appendChild(itemInfo);
      li.appendChild(controls);
      list.appendChild(li);
    });
  }

  // Update total price
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalElement = document.querySelector(".cart__total-info");
  if (totalElement) {
    totalElement.textContent = `Total: Rp${totalPrice.toLocaleString("id-ID")}`;
  }

  updateCartIcon();
  refreshAllButtons();
}

function refreshAllButtons() {
  document.querySelectorAll(".menu__card").forEach((card) => {
    const name = card.querySelector(".menu__name").textContent;
    const button = card.querySelector(".menu__button");

    // Find item by name (assumes name is unique)
    const cartItem = getCart().find((i) => i.name === name);
    button.textContent = cartItem ? "Hapus dari Keranjang" : "Beli";
  });
}

// Navigation Menu Toggle Functionality
const navigationMenu = document.querySelector(".navigation__menu");
const menuToggle = document.querySelector("#menu");

// Toggle menu when menu button is clicked
menuToggle.onclick = () => {
  navigationMenu.classList.toggle("navigation__menu--active");
};

// Click outside sidebar to close menu
document.addEventListener("click", function (e) {
  if (!menuToggle.contains(e.target) && !navigationMenu.contains(e.target)) {
    navigationMenu.classList.remove("navigation__menu--active");
  }
});
