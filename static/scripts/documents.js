export const docs = [];

export class Document {
    constructor(id, name, content) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.timestamp = Date.now();
        docs.push(this);
    }

    saveDoc(title, content) {
        this.name = title;
        this.content = content;
        this.timestamp = Date.now(); // Update timestamp when saving to move to top
    }

    loadDoc() {
        return this;
    }

    delDoc() {
        const index = docs.findIndex(doc => doc.id === this.id);
        if (index > -1) {
            docs.splice(index, 1);
        }
    }
}





