const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const togglePasswordButton = document.getElementById("togglePassword");
const toggleConfirmPasswordButton = document.getElementById(
  "toggleConfirmPassword"
);
const form = document.getElementById("createAccountForm");

// Toggle password visibility for both password and confirm password fields
togglePasswordButton.addEventListener("click", function () {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePasswordButton.textContent = type === "password" ? "Show" : "Hide";
});

toggleConfirmPasswordButton.addEventListener("click", function () {
  const type =
    confirmPasswordInput.getAttribute("type") === "password"
      ? "text"
      : "password";
  confirmPasswordInput.setAttribute("type", type);
  toggleConfirmPasswordButton.textContent =
    type === "password" ? "Show" : "Hide";
});

// Real-time validation for inputs
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);
confirmPasswordInput.addEventListener("input", validateConfirmPassword);

// Email validation
function validateEmail() {
  const email = emailInput.value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email)) {
    showValid(emailInput);
    document.getElementById("emailError").style.display = "none";
  } else {
    document.getElementById("emailError").style.display = "block";
    emailInput.classList.remove("valid-blink");
  }
}

// Password validation
function validatePassword() {
  const password = passwordInput.value;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  if (passwordRegex.test(password)) {
    showValid(passwordInput);
    document.getElementById("passwordError").style.display = "none";
  } else {
    document.getElementById("passwordError").style.display = "block";
    passwordInput.classList.remove("valid-blink");
  }
  validateConfirmPassword(); // Validate confirm password in case user changes main password
}

// Confirm Password validation
function validateConfirmPassword() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  if (password === confirmPassword && confirmPassword.length > 0) {
    showValid(confirmPasswordInput);
    document.getElementById("confirmPasswordError").style.display = "none";
  } else {
    document.getElementById("confirmPasswordError").style.display = "block";
    confirmPasswordInput.classList.remove("valid-blink");
  }
}

// Function to add green blink effect on valid input
function showValid(inputElement) {
  inputElement.classList.add("valid-blink");
}

// Final form validation on submit
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent default form submission

  // Re-validate all fields on submit
  validateEmail();
  validatePassword();
  validateConfirmPassword();

  // Check if there are any visible error messages
  const emailErrorVisible =
    document.getElementById("emailError").style.display !== "none";
  const passwordErrorVisible =
    document.getElementById("passwordError").style.display !== "none";
  const confirmPasswordErrorVisible =
    document.getElementById("confirmPasswordError").style.display !== "none";

  // If no errors are visible, submit the form
  if (
    !emailErrorVisible &&
    !passwordErrorVisible &&
    !confirmPasswordErrorVisible
  ) {
    form.submit(); // Submit the form programmatically
  }
});
