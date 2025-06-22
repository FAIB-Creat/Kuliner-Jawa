const apiUrl = "https://admin-warung-tempat-makan.vercel.app/api";

document.addEventListener("DOMContentLoaded", async () => {
  await renderMenu("makanan");
  await renderMenu("minuman");

  updateCartIcon();
  renderCart();

  // toggle cart panel
  const cartPanel = document.querySelector("#cart-panel");
  const cartIcon = document.querySelector("#cart");

  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    cartPanel.classList.toggle("hidden");
  });

  // checkout
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
        body: JSON.stringify({ cart: cart.map((c) => c.id) }),
      });

      const data = await response.json();

      window.snap.pay(data.token);

      localStorage.removeItem("cart");
      renderCart();
      updateCartIcon();
    });

  // click outside to close cart
  document.addEventListener("click", (event) => {
    if (cartPanel.classList.contains("hidden")) return;
    if (cartPanel.contains(event.target) || cartIcon.contains(event.target))
      return;
    cartPanel.classList.add("hidden");
  });
});

async function renderMenu(type) {
  try {
    const section = document.querySelector(`#${type}`);
    const list = section.querySelector(".projects-grid");
    const template = document.querySelector("#menu-template");

    const response = await fetch(`${apiUrl}/menu?type=${type}`);
    const data = (await response.json()).data;

    data.forEach((item) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector("img").src = item.image;
      clone.querySelector("img").alt = item.name;
      clone.querySelector(".menu-name").textContent = item.name;
      clone.querySelector(".menu-price").textContent = item.price;

      const button = clone.querySelector("button");
      updateButtonState(button, item.id);

      button.addEventListener("click", () => {
        if (isInCart(item.id)) {
          removeFromCart(item.id);
        } else {
          addToCart({ id: item.id, name: item.name });
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

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

function updateCartIcon() {
  const cartIcon = document.querySelector("#cart");
  const total = getCart().length;
  cartIcon.setAttribute("data-count", total);
}

function updateButtonState(button, itemId) {
  button.textContent = isInCart(itemId) ? "Hapus dari Keranjang" : "Beli";
}

function renderCart() {
  const cart = getCart();
  const list = document.querySelector("#cart-items");
  list.innerHTML = "";

  if (cart.length === 0) {
    list.innerHTML = "<li>Keranjang masih kosong</li>";
  } else {
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name}
        <button onclick="removeFromCart('${item.id}')"><i class='bx bx-x'></i></button>
      `;
      list.appendChild(li);
    });
  }

  updateCartIcon();
  refreshAllButtons();
}

function refreshAllButtons() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const name = card.querySelector(".menu-name").textContent;
    const button = card.querySelector("button");

    // Find item by name (assumes name is unique)
    const cartItem = getCart().find((i) => i.name === name);
    button.textContent = cartItem ? "Hapus dari Keranjang" : "Beli";
  });
}
