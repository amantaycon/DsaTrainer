const pageNav = document.getElementById('navpagnav');
$.post('/contentpage/nav', { name: window.navName }, (res) => {
    let nav = `<ul class="navpaged "><div onclick="closenNav()" class="close welf pointer">˟</div>`;
    res.forEach(item => {
        nav += `<li><a class="panahea panaho `
        nav += window.contentid == item.id? `cor_ora`: `white`;
        nav += `" href="${window.link}?id=${item.id}">${item.nav_title}</a> `;
        if (window.admin) nav += `<span data-id='${item.id}' class="pointer" onclick='editnav(this)'>✏️</span>`;
        nav += `</li>`;
    });
    if (window.admin) nav += `<li class="panahe"><span class="panahea panaho white pointer" onclick="addNewNav()">+</span></li>`;
    nav += `</ul>`;
    pageNav.innerHTML = nav;
});

if (window.content) {
    $.post('/content/pagedata', { content_address: window.content }, res => {
        document.getElementById('pagedata').innerHTML += `<div id="editable">` + res.data + `</div?`;

        var con = '';
        $.post('/content/pagedata/prenext', { name: window.navName, id: window.contentid }, res => {
            con += `<div class="nexpre">`;
            if (window.contentid > 1) {
                con += `<div class="previous"><a class="center" href="${window.link + '?id=' + (window.contentid - 1)}">Previous</a></div>`;
            } else {
                con += `<div class="previous"><span class="center button_deativate">Previous</span></div>`;
            }

            if (res == '1') {
                con += `<div class="next"><a class="center" href="${window.link + '?id=' + (window.contentid + 1)}">Next</a></div>`;
            } else {
                con += `<div class="next"><span class="center button_deativate">Next</span></div>`;
            }

            con += `</div>`;
            document.getElementById('pagedata').innerHTML = con + document.getElementById('pagedata').innerHTML;
            document.getElementById('pagedata').innerHTML += con;

            document.querySelectorAll('.image-control').forEach(button => {
                button.style.display = "none";
            });
        });
    });
}


$.post('/content/navhead', { link: window.link }, res => {
    let con = '';
    res.forEach(item => {
        con += `<li class="listpn center"><a class="listpna" href="${item.link}">${item.name}</a></li>`;
    });
    document.getElementById('pagehead').innerHTML = con;
});

