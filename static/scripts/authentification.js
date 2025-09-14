import { getCookie } from './utils.js';

function isUserLoggedIn() {
    const authToken = localStorage.getItem('authToken');
    const sessionCookie = getCookie('session');
    const userData = localStorage.getItem('userData');
    
    return !!(authToken || sessionCookie || userData);
}

function handleSignupSubmit(event) {
    event.preventDefault(); 
    
    const form = event.target;
    const fullName = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!fullName || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const userData = {
        fullName: fullName,
        email: email,
        password: password
    };
    
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
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('authToken', 'signup_' + Date.now());
            
            console.log('User signed up successfully:', data.user.email);
            window.location.href = '/index';
        } else {
            alert('Signup failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Signup error:', error);
        alert('Network error. Please try again.');
    });
}

function handleLoginSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    const loginData = {
        email: email,
        password: password
    };
    
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
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('authToken', 'login_' + Date.now());
            
            console.log('User logged in successfully:', data.user.email);
            
            window.location.href = '/index';
        } else {
            alert('Login failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Network error. Please try again.');
    });
}

function handleSignOut() {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('session');
    
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('User signed out successfully');
    
    window.location.href = '/';
}

export function CheckLoggedIn() {
    if (isUserLoggedIn()) {
        console.log('User logged in');
        if (window.location.pathname !== '/index') {
            window.location.href = '/index';
        }
    } else {
        console.log('User not logged in');
        // If user is not logged in and on index page, redirect to signup
        if (window.location.pathname === '/index') {
            window.location.href = '/';
        }
    }
}

export function AuthButtons() {
    const signupForm = document.getElementById('signup-form')

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit)
    }
        
    const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginSubmit);
        }

    const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.addEventListener('click', handleSignOut);
        }
}
