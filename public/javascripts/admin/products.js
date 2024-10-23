




//list unlist functions
function toggleProduct(productId) {
  const isListedButton = document.querySelector(`button[onclick="toggleProduct('${productId}')"]`);

  const isListed = isListedButton.classList.contains('listed');
  const actionText = isListed ? 'Unlist' : 'List'; 

  // SweetAlert confirmation dialog
  swal({
    title: `Are you sure you want to ${actionText.toLowerCase()} this product?`,
    icon: "warning",
    buttons: true,
    dangerMode: true,
  })
  .then((willToggle) => {
    if (willToggle) {
      // If confirmed, make the axios request
      axios.post(`/admin/products/${productId}`, { isListed: !isListed })
        .then(response => {
          if (response.data.success) {
            // Toggle button text and status based on the new state
            isListedButton.classList.toggle('listed', !isListed);
            isListedButton.classList.toggle('unlisted', isListed);
            isListedButton.textContent = isListed ? 'List' : 'Unlist';
          } else {
            // Show error alert if something went wrong
            swal("Error", response.data.message || 'Error updating product status.', "error");
          }
        })
        .catch(error => {
          console.error('Error toggling product listing:', error);
          // Show error alert if the request fails
          swal("Error", 'An error occurred while updating the product status. Please try again.', "error");
        });
    } else {
      // Cancelled the action
      swal("Action cancelled", "Your product status is unchanged", "info");
    }
  });
}



// Modal handling
document.getElementById('addProductBtn').addEventListener('click', function () {
  document.getElementById('addProductModal').style.display = 'block';
});


function closeModal() {
  document.getElementById('addProductModal').style.display = 'none';
}






//edit modal
function editProduct(productId) {
  console.log(productId);
  
  fetch(`/admin/products/${productId}`)
      .then(response => response.json())
      .then(product => {
          // Populate the form fields with the product data
          document.getElementById('editProductId').value = product._id;
          document.getElementById('editName').value = product.name;
          document.getElementById('editDescription').value = product.description;
          document.getElementById('editStock').value = product.stock;
          document.getElementById('editPrice').value = product.price;
          document.getElementById('editColors').value = product.colors.join(',');

          // Display current images
          const currentImagesContainer = document.getElementById('editCurrentImages');
          currentImagesContainer.innerHTML = ''; // Clear previous images

          if (Array.isArray(product.images) && product.images.length > 0) {
              product.images.forEach((image, index) => {
                  const imgWrapper = document.createElement('div');
                  imgWrapper.style.display = 'inline-block';
                  imgWrapper.style.position = 'relative';
                  imgWrapper.style.margin = '10px';

                  const imgElement = document.createElement('img');
                  imgElement.src = `../${image}`;
                  imgElement.alt = `Product Image ${index + 1}`;
                  imgElement.style.width = '100px';

                  const imageInput = document.createElement('input');
                  imageInput.type = 'file';
                  imageInput.accept = 'image/*';
                  imageInput.style.display = 'block';
                  imageInput.required = false;

                  // Crop and preview new image
                  imageInput.onchange = function(event) {
                      const file = event.target.files[0];
                      if (file) {
                          const reader = new FileReader();
                          reader.onload = function(e) {
                              imgElement.src = e.target.result; // Preview new image
                          };
                          reader.readAsDataURL(file);
                      }
                  };

                  imgWrapper.appendChild(imgElement);
                  imgWrapper.appendChild(imageInput);
                  currentImagesContainer.appendChild(imgWrapper);
              });
          }

          // Show the edit modal
          document.getElementById('editProductModal').style.display = 'block';
      })
      .catch(error => console.error('Error fetching product:', error));
}

function closeEditModal() {
  document.getElementById('editProductModal').style.display = 'none';
}

document.getElementById('editProductForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission

  const editProductId = document.getElementById('editProductId').value.trim();
  const editName = document.getElementById('editName').value.trim();
  const editDescription = document.getElementById('editDescription').value.trim();
  const editCategoryID = document.getElementById('editCategoryID').value.trim();
  const editStock = document.getElementById('editStock').value.trim();
  const editPrice = document.getElementById('editPrice').value.trim();
  const editColors = document.getElementById('editColors').value.trim().split(',');

  // Create a FormData object
  const formData = new FormData();

  // Append the regular fields
  formData.append('name', editName);
  formData.append('description', editDescription);
  formData.append('categoryID', editCategoryID);
  formData.append('stock', editStock);
  formData.append('price', editPrice);
  formData.append('colors', JSON.stringify(editColors)); // Convert array to string if needed

  // Append the files (images)
  const imageInputs = document.querySelectorAll('#editCurrentImages input[type="file"]');

  imageInputs.forEach((input, index) => {
      const file = input.files[0];
      if (file) {
          formData.append(`croppedImage[]`, file); // Append the file to FormData
      }
  });

  // Send a PATCH request to update the product
  axios.patch(`/admin/products/${editProductId}`, formData, {
      headers: {
          'Content-Type': 'multipart/form-data'
      }
  })
  .then(response => {
      console.log('Product updated successfully:', response.data);
      // Close the modal after successful update
      closeEditModal();
      location.reload(); // Reload to see changes
  })
  .catch(error => {
      console.error('Error updating product:', error);
      // Optionally, show an error message to the user
  });
});




//add validation


function validateName() {
  const name = document.getElementById('name').value.trim();
  const nameError = document.getElementById('nameError');

  const regex = /^[a-zA-Z0-9\s]+$/;

  if (name.length < 3) {
    nameError.textContent = 'Product name must be at least 3 characters.';
    return false;
  }

  if (!regex.test(name)) {
    nameError.textContent = 'Product name must contain only letters, numbers, and spaces (no special characters).';
    return false;
  }

  nameError.textContent = '';
  return true;
}


function validateDescription() {
  const description = document.getElementById('description').value.trim();
  const descriptionError = document.getElementById('descriptionError');
  if (description.length < 10) {
      descriptionError.textContent = 'Description must be at least 10 characters.';
      return false;
  }
  descriptionError.textContent = '';
  return true;
}

function validateCategory() {
  const categoryID = document.getElementById('categoryID').value;
  const categoryError = document.getElementById('categoryError');
  if (categoryID === '') {
      categoryError.textContent = 'Please select a category.';
      return false;
  }
  categoryError.textContent = '';
  return true;
}

function validateStock() {
  const stock = document.getElementById('stock').value;
  const stockError = document.getElementById('stockError');
  if (stock === '' || stock < 0) {
      stockError.textContent = 'Stock must be a non-negative number.';
      return false;
  }
  stockError.textContent = '';
  return true;
}

function validatePrice() {
  const price = document.getElementById('price').value;
  const priceError = document.getElementById('priceError');
  if (price === '' || price <= 0) {
      priceError.textContent = 'Price must be a positive number.';
      return false;
  }
  priceError.textContent = '';
  return true;
}

function validateColors() {
  const colors = document.getElementById('colors').value.trim();
  const colorsError = document.getElementById('colorsError');
  if (colors === '') {
      colorsError.textContent = 'Please enter at least one color (comma-separated).';
      return false;
  }
  colorsError.textContent = '';
  return true;
}

function validateImages() {
  const imageInput = document.getElementById('image-input');
  const imageError = document.getElementById('imagesError');
  const files = imageInput.files;
  if (files.length !== 3) {
      imageError.textContent = 'Please select exactly 3 images.';
      return false;
  }
  imageError.textContent = '';
  return true;
}


function validateForm() {
  const isValidName = validateName();
  const isValidDescription = validateDescription();
  const isValidCategory = validateCategory();
  const isValidStock = validateStock();
  const isValidPrice = validatePrice();
  const isValidColors = validateColors();
  const isValidImages = validateImages();


  if (isValidName && isValidDescription && isValidCategory && isValidStock && isValidPrice && isValidColors && isValidImages) {
      return true;
  } else {
      return false;
  }
}




//edit validation


function validateEditName() {
  const name = document.getElementById('editName').value.trim();
  const nameError = document.getElementById('editNameError');

  
  const regex = /^[a-zA-Z0-9\s]+$/;

  if (name.length < 3) {
    nameError.textContent = 'Product name must be at least 3 characters long.';
    return false;
  }

  
  if (!regex.test(name)) {
    nameError.textContent = 'Product name can only contain letters, numbers, and spaces (no special characters).';
    return false;
  }

  nameError.textContent = '';
  return true;
}

function validateEditDescription() {
  const description = document.getElementById('editDescription').value.trim();
  const descriptionError = document.getElementById('editDescriptionError');
  if (description.length < 10) {
      descriptionError.textContent = 'Description must be at least 10 characters long.';
      return false;
  }
  descriptionError.textContent = '';
  return true;
}

function validateEditCategory() {
  const categoryID = document.getElementById('editCategoryID').value;
  const categoryError = document.getElementById('editCategoryError');
  if (categoryID === '') {
      categoryError.textContent = 'Please select a category.';
      return false;
  }
  categoryError.textContent = '';
  return true;
}

function validateEditStock() {
  const stock = document.getElementById('editStock').value;
  const stockError = document.getElementById('editStockError');
  if (stock === '' || stock < 0) {
      stockError.textContent = 'Stock must be a non-negative number.';
      return false;
  }
  stockError.textContent = '';
  return true;
}

function validateEditPrice() {
  const price = document.getElementById('editPrice').value;
  const priceError = document.getElementById('editPriceError');
  if (price === '' || price <= 0) {
      priceError.textContent = 'Price must be a positive number.';
      return false;
  }
  priceError.textContent = '';
  return true;
}

function validateEditColors() {
  const colors = document.getElementById('editColors').value.trim();
  const colorsError = document.getElementById('editColorsError');
  if (colors === '') {
      colorsError.textContent = 'Please enter at least one color (comma-separated).';
      return false;
  }
  colorsError.textContent = '';
  return true;
}

function validateEditImages() {
  const imageInput = document.getElementById('editImageInput');
  const imageError = document.getElementById('editImagesError');
  const files = imageInput.files;
  if (files.length !== 3) {
      imageError.textContent = 'Please select exactly 3 images.';
      return false;
  }
  imageError.textContent = '';
  return true;
}

// Final form validation before submission
function validateEditProductForm() {
  const isValidName = validateEditName();
  const isValidDescription = validateEditDescription();
  const isValidCategory = validateEditCategory();
  const isValidStock = validateEditStock();
  const isValidPrice = validateEditPrice();
  const isValidColors = validateEditColors();
  const isValidImages = validateEditImages();

  // Only submit the form if all validations pass
  if (isValidName && isValidDescription && isValidCategory && isValidStock && isValidPrice && isValidColors && isValidImages) {
      return true;
  } else {
      return false;
  }
}
