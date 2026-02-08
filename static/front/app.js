const API_BASE = "http://127.0.0.1:8000/api/links/";
const TOKEN_URL = "http://127.0.0.1:8000/api/token/";

let accessToken = localStorage.getItem("accessToken") || null;

let allLinks = [];
let sortKey = null;
let sortDir = "asc"; // asc | desc
let currentPage = 1;

function applyTheme(enabled) {
  document.body.classList.toggle("dark", enabled);
  document.body.setAttribute("data-bs-theme", enabled ? "dark" : "light");
}

function normalize(str) {
  return (str ?? "").toString().toLowerCase().trim();
}

function compareValues(a, b) {
  const aa = normalize(a);
  const bb = normalize(b);
  if (aa < bb) return -1;
  if (aa > bb) return 1;
  return 0;
}

function getPageSize() {
  const sel = document.getElementById("pageSizeSelect");
  const v = sel ? sel.value : "10";
  if (v === "all") return Infinity;
  const n = Number(v);
  return Number.isFinite(n) ? n : 10;
}

function setLegend(totalItems, pageSize) {
  const legend = document.getElementById("pageLegend");
  if (!legend) return;

  if (totalItems <= 0) {
    legend.textContent = "0 de 0";
    return;
  }

  if (pageSize === Infinity) {
    legend.textContent = "1 de 1";
    // botones
    const bA = document.getElementById("btnAtras");
    const bS = document.getElementById("btnSiguiente");
    if (bA) bA.disabled = true;
    if (bS) bS.disabled = true;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  legend.textContent = `${currentPage} de ${totalPages}`;

  const bA = document.getElementById("btnAtras");
  const bS = document.getElementById("btnSiguiente");
  if (bA) bA.disabled = (currentPage <= 1);
  if (bS) bS.disabled = (currentPage >= totalPages);
}

function updateSortIndicators() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    const key = th.dataset.key;
    const icon = th.querySelector(".sort-indicator i");
    if (!icon) return;

    icon.className = "bi bi-arrow-down-up";

    if (key === sortKey) {
      icon.className = sortDir === "asc" ? "bi bi-arrow-up" : "bi bi-arrow-down";
    }
  });
}

function getFilteredSortedLinks() {
  const searchInput = document.getElementById("searchInput");
  const q = normalize(searchInput ? searchInput.value : "");

  let list = allLinks.filter((l) => {
    if (!q) return true;
    const hay = [l.titulo, l.tecnologia, l.seniority, l.autor, l.observacion, l.link]
      .map(normalize)
      .join(" ");
    return hay.includes(q);
  });

  if (sortKey) {
    list = list.slice().sort((x, y) => {
      const c = compareValues(x[sortKey], y[sortKey]);
      return sortDir === "asc" ? c : -c;
    });
  }

  return list;
}

function renderTable() {
  const tbody = document.getElementById("linksTbody");
  if (!tbody) return;

  const pageSize = getPageSize();
  const list = getFilteredSortedLinks();

  // Si cambia el tamaño o búsqueda, asegurate de no quedar fuera de rango
  if (pageSize !== Infinity) {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
  } else {
    currentPage = 1;
  }

  const start = (pageSize === Infinity) ? 0 : (currentPage - 1) * pageSize;
  const end = (pageSize === Infinity) ? list.length : start + pageSize;
  const visible = list.slice(start, end);

  tbody.innerHTML = "";

  if (visible.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">Sin resultados</td></tr>`;
    setLegend(0, pageSize);
    updateSortIndicators();
    return;
  }

  for (const l of visible) {
    const tr = document.createElement("tr");
    const obs = l.observacion ?? "";
    const url = l.link ?? "";

    tr.innerHTML = `
      <td>${l.titulo ?? ""}</td>
      <td>${l.tecnologia ?? ""}</td>
      <td>${l.seniority ?? ""}</td>
      <td>${l.autor ?? ""}</td>
      <td class="text-truncate" style="max-width:260px;" title="${String(obs).replaceAll('"', "&quot;")}">${obs}</td>
      <td>${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Abrir</a>` : ""}</td>
    `;

    tbody.appendChild(tr);
  }

  setLegend(list.length, pageSize);
  updateSortIndicators();
}

async function loadLinks() {
  const tbody = document.getElementById("linksTbody");
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger">No se pudo cargar</td></tr>`;
      }
      setLegend(0, getPageSize());
      return;
    }

    const data = await res.json();
    allLinks = Array.isArray(data) ? data : (data.results ?? []);
    renderTable();
  } catch (e) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Error de red / CORS</td></tr>`;
    }
    setLegend(0, getPageSize());
  }
}

/**
 * LOGIN: se obtiene token con username/password. NO lleva Authorization.
 * Uso: await login("user","pass") desde consola o luego con un form.
 */
async function login(username, password) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "Login falló");
  }

  accessToken = data.access;
  localStorage.setItem("accessToken", accessToken);
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[DocsDevs] app.js cargado");

  // ===== Theme toggle =====
  const toggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("darkMode") === "1";
  if (toggle) {
    toggle.checked = savedTheme;
    applyTheme(savedTheme);

    toggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      applyTheme(enabled);
      localStorage.setItem("darkMode", enabled ? "1" : "0");
    });
  } else {
    applyTheme(savedTheme);
  }

  // ===== Buscar / Mostrar: reset a página 1 =====
  const btnBuscar = document.getElementById("btnBuscar");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", () => {
      currentPage = 1;
      renderTable();
    });
  }

  const pageSizeSelect = document.getElementById("pageSizeSelect");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      currentPage = 1;
      renderTable();
    });
  }

  // ===== Sort =====
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;

      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = "asc";
      }

      currentPage = 1;
      renderTable();
    });
  });

  // ===== Paginación real =====
  const btnAtras = document.getElementById("btnAtras");
  const btnSiguiente = document.getElementById("btnSiguiente");

  if (btnAtras) {
    btnAtras.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener("click", () => {
      const pageSize = getPageSize();
      const total = getFilteredSortedLinks().length;
      const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(total / pageSize));

      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });
  }

  // ===== Modal Nuevo + POST con token =====
  const btnNuevo = document.getElementById("btnNuevo");
  const btnGuardarLink = document.getElementById("btnGuardarLink");
  const formNuevoLink = document.getElementById("formNuevoLink");
  const formError = document.getElementById("formError");
  const formOk = document.getElementById("formOk");

  let modalNuevoLink = null;

  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => {
      if (formError) formError.classList.add("d-none");
      if (formOk) formOk.classList.add("d-none");
      if (formNuevoLink) formNuevoLink.reset();

      const modalEl = document.getElementById("modalNuevoLink");
      if (modalEl) {
        modalNuevoLink = new bootstrap.Modal(modalEl);
        modalNuevoLink.show();
      }
    });
  }

  if (btnGuardarLink) {
    btnGuardarLink.addEventListener("click", async () => {
      if (formError) formError.classList.add("d-none");
      if (formOk) formOk.classList.add("d-none");

      if (!formNuevoLink) return;

      if (!accessToken) {
        if (formError) {
          formError.textContent = "Tenés que hacer login (token) para guardar.";
          formError.classList.remove("d-none");
        }
        return;
      }

      const fd = new FormData(formNuevoLink);
      const payload = {
        titulo: fd.get("titulo"),
        tecnologia: fd.get("tecnologia"),
        seniority: fd.get("seniority"),
        autor: fd.get("autor"),
        link: fd.get("link"),
        observacion: fd.get("observacion") || "",
        status: Number(fd.get("status") || 1),
      };

      try {
        const res = await fetch("http://127.0.0.1:8000/api/links/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (formError) {
            formError.textContent = data?.detail || data?.error || "No se pudo guardar";
            formError.classList.remove("d-none");
          }
          return;
        }

        if (formOk) {
          formOk.textContent = "Guardado OK";
          formOk.classList.remove("d-none");
        }

        await loadLinks();
        modalNuevoLink?.hide();
      } catch (e) {
        if (formError) {
          formError.textContent = "Error de red / CORS";
          formError.classList.remove("d-none");
        }
      }
    });
  }

  // ===== Cargar datos =====
  loadLinks();
});
