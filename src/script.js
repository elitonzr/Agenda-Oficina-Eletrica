// script.js atualizado com suporte ao filtro por tipo e melhorias visuais

const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const themeToggle = document.getElementById("themeToggle");
const tipoSelect = document.getElementById("tipoFiltro");

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

let currentDate = new Date();
let allEvents = [];

// === TEMA ===
function applyTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  themeToggle.textContent = theme === "dark" ? "🌙" : "🌞";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
});

(function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  applyTheme(saved);
})();

// === NAVEGAÇÃO ===
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderAll();
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderAll();
});

if (tipoSelect) {
  tipoSelect.addEventListener("change", renderAll);
}

const csvUrls = [
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBpKp63xdD921Hs2xheVfVa1vhhbVya6RFC8IaC0mCli_kia3dHY1QQqpOwiy4f4Hznv4YkilhyYY/pub?gid=0&single=true&output=csv", // arquivo online
  // "./csv/Feriados - Fixo.csv", // arquivo local
  // "./csv/Comemorativas - Fixo.csv", // arquivo local
];

const fallbackCsv = "./csv/Agenda.csv"; // Terceiro arquivo, só se o google sheets falhar.

async function fetchEvents() {
  const allEvents = [];

  for (let i = 0; i < csvUrls.length; i++) {
    const url = csvUrls[i];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao acessar ${url}`);
      const text = await res.text();
      const events = parseCSV(text);
      allEvents.push(...events);
      console.log(`✔ CSV carregado: ${url}`);
    } catch (error) {
      console.warn(`⚠ Falha ao carregar ${url}:`, error.message);

      // Se for o primeiro arquivo e falhar, tenta o fallback
      if (i === 0) {
        try {
          const fallbackRes = await fetch(fallbackCsv);
          if (!fallbackRes.ok)
            throw new Error(`Erro ao acessar ${fallbackCsv}`);
          const fallbackText = await fallbackRes.text();
          const fallbackEvents = parseCSV(fallbackText);
          allEvents.push(...fallbackEvents);
          console.log(`✔ CSV de emergência carregado: ${fallbackCsv}`);
        } catch (fallbackError) {
          console.error(
            `❌ Falha ao carregar CSV de emergência:`,
            fallbackError.message
          );
        }
      }
    }
  }
  console.log(`⚡@elitonz`);
  return allEvents;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const currentYear = new Date().getFullYear();
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const ev = {};
    headers.forEach((h, i) => (ev[h] = values[i]?.trim()));

    // Se for a coluna 'data' e o tipo for 'Feriado', atualiza o ano
    // if (
    //   ev.tipo?.toLowerCase() === "feriado" &&
    //   ev.data?.match(/^\d{2}\/\d{2}\/\d{4}$/)
    // ) {
    //   const [day, month] = ev.data.split("/");
    //   ev.data = `${day}/${month}/${currentYear}`;
    //   // console.log(ev);
    // }

    return ev;
  });
}

// === ATUALIZAR CALENDÁRIO ===
function renderAll() {
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  monthTitle.textContent = `${month[0].toUpperCase() + month.slice(1)} ${year}`;

  const tipo = tipoSelect?.value || "";
  const filtered =
    tipo && tipo !== ""
      ? allEvents.filter((ev) => ev.tipo === tipo)
      : allEvents;
  renderCalendar(filtered);
}

function renderCalendar(events) {
  calendar.innerHTML = "";

  const y = currentDate.getFullYear(),
    m = currentDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const lastDay = new Date(y, m, totalDays).getDay();

  // Cabeçalho com dias da semana
  const header = document.createElement("div");
  header.className = "calendar-header";
  const fimDeSemana = ["Sáb", "Dom"];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  daysOfWeek.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.textContent = day;
    header.appendChild(dayHeader);
    dayHeader.style.color = fimDeSemana.includes(dayHeader.textContent)
      ? "var(--text-weekend)"
      : "inherit";
  });
  calendar.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  // Espaços antes do primeiro dia
  for (let i = 0; i < firstDay; i++)
    grid.appendChild(document.createElement("div"));

  const todayStr = `${String(new Date().getDate()).padStart(2, "0")}/${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}/${new Date().getFullYear()}`;

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    const dateStr = `${String(d).padStart(2, "0")}/${String(m + 1).padStart(
      2,
      "0"
    )}/${y}`;

    if (dateStr === todayStr) {
      cell.classList.add("today");
    }

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = d;
    cell.appendChild(dayNumber);

    const dayEvents = events.filter((ev) => ev.data === dateStr);

    dayEvents.forEach((ev) => {
      const eDiv = document.createElement("div");
      eDiv.className = "event";
      eDiv.style.backgroundColor = ev.corfundo || "var(--highlight)";
      eDiv.style.color = ev.cortexto || "black";
      eDiv.innerHTML = `<strong>${ev.tipo || ""}</strong>${
        ev.titulo ? `<br><small>${ev.titulo}</small>` : ""
      }`;
      eDiv.addEventListener("click", () => openModal(ev));
      cell.appendChild(eDiv);
    });

    grid.appendChild(cell);
  }

  // Espaços depois do último dia para completar a grade
  for (let i = lastDay; i < 6; i++) {
    grid.appendChild(document.createElement("div"));
  }

  calendar.appendChild(grid);
}

// === MODAL ===
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalTipo = document.getElementById("modalTipo");
const modalDate = document.getElementById("modalDate");
const modalDetails = document.getElementById("modalDetails");
const modalResponsavel = document.getElementById("modalResponsavel");
const modalObs = document.getElementById("modalObs");

function openModal(ev) {
  modalTipo.textContent = ev.tipo || "Sem Tipo";
  modalTipo.style.backgroundColor = ev.corfundo || "var(--highlight)";
  modalTipo.style.color = ev.cortexto || "var(--text-light)";
  modalTitle.textContent = ev.titulo ? `Evento: ${ev.titulo}` : "";
  modalResponsavel.textContent = ev.responsavel
    ? `Responsável: ${ev.responsavel}`
    : "";
  modalDate.textContent = ev.data ? `Data: ${ev.data}` : "";
  modalDetails.textContent = ev.hora ? `Horário: ${ev.hora}` : "";
  modalObs.textContent = ev.obs ? `Obs: ${ev.obs}` : "";
  modalOverlay.style.display = "flex";
}

function closeModal() {
  modalOverlay.style.display = "none";
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.style.display === "flex") {
    closeModal();
  }
});

// === INICIALIZAÇÃO ===
fetchEvents().then((events) => {
  allEvents = events;
  const tiposUnicos = [...new Set(events.map((e) => e.tipo).filter(Boolean))];
  if (tipoSelect) {
    tipoSelect.innerHTML =
      '<option value="">Todos</option>' +
      tiposUnicos.map((t) => `<option value="${t}">${t}</option>`).join("");
  }
  renderAll();
});
