const signupForm = document.querySelector(".Box");
const successMessage = document.getElementById("success-message");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("text").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const data = {
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
      successMessage.style.display = "block";
      document.getElementById("text").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    } else {
      console.error("Error during signup:", response.statusText);
    }
  } catch (error) {
    console.error("Error during signup:", error);
  }

});

