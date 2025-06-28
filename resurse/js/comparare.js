window.addEventListener("DOMContentLoaded", () => {
    const btnsCompare = document.querySelectorAll(".btn-compare");
    let container = document.getElementById("container-comparare");

    const getVacante = () => {
        try {
            return JSON.parse(localStorage.getItem("vacante_comparare")) || [];
        } catch (e) {
            return [];
        }
    };

    const vacante = getVacante();

    const setVacante = (arr) => {
        localStorage.setItem("vacante_comparare", JSON.stringify(arr));
    };

    const setUltimaActiune = () => {
        localStorage.setItem("ultima_actiune_compare", Date.now());
    };

    const isExpirat = () => {
        const msInZi = 24 * 60 * 60 * 1000;
        const ultima = parseInt(localStorage.getItem("ultima_actiune_compare"));
        if (!ultima) return true;
        return Date.now() - ultima > msInZi;
    };

    const actualizeazaContainer = () => {
        const vacante = getVacante();

        if (vacante.length === 0) {
            if (container) container.remove();
            return;
        }

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

        let html = vacante.map((v, idx) => `
            <div style="margin-bottom:5px;">
                Vacanță: ${v.nume}
                <button data-index="${idx}" class="btn-remove" style="margin-left:10px;">❌</button>
            </div>
        `).join("");

        if (vacante.length === 2) {
            html += `
                <div style="text-align:center; margin-top:10px;">
                    <button id="btn-afisare-compare" class="btn btn-primary">afișează</button>
                </div>
            `;
        }

        container.innerHTML = html;

        const btnAfisare = document.getElementById("btn-afisare-compare");
        if (btnAfisare) {
            btnAfisare.addEventListener("click", () => {
                const url = `/comparare?id1=${vacante[0].id}&id2=${vacante[1].id}`;
                window.open(url, "_blank");
            });
        }

        document.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.index);
                let vacante = getVacante();
                vacante.splice(idx, 1);
                setVacante(vacante);
                actualizeazaContainer();
            });
        });

        const btnsCompare = document.querySelectorAll(".btn-compare");

        if (vacante.length < 2) {
            btnsCompare.forEach(btn => {
                btn.disabled = false;
                btn.removeAttribute("data-blocat");
                btn.removeAttribute("title");
                btn.style.opacity = "1";
            });
        } else {
            btnsCompare.forEach(btn => {
                btn.disabled = false;
                btn.setAttribute("data-blocat", "true");
                btn.title = "ștergeți o vacanță din lista de comparare";
                btn.style.opacity = "0.5";
            });
        }
    };

    btnsCompare.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.getAttribute("data-blocat") === "true") return;

            const id = btn.dataset.id;
            const nume = btn.dataset.nume;
            // Citește prețul dintr-un atribut data-pret (vezi pasul 2)
            const pret = btn.dataset.pret;
            let vacante = getVacante();

            if (vacante.length >= 2 || vacante.some(v => v.id === id)) return;

            vacante.push({ id, nume, pret });
            setVacante(vacante);
            setUltimaActiune();
            actualizeazaContainer();
        });
    });

    const btnReset = document.getElementById("btn-resetare");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            localStorage.removeItem("vacante_comparare");
            localStorage.removeItem("ultima_actiune_compare");
            const container = document.getElementById("container-comparare");
            if (container) container.remove();
        });
    }

    actualizeazaContainer();
});
