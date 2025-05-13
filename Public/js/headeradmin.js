$(document).ready(function () {
    // Show the popup
    $("#openPopup").click(function () {
        $("#popup").fadeIn();
        $("#overlay").fadeIn();
        $.get("/home/headerlist", (data) => {
            $("#inputFields").html("");
            data.forEach((item) => {
                $("#inputFields").append(`
                    <div>
                        <input class="classinput" type="text" name="title[]" value="${item.title}" required>
                        <input class="classinput" type="url" name="url[]" value="${item.url}" required>
                    </div>
                `);
            });
        });
    });

    // Close the popup
    $("#closePopup, #overlay").click(function () {
        $("#popup").fadeOut();
        $("#overlay").fadeOut();
    });

    // Add more input fields
    $("#addMore").click(function () {
        $("#inputFields").append(`
                    <div>
                        <input class="classinput" type="text" name="title[]" placeholder="Enter Title" required>
                        <input class="classinput" type="url" name="url[]" placeholder="Enter URL" required>
                    </div>
                `);
    });

    // Save data and send to backend
    $("#saveData").click(function () {
        let data = [];
        $("#inputFields div").each(function () {
            let title = $(this).find("input[name='title[]']").val();
            let url = $(this).find("input[name='url[]']").val();
            if (title && url) {
                data.push({ title: title, url: url });
            }
        });

        $.post("/home/headerlist", { headerList: data }, (response) => {
            window.location.reload();
            $("#popup").fadeOut();
            $("#overlay").fadeOut();
        });
    });
});