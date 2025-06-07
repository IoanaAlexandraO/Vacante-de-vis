document.addEventListener("DOMContentLoaded", function () {
    const root = document.documentElement;
    const switchTema = document.querySelector(".switch-tema");
    const temaSalvata = localStorage.getItem("tema") || "light";

    function aplicaTema(tema) {
        root.classList.remove("tema-light", "tema-dark");
        root.classList.add(`tema-${tema}`);
        localStorage.setItem("tema", tema);
        if (switchTema) {
            switchTema.innerHTML = tema === "dark" ? "🌙 Dark" : "☀️ Light";
        }
    }

    aplicaTema(temaSalvata);
    console.log("Tema inițială:", temaSalvata);

    if (switchTema) {
        switchTema.addEventListener("click", () => {
            const temaNoua = root.classList.contains("tema-dark") ? "light" : "dark";
            console.log("Schimb tema în:", temaNoua);
            aplicaTema(temaNoua);
        });
    }
});
