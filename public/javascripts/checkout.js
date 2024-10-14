function populateAddress() {
    var selectedOption = document.getElementById('addressSelect').selectedOptions[0];

    // Get data attributes
    var fullName = selectedOption.getAttribute('data-fullname');
    var address = selectedOption.getAttribute('data-address');
    var pincode = selectedOption.getAttribute('data-pincode');
    var phone = selectedOption.getAttribute('data-phone');

    // Populate the form fields
    document.getElementById('fullName').value = fullName;
    document.getElementById('address').value = address;
    document.getElementById('pincode').value = pincode;
    document.getElementById('phone').value = phone;
}

function validateForm() {
    let valid = true;
    clearErrors();


    // Validate Full Name
    const fullName = document.getElementById('fullName').value.trim();
    if (fullName === "") {
        showError('nameError', 'Full Name is required.');
        valid = false;
    }

    // Validate Address
    const address = document.getElementById('address').value.trim();
    const addressRegex = /^[^,]+,[^,]+,[^,]+,[^,]+$/; // Matches "Address,state,district,place"

    if (address === "") {
        showError('addressFieldError', 'Address is required.');
        valid = false;
    } else if (!addressRegex.test(address)) {
        showError('addressFieldError', 'Address must be in the format: Address,state,district,place.');
        valid = false;
    }

    // Validate Pincode
    const pincode = document.getElementById('pincode').value.trim();
    if (pincode === "") {
        showError('pincodeError', 'Pincode is required.');
        valid = false;
    } else if (!/^\d{6}$/.test(pincode)) {
        showError('pincodeError', 'Pincode must be 6 digits.');
        valid = false;
    }

    // Validate Phone Number
    const phone = document.getElementById('phone').value.trim();
    if (phone === "") {
        showError('phoneError', 'Phone Number is required.');
        valid = false;
    } else if (!/^\d+$/.test(phone)) {
        showError('phoneError', 'Phone Number must be numeric.');
        valid = false;
    }

    return valid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.text-danger');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

document.getElementById('checkoutForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Validate form
    if (validateForm()) {
        const selectedAddress = document.getElementById('addressSelect').value;
        const fullName = document.getElementById('fullName').value;
        const address = document.getElementById('address').value;
        const pincode = document.getElementById('pincode').value;
        const phone = document.getElementById('phone').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        // Create the body to send
        const requestBody = {
            selectedAddress,
            fullName,
            address,
            pincode,
            phone,
            paymentMethod
        };

        // Submit the form via Axios
        axios.post(`/checkout/submit/<%= user._id %>`, requestBody)
            .then(response => {
                const orderId = response.data.orderId;
                console.log(orderId);
                // Redirect to order confirmation page if successful
                window.location.href = `/order/confirmation/${orderId}`;
            })
            .catch(error => {
                if (error.response && error.response.data.message) {
                    // Show SweetAlert if there are out-of-stock products
                    Swal.fire({
                        icon: 'error',
                        title: 'Out of Stock',
                        text: error.response.data.message,
                    });
                } else {
                    // Handle any other error
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'An error occurred while processing your order.',
                    });
                }
            });
    }
});