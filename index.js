// Language translation
let language = {
    eng: {
        Language: "Hello, my names is Hannes. I am currently studing computer science at the university of Skövde."
    },
    sv: {
        Language: "Hej, mitt namn är Hannes. Just nu studerar jag datavetenskap på högskolan i Skövde."
    }
};

// Sets language with window hash
if (window.location.hash) {
    if (window.location.hash === "#sv") {
        Language.textContent = language.sv.Language;
    } else {
        Language.textContent = language.eng.Language;
    }
}
// reload language
let dataReload = document.querySelectorAll("[data-reload]");

for (i = 0; i <= dataReload.length; i++) {
    dataReload[i].onclick = function () {
        location.reload(true);
    }
}
