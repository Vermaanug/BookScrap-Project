const signupForm = document.querySelector(".Box");
const successMessage = document.getElementById("success-message");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const Firstname = document.getElementById("Firstname").value;
  const Lastname = document.getElementById("Lastname").value;
  const username = document.getElementById("text").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const data = {
    Firstname: Firstname,
    Lastname: Lastname,
    username: username,
    email: email,
    password: password,
  };

  try {
    const response = await fetch("/Signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      document.getElementById("Firstname").value = "";
      document.getElementById("Lastname").value = "";
      document.getElementById("text").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
      Swal.fire({
        icon: "success",
        width: 400,
        text: "Sign Up Sucessfully",
      });
    } else {
      console.error("Error during signup:", response.statusText);
    }
  } catch (error) {
    console.error("Error during signup:", error);
  }

});

