const otpInputs = document.querySelectorAll(".otp-input");

otpInputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    if (input.value.length === 1 && !isNaN(input.value)) {
      // Move to the next field if input is valid
      if (index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && index > 0 && input.value === "") {
      otpInputs[index - 1].focus();
    }
  });
});

// Countdown logic
let countdown = sessionStorage.getItem("otpCountdown") || 60;
const timerElement = document.getElementById("timer");
const resendLink = document.getElementById("resend-link");
const didntGetCode = document.getElementById("didnt-get-code");

timerElement.textContent = countdown;

const interval = setInterval(() => {
  countdown--;
  timerElement.textContent = countdown;
  sessionStorage.setItem("otpCountdown", countdown);

  if (countdown <= 0) {
    clearInterval(interval);
    sessionStorage.removeItem("otpCountdown");
    document.getElementById("countdown").style.display = "none";
    resendLink.style.display = "inline";
    didntGetCode.style.display = "block";
  }
}, 1000);

if (countdown <= 0) {
  sessionStorage.removeItem("otpCountdown");
}

otpInputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    if (isNaN(e.target.value) || e.target.value.length > 1) {
      e.target.value = "";
    }
  });
});
