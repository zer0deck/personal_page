// prototypes

String.prototype.format = function() {
    var i = 0,
        args = arguments;
    return this.replace(/{}/g, function() {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

// selectors

const header = document.querySelector(".header")
const navLinks = document.querySelectorAll(".nav_link")


// functions
function headerColorChanger() {
    let scrollPos = window.scrollY
    if (scrollPos > 0) {
        header.classList.add('scroll');
    } else {
        header.classList.remove('scroll');
    }
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// header and navigation

window.addEventListener("scroll", headerColorChanger);
document.addEventListener("DOMContentLoaded", headerColorChanger);



for (let navLink of navLinks) {
    navLink.addEventListener("click", function() {
        console.log(navLink.text);
    });
}