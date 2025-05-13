// show add new nav popup
function addNewNav() {
    document.getElementById('addsubPopup').style.display = 'block';
}

// close all popup
function closePopup() {
    document.querySelectorAll('.popup').forEach(popup => popup.style.display = 'none');
}

function CreateNav() {
    var title = document.getElementById('title11').value;
    var nav_title = document.getElementById('navtitle').value;
    var keyword = document.getElementById('keyword11').value;
    var description = document.getElementById('description').value;
    var name = window.navName;
    $.post('/content/createnav', { title, nav_title, keyword, description, name }, res => {
        window.location.reload();
    });
}

function editnav(event) {
    var id = event.dataset.id;
    var name = window.navName;
    $.post('/content/nav/data', { id, name }, res => {
        document.getElementById('editsubPopup').style.display = 'block';
        document.getElementById('title111').value = res.title;
        document.getElementById('navtitle1').value = res.nav_title;
        document.getElementById('keyword111').value = res.keyword;
        document.getElementById('description1').value = res.description;
        document.getElementById('editsubPopup').dataset.targetId = id;
    });
}

function updatenavdata() {
    var id = document.getElementById('editsubPopup').dataset.targetId;
    var description = document.getElementById('description1').value;
    var keyword = document.getElementById('keyword111').value;
    var nav_title = document.getElementById('navtitle1').value;
    var title = document.getElementById('title111').value;
    var name = window.navName;

    $.post('/content/updatenav', { title, nav_title, keyword, description, name, id }, res => {
        document.getElementById('editsubPopup').style.display = 'none';
        window.location.reload();
    });
};



let isEditable = false; // Track if the editor is in edit mode

function toggleImageControls(editMode) {
    document.querySelectorAll('.image-control').forEach(button => {
        button.style.display = editMode ? "block" : "none";
    });
}

function openEditor() {
    isEditable = true;
    let editableDiv = document.getElementById('editable');
    toggleImageControls(true);

    // Enable editing mode
    editableDiv.contentEditable = "true";
    editableDiv.style.border = "1px dashed #007bff"; // Highlight editable area
    document.getElementById('editpencil').style.display = "none";
    document.querySelector('.toolbar').style.display = 'block';
}


function closeEditor() {
    let editableDiv = document.getElementById('editable');
    isEditable = false;
    toggleImageControls(false);

    // Disable editing mode
    editableDiv.contentEditable = "false";
    editableDiv.style.border = "none"; // Remove border highlight
    document.querySelector('.toolbar').style.display = 'none';
    document.getElementById('editpencil').style.display = 'block';

}


function execCommand(command, value = null) {
    document.execCommand(command, false, value);
}

function addLink() {
    let url = prompt("Enter URL:");
    if (url) {
        execCommand("createLink", url);
    }
}

function chooseHeader() {
    let headerTag = document.getElementById("headerSelector").value;
    execCommand("formatBlock", headerTag);
}


function chooseColor() {
    let colorClass = document.getElementById("colorSelector").value;
    if (!colorClass) return;

    let selection = window.getSelection();
    if (!selection.rangeCount) return;

    let range = selection.getRangeAt(0);
    let parentNode = range.commonAncestorContainer.parentNode;

    // If selected text is already inside a span, update the class
    if (parentNode.tagName === "SPAN") {
        parentNode.className = colorClass; // Replace class, preventing nested spans
    } else {
        // Create a new span and wrap the selected text
        let span = document.createElement("span");
        span.classList.add(colorClass);
        range.surroundContents(span);
    }
}



let savedSelection = null; // Store selection globally

// Function to save the current selection
function saveSelection() {
    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedSelection = selection.getRangeAt(0);
    }
}


// Function to restore the saved selection
function restoreSelection() {
    if (savedSelection) {
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedSelection);
    }
}

// Listen for toolbar clicks and save the selection
document.querySelector(".toolbar").addEventListener("mousedown", saveSelection);



function changeFontSize() {
    restoreSelection(); // Ensure selection remains after clicking input
    let size = document.getElementById("fontSize").value + "px";
    let selection = window.getSelection();
    if (!selection.rangeCount) return;

    let range = selection.getRangeAt(0);
    let parentNode = range.commonAncestorContainer;

    // Ensure parentNode is an element
    if (parentNode.nodeType === Node.TEXT_NODE) {
        parentNode = parentNode.parentElement;
    }

    // Find the nearest span, or create one if needed
    let targetSpan = parentNode.closest("span");
    if (targetSpan) {
        targetSpan.style.fontSize = size; // Update existing span
    } else {
        let newSpan = document.createElement("span");
        newSpan.style.fontSize = size;
        range.surroundContents(newSpan);
    }
}



function addTable() {
    let r = parseInt(prompt('Enter number of rows'), 10);
    let c = parseInt(prompt('Enter number of columns'), 10);

    if (isNaN(r) || isNaN(c) || r <= 0 || c <= 0) {
        alert("Please enter valid positive numbers for rows and columns.");
        return;
    }

    let tableHTML = `
        <div style="text-align: center;">
            <table style="border-collapse: collapse; border: 1px solid var(--white); margin: auto;">
    `;

    for (let i = 0; i < r; i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < c; j++) {
            tableHTML += `
                <td style="border: 1px solid var(--white); padding: 5px;">
                    Row ${i + 1}, Cell ${j + 1}
                </td>
            `;
        }
        tableHTML += "</tr>";
    }

    tableHTML += "</table></div>";

    document.execCommand("insertHTML", false, tableHTML);
}



function addImage() {
    let input = document.getElementById('imageInput');
    if (!input || !input.files[0]) {
        console.error("No image selected.");
        return;
    }

    let reader = new FileReader();
    reader.onload = function (e) {
        let wrapper = document.createElement("div");
        wrapper.contentEditable = false;
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.alignItems = "center";
        wrapper.style.margin = "10px 0";

        let img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.cursor = "move";

        function createButton(symbol, position, alignValue) {
            let button = document.createElement("button");
            button.innerText = symbol;
            button.classList.add("image-control");
            button.style.position = "absolute";
            button.style[position] = "-25px";
            button.style.top = "50%";
            button.style.transform = "translateY(-50%)";
            button.style.display = isEditable ? "block" : "none"; // Hide by default
            button.onclick = () => {
                wrapper.style.justifyContent = alignValue;
            };
            return button;
        }

        let alignLeft = createButton("⬅️", "left", "flex-start");
        let alignCenter = createButton("🔲", "center", "center");
        let alignRight = createButton("➡️", "right", "flex-end");

        let resizeHandle = document.createElement("div");
        resizeHandle.classList.add("image-control");
        resizeHandle.style.width = "10px";
        resizeHandle.style.height = "10px";
        resizeHandle.style.background = "gray";
        resizeHandle.style.position = "absolute";
        resizeHandle.style.right = "0";
        resizeHandle.style.bottom = "0";
        resizeHandle.style.cursor = "nwse-resize";
        resizeHandle.style.display = isEditable ? "block" : "none"; // Hide by default

        resizeHandle.onmousedown = function (event) {
            event.preventDefault();
            document.onmousemove = function (e) {
                let newWidth = e.clientX - wrapper.getBoundingClientRect().left;
                let newHeight = e.clientY - wrapper.getBoundingClientRect().top;
                if (newWidth > 30) img.style.width = newWidth + "px";
                if (newHeight > 30) img.style.height = newHeight + "px";
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };

        wrapper.appendChild(img);
        wrapper.appendChild(alignLeft);
        wrapper.appendChild(alignCenter);
        wrapper.appendChild(alignRight);
        wrapper.appendChild(resizeHandle);

        let selection = window.getSelection();
        if (selection.rangeCount > 0) {
            let range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(wrapper);
        }
    };
    reader.readAsDataURL(input.files[0]);
}


async function saveContent() {
    const editor = document.getElementById('editable');
    let images = editor.getElementsByTagName('img');
    let imageUploadPromises = [];

    for (let img of images) {
        if (img.src.startsWith("data:")) { // Check if the image is locally loaded (base64)
            let formData = new FormData();
            formData.append("image", dataURLtoFile(img.src, "uploaded_image.png"));

            // Upload the image and get the new URL
            let uploadPromise = fetch('/content/uploadimage', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.url) img.src = data.url; // Replace with uploaded URL
                })
                .catch(error => console.error("Image upload failed:", error));

            imageUploadPromises.push(uploadPromise);
        }
    }

    // Wait for all images to be uploaded and replaced
    await Promise.all(imageUploadPromises);

    // Upload entire editor content after replacing image URLs
    const finalContent = editor.innerHTML;
    
    fetch('/content/pagedata/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content_address: window.content,
            data: finalContent
        })
    }).then(res => res.json())
      .then(() => window.location.reload())
      .catch(error => console.error("Content upload failed:", error));

}


// Helper function to convert base64 image to a File object
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


function CodeBlockSyntax() {
    let language = document.getElementById("codeLanguageSelector").value;
    let selection = window.getSelection();

    if (!selection.rangeCount) return;

    let range = selection.getRangeAt(0);
    let selectedText = range.toString().trim();

    if (!selectedText) {
        alert("Please select some text to format as code.");
        return;
    }

    // Create wrapper to avoid breaking contenteditable
    let wrapper = document.createElement("div");
    wrapper.style.display = "inline-block; width: 100%;"; // Prevent breaking the content flow

    // Create a code block and copy button
    let preBlock = document.createElement("pre");
    let codeElement = document.createElement("code");
    let copyButton = document.createElement("button");

    codeElement.classList.add("hljs", language);
    codeElement.textContent = selectedText;

    copyButton.textContent = "Copy";
    copyButton.classList.add("copy-btn");
    copyButton.onclick = function () {
        navigator.clipboard.writeText(selectedText).then(() => {
            copyButton.textContent = "Copied!";
            setTimeout(() => { copyButton.textContent = "Copy"; }, 1500);
        });
    };

    // Append elements properly
    preBlock.appendChild(copyButton);
    preBlock.appendChild(codeElement);
    wrapper.appendChild(preBlock);

    // Replace selected text with the wrapper instead of preBlock directly
    range.deleteContents();
    range.insertNode(wrapper);

    // Apply syntax highlighting
    hljs.highlightElement(codeElement);
}