import { HtmlLoader } from "./pageContentLoader.js"

document.addEventListener('DOMContentLoaded', () => {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    navbarToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
    });
});

let htmlLoader = new HtmlLoader();
htmlLoader.loadHtml("./meniu.html", "meniu");