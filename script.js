// Toogle class active
const NavNavbar = document.querySelector(".navbar");

// ketika menu di klik
document.querySelector("#menu").onclick = () => {
  NavNavbar.classList.toggle("active");
};

// klik di luar sidebar untuk menghilangkan menu
const Menu = document.querySelector("#menu");

document.addEventListener("click", function (e) {
  if (!Menu.contains(e.target) && !NavNavbar.contains(e.target)) {
    NavNavbar.classList.remove("active");
  }
});
