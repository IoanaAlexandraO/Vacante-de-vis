window.addEventListener("DOMContentLoaded", () => {
  // Selectare inputuri din filtrare
  const inpNume = document.getElementById("inp-nume");
  const inpPret = document.getElementById("inp-pret");
  const valPret = document.getElementById("val-pret"); // span pentru afișarea valorii sliderului
  const inpDurata = document.getElementById("inp-durata");
  const radioCategorii = document.querySelectorAll('input[name="categorie"]');
  const inpDificultate = document.getElementById("inp-dificultate");
  const inpCuloare = document.getElementById("inp-culoare");
  const inpTransport = document.getElementById("inp-transport");
  const inpData = document.getElementById("inp-data");
  const inpActivitati = document.getElementById("inp-activitati");
const btnCalculSuma = document.getElementById("btn-calcul-suma");
  // Butoane
  const btnFiltrare = document.getElementById("btn-filtrare");
  const btnSortarePret = document.getElementById("btn-sortare-pret");
  const btnResetare = document.getElementById("btn-resetare");
  const btnSortarePretDesc = document.getElementById("btn-sortare-pret-desc");

  // Carduri de vacanțe și coloanele lor (pentru resetare)
  const vacante = Array.from(document.querySelectorAll("article.card"));
  const coloane = Array.from(document.querySelectorAll("#vacante-container > .col-md-6.col-lg-4"));

  let sortAscendent = true; // default sortare crescătoare

  // Afișează valoarea slider-ului în timp real
  if (inpPret && valPret) {
    inpPret.addEventListener("input", () => {
      valPret.textContent = `(${inpPret.value})`;
    });
  }

  // Funcție de calcul a distanței Levenshtein (toleranță pentru greșeli de tastare la căutare după nume)
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituire
            matrix[i][j - 1] + 1,     // inserare
            matrix[i - 1][j] + 1      // ștergere
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Parsează o dată în format românesc (ex: 12 iunie 2025)
  function parseRomanianDate(text) {
    const luni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
                  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    const match = text.match(/(\d{1,2}) (\w+) (\d{4})/i);
    if (!match) return null;
    const zi = parseInt(match[1]), luna = luni.indexOf(match[2].toLowerCase()), an = parseInt(match[3]);
    return (luna >= 0) ? new Date(an, luna, zi) : null;
  }

  // Parsează o dată în format YYYY-MM-DD (standard input[type="date"])
  function parseDate(dateString) {
    const parts = dateString.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // lunile încep de la 0
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  }

  // LOGICA DE FILTRARE
  if (btnFiltrare) {
    btnFiltrare.addEventListener("click", () => {
      const valNume = inpNume?.value?.trim().toLowerCase() || "";
      getvalPret = valPret?.textContent.match(/\d+/)?.[0]; // extrage valoarea numerică din textul sliderului
      const valDificultate = inpDificultate?.value?.toLowerCase() || "oricare";
      const valCuloare = inpCuloare?.value?.toLowerCase() || "oricare";
      const valTransport = inpTransport?.checked ? "da" : "nu";
      const valDurata = parseInt(inpDurata?.value || "0");
      const valData = inpData?.value ? parseDate(inpData.value) : null;
      const valActivitati = inpActivitati?.value?.trim().toLowerCase() || "";
      let valCategorie = "oricare";

      // Preia categoria selectată
      radioCategorii.forEach(radio => valCategorie = radio.checked ? radio.value.toLowerCase() : valCategorie);

      // Aplică toate filtrele pe fiecare card
      vacante.forEach(card => {
        let ok = true;

        const nume = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
        const pasaport = (card.getAttribute("data-pasaport") || "").toLowerCase();
        const getDate = parseDate(card.getAttribute("data-data")) || "";

        // Filtru nume cu Levenshtein (toleranță mică la greșeli)
        if (valNume !== '') {
          if (!nume.includes(valNume) && levenshtein(nume, valNume) > 2)
            ok = false;
        }

        // Filtru preț maxim
        if (getvalPret > 0 && getvalPret > parseInt(card.getAttribute("data-pret")?.toLowerCase()))
          ok = false;

        // Dificultate exactă
        if (valDificultate !== "oricare" && card.getAttribute("data-dificultate")?.toLowerCase() !== valDificultate)
          ok = false;

        // Culoare pasaport
        if (valCuloare !== "oricare" && !pasaport.includes(valCuloare))
          ok = false;

        // Transport inclus
        if (valTransport === "da" && card.getAttribute("data-transport")?.toLowerCase() !== "da")
          ok = false;

        // Durată maximă
        if (valDurata > 0) {
          const durata = parseInt(card.getAttribute("data-durata") || "0");
          if (durata > valDurata)
            ok = false;
        }

        // Dată minimă
        if (valData && getDate && getDate < valData)
          ok = false;

        // Activități (substring în text)
        if (valActivitati && !card.getAttribute("data-activitati").toLowerCase().includes(valActivitati))
          ok = false;

        // Categorie radio
        if (valCategorie !== "oricare" && card.getAttribute("data-categorie")?.toLowerCase() !== valCategorie)
          ok = false;

        // Afișează sau ascunde cardul
        card.style.display = ok ? "block" : "none";
      });
    });
  }

  // SORTARE
  function ordonareCarduri() {
    const container = document.getElementById("vacante-container");
    const carduri = Array.from(container.children);

    carduri.sort((a, b) => {
      const pretA = parseInt(a.querySelector(".card-text")?.textContent.match(/\d+/)?.[0]) || 0;
      const pretB = parseInt(b.querySelector(".card-text")?.textContent.match(/\d+/)?.[0]) || 0;
      return sortAscendent ? pretA - pretB : pretB - pretA;
    });

    // Reatașează cardurile în ordinea sortată
    carduri.forEach(card => container.appendChild(card));
  }

  // Buton sortare crescătoare
  if (btnSortarePret) {
    btnSortarePret.addEventListener("click", () => {
      sortAscendent = true;
      ordonareCarduri();
    });
  }

  // Buton sortare descrescătoare
  if (btnSortarePretDesc) {
    btnSortarePretDesc.addEventListener("click", () => {
      sortAscendent = false;
      ordonareCarduri();
    });
  }

  // RESETARE FILTRE
  if (btnResetare) {
    btnResetare.addEventListener("click", () => {
      if (!confirm("Sigur vrei să resetezi toate filtrele?")) return;

      // Resetează toate valorile
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

      // Reafișează toate cardurile
      vacante.forEach(card => card.style.display = "block");
      coloane.forEach(col => col.style.display = "block");

      sortAscendent = true;
    });
  }
});
