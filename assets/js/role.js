export function requireAdmin() {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    window.location.href = "index.html";
  }
}

export function showAdminUI() {
  const role = localStorage.getItem("role");
  if (role === "admin") {
    document.querySelectorAll(".admin-only")
      .forEach(el => el.classList.remove("hidden"));
  }
}
