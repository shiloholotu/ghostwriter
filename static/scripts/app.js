import {processDocument} from './processing.js';

import {Document, docs} from './documents.js'
import {generateId} from './utils.js'
let nextTitleSave = 0;
let currentDoc = null
const docButtonContainer = document.getElementById("docButtons");
const newDocButton = document.getElementById("newDocButton");

function renderDocList() {
    if (!docButtonContainer) return;

    docButtonContainer.innerHTML = "";
    if (docs.length === 0) {
        docButtonContainer.innerHTML = "<p id='noSavedDocs'>You have no saved documents. Try making one!</p>";
        return;
    }

    // Sort documents: current document first, then by timestamp (newest first)
    const sortedDocs = [...docs].sort((a, b) => {
        // If one of them is the current document, put it first
        if (currentDoc && a.id === currentDoc.id) return -1;
        if (currentDoc && b.id === currentDoc.id) return 1;
        
        // Otherwise sort by timestamp (newest first)
        return b.timestamp - a.timestamp;
    });

    for (let i = 0; i < sortedDocs.length; i++) { 
        const docData = sortedDocs[i];

        const btn = document.createElement("button");
        btn.className = "docButton";
        btn.textContent = docData.name;

        if (currentDoc && docData.id === currentDoc.id) {
            btn.style.background = "var(--lighter-gray)";
        } else {
            btn.addEventListener("click", () => openDoc(docData));
        }

        docButtonContainer.appendChild(btn);
    }
}


function renderDocInputs(doc) {
    const docContainer = document.getElementById("docContainer");
    if (!docContainer) return;
    
    let html = "";
    if(doc == "blank"){
        html = `
             <div id='docPlaceholder'>
                <img src="static/assets/logo-white.png">
                <p>Click on a document or make a new one!</p>
            </div>
        `;
    }
    else{
        currentDoc = doc;
        html = `
            <input id="docTitle" type="text" value="${currentDoc.name}">
            <div style="width:100%;display:flex;margin-bottom:20px;">
                <button class="editButton"><img src="static/assets/flash.svg">Fill in the blanks</button>
                <button id="deleteButton" class="editButton" style="margin-left:10px"><img src="static/assets/trash.svg">Delete document</button>
                <button id="saveTxtButton" class="editButton" style="margin-left:10px"><img src="static/assets/floppy-disk.svg">Save as .txt</button>
                <button id="statsButton" class="editButton" style="margin-left:10px"><img src="static/assets/info-circle.svg">Stats</button>
            </div>
            <div id="docContent" contenteditable="true">
                ${currentDoc.content}
            </div>
        `;
    }
    docContainer.innerHTML = html;
    
    // Re-setup event listeners after DOM update
    if (doc !== "blank") {
        setupDocumentEventListeners();
    }
}

function setupDocumentEventListeners() {
    const deleteButton = document.getElementById("deleteButton");
    if (deleteButton) {
        deleteButton.addEventListener("click", deleteCurrentDoc);
    }
}

function deleteCurrentDoc() {
    if (currentDoc && currentDoc !== "blank") {
        const currentIndex = docs.findIndex(doc => doc.id === currentDoc.id);
        
        // Delete the current document
        currentDoc.delDoc();
        
        // Find the next document to open
        let nextDoc = null;
        if (docs.length > 0) {
            // If there are remaining docs, open the one at the same index, or the last one if we deleted the last doc
            const nextIndex = currentIndex < docs.length ? currentIndex : docs.length - 1;
            nextDoc = docs[nextIndex];
        }
        
        if (nextDoc) {
            // Open the next document
            openDoc(nextDoc);
        } else {
            // No documents left, show blank state
            currentDoc = null;
            renderDocInputs("blank");
            renderDocList();
        }
    }
}


function saveCurrentDoc(){
    if(currentDoc == null || currentDoc === "blank") return;
    const titleElement = document.getElementById("docTitle");
    const contentElement = document.getElementById("docContent");
    
    if (!titleElement || !contentElement) return;
    
    const title = titleElement.value;
    const content = contentElement.innerHTML;
    currentDoc.saveDoc(title, content);
    renderDocList(); // Update sidebar immediately after saving
}

function openDoc(doc){
    // Save current doc before switching
    if (currentDoc && currentDoc !== "blank") {
        saveCurrentDoc();
    }
    
    currentDoc = doc;
    renderDocInputs(doc);
    renderDocList();
}


    
function createNewDoc() {
    const id = generateId();
    
    // Find the next untitled number
    const untitledDocs = docs.filter(doc => doc.name.startsWith("Untitled"));
    let nextNumber = 1;
    
    while (untitledDocs.some(doc => doc.name === `Untitled ${nextNumber}`)) {
        nextNumber++;
    }
    
    const docName = `Untitled ${nextNumber}`;
    const doc = new Document(id, docName, "");
    openDoc(doc);
}

export function initApp() {
    // Only initialize if we're on the index page
    if (window.location.pathname !== '/index') {
        return;
    }

    newDocButton.addEventListener("click", function () {
        createNewDoc();
    });

    // Set up autosave with debouncing
    let saveTimeout;
    function setupAutosave() {
        // Use event delegation since elements are dynamically created
        document.addEventListener("input", function(e) {
            if (e.target.id === "docTitle" || e.target.id === "docContent") {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveCurrentDoc();
                }, 500); // Reduced delay for more responsive updates
            }
        });
    }

    renderDocList();
    renderDocInputs("blank");
    setupAutosave();
}
