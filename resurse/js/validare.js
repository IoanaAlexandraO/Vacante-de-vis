document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.getElementById("inp-activitati");

    // Lista de cuvinte cheie permise
    const cuvintePermise = ['sejur', 'city-break', 'aventura', 'relaxare', 'cruise'];

    textarea.addEventListener("input", function () {
        const valoare = textarea.value.trim();
        const cuvinte = valoare.split(",").map(cuvant => cuvant.trim().toLowerCase()); // Separă cuvintele după virgulă și normalizează

        // Verifică dacă toate cuvintele sunt în lista de cuvinte permise
        const esteValid = cuvinte.every(cuvant => cuvintePermise.includes(cuvant));

        if (valoare === "" || !esteValid) {
            textarea.classList.add("is-invalid");
            textarea.classList.remove("is-valid");
        } else {
            textarea.classList.remove("is-invalid");
            textarea.classList.add("is-valid");
        }
    });
});