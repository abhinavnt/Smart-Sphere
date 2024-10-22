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

// document.querySelectorAll('.block-btn, .unblock-btn').forEach(button => {
//     button.addEventListener('click', (event) => {
//         const userId = event.target.getAttribute('data-user-id');
//         const isBlocked = event.target.classList.contains('unblock-btn');

//         const actionText = isBlocked ? 'Unblock' : 'Block';
//         const confirmation = confirm(`Are you sure you want to ${actionText.toLowerCase()} this user?`);

//         if (confirmation) {
//             updateUserStatus(userId, isBlocked);
//         } else {
//           console.log("action canceld");
          
//         }
//     });
// });




document.querySelectorAll('.block-btn, .unblock-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-user-id');
        const isBlocked = event.target.classList.contains('unblock-btn');

        const actionText = isBlocked ? 'Unblock' : 'Block';

        
        swal({
            title: `Are you sure you want to ${actionText.toLowerCase()} this user?`,
            text: "Once confirmed, this action will be performed.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willConfirm) => {
            if (willConfirm) {
               
                updateUserStatus(userId, isBlocked);
                swal(`${actionText}d!`, `The user has been ${actionText.toLowerCase()}ed.`, "success");
            } else {
                console.log("Action canceled");
            }
        });
    });
});



