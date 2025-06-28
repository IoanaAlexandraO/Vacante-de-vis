// Așteaptă ca pagina să fie complet încărcată
window.addEventListener("DOMContentLoaded", () => {

    // Selectează toate butoanele „Compară”
    const btnsCompare = document.querySelectorAll(".btn-compare");

    // Referință către containerul plutitor pentru comparații (dacă există deja)
    let container = document.getElementById("container-comparare");

    // === Funcții pentru lucru cu localStorage ===

    // Citește lista de vacanțe din localStorage
    const getVacante = () => {
        try {
            return JSON.parse(localStorage.getItem("vacante_comparare")) || [];
        } catch (e) {
            return [];
        }
    };

    // Scrie lista de vacanțe în localStorage
    const setVacante = (arr) => {
        localStorage.setItem("vacante_comparare", JSON.stringify(arr));
    };

    // Salvează momentul ultimei acțiuni (pentru expirare)
    const setUltimaActiune = () => {
        localStorage.setItem("ultima_actiune_compare", Date.now());
    };

    // Verifică dacă au trecut mai mult de 24h de la ultima acțiune
    const isExpirat = () => {
        const msInZi = 24 * 60 * 60 * 1000;
        const ultima = parseInt(localStorage.getItem("ultima_actiune_compare"));
        if (!ultima) return true;
        return Date.now() - ultima > msInZi;
    };

    // Actualizează containerul de comparare de jos din pagină
    const actualizeazaContainer = () => {
        const vacante = getVacante();

        // Dacă nu sunt vacanțe selectate, elimină containerul
        if (vacante.length === 0) {
            if (container) container.remove();
            return;
        }

        // Creează containerul dacă nu există încă
        if (!document.getElementById("container-comparare")) {
            container = document.createElement("div");
            container.id = "container-comparare";
            container.style.position = "fixed";
            container.style.bottom = "10px";
            container.style.right = "10px";
            container.style.padding = "10px";
            container.style.background = "white";
            container.style.border = "1px solid black";
            container.style.borderRadius = "8px";
            container.style.zIndex = "9999";
            document.body.appendChild(container);
        } else {
            container = document.getElementById("container-comparare");
        }

        // Creează HTML-ul afișat în container
        let html = vacante.map((v, idx) => `
            <div style="margin-bottom:5px;">
                Vacanță: ${v.nume}
                <button data-index="${idx}" class="btn-remove" style="margin-left:10px;">❌</button>
            </div>
        `).join("");

        // Dacă sunt exact 2 vacanțe, adaugă butonul „afișează”
        if (vacante.length === 2) {
            html += `
                <div style="text-align:center; margin-top:10px;">
                    <button id="btn-afisare-compare" class="btn btn-primary">afișează</button>
                </div>
            `;
        }

        // Afișează conținutul în container
        container.innerHTML = html;

        // Eveniment pe butonul „afișează” → deschide pagina de comparare
        const btnAfisare = document.getElementById("btn-afisare-compare");
        if (btnAfisare) {
            btnAfisare.addEventListener("click", () => {
                const url = `/comparare?id1=${vacante[0].id}&id2=${vacante[1].id}`;
                window.open(url, "_blank");
            });
        }

        // Eveniment pentru butoanele de ștergere ❌
        document.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.index);
                let vacante = getVacante();
                vacante.splice(idx, 1); // elimină vacanța selectată
                setVacante(vacante);
                actualizeazaContainer(); // reafișează containerul
            });
        });

        // Activează/dezactivează butoanele „Compară” în funcție de starea actuală
        const btnsCompare = document.querySelectorAll(".btn-compare");

        if (vacante.length < 2) {
            // Permite selecția altor vacanțe
            btnsCompare.forEach(btn => {
                btn.disabled = false;
                btn.removeAttribute("data-blocat");
                btn.removeAttribute("title");
                btn.style.opacity = "1";
            });
        } else {
            // Blochează selecția altor vacanțe
            btnsCompare.forEach(btn => {
                btn.disabled = false; // nu dezactivez complet, dar adaug atribut de blocare
                btn.setAttribute("data-blocat", "true");
                btn.title = "ștergeți o vacanță din lista de comparare";
                btn.style.opacity = "0.5";
            });
        }
    };

    // Când se apasă pe un buton „Compară”
    btnsCompare.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.getAttribute("data-blocat") === "true") return;

            const id = btn.dataset.id;
            const nume = btn.dataset.nume;
            const pret = btn.dataset.pret;
            let vacante = getVacante();

            // Nu permite mai mult de 2 sau dubluri
            if (vacante.length >= 2 || vacante.some(v => v.id === id)) return;

            // Adaugă vacanța și salvează
            vacante.push({ id, nume, pret });
            setVacante(vacante);
            setUltimaActiune();
            actualizeazaContainer();
        });
    });

    // Când se apasă pe butonul „Resetare” → șterge tot
    const btnReset = document.getElementById("btn-resetare");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            localStorage.removeItem("vacante_comparare");
            localStorage.removeItem("ultima_actiune_compare");
            const container = document.getElementById("container-comparare");
            if (container) container.remove();
        });
    }

    // La încărcarea paginii, construiește UI-ul dacă există date salvate
    actualizeazaContainer();
});
