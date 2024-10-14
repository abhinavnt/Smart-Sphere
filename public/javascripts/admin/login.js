document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Clear previous errors
    document.getElementById('formMessage').innerText = '';

    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Frontend validation for empty fields
    if (!email || !password) {
        document.getElementById('formMessage').innerText = 'User not found';
        return; // Prevent form submission if validation fails
    }

    try {
        // Make Axios request if no frontend validation errors
        const response = await axios.post('/login', {
            email: email,
            password: password
        });

        // Handle success: Redirect to home or dashboard
        if (response.data.success) {
            window.location.href = response.data.redirectUrl;
        }
    } catch (error) {
        if (error.response && error.response.data) {
            // Handle errors returned by the backend
            const errorMessage = error.response.data.message;

            // Display error message
            document.getElementById('formMessage').innerText = errorMessage;
        } else {
            // Handle any unexpected errors
            document.getElementById('formMessage').innerText = 'An unexpected error occurred. Please try again later.';
        }
    }
});

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}