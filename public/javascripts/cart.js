//remove cart
document.querySelectorAll(".remove-item").forEach((button) => {
  button.addEventListener("click", function () {
    const itemId = this.getAttribute("data-id"); // Get the item ID
    const userId = window.userId; // Get user ID from session or context

    // Show SweetAlert confirmation dialog
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to remove this item from the cart?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // If user confirms, send the request to remove the item
        axios
          .patch(`/cart/remove/${userId}`, { itemId })
          .then((response) => {
            if (response.data.success) {
              location.reload(); // Reload the page to reflect changes
            } else {
            }
          })
          .catch((error) => {});
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const cartItems = document.querySelectorAll(".table_row");

  cartItems.forEach((item) => {
    const quantityInput = item.querySelector(".num-product");
    const increaseButton = item.querySelector(".btn-num-product-up");
    const decreaseButton = item.querySelector(".btn-num-product-down");
    const itemId = item.querySelector(".remove-item").getAttribute("data-id");
    const productId = item
      .querySelector(".remove-item")
      .getAttribute("data-productId");

    increaseButton.addEventListener("click", async () => {
      let currentQuantity = parseInt(quantityInput.value);
      const availableStock = await checkStock(productId);

      if (currentQuantity <= 5 && currentQuantity <= availableStock) {
        quantityInput.value = currentQuantity;
        updateCartTotal();
        updateCartItemQuantity(itemId, currentQuantity);
        Swal.fire(
          "Maximum Limit Reached",
          "You cannot add more than 5 items!",
          "warning"
        );
      } else if (currentQuantity > availableStock) {
        Swal.fire(
          "Stock Limit Reached",
          "You cannot exceed available stock!",
          "warning"
        ).then(() => {
          location.reload();
        });
      }
    });

    decreaseButton.addEventListener("click", () => {
      let currentQuantity = parseInt(quantityInput.value);

      if (currentQuantity >= 1) {
        quantityInput.value = currentQuantity;
        updateCartTotal();
        updateCartItemQuantity(itemId, currentQuantity);
      }
    });

    quantityInput.addEventListener("input", () => {
      let currentQuantity = parseInt(quantityInput.value);
      if (isNaN(currentQuantity) || currentQuantity < 1) {
        quantityInput.value = 1;
        currentQuantity = 1;
      } else if (currentQuantity > 5) {
        Swal.fire(
          "Maximum Limit Reached",
          "You cannot add more than 5 items!",
          "warning"
        );
        quantityInput.value = 5;
        currentQuantity = 5;
      }

      updateCartTotal();
      updateCartItemQuantity(itemId, currentQuantity);
    });
  });

  function updateCartTotal() {
    let cartTotal = 0;

    cartItems.forEach((item) => {
      const quantity = parseInt(item.querySelector(".num-product").value);
      const price = parseFloat(
        item.querySelector(".column-3").textContent.replace("₹", "")
      );
      const itemTotal = price * quantity;
      3;
      cartTotal += itemTotal;
      item.querySelector(".column-5").textContent = "₹" + itemTotal;
    });

    document.querySelector(".mtext-110.cl2").textContent = "₹" + cartTotal;
  }

  async function checkStock(productId) {
    try {
      const response = await axios.post(`/cart/check-stock/${productId}`);
      return response.data.availableStock;
    } catch (error) {
      return 0;
    }
  }

  function updateCartItemQuantity(itemId, quantity) {
    axios
      .patch(`/cart/update/${userId} `, { itemId, quantity })
      .then((response) => {
        if (!response.data.success) {
        }
      })
      .catch((error) => {});
  }
});


