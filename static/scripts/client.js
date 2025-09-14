
document.addEventListener('DOMContentLoaded', function() {
    console.log('User  in')
    initializeApp();
    
    // Handle signup form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Handle sign out button
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
        signOutButton.addEventListener('click', handleSignOut);
    }
})

function initializeApp() {
    if (isUserLoggedIn()) {
        console.log('User logged in');
        if (window.location.pathname !== '/index') {
            window.location.href = '/index';
        }
    } else {
        console.log('User not logged in');
    }
}

function isUserLoggedIn() {
    const authToken = localStorage.getItem('authToken');
    const sessionCookie = getCookie('session');
    const userData = localStorage.getItem('userData');
    
    return !!(authToken || sessionCookie || userData);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function handleSignupSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get form data
    const form = event.target;
    const fullName = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    // Basic validation
    if (!fullName || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create user data object
    const userData = {
        fullName: fullName,
        email: email,
        password: password
    };
    
    // Send request to Python server
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store user data in localStorage only on successful server response
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('authToken', 'signup_' + Date.now());
            
            console.log('User signed up successfully:', data.user.email);
            
            // Redirect to main app only on success
            window.location.href = '/index';
        } else {
            // Show error message from server
            alert('Signup failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Signup error:', error);
        alert('Network error. Please try again.');
    });
}

function handleLoginSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get form data
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create login data object
    const loginData = {
        email: email,
        password: password
    };
    
    // Send request to Python server
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store user data in localStorage only on successful server response
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('authToken', 'login_' + Date.now());
            
            console.log('User logged in successfully:', data.user.email);
            
            // Redirect to main app only on success
            window.location.href = '/index';
        } else {
            // Show error message from server
            alert('Login failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Network error. Please try again.');
    });
}

function handleSignOut() {
    // Clear all authentication data from localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('session');
    
    // Clear any session cookies
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('User signed out successfully');
    
    // Redirect to signup page
    window.location.href = '/';
}