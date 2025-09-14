import { AuthButtons, CheckLoggedIn } from './authentification.js'
import {initApp} from './app.js'

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
})

function initializeApp() {
    AuthButtons()
    CheckLoggedIn()
    initApp()
}
