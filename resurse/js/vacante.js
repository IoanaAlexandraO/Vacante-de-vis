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

      const nume = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const pretText = card.querySelector(".card-text")?.textContent.match(/\d+/g);
      const pret = pretText ? parseInt(pretText[0]) : 0;

      const descriere = card.querySelector(".card-text:last-of-type")?.textContent.toLowerCase() || "";
      const dataText = card.querySelector(".card-text:nth-of-type(2)")?.textContent.match(/\d{4}-\d{2}-\d{2}/);
      const dataStart = dataText ? new Date(dataText[0]) : null;

      if (valNume && !nume.includes(valNume)) ok = false;
      if (pret > valPret) ok = false;
      if (valData && dataStart && new Date(valData) > dataStart) ok = false;

      // Condiții fictive suplimentare (doar dacă sunt prezente în textul descriptiv)
      if (valDificultate !== "oricare" && !descriere.includes(valDificultate)) ok = false;
      if (valCuloare !== "oricare" && !descriere.includes(valCuloare)) ok = false;
      if (valTransport && !descriere.includes("transport")) ok = false;
      if (!isNaN(valDurata)) {
        const durataMatch = descriere.match(/(\d+)\s*zile/);
        if (durataMatch && parseInt(durataMatch[1]) > valDurata) ok = false;
      }

      if (valActivitati.length) {
        let areActivitate = false;
        for (let activ of valActivitati) {
          if (descriere.includes(activ)) {
            areActivitate = true;
            break;
          }
        }
        if (!areActivitate) ok = false;
      }

      card.style.display = ok ? "block" : "none";
    });
  });

  btnSortarePret.addEventListener("click", () => {
    const container = document.getElementById("vacante-container");
    const carduri = Array.from(container.children);

    carduri.sort((a, b) => {
      const pretA = parseInt(a.querySelector(".card-text")?.textContent.match(/\d+/)[0]);
      const pretB = parseInt(b.querySelector(".card-text")?.textContent.match(/\d+/)[0]);
      return sortAscendent ? pretA - pretB : pretB - pretA;
    });

    sortAscendent = !sortAscendent;
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
  });
});
