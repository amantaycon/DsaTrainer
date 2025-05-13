
// Open the edit popup
function openEditPopup(element) {
    let item = element.closest('.m-0');
    let editPopup = document.getElementById('editPopup');

    document.getElementById('editTitle').value = item.querySelector('h2').innerText;
    editPopup.dataset.targetId = item.dataset.id; // Store item's data-id instead of the whole element

    $("#editPopup").fadeIn();
}

// Save the edited data
function saveEdit() {
    let editPopup = document.getElementById('editPopup');
    let targetId = editPopup.dataset.targetId;

    let item = document.querySelector(`[data-id='${targetId}']`); // Get the original item
    if (item) {
        // Send data to backend
        $.post("/home/featured/update", { id: item.querySelector('h2').dataset.id, title: document.getElementById('editTitle').value }, (response) => {
            item.querySelector('h2').innerText = document.getElementById('editTitle').value;
        });
    }

    $("#editPopup").fadeOut();


}

// Delete the header
function deleteHeader() {
    let editPopup = document.getElementById('editPopup');
    let targetId = editPopup.dataset.targetId;
    let item = document.querySelector(`[data-id='${targetId}']`); // Get the original item
    if (item) {
        $.post(`/home/featured/delete`, { id: item.querySelector('h2').dataset.id }, (response) => {
            item.closest('.hodata').remove();
        });
    }
    $("#editPopup").fadeOut();
}

// Open the header popup
function openHeadPopup() {
    document.getElementById('addPopup').style.display = 'block';
}

// Save the header data
function saveHeadData() {
    const title = document.getElementById('addHeadTitle').value;

    if (title) {
        $.post('/home/featured/header', { title }, (response) => {
            console.log(response);
            window.location.reload();
        });
    }
    closePopup();
}

// Open the add sub header popup
function openAddPopup(event) {
    document.getElementById('addsubPopup').style.display = 'block';
    document.getElementById('addsubPopup').dataset.targetId = event.querySelector('h3').dataset.id;
}

// Save the sub header data
function saveSubData() {
    const name = document.getElementById('newName').value;
    const link = document.getElementById('newLink').value;
    const slogan = document.getElementById('newDesc').value;
    const featuredId = document.getElementById('addsubPopup').dataset.targetId;

    if (name && link && featuredId) {
        $.post('/home/featured/subheader', { featuredId, name, slogan, link }, (response) => {
            window.location.reload();
        });
        closePopup();
    } else {
        alert('Please enter valid details.');
    }
}

// Open subheader edit popup
function openSubEditPopup(event, elem) {
    event.preventDefault();
    let subItem = elem.closest('.m-2dd');
    document.getElementById('subTitle').value = subItem.querySelector('h3').innerText;
    document.getElementById('subLink').value = subItem.querySelector('a').href;
    document.getElementById('subDesc').value = subItem.querySelector('p').innerText;
    document.getElementById('subEditPopup').dataset.targetId = subItem.dataset.id;
    document.getElementById('subEditPopup').style.display = 'block';
}

// save and update subheader data
function saveSubEdit() {
    const subItemId = document.getElementById('subEditPopup').dataset.targetId;
    const subItem = document.querySelector(`[data-id='${subItemId}']`);

    const id = subItem.querySelector('h3').dataset.id;
    const name = document.getElementById('subTitle').value;
    const slogan = document.getElementById('subDesc').value;
    const link = document.getElementById('subLink').value;
    $.post('/home/featured/subheader/update',{id, name, slogan, link}, (response)=>{
        subItem.querySelector('h3').innerText = name;
        subItem.querySelector('a').href = link;
        subItem.querySelector('p').innerText = slogan;
    });
    closePopup();
}

function deletePopup(){
    const subItemId = document.getElementById('subEditPopup').dataset.targetId;
    const subItem = document.querySelector(`[data-id='${subItemId}']`);
    $.post('/home/featured/subheader/delete', {id: subItem.querySelector('h3').dataset.id}, (response)=>{
        subItem.closest('.m-2d').remove();
    });
    closePopup();
}


function closePopup() {
    document.querySelectorAll('.popup').forEach(popup => popup.style.display = 'none');
}


