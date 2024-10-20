// order details view
document.addEventListener("DOMContentLoaded", function () {
  const viewOrderButtons = document.querySelectorAll(".viewOrder");

  viewOrderButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-id");
      
      axios.get(`/admin/${orderId}/details`)
        .then((response) => {
          const order = response.data;
          console.log(order);
          

          
          document.getElementById("orderedDate").innerText = new Date(order.orderedDate).toLocaleDateString();
          document.getElementById("orderStatus").innerText = order.orderStatus;
          document.getElementById("orderID").innerText = order.orderid;
          document.getElementById("shippingAddress").innerText = `${order.shippingAddress.fullname}, ${order.shippingAddress.address}, ${order.shippingAddress.pincode}`;

          const productsContainer = document.getElementById("orderedProducts");
          productsContainer.innerHTML = ""; 

          order.items.forEach((item) => {
            productsContainer.innerHTML += `
              <div class="col-md-4">
                <div class="card mb-3">
                 <p class="card-text">Quantity: ${order._id}</p>
                  <img src="/${item.productID.images[0]}" class="card-img-top" alt="${item.productID.name}">
                  <div class="card-body">
                    <h5 class="card-title">${item.productID.name}</h5>
                    <p class="card-text">Price: ₹${item.productID.price}</p>
                    <p class="card-text">Quantity: ${item.quantity}</p>
                    <button class="btn btn-danger" onclick="cancelProduct('${order._id}', '${item.productID._id}')">Cancel Product</button>
                  </div>
                </div>
              </div>
            `;
          });

          document.getElementById("totalAmount").innerText = `₹${order.totalAmount}`;

        
          const modal = new bootstrap.Modal(document.getElementById("orderDetailModal"));
          modal.show();
        })
        .catch((error) => {
          console.error("Error fetching order details:", error);
          alert("An error occurred while fetching order details.");
        });
    });
  });
});


// Function to cancel a specific product
document.addEventListener("DOMContentLoaded", function () {
  const cancelProductButtons = document.querySelectorAll(".cancelProduct");

  cancelProductButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-orderid");
      const productId = this.getAttribute("data-productid");

      
      Swal.fire({
        title: 'Cancel Product',
        text: 'Please select a reason for cancellation:',
        input: 'select',
        inputOptions: {
          'Not needed anymore': 'Not needed anymore',
          'Found a better price': 'Found a better price',
          'Ordered by mistake': 'Ordered by mistake',
          'Product not available': 'Product not available',
          'Other': 'Other'
        },
        inputPlaceholder: 'Select a reason',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to select a reason for cancellation!';
          }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const reason = result.value;
          axios
            .post(`/order/cancel/${orderId}/${productId}`, { reason })
            .then((response) => {
              Swal.fire("Cancelled!", response.data.message, "success").then(() => {
                location.reload();
              });
            })
            .catch((error) => {
              Swal.fire("Error!", error.response?.data?.message || "Something went wrong!", "error");
            });
        }
      });
    });
  });
});




//retuern product
document.addEventListener("DOMContentLoaded", function () {
  const returnProductButtons = document.querySelectorAll(".returnProduct");

  // Function to handle return product
  function handleReturnProduct(orderId, productId) {
    Swal.fire({
      title: 'Return Product',
      text: 'Please select a reason for return:',
      input: 'select',
      inputOptions: {
        'Damaged product': 'Damaged product',
        'Wrong product delivered': 'Wrong product delivered',
        'Product quality issue': 'Product quality issue',
        'Other': 'Other'
      },
      inputPlaceholder: 'Select a reason',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a reason for return!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value;
        axios
          .post(`/order/return/${orderId}/${productId}`, { reason })
          .then((response) => {
            Swal.fire("Returned!", response.data.message, "success").then(() => {
              location.reload();
            });
          })
          .catch((error) => {
            Swal.fire("Error!", error.response?.data?.message || "Something went wrong!", "error");
          });
      }
    });
  }

  // Attach event listener to all returnProduct buttons
  returnProductButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-orderid");
      const productId = this.getAttribute("data-productid");
      handleReturnProduct(orderId, productId);
    });
  });
});





//adress modal
document.addEventListener("DOMContentLoaded", function () {
  const addressModal = new bootstrap.Modal(
    document.getElementById("addressModal")
  );
  const addressForm = document.getElementById("addressForm");
  const openModalBtn = document.getElementById("openAddressModal");
  const closeModalBtns = document.querySelectorAll(
    "#closeModal, #closeModalFooter"
  );
  const submitAddressBtn = document.getElementById("submitAddress");



  // Handle delete address
  addressList.addEventListener("click", function (e) {
    if (e.target.classList.contains("deleteAddress")) {
      const addressId = e.target.dataset.id;
      const confirmation = confirm(
        "Are you sure you want to delete this address?"
      );
      if (confirmation) {
        axios
          .delete(`/daleteAddress/${addressId}`)
          .then((response) => {
            console.log(response.data.message);

            e.target.closest("li").remove();
          })
          .catch((error) => {
            console.error("Error deleting address:", error);
          });
      }
    }
  });



  // Open modal for adding a new address
  openModalBtn.addEventListener("click", function () {
    addressForm.reset();
    clearValidationMessages();
    document.getElementById("addressId").value = "";
    document.getElementById("addressModalLabel").innerText = "Add New Address";
    submitAddressBtn.innerText = "Add Address";
    addressModal.show();
  });




  // Close modal
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      addressModal.hide(); // Use Bootstrap method to hide the modal
    });
  });



  // Handle Add/Edit Address
  submitAddressBtn.addEventListener("click", function () {
    const addressId = document.getElementById("addressId").value;
    if (addressId) {
      editAddress(addressId);
    } else {
      addAddress();
    }
  });




  // Open modal to edit an address
  document
    .getElementById("addressList")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("editAddress")) {
        const button = e.target;
        document.getElementById("addressId").value = button.dataset.id;
        document.getElementById("fullName").value = button.dataset.fullname;
        document.getElementById("phone").value = button.dataset.phone;
        document.getElementById("address").value = button.dataset.address;
        document.getElementById("district").value = button.dataset.district;
        document.getElementById("city").value = button.dataset.city;
        document.getElementById("state").value = button.dataset.state;
        document.getElementById("pincode").value = button.dataset.pincode;
        document.getElementById("country").value = button.dataset.country;
        document.getElementById("addressType").value = button.dataset.type;

        document.getElementById("addressModalLabel").innerText = "Edit Address";
        submitAddressBtn.innerText = "Update Address";
        addressModal.show();
      }
    });

  // to add address
  function addAddress() {
    const addressData = getAddressData();
    if (validateForm(addressData)) {
      console.log(userId);

      axios
        .post(`/addAddress/${userId}`, addressData)
        .then((response) => {
          console.log("Address added:", response.data);
          addressModal.hide();
          addressForm.reset();
          location.reload();
        })
        .catch((error) => {
          console.error("Error adding address:", error);
        });
    }
  }

  // edit address

  async function editAddress(addressId) {
    const addressData = getAddressData();
    if (validateForm(addressData)) {
      try {
        const response = await axios.patch(
          `/editAddress/${addressId}`,
          addressData
        );
        if (response.status === 200) {
          console.log("Address updated successfully");
          addressModal.hide();
          addressForm.reset();
          location.reload();
        } else {
          console.error("Failed to update address", response);
        }
      } catch (error) {
        console.error("Error updating address:", error);
      }
    }
  }

  function getAddressData() {
    return {
      fullName: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      district: document.getElementById("district").value.trim(),
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value.trim(),
      pincode: document.getElementById("pincode").value.trim(),
      country: document.getElementById("country").value.trim(),
      type: document.getElementById("addressType").value,
    };
  }

  function validateForm(data) {
    let isValid = true;
    clearValidationMessages();

    if (!data.fullName) {
      displayError("fullNameError", "Full Name cannot be empty or whitespace.");
      isValid = false;
    }
    if (!data.phone) {
      displayError("phoneError", "Phone cannot be empty or whitespace.");
      isValid = false;
    }
    if (!data.phone) {
        displayError("phoneError", "Phone cannot be empty or whitespace.");
        isValid = false;
      } else if (!/^\d{10}$/.test(data.phone)) {
        displayError("phoneError", "Phone number must be exactly 10 digits.");
        isValid = false;
      } else if (/^0{10}$/.test(data.phone)) {
        displayError("phoneError", "Phone number cannot be all zeros.");
        isValid = false;
      } else {
        displayError("phoneError", "");
      }
      
    if (!data.district) {
      displayError("districtError", "District cannot be empty or whitespace.");
      isValid = false;
    }
    if (!data.city) {
      displayError("cityError", "City cannot be empty or whitespace.");
      isValid = false;
    }
    if (!data.state) {
      displayError("stateError", "State cannot be empty or whitespace.");
      isValid = false;
    }
    if (!data.pincode) {
        displayError("pincodeError", "Pincode cannot be empty or whitespace.");
        isValid = false;
      } else if (!/^\d{6}$/.test(data.pincode)) {
        displayError("pincodeError", "Pincode must be exactly 6 digits.");
        isValid = false;
      } else if (/^0{6}$/.test(data.pincode)) {
        displayError("pincodeError", "invalid Pincode ");
        isValid = false;
      } else {
        
        displayError("pincodeError", "");
      }
      
    if (!data.country) {
      displayError("countryError", "Country cannot be empty or whitespace.");
      isValid = false;
    }

    return isValid;
  }

  function displayError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    setTimeout(() => {
      errorElement.innerText = "";
    }, 3000);
  }

  function clearValidationMessages() {
    const errorElements = [
      "fullNameError",
      "phoneError",
      "addressError",
      "districtError",
      "cityError",
      "stateError",
      "pincodeError",
      "countryError",
    ];
    errorElements.forEach((id) => {
      document.getElementById(id).innerText = "";
    });
  }
});




//update user details
document.getElementById("profileForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;

  const updatedDetails = {
    username: username,
    email: email,
  };

  // Use Axios to send a PATCH request to update the profile
  axios
    .patch(`/userDetails/${userId}`, updatedDetails)
    .then((response) => {
      alert("Profile updated successfully!");
    })
    .catch((error) => {
      console.error(error);
      alert("There was an error updating the profile.");
    });
});





// to reset password
document.getElementById('resetPasswordBtn').addEventListener('click', function() {
  const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
  modal.show();
  resetValidationMessages();
});

document.getElementById('submitResetPassword').addEventListener('click', function() {
  validateAndSubmit();
});

document.getElementById('currentEmail').addEventListener('input', validateEmail);
document.getElementById('currentPassword').addEventListener('input', validateCurrentPassword);
document.getElementById('newPassword').addEventListener('input', validateNewPassword);

document.getElementById('toggleCurrentPassword').addEventListener('click', function() {
  togglePasswordVisibility('currentPassword', 'currentPasswordIcon');
});

document.getElementById('toggleNewPassword').addEventListener('click', function() {
  togglePasswordVisibility('newPassword', 'newPasswordIcon');
});

function validateAndSubmit() {
  resetValidationMessages();

  const currentEmail = document.getElementById('currentEmail').value;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  let valid = true;

  if (!currentEmail) {
      showError('currentEmail', 'This field is required');
      valid = false;
  }

  if (!currentPassword) {
      showError('currentPassword', 'This field is required');
      valid = false;
  }

  if (!newPassword) {
      showError('newPassword', 'This field is required');
      valid = false;
  } else {
     
      if (!passwordPattern.test(newPassword)) {
          showError('newPassword', ' ');
          valid = false;
      }
  }

  if (!valid) {
      return;
  }

  const data = {
      email: currentEmail,
      currentPassword: currentPassword,
      newPassword: newPassword
  };

  axios.patch(`/resetPassword/${userId}`, data)
  .then(response => {
      Swal.fire({
          title: 'Success!',
          text: 'Password updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
      }).then(() => {
          location.reload();
      });
  })
  .catch(error => {
      if (error.response) {
          
          Swal.fire({
              title: 'Error!',
              text: error.response.data.message || 'Failed to update password. Please try again.',
              icon: 'error',
              confirmButtonText: 'OK'
          });
      } else {
         
          Swal.fire({
              title: 'Error!',
              text: 'An error occurred. Please try again later.',
              icon: 'error',
              confirmButtonText: 'OK'
          });
      }
  });
}


function validateEmail() {
  const emailField = document.getElementById('currentEmail');
  if (!emailField.value) {
      showError('currentEmail', 'This field is required');
  } else {
      clearError('currentEmail'); 
  }
}

function validateCurrentPassword() {
  const passwordField = document.getElementById('currentPassword');
  if (!passwordField.value) {
      showError('currentPassword', 'This field is required');
  } else {
      clearError('currentPassword');
  }
}

function validateNewPassword() {
  const passwordField = document.getElementById('newPassword');
  const passwordPattern = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;

  if (!passwordField.value) {
      showError('newPassword', 'This field is required');
  } else if (!passwordPattern.test(passwordField.value)) {
      showError('newPassword', 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters. hai hoi');
  } else {
      clearError('newPassword');
  }
}

function togglePasswordVisibility(fieldId, iconId) {
  const passwordField = document.getElementById(fieldId);
  const icon = document.getElementById(iconId);
  const isPasswordVisible = passwordField.type === 'text';
  
  passwordField.type = isPasswordVisible ? 'password' : 'text';
  icon.classList.toggle('bi-eye', !isPasswordVisible);
  icon.classList.toggle('bi-eye-slash', isPasswordVisible);
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const existingError = field.parentNode.querySelector('.form-text.text-danger');
  
  if (!existingError) {
      const errorMessage = document.createElement('small');
      errorMessage.className = 'form-text text-danger';
      errorMessage.innerText = message;
      field.parentNode.appendChild(errorMessage);
  }
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const existingError = field.parentNode.querySelector('.form-text.text-danger');
  
  if (existingError) {
      existingError.remove();
  }
}

function resetValidationMessages() {
  const errorMessages = document.querySelectorAll('.form-text.text-danger');
  errorMessages.forEach(msg => msg.remove());
}
