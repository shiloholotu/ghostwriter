# Firebase Setup Instructions

## Prerequisites
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication in your Firebase project
3. Enable Email/Password authentication method

## Server Setup (Python)

### Option 1: Service Account Key (Recommended for Production)
1. Go to Project Settings > Service Accounts in Firebase Console
2. Generate a new private key (downloads a JSON file)
3. Save the JSON file as `serviceAccountKey.json` in your project root
4. Update `firebase_config.py` to use the service account:
   ```python
   cred = credentials.Certificate("serviceAccountKey.json")
   firebase_admin.initialize_app(cred)
   ```

### Option 2: Default Credentials (Development)
1. Install Google Cloud SDK
2. Run `gcloud auth application-default login`
3. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json`

## Client Setup (JavaScript)

### Option 1: Firebase Web SDK (Full Authentication)
1. Add Firebase Web SDK to your HTML:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"></script>
   ```

2. Initialize Firebase in your client.js:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id"
   };
   firebase.initializeApp(firebaseConfig);
   ```

### Option 2: Server-Only Authentication (Current Implementation)
- Uses server endpoints for all authentication
- No Firebase Web SDK required
- Authentication state managed via localStorage

## Current Implementation
The current setup uses server-only authentication where:
- `/signup` creates users via Firebase Admin SDK
- `/login` verifies users exist in Firebase
- `/verify-token` validates Firebase ID tokens
- Client stores authentication state in localStorage

## Security Notes
- Never commit service account keys to version control
- Use environment variables for sensitive configuration
- Implement proper CORS policies for production
- Consider using Firebase Auth on client-side for better security
