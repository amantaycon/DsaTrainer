// work all setting page task
let cropper;
const previewImage = document.getElementById('preview');
const fileInput = document.getElementById('uphoto');
const cropButton = document.getElementById('cropButton');
const dpblock = document.getElementById('prephoto');
// hide floting post creation div
function hidefloat() {
    dpblock.style.display = "none";
}
//if click any other side of floting div then hide it
document.addEventListener('click', function (event) {
    if (!dpblock.contains(event.target)) {
        hidefloat();
    }
});

//if file is input in input tag then show the preview
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            dpblock.style.display = 'block';

            // Initialize Cropper.js after image loads
            if (cropper) {
                cropper.destroy();  // Destroy previous cropper instance
            }
            cropper = new Cropper(previewImage, {
                aspectRatio: 1,  // Square aspect ratio for profile pictures
                viewMode: 1,
            });

            cropButton.style.display = 'inline-block'; // Show crop button
        };
        reader.readAsDataURL(file);
    }
});
// Handle crop and upload
cropButton.addEventListener('click', async () => {
    if (cropper) {
        // Get cropped image data as a Blob
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300
        });
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('profilePicture', blob, 'profile-picture.png');
            // Send cropped image to server
            $.ajax({
                url: 'upload',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    location.reload();
                },
                error: function (xhr, status, error) {
                    alert('Error uploading the file: ' + error);
                }
            });

        });
    }
});

//update user setting data
function updateData(event) {
    event.preventDefault(); // prevent form from submitting normally
    var data = {
        username: document.getElementById('username').value,
        fullname: document.getElementById('fullname').value,
        gender: document.getElementById('gender').value,
        notification: document.getElementById('notification').value,
        bio: document.getElementById('bio').value,
        theme: document.getElementById('theme').value,
    };

    // Send data using POST
    $.post("setting", data, function (response) {
        console.log(response);
        location.reload(); // reload the page after successful post
    });
}

//chack user name avalable or not
function userurlChanged(element) {
    var userurl = { userurl: element.value };
    $.post('checkuserurl', userurl, function (res) {
        if (res) {
            element.style.color = 'var(--darkblue)';
            element.style.border = '2px solid var(--orange_light)';
        }
        else {
            element.style.color = 'red';
            element.style.border = '2px solid red';
        }
    })
}
