const updateUserStatus = async (userId, isBlocked) => {
    const url = `/admin/users/${userId}`;
    const data = { isBlocked: !isBlocked };
    
    try {
        const response = await axios.patch(url, data);
        console.log('User status updated:', response.data);
        location.reload(); 
    } catch (error) {
        console.error('Error updating user status:', error);
    }
};

document.querySelectorAll('.block-btn, .unblock-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-user-id');
        const isBlocked = event.target.classList.contains('unblock-btn');

        const actionText = isBlocked ? 'Unblock' : 'Block';
        const confirmation = confirm(`Are you sure you want to ${actionText.toLowerCase()} this user?`);

        if (confirmation) {
            updateUserStatus(userId, isBlocked);
        } else {
          console.log("action canceld");
          
        }
    });
});
