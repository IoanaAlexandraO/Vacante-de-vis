document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll('.galerie-animata .slide');
    const galerie = document.querySelector('.galerie-animata');
    const clength = slides.length;
    if (clength === 0) return;

    let idx = 0;
    let intervalId;
    let isPaused = false;
    let transitionInProgress = false;

    // Inițializare toate slide-urile
    slides.forEach((slide, i) => {
        if (i === 0) {
            // Primul slide activ
            slide.style.opacity = "1";
            slide.style.zIndex = "2";
            slide.style.clipPath = "ellipse(100% 70% at 50% 50%)";
            slide.style.filter = "grayscale(0)";
        } else {
            // Restul slide-urilor ascunse
            slide.style.opacity = "0";
            slide.style.zIndex = "1";
            slide.style.clipPath = "ellipse(100% 0% at 50% 50%)";
            slide.style.filter = "grayscale(1)";
        }
    });

    function nextSlide() {
        if (isPaused || transitionInProgress) return;

        transitionInProgress = true;
        const slideAnterior = slides[idx];
        slideAnterior.style.clipPath = "ellipse(100% 70% at 50% 50%)";
        slideAnterior.style.filter = "grayscale(0)";
        slideAnterior.style.opacity = "1";
        slideAnterior.style.zIndex = "1";

        idx = (idx + 1) % clength;
        const slideNou = slides[idx];

        // Pregătire slide nou (fără tranziție încă)
        slideNou.style.transition = "none";
        slideNou.style.opacity = "1";
        slideNou.style.zIndex = "2";
        slideNou.style.clipPath = "ellipse(100% 0% at 50% 50%)";

        // Forțează reflow pentru a aplica stilurile
        void slideNou.offsetWidth;

        // Reactivează tranzițiile
        slideNou.style.transition = "clip-path 2.5s ease-in-out, filter 1.5s ease-in-out";

        // Începe animația clip-path
        slideNou.style.clipPath = "ellipse(100% 70% at 50% 50%)";

        // După 900ms, începe tranziția de la gri la color
        setTimeout(() => {
            if (!isPaused) {
                slideNou.style.filter = "grayscale(0)";
            }
        }, 900);

        // După finalizarea tranzițiilor, curăță slide-urile vechi
        setTimeout(() => {
            if (!isPaused) {
                slideAnterior.style.opacity = "0";
                slideAnterior.style.zIndex = "1";
                slideAnterior.style.clipPath = "ellipse(100% 0% at 50% 50%)";
                slideAnterior.style.filter = "grayscale(1)";
            }
            transitionInProgress = false;
        }, 2500);
    }

    nextSlide();

    // Pornește ciclul automat
    intervalId = setInterval(nextSlide, 3000);

    function freeze_restartSlideStyles(slide, type_transition) {
        const computedStyles = window.getComputedStyle(slide);
        const cclipPath = computedStyles.clipPath;
        const cfilter = computedStyles.filter;
        const copacity = computedStyles.opacity;
        slide.style.transition = type_transition;
        slide.style.clipPath = cclipPath;
        slide.style.filter = cfilter;
        slide.style.opacity = copacity;
        void slide.offsetWidth;
    }

    // Hover handlers
    galerie.addEventListener("mouseenter", () => {
        isPaused = true;
        transitionInProgress = true;
        clearInterval(intervalId);
        intervalId = null;

        // Păstrează toate tranzițiile în starea curentă
       
        const slideAnterior = slides[(idx+clength-1)%clength];
        freeze_restartSlideStyles(slideAnterior, "none");
        const slideNou = slides[idx];
        freeze_restartSlideStyles(slideNou, "none");
    });

    galerie.addEventListener("mouseleave", () => {

        // Reactivează tranzițiile
        // slides.forEach(slide => {
        //     freeze_restartSlideStyles(slide, "clip-path 2.5s ease-in-out, filter 1.5s ease-in-out, opacity 0.8s ease-in-out");
        // });

        transitionInProgress = true;
        //continua tranzitia pentru slides[idx-1];
        const slideAnterior = slides[(idx+clength-1)%clength];
        slideAnterior.style.clipPath = "ellipse(100% 0% at 50% 50%)";
        slideAnterior.style.filter = "grayscale(1)";
        slideAnterior.style.opacity = "1";
        slideAnterior.style.zIndex = "1";
        slideAnterior.style.transition = "clip-path 2.5s ease-in-out, filter 1.5s ease-in-out, opacity 0.8s ease-in-out";
        
        //continua tranzitia pentru slides[idx];
        const slideNou = slides[idx];
        slideNou.style.clipPath = "ellipse(100% 70% at 50% 50%)";
        slideNou.style.filter = "grayscale(0)";
        slideNou.style.opacity = "1";
        slideNou.style.zIndex = "2";
        slideNou.style.transition = "clip-path 2.5s ease-in-out, filter 1.5s ease-in-out, opacity 0.8s ease-in-out";
    
        isPaused = false;
        transitionInProgress = false;
        // Repornește ciclul automat
        intervalId = setInterval(nextSlide, 4500);
    });
});