// Get the modal 
var modal = document.getElementById("addCategoryModal");
var openModalBtn = document.getElementById("openModalBtn");
var closeModalBtn = document.getElementById("closeModalBtn");


openModalBtn.onclick = function () {
  modal.style.display = "block";
};


closeModalBtn.onclick = function () {
  modal.style.display = "none";
};


window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

const msg = document.getElementById("msg");
if (msg) {
  setTimeout(() => {
    msg.innerHTML = "";
  }, 3000);
}

//listing or unlisting

const updateCategoryStatus = async (categoryId, isListed) => {
  const url =` /admin/category/${categoryId}`;
  const data = { isListed: !isListed };

  try {
      const response = await axios.patch(url, data);
      console.log('Category status updated:', response.data);
      location.reload();
  } catch (error) {
      console.error('Error updating category status:', error);
    }
};;

// Add event listeners to buttons for listing/unlisting products
document.querySelectorAll('.unlist-btn-category, .list-btn-category').forEach(button => {
  button.addEventListener('click', (event) => {
      const categoryId = event.target.getAttribute('data-category-id'); 
      const isListed = event.target.classList.contains('unlist-btn-category'); 

      const action = isListed ? 'Unlist' : 'List';
      const confirmation = confirm(`Are you sure you want to ${action} this category?`);

      if (confirmation) {
          updateCategoryStatus(categoryId, isListed); 
      }
  });
});


// Modal handling for adding new products
document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openModalBtn");
  const addProductModal = document.getElementById("addProductModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  openModalBtn.addEventListener("click", () => {
    addProductModal.style.display = "block";
  });

  closeModalBtn.addEventListener("click", () => {
    addProductModal.style.display = "none";
  });
});






  
  // Edit category modal handling
  const editButtons = document.querySelectorAll(".edit-btn-category");
  const editCategoryModal = document.getElementById("editCategoryModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const editCategoryForm = document.getElementById("editCategoryForm");
  const editCategoryNameInput = document.getElementById("editCategoryName");

  editButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const categoryId = e.target.getAttribute("data-category-id");
      const categoryName = e.target.getAttribute("data-category-name");
      editCategoryNameInput.value = categoryName;
      editCategoryForm.action = `/admin/categories/edit/${categoryId}`;

      editCategoryModal.style.display = "block";
    });
  });

  closeEditModalBtn.addEventListener("click", () => {
    editCategoryModal.style.display = "none";
  });

 
  window.addEventListener("click", (e) => {
    if (e.target == addCategoryModal) {
      addCategoryModal.style.display = "none";
    }
    if (e.target == editCategoryModal) {
      editCategoryModal.style.display = "none";
    }
  });


//editing

document.addEventListener("DOMContentLoaded", () => {

  // Edit category modal handling
  const editButtons = document.querySelectorAll(".edit-btn-category");
  const editCategoryModal = document.getElementById("editCategoryModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const editCategoryForm = document.getElementById("editCategoryForm");
  const editCategoryNameInput = document.getElementById("editCategoryName");

  
  editButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const categoryId = e.target.getAttribute("data-category-id");
      const categoryName = e.target.getAttribute("data-category-name");
      editCategoryNameInput.value = categoryName;
      editCategoryForm.action = `/admin/categories/edit/${categoryId}`;
      editCategoryModal.style.display = "block";
    });
  });

  // Handle category form submission
  editCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    const formAction = editCategoryForm.action; 
    const formData = new FormData(editCategoryForm);

    try {
      
      const response = await axios.patch(formAction, {
        categoryName: formData.get("categoryName"),
      });

      if (response.data.success) {
       
        location.reload();
      } else {
        alert(response.data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Error occurred while updating category:", error);
      alert("Error occurred while updating category");
    }
  });

  // Close the edit modal when the close button is clicked
  closeEditModalBtn.addEventListener("click", () => {
    editCategoryModal.style.display = "none";
  });

  // Close modals when clicking outside of them
  window.addEventListener("click", (e) => {
    if (e.target == editCategoryModal) {
      editCategoryModal.style.display = "none";
    }
  });
});





//search
// document.addEventListener("DOMContentLoaded", function () {
//   const searchInput = document.getElementById("searchInput");
//   const categoryTableBody = document.getElementById("categoryTableBody");

//   searchInput.addEventListener("input", function () {
//       const searchTerm = searchInput.value.toLowerCase(); // Convert search term to lowercase
//       const rows = categoryTableBody.getElementsByTagName("tr");

//       for (let i = 0; i < rows.length; i++) {
//           const categoryNameCell = rows[i].getElementsByTagName("td")[0];
//           if (categoryNameCell) {
//               const categoryName = categoryNameCell.textContent || categoryNameCell.innerText;
//               // Convert category name to lowercase for comparison
//               if (categoryName.toLowerCase().indexOf(searchTerm) > -1) {
//                   rows[i].style.display = ""; // Show row
//               } else {
//                   rows[i].style.display = "none"; // Hide row
//               }
//           }
//       }
//   });
// });