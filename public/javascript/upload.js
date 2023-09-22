document.addEventListener("DOMContentLoaded", function() {

  let uploadButton = document.getElementById("upload-button");
  let chosenImage = document.getElementById("chosen-image");
  let fileName = document.getElementById("file-name");

  uploadButton.onchange = () => {
    let reader = new FileReader();
    reader.readAsDataURL(uploadButton.files[0]);
    reader.onload = () => {
      chosenImage.setAttribute("src", reader.result);
    }
    fileName.textContent = uploadButton.files[0].name;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  let chosenImage = document.getElementById("chosen-image");
  let fileName = document.getElementById("file-name");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      // Create a new FormData object to store form data and files
      const formData = new FormData(form);

      // Send the data to the server
      const response = await fetch("/submit-form", {
        method: "POST",
        body: formData, // Use the FormData object here
      });

      if (response.ok) {
          
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Book information has been successfully stored.",
        });

      form.reset();
      chosenImage.removeAttribute("src"); // Remove the 'src' attribute to clear the image
      fileName.textContent = "";
      } else {
        console.error("Server validation errors or other errors:", response);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});

