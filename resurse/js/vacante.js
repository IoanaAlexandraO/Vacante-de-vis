window.addEventListener("DOMContentLoaded", () => {

  const inpNume = document.getElementById("inp-nume");
  const inpPret = document.getElementById("inp-pret");
  const valPret = document.getElementById("val-pret");
  const inpDurata = document.getElementById("inp-durata");
  const radioCategorii = document.querySelectorAll('input[name="categorie"]');
  const inpDificultate = document.getElementById("inp-dificultate");
  const inpCuloare = document.getElementById("inp-culoare");
  const inpTransport = document.getElementById("inp-transport");
  const inpData = document.getElementById("inp-data");
  const inpActivitati = document.getElementById("inp-activitati");
  

  const btnFiltrare = document.getElementById("btn-filtrare");
  const btnSortarePret = document.getElementById("btn-sortare-pret");
  const btnResetare = document.getElementById("btn-resetare");

  const vacante = Array.from(document.querySelectorAll("article.card"));
  let sortAscendent = true;

  // Afișare valoare slider preț
  if (inpPret && valPret) {
    inpPret.addEventListener("input", () => {
      valPret.textContent = `(${inpPret.value})`;
    });
  }


  function parseRomanianDate(text) {
    const luni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
                  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    const match = text.match(/(\d{1,2}) (\w+) (\d{4})/i);
    if (!match) return null;
    const zi = parseInt(match[1]), luna = luni.indexOf(match[2].toLowerCase()), an = parseInt(match[3]);
    return (luna >= 0) ? new Date(an, luna, zi) : null;
  }

  function parseDate(dateString) {
    const parts = dateString.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // lunile în JavaScript sunt de la 0 la 11
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    return new Date(year, month, day);
  }

  if (btnFiltrare) {
    btnFiltrare.addEventListener("click", () => {

      const valNume = inpNume?.value?.trim().toLowerCase() || "";
      getvalPret = valPret?.textContent.match(/\d+/)?.[0];
      const valDificultate = inpDificultate?.value?.toLowerCase() || "oricare";
      const valCuloare = inpCuloare?.value?.toLowerCase() || "oricare";
      const valTransport = inpTransport?.checked ? "da" : "nu";
      const valDurata = parseInt(inpDurata?.value || "0");
      const valData = inpData?.value ? parseDate(inpData.value) : null;
      const valActivitati = inpActivitati?.value?.trim().toLowerCase() || "";
      let valCategorie = "oricare";
          
      radioCategorii.forEach(radio => valCategorie = radio.checked ? radio.value.toLowerCase() : valCategorie);

      console.log("Filtrare:", { valActivitati});

      vacante.forEach(card => {
        let ok = true;
        const nume = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
        const pasaport = (card.getAttribute("data-pasaport") || "").toLowerCase();
        const getDate = parseDate(card.getAttribute("data-data"))   || "";

        if (valNume!='' && !nume.includes(valNume)) ok = false;
        if (getvalPret>0 && getvalPret > parseInt(card.getAttribute("data-pret")?.toLowerCase())) ok = false;
        if (valDificultate !== "oricare" && card.getAttribute("data-dificultate")?.toLowerCase()!= valDificultate) ok = false;
        if (valCuloare !== "oricare" && !pasaport.includes(valCuloare)) ok = false;
        if (valTransport === "da" && card.getAttribute("data-transport")?.toLowerCase()!= valTransport) ok = false;

        if (valDurata > 0) {
          const durata = parseInt(card.getAttribute("data-durata") || "0");
          if (durata > valDurata) ok = false;
        }
        if (valData && getDate && getDate < valData) ok = false;

        if (valActivitati && !card.getAttribute("data-activitati").toLowerCase().includes(valActivitati)) ok = false;
        if (valCategorie != "oricare" && card.getAttribute("data-categorie")?.toLowerCase() != valCategorie)
          ok = false;   

        card.style.display = ok ? "block" : "none";
      });
    });
  }

  if (btnSortarePret) {
    btnSortarePret.addEventListener("click", () => {
      const container = document.getElementById("vacante-container");
      const carduri = Array.from(container.children);

      carduri.sort((a, b) => {
        const pretA = parseInt(a.querySelector(".card-text")?.textContent.match(/\d+/)?.[0]) || 0;
        const pretB = parseInt(b.querySelector(".card-text")?.textContent.match(/\d+/)?.[0]) || 0;
        return sortAscendent ? pretA - pretB : pretB - pretA;
      });

      sortAscendent = !sortAscendent;
      btnSortarePret.innerHTML = `<i class="bi bi-arrow-down-up me-1"></i><span class="d-none d-sm-inline">${sortAscendent ? "Sortare după preț ↑" : "Sortare după preț ↓"}</span>`;
      carduri.forEach(card => container.appendChild(card));
    });
  }

  if (btnResetare) {
    btnResetare.addEventListener("click", () => {
      if (inpNume) inpNume.value = "";
      if (inpPret) inpPret.value = inpPret.min;
      if (valPret) valPret.textContent = `(${inpPret?.min})`;
      if (inpDificultate) inpDificultate.value = "oricare";
      if (inpCuloare) inpCuloare.value = "oricare";
      if (inpTransport) inpTransport.checked = false;
      if (inpDurata) inpDurata.value = inpDurata.max;
      if (inpData) inpData.value = "";
      if (inpActivitati) inpActivitati.value = "";

      radioCategorii.forEach(radio => radio.checked = false);


      vacante.forEach(card => card.style.display = "block");
      btnSortarePret.innerHTML = `<i class="bi bi-arrow-down-up me-1"></i><span class="d-none d-sm-inline">Sortare după preț</span>`;
      sortAscendent = true;
    });
  }
});
