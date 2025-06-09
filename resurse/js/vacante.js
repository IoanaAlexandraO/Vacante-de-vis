window.addEventListener("DOMContentLoaded", () => {
  const inpNume = document.getElementById("inp-nume");
  const inpPret = document.getElementById("inp-pret");
  const inpDificultate = document.getElementById("inp-dificultate");
  const inpCuloare = document.getElementById("inp-culoare");
  const inpTransport = document.getElementById("inp-transport");
  const inpDurata = document.getElementById("inp-durata");
  const inpData = document.getElementById("inp-data");
  const inpActivitati = document.getElementById("inp-activitati");

  const btnFiltrare = document.getElementById("btn-filtrare");
  const btnSortarePret = document.getElementById("btn-sortare-pret");
  const btnResetare = document.getElementById("btn-resetare");

  const vacante = Array.from(document.querySelectorAll("article.card"));
  let sortAscendent = true;

  // Afișare valoare slider preț
  inpPret.addEventListener("input", () => {
    document.getElementById("val-pret").textContent = `(${inpPret.value})`;
  });

  // Funcție helper pentru parsarea datei românești - CORECTATĂ
  function parseRomanianDate(dateText) {
    const luni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", 
                  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    
    // Caută textul după "Disponibilă din:" și extrage data
    const afterColon = dateText.split("Disponibilă din:")[1]?.trim();
    if (!afterColon) return null;
    
    // Formatul nou: "15 Iulie 2025 (Marți)" - extrage doar partea de dată
    const match = afterColon.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (!match) return null;
    
    const zi = parseInt(match[1]);
    const lunaText = match[2].toLowerCase();
    const an = parseInt(match[3]);
    
    const lunaIndex = luni.indexOf(lunaText);
    if (lunaIndex === -1) return null;
    
    return new Date(an, lunaIndex, zi);
  }

  btnFiltrare.addEventListener("click", () => {
    const valNume = inpNume.value.trim().toLowerCase();
    const valPret = parseInt(inpPret.value);
    const valDificultate = inpDificultate.value.toLowerCase();
    const valCuloare = inpCuloare.value.toLowerCase(); // folosit pentru "culoare pașaport"
    // restul inputurilor pot fi eliminate dacă nu mai sunt necesare

    vacante.forEach(card => {
      let ok = true;

      // Extragere nume și preț din elementele vizibile
      const nume = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const pretElement = Array.from(card.querySelectorAll(".card-text")).find(el => el.textContent.includes("Preț:"));
      const pretText = pretElement?.textContent.match(/(\d+)/);
      const pret = pretText ? parseInt(pretText[1]) : 0;

      // Extragere din atributele personalizate
      const dificultate = (card.getAttribute("data-dificultate") || "").toLowerCase();
      const pasaport = (card.getAttribute("data-pasaport") || "").toLowerCase();

      // Aplicare filtre vizuale
      if (valNume && !nume.includes(valNume)) ok = false;
      if (pret > valPret) ok = false;

      // Filtrare după dificultate (dacă se selectează altceva decît "oricare")
      if (valDificultate !== "oricare" && !dificultate.includes(valDificultate)) ok = false;

      // Filtrare după culoarea pașaportului (dacă se selectează altceva decît "oricare")
      if (valCuloare !== "oricare" && !pasaport.includes(valCuloare)) ok = false;

      card.style.display = ok ? "block" : "none";
    });
  });

  btnSortarePret.addEventListener("click", () => {
    const container = document.getElementById("vacante-container");
    const carduri = Array.from(container.children);

    carduri.sort((a, b) => {
      // Extragere preț pentru sortare
      const pretElementA = Array.from(a.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Preț:"));
      const pretElementB = Array.from(b.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Preț:"));
      
      const pretA = pretElementA ? parseInt(pretElementA.textContent.match(/(\d+)/)[1]) : 0;
      const pretB = pretElementB ? parseInt(pretElementB.textContent.match(/(\d+)/)[1]) : 0;
      
      return sortAscendent ? pretA - pretB : pretB - pretA;
    });

    sortAscendent = !sortAscendent;
    
    // Actualizare text buton
    const btnText = sortAscendent ? "Sortare după preț ↑" : "Sortare după preț ↓";
    btnSortarePret.innerHTML = `<i class="bi bi-arrow-down-up me-1"></i><span class="d-none d-sm-inline">${btnText}</span>`;
    
    carduri.forEach(card => container.appendChild(card));
  });

  btnResetare.addEventListener("click", () => {
    inpNume.value = "";
    inpPret.value = inpPret.max;
    document.getElementById("val-pret").textContent = `(${inpPret.max})`;
    inpDificultate.value = "oricare";
    inpCuloare.value = "oricare";
    inpTransport.checked = false;
    inpDurata.value = inpDurata.max;
    inpData.value = "";
    inpActivitati.value = "";

    vacante.forEach(card => card.style.display = "block");
    
    // Reset text sortare
    btnSortarePret.innerHTML = `<i class="bi bi-arrow-down-up me-1"></i><span class="d-none d-sm-inline">Sortare după preț</span>`;
    sortAscendent = true;
  });

  document.getElementById('btn-filtrare').addEventListener('click', function() {
    const searchValue = document.getElementById('inp-nume').value.toLowerCase();

    document.querySelectorAll('#vacante-container .card').forEach(card => {
        // Folosește titlul din informațiile esențiale
        const title = card.querySelector('.card-essential-info h5').textContent.toLowerCase();

        if (title.includes(searchValue)) {
            card.style.display = ''; // afișează cardul
        } else {
            card.style.display = 'none'; // ascunde cardul
        }
    });
});
});