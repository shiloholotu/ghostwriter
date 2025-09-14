export const docs = [];

export class Document {
    constructor(id, name, content, timestamp = null) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.timestamp = timestamp || Date.now();
        docs.push(this);
    }

    async save() {
        this.timestamp = Date.now();
        
        // Save to Firebase
        await this.saveToFirebase();
    }

    async saveDoc(title, content) {
        this.name = title;
        this.content = content;
        this.timestamp = Date.now();
        
        // Save to Firebase
        await this.saveToFirebase();
    }

    async saveToFirebase() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            
            if (!userData || !userData.idToken) {
                console.log('No authentication token - saving locally only');
                return true;
            }
            
            console.log('🔄 Saving document to Firebase:', this.name);

            const response = await fetch('/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.idToken}`
                },
                body: JSON.stringify({
                    id: this.id,
                    title: this.name,
                    content: this.content
                })
            });

            if (response.status === 401) {
                console.warn('Authentication token expired or invalid, clearing stored data');
                localStorage.removeItem('userData');
                localStorage.removeItem('authToken');
                return true;
            }

            const result = await response.json();
            console.log('Firebase save response:', result);
            
            if (!result.success) {
                console.error('Failed to save document:', result.message);
                return false;
            }
            
            console.log('✅ Document saved to Firebase successfully');
            return true;
        } catch (error) {
            console.error(' Error saving document to Firebase:', error);
            return false;
        }
    }


    loadDoc() {
        return this;
    }

    async delDoc() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData || !userData.idToken) {
                console.log('No authentication token found, skipping Firebase delete');
                // Remove from local array only
                const index = docs.findIndex(doc => doc.id === this.id);
                if (index > -1) {
                    docs.splice(index, 1);
                }
                return true;
            }

            const response = await fetch(`/documents/${this.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userData.idToken}`
                }
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to delete document:', result.message);
                return false;
            }

            // Remove from local array
            const index = docs.findIndex(doc => doc.id === this.id);
            if (index > -1) {
                docs.splice(index, 1);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting document from Firebase:', error);
            return false;
        }
    }
}

// Load documents from Firebase
export async function loadDocumentsFromFirebase() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.idToken) {
            console.log('No authentication token found, skipping document load');
            return;
        }

        console.log('Loading documents with token:', userData.idToken.substring(0, 20) + '...');
        console.log('Full userData:', userData);

        const response = await fetch('/documents', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userData.idToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Documents response status:', response.status);

        if (response.status === 401) {
            console.warn('Authentication token expired or invalid, clearing stored data');
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            return;
        }

        const result = await response.json();
        if (!result.success) {
            console.error('Failed to load documents:', result.message);
            return;
        }

        // Clear existing docs and load from server
        docs.length = 0;
        
        for (const docData of result.documents) {
            // Convert ISO timestamp back to milliseconds
            const timestamp = docData.updated_at ? new Date(docData.updated_at).getTime() : Date.now();
            new Document(docData.id, docData.title, docData.content, timestamp);
        }

        console.log(`Loaded ${docs.length} documents from server:`, docs.map(d => d.name));
    } catch (error) {
        console.error('Error loading documents from Firebase:', error);
    }
}





