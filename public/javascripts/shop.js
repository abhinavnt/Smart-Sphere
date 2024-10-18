document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('input[name="search-product"]');
    const productCards = document.querySelectorAll('.col-sm-6.col-md-4.col-lg-3'); // Select all product cards

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();

        productCards.forEach(card => {
            const productName = card.querySelector('.card-title strong').innerText.toLowerCase();
            const productCategory = card.querySelector('.card-title').innerText.toLowerCase();

            if (productName.includes(query) || productCategory.includes(query)) {
                card.style.display = ''; // Show the card
            } else {
                card.style.display = 'none'; // Hide the card
            }
        });
    });
});




document.addEventListener('DOMContentLoaded', () => {
const sortLinks = document.querySelectorAll('.filter-link[data-sort]');

sortLinks.forEach(link => {
    link.addEventListener('click', async (event) => {
        event.preventDefault();
        const sortBy = event.target.getAttribute('data-sort');

        // Fetch all products from the server
        const products = await fetchProducts();

        // Log fetched products
        console.log('Fetched Products:', products);

        // Sort and update display
        sortProducts(products, sortBy);
    });
});

async function fetchProducts() {
    const response = await fetch('/products'); // Adjust this URL based on your API endpoint
    const products = await response.json();
    return products;
}


//filtering
function sortProducts(products, sortBy) {
    let sortedProducts;

    switch (sortBy) {
        case 'popularity':
            sortedProducts = [...products].sort((a, b) => b.popularity - a.popularity);
            break;
        case 'averageRating':
            sortedProducts = [...products].sort((a, b) => b.rating - a.rating);
            break;
        case 'newness':
            sortedProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'priceLowToHigh':
            sortedProducts = [...products].sort((a, b) => a.price - b.price);
            break;
        case 'priceHighToLow':
            sortedProducts = [...products].sort((a, b) => b.price - a.price);
            break;
        case 'aToZ':
            sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'zToA':
            sortedProducts = [...products].sort((a, b) => b.name.localeCompare(a.name));
            break;
        default:
            sortedProducts = products; // Default case
    }

    // Log sorted products
    console.log('Sorted Products:', sortedProducts);

    // Update the product display with only sorted products
    updateProductDisplay(sortedProducts);
}

function updateProductDisplay(products) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; 

    if (products.length === 0) {
        productContainer.innerHTML = '<p>No products found.</p>'; 
        return;
    }

    products.forEach(product => {
        const productElement = createProductElement(product);
        productContainer.appendChild(productElement);
    });
}

function createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'col-sm-6 col-md-4 col-lg-3 p-b-35';
    div.innerHTML = `
        <div class="card h-100">
            <a href="/product_details/${product._id}">
                <img src="${product.images[0]}" class="card-img-top img-fluid product-image" alt="Product Image">
            </a>
            <div class="card-body">
                <h5 class="card-title">
                    <a href="/product_details/${product._id}" class="text-dark">
                        <strong>${product.name}<br></strong>${product.category}
                    </a>
                </h5>
                <p class="card-text">₹${product.price}</p>
            </div>
            <div class="card-footer d-flex justify-content-between bg-transparent border-top-0">
                <!-- Wishlist and Cart Buttons -->
            </div>
        </div>
    `;
    return div;
}
});




//add to cart

document.querySelectorAll('.add-to-cart').forEach(button => {
button.addEventListener('click', function() {
    const productId = this.getAttribute('data-id');

    // Check product stock before adding to cart
    checkStock(productId)
        .then(response => {
            if (response.inStock) {
                const product = {
                    id: productId,
                    name: this.getAttribute('data-name'),
                    price: parseFloat(this.getAttribute('data-price')),
                    productImage: this.getAttribute('data-image')
                };

                // Check if adding would exceed stock
                if (response.userQuantity < response.availableStock) {
                    addToCart(product)
                        .then(() => {
                            // Check for limited stock after adding
                            if (response.userQuantity + 1 > 5) {
                                showLimitedStockAlert(`You already have 5 in your cart.`);
                            }
                        });
                } else {
                    showOutOfStockAlert();
                }
            } else {
                showOutOfStockAlert();
            }
        })
        .catch(error => {
            console.error('Error checking stock:', error);
        });
});
});

// Check product stock function
function checkStock(productId) {
return axios.post(`/cart/check-stock/${productId}`)
    .then(response => response.data)
    .catch(error => {
        console.error('Error checking stock:', error);
        return { inStock: false, userQuantity: 0, availableStock: 0 };
    });
}

// Add to cart function

const number = document.getElementById('btn.value')
console.log(number);

function addToCart(product) {
const cartItem = {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    imageUrl: product.productImage
};

return axios.post(`/cart/add/${window.userId}`, cartItem)
    .then(response => {
        showSuccessAlert('Product added to cart successfully!');
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        showLimitedStockAlert('You already have limited product in your cart.');
    });
}

// Show out of stock alert
function showOutOfStockAlert() {
Swal.fire({
    icon: 'warning',
    title: 'Out of Stock',
    text: 'This product is currently unavailable.',
    confirmButtonText: 'OK'
});
}

// Function to show the limited stock alert
function showLimitedStockAlert(message) {
Swal.fire({
    icon: 'info',
    title: 'Limited Stock',
    text: message,
    confirmButtonText: 'OK'
});
}

// Function to show the success alert
function showSuccessAlert(message) {
Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    confirmButtonText:'OK'
});
} 





// for sort and filters
document.addEventListener('DOMContentLoaded', () => {
const productCards = Array.from(document.querySelectorAll('.col-sm-6.col-md-4.col-lg-3'));
const sortLinks = document.querySelectorAll('.filter-link[data-sort]');

sortLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const sortBy = event.target.getAttribute('data-sort');
        sortProducts(productCards, sortBy);
    });
});

function sortProducts(products, sortBy) {
    let sortedProducts;

    switch (sortBy) {
        case 'popularity':
            sortedProducts = products.sort((a, b) => {
            });
            break;
        case 'averageRating':
                sortedProducts = products.sort((a, b) => {
                    const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
                    const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;
                    return ratingB - ratingA; // Higher ratings come first
                });
                break;
        case 'newness':
            sortedProducts = products.sort((a, b) => {
                
                const dateA = new Date(a.getAttribute('data-created-at'));
                const dateB = new Date(b.getAttribute('data-created-at'));
                console.log(dateA,dateB);
                
                return dateB - dateA; 
            });
            break;
        case 'priceLowToHigh':
            sortedProducts = products.sort((a, b) => {
                return parseFloat(a.querySelector('.card-text').innerText.replace('₹', '')) - 
                       parseFloat(b.querySelector('.card-text').innerText.replace('₹', ''));
            });
            break;
        case 'priceHighToLow':
            sortedProducts = products.sort((a, b) => {
                return parseFloat(b.querySelector('.card-text').innerText.replace('₹', '')) - 
                       parseFloat(a.querySelector('.card-text').innerText.replace('₹', ''));
            });
            break;
        case 'aToZ':
            sortedProducts = products.sort((a, b) => {
                const nameA = a.querySelector('.card-title strong').innerText.toLowerCase();
                const nameB = b.querySelector('.card-title strong').innerText.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'zToA':
            sortedProducts = products.sort((a, b) => {
                const nameA = a.querySelector('.card-title strong').innerText.toLowerCase();
                const nameB = b.querySelector('.card-title strong').innerText.toLowerCase();
                return nameB.localeCompare(nameA);
            });
            break;
            case 'default':
        default:
            location.reload()
            sortedProducts = products; 
            break;
    }

    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = '';

    sortedProducts.forEach(product => {
        productContainer.appendChild(product);
    });
}
});
