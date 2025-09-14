export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}


export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
