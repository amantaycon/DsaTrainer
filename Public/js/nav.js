function showNavLeft() {
    const nav = document.getElementById('navpagnav');
    nav.style.paddingTop = '0';
    nav.style.display = 'block';
}

function closenNav() {
    const nav = document.getElementById('navpagnav');
    nav.style.display = 'none';
    nav.style.paddingTop = '4rem';
}

function showUserNav() {
    const nav = document.getElementById('usernavli1');
    if (nav) {
        nav.style.display = (getComputedStyle(nav).display === 'block') ? 'none' : 'block';
    }
}

document.addEventListener("click", function (event) {
    const userNav = document.getElementById("usernavli1");
    const userClick = document.getElementById("usernav");

    if (userNav && userClick) {
        // If click is outside both `usernavli1` and `usernav`, hide `usernavli1`
        if (!userNav.contains(event.target) && !userClick.contains(event.target) && getComputedStyle(userNav).display === 'block') {
            userNav.style.display = 'none';
        }
    }
});

function redirectToLogin(link) {
    const currentURL = window.location.href;
    window.location.href = `${link}?redirect=${encodeURIComponent(currentURL)}`;
}


