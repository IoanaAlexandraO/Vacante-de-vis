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
    const valCuloare = inpCuloare.value.toLowerCase();
    const valTransport = inpTransport.checked;
    const valDurata = parseInt(inpDurata.value);
    const valData = inpData.value;
    
    const valActivitati = inpActivitati.value
      .toLowerCase()
      .split(/[,;]/)
      .map(a => a.trim())
      .filter(a => a.length > 0);

    vacante.forEach(card => {
      let ok = true;

      // Extragere nume
      const nume = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      
      // Extragere preț - caută textul care conține "Preț:"
      const pretElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Preț:"));
      const pretText = pretElement?.textContent.match(/(\d+)/);
      const pret = pretText ? parseInt(pretText[1]) : 0;

      // Extragere dificultate
      const dificultateElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Dificultate:"));
      const dificultateText = dificultateElement?.textContent.toLowerCase() || "";

      // Extragere culoare pașaport - ÎMBUNĂTĂȚIT
      let pasaportCuloare = "";
      const pasaportElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Pașaport necesar:"));
      if (pasaportElement) {
        const pasaportText = pasaportElement.textContent.toLowerCase();
        if (pasaportText.includes("rosu") || pasaportText.includes("roșu")) pasaportCuloare = "rosu";
        else if (pasaportText.includes("albastru")) pasaportCuloare = "albastru";
        else if (pasaportText.includes("verde")) pasaportCuloare = "verde";
        else if (pasaportText.includes("negru")) pasaportCuloare = "negru";
      }

      // Extragere transport inclus - ÎMBUNĂTĂȚIT
      let transportInclus = false;
      const transportElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Transport inclus:"));
      if (transportElement) {
        const transportText = transportElement.textContent.toLowerCase();
        transportInclus = transportText.includes("true");
      }

      // Extragere durată - ÎMBUNĂTĂȚIT
      let durata = null;
      const durataElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Durată:"));
      if (durataElement) {
        const durataMatch = durataElement.textContent.match(/(\d+)\s*zile/);
        if (durataMatch) {
          durata = parseInt(durataMatch[1]);
        }
      }

      // Extragere activități - ÎMBUNĂTĂȚIT
      let activitati = "";
      const activitatiElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Activități:"));
      if (activitatiElement) {
        activitati = activitatiElement.textContent.toLowerCase();
      }

      // Extragere dată - CORECTATĂ
      const dataElement = Array.from(card.querySelectorAll(".card-text"))
        .find(el => el.textContent.includes("Disponibilă din:"));
      const dataText = dataElement?.textContent || "";
      const dataStart = parseRomanianDate(dataText);

      // Aplicare filtre
      if (valNume && !nume.includes(valNume)) ok = false;
      if (pret > valPret) ok = false;
      if (valData && dataStart && new Date(valData) > dataStart) ok = false;

      // Filtrare după dificultate
      if (valDificultate !== "oricare") {
        if (valDificultate === "usor" && !dificultateText.includes("ușor") && !dificultateText.includes("usor")) ok = false;
        else if (valDificultate === "mediu" && !dificultateText.includes("mediu")) ok = false;
        else if (valDificultate === "dificil" && !dificultateText.includes("dificil")) ok = false;
      }
      
      // Filtrare după culoare pașaport
      if (valCuloare !== "oricare" && pasaportCuloare !== valCuloare) ok = false;
      
      // Filtrare transport
      if (valTransport && !transportInclus) ok = false;
      
      // Filtrare durată
      if (!isNaN(valDurata) && durata !== null && durata > valDurata) ok = false;

      // Filtrare activități
      if (valActivitati.length > 0) {
        let areActivitate = false;
        for (let activ of valActivitati) {
          if (activitati.includes(activ)) {
            areActivitate = true;
            break;
          }
        }
        if (!areActivitate) ok = false;
      }

      // Afișare/ascundere card
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
});