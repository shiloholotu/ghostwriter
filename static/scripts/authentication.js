
import { initializeApp } from "firebase/app";
require('dotenv').config();
console.log(process.env.API_KEY);
const app = initializeApp(firebaseConfig);

// Sign Up (Create User)
async function signUp(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
        })
    });
    const data = await response.json();
    return data;
}

// Sign In (Login User)
async function signIn(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
        })
    });
    const data = await response.json();
    return data;
}
