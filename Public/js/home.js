const cheader = document.getElementById('cheader');

$.get('/home/featured', (data) => {
    if (data.message) {
        console.log(data.message);
        if(window.admin == true){
            cheader.innerHTML += `<div class="hodata">
                        <div style="height: 1px;"></div>
                        <div class="m-0">
                            <div class="pointer">
                                <div class="ifects ifect12"></div>
                                <div class="m-1 center welf cor_whi blur">
                                    <h2 onclick="openHeadPopup()">Add Section</h2>
                                </div>
                            </div>
                        </div></div>`;
        }
        return;
    }

    let content = '';
    data.forEach((item) => {
        content += `<div class="hodata">
                        <div style="height: 1px;"></div>
                        <div class="m-0" data-id="head${item.id}">
                            <div style="position: relative;">`
                            if(window.admin == true){
                                content += `<div class="edit-icon" onclick="openEditPopup(this)">✏️</div>`;
                            }
                            content += `<div class="ifects ifect12"></div>
                                <div class="m-1 center welf cor_whi blur">
                                    <h2 class="sectionTitle" data-id="${item.id}">${item.title}</h2>
                                </div>
                            </div>
                            <div class="m-2new">`;

        item.sub_headers.forEach((sub) => {
            content += `<div class="m-2d">
                            <div class="m-2dd center" data-id="head${item.id}sub${sub.id}">
                                <div class="ifects ifect13"></div>
                                <a href="${sub.link}" class="m-2dd1 cor_whi">
                                    <div class="center m-2dd11 blur">
                                        <div class="center m-2dd12">
                                            <h3 data-id=${sub.id}>${sub.name}</h3>`;
            if(window.admin == true){
                content += `<span class="edit-sub" onclick="openSubEditPopup(event, this)">✏️</span>`;
            }
            content += `</div>
                            </div>
                                    <p class="center cor_whi fontsmall">${sub.slogan}</p>
                                </a>
                            </div>
                        </div>`;
        });

        if(window.admin == true){
            content += `<div class="m-2d">
                            <div class="m-2dd center">
                                <div class="ifects ifect13"></div>
                                <a href="javascript:void(0)" onclick="openAddPopup(this)" class="m-2dd1 cor_whi">
                                    <div class="center m-2dd11 blur">
                                        <div class="center m-2dd12">
                                            <h3 data-id="${item.id}">+</h3>
                                        </div>
                                    </div>
                                    <p class="center cor_whi fontsmall">Add New</p>
                                </a>
                            </div>
                        </div>`;
        }

        content += `</div>
                    </div>
                </div>`;
    });

    if(window.admin == true){
        content += `<div id="hodata">
                    <div style="height: 1px;"></div>
                    <div class="m-0">
                        <div class="pointer">
                            <div class="ifects ifect12"></div>
                            <div class="m-1 center welf cor_whi blur">
                                <h2 onclick="openHeadPopup()">Add Section</h2>
                            </div>
                        </div>
                    </div></div>`;
    }
    cheader.innerHTML += content; // Update innerHTML once
});

