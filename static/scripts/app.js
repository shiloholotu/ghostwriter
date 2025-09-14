import {Document, docs, loadDocumentsFromFirebase} from './documents.js'
import {generateId} from './utils.js'
let nextTitleSave = 0;
let currentDoc = null
let currentDocIndex = 0;
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
    
    const saveTxtButton = document.getElementById("saveTxtButton");
    if (saveTxtButton) {
        saveTxtButton.addEventListener("click", downloadAsText);
    }
    
    const statsButton = document.getElementById("statsButton");
    if (statsButton) {
        statsButton.addEventListener("click", showDocumentStats);
    }
    
    const closeStatsButton = document.getElementById("closeStatsButton");
    if (closeStatsButton) {
        closeStatsButton.addEventListener("click", hideDocumentStats);
    }
    
    const fillBlanksButton = document.querySelector('.editButton');
    if (fillBlanksButton && fillBlanksButton.textContent.includes('Fill in the blanks')) {
        fillBlanksButton.addEventListener("click", fillInTheBlanks);
    }
}

function downloadAsText() {
    if (!currentDoc || currentDoc === "blank") return;
    
    const titleElement = document.getElementById("docTitle");
    const contentElement = document.getElementById("docContent");
    
    if (!titleElement || !contentElement) return;
    
    const title = titleElement.value || "Untitled";
    const content = contentElement.innerText || contentElement.textContent || "";
    
    // Create a blob with the text content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function calculateDocumentStats() {
    const contentElement = document.getElementById("docContent");
    if (!contentElement) return { words: 0, characters: 0, charactersNoSpaces: 0 };
    
    const text = contentElement.innerText || contentElement.textContent || "";
    
    // Calculate character count (with spaces)
    const characters = text.length;
    
    // Calculate character count (without spaces)
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Calculate word count
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    
    return { words, characters, charactersNoSpaces };
}

function showDocumentStats() {
    // Get stats from current content, even if no document is loaded
    const stats = calculateDocumentStats();
    const titleElement = document.getElementById("docTitle");
    const docTitle = titleElement ? titleElement.value || "Current Document" : "Current Document";
    
    const statsContent = document.getElementById("statsContent");
    const statsOverlay = document.getElementById("statsOverlay");
    
    // Check if elements exist and log their actual values
    console.log("Element check:", {
        statsContent: statsContent,
        statsOverlay: statsOverlay,
        statsContentExists: statsContent !== null,
        statsOverlayExists: statsOverlay !== null
    });
    
    // Try to find the elements again if not found
    if (!statsContent || !statsOverlay) {
        console.log("Elements not found, searching in document...");
        const allElements = document.querySelectorAll("*");
        console.log("Total elements in document:", allElements.length);
        
        // Try alternative selectors
        const overlay = document.querySelector("#statsOverlay") || document.querySelector("[id='statsOverlay']");
        const content = document.querySelector("#statsContent") || document.querySelector("[id='statsContent']");
        
        console.log("Alternative search results:", { overlay, content });
    }
    
    if (statsContent && statsOverlay) {
        statsContent.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #8cdf82; font-size: 18px;">${docTitle}</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: #8cdf82; margin-bottom: 8px;">${stats.words.toLocaleString()}</div>
                    <div style="font-size: 14px; opacity: 0.8;">Words</div>
                </div>
                <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: #8cdf82; margin-bottom: 8px;">${stats.characters.toLocaleString()}</div>
                    <div style="font-size: 14px; opacity: 0.8;">Characters</div>
                </div>
            </div>
            <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: 600; color: #f2f2f7; margin-bottom: 8px;">${stats.charactersNoSpaces.toLocaleString()}</div>
                <div style="font-size: 14px; opacity: 0.8;">Characters (no spaces)</div>
            </div>
        `;
        
        statsOverlay.style.display = "flex";
        console.log("Stats popup displayed successfully");
    } else {
        // Create the popup dynamically if it doesn't exist
        console.log("Creating stats popup dynamically...");
        
        const overlay = document.createElement('div');
        overlay.id = 'statsOverlay';
        overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:1000;align-items:center;justify-content:center;';
        
        overlay.innerHTML = `
            <div style="background:#222;padding:30px 40px;border-radius:16px;box-shadow:0 4px 32px #000;color:#fff;min-width:300px;max-width:90vw;">
                <h2 style="margin-top:0;">Document Statistics</h2>
                <div id="statsContent">
                    <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #8cdf82; font-size: 18px;">${docTitle}</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 600; color: #8cdf82; margin-bottom: 8px;">${stats.words.toLocaleString()}</div>
                            <div style="font-size: 14px; opacity: 0.8;">Words</div>
                        </div>
                        <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 600; color: #8cdf82; margin-bottom: 8px;">${stats.characters.toLocaleString()}</div>
                            <div style="font-size: 14px; opacity: 0.8;">Characters</div>
                        </div>
                    </div>
                    <div style="background: #222a34; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 600; color: #f2f2f7; margin-bottom: 8px;">${stats.charactersNoSpaces.toLocaleString()}</div>
                        <div style="font-size: 14px; opacity: 0.8;">Characters (no spaces)</div>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top:20px;padding:8px 20px;border-radius:8px;background:#444;color:#fff;border:none;cursor:pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log("Stats popup created and displayed");
    }
}

function hideDocumentStats() {
    const statsOverlay = document.getElementById("statsOverlay");
    if (statsOverlay) {
        statsOverlay.style.display = "none";
    }
}

async function fillInTheBlanks() {
    const docContent = document.getElementById("docContent");
    if (!docContent) return;
    
    // Find all highlighted text elements
    const highlightedElements = docContent.querySelectorAll('strong');
    if (highlightedElements.length === 0) {
        alert('No highlighted text found. Please highlight some text first using Ctrl+B.');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: var(--background); border: 1px solid var(--pretty-green); 
                    border-radius: 8px; padding: 20px; z-index: 1001; color: var(--font-color);">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid var(--pretty-green); 
                           border-top: 2px solid transparent; border-radius: 50%; 
                           animation: spin 1s linear infinite;"></div>
                <span>Processing highlighted text...</span>
            </div>
        </div>
    `;
    
    // Add spin animation
    const spinStyle = document.createElement('style');
    spinStyle.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinStyle);
    document.body.appendChild(loadingIndicator);
    
    try {
        // Process each highlighted element
        for (let i = 0; i < highlightedElements.length; i++) {
            const element = highlightedElements[i];
            const highlightedText = element.textContent.trim();
            
            if (highlightedText) {
                try {
                    // Send to handle_requests function via API
                    const response = await fetch(`/data?prompt=${encodeURIComponent(highlightedText)}`);
                    const data = await response.json();
                    
                    // Check if the response contains an error
                    if (data.error) {
                        console.error('Error from server:', data.error);
                        // Replace with error message or keep original text
                        const errorNode = document.createTextNode(`[Error: ${data.error}]`);
                        element.parentNode.replaceChild(errorNode, element);
                    } else if (data.result) {
                        // Replace the highlighted text with the result
                        const resultNode = document.createTextNode(data.result.toString().trim());
                        element.parentNode.replaceChild(resultNode, element);
                    } else {
                        // No result, keep original text
                        const originalNode = document.createTextNode(highlightedText);
                        element.parentNode.replaceChild(originalNode, element);
                    }
                } catch (fetchError) {
                    console.error('Error fetching data for:', highlightedText, fetchError);
                    // Keep original text on fetch error
                    const originalNode = document.createTextNode(highlightedText);
                    element.parentNode.replaceChild(originalNode, element);
                }
            }
        }
        
        // Save the document after processing
        if (currentDoc && currentDoc !== "blank") {
            saveCurrentDoc();
        }
        
    } catch (error) {
        console.error('Error processing highlighted text:', error);
        alert('Error processing highlighted text. Please try again.');
    } finally {
        // Remove loading indicator
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        if (spinStyle) {
            spinStyle.remove();
        }
    }
}

function setupUserProfile() {
    const userData = localStorage.getItem('userData');
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userData && userNameElement && userAvatarElement) {
        try {
            const user = JSON.parse(userData);
            const fullName = user.fullName || user.name || 'User';
            
            // Display full name
            userNameElement.textContent = fullName;
            
            // Create avatar with first letter of name
            const firstLetter = fullName.charAt(0).toUpperCase();
            userAvatarElement.textContent = firstLetter;
        } catch (error) {
            console.error('Error parsing user data:', error);
            userNameElement.textContent = 'User';
            userAvatarElement.textContent = 'U';
        }
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


async function saveCurrentDoc(){
    if(currentDoc == null || currentDoc === "blank") return;
    const titleElement = document.getElementById("docTitle");
    const contentElement = document.getElementById("docContent");
    
    if (!titleElement || !contentElement) return;
    
    const title = titleElement.value;
    const content = contentElement.innerHTML;
    await currentDoc.saveDoc(title, content);
    renderDocList(); // Update sidebar immediately after saving
}

async function openDoc(doc){
    // Save current doc before switching
    if (currentDoc && currentDoc !== "blank") {
        await saveCurrentDoc();
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

// Global highlighting state
let isHighlightingMode = false;
let highlightIndicator = null;

function createHighlightIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'highlightIndicator';
    indicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background: var(--pretty-green); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
            <span style="font-size: 14px; color: var(--pretty-green); font-weight: 500;">Highlighting Mode Active</span>
            <span style="font-size: 12px; color: var(--lighter-font-color);">Press Ctrl+B to exit</span>
        </div>
    `;
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--background);
        border: 1px solid var(--pretty-green);
        border-radius: 8px;
        padding: 12px 16px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    
    // Animate in
    setTimeout(() => {
        indicator.style.transform = 'translateX(0)';
    }, 100);
    
    return indicator;
}

function showHighlightIndicator() {
    if (!highlightIndicator) {
        highlightIndicator = createHighlightIndicator();
    }
}

function hideHighlightIndicator() {
    if (highlightIndicator) {
        highlightIndicator.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (highlightIndicator) {
                highlightIndicator.remove();
                highlightIndicator = null;
            }
        }, 300);
    }
}

function setupHighlightingMode() {
    let currentHighlightElement = null;
    
    document.addEventListener('keydown', function(e) {
        // Check for Ctrl+B
        if (e.ctrlKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            
            isHighlightingMode = !isHighlightingMode;
            
            if (isHighlightingMode) {
                showHighlightIndicator();
                // Change cursor to indicate highlighting mode
                document.body.style.cursor = 'text';
                const docContent = document.getElementById('docContent');
                if (docContent) {
                    docContent.style.cursor = 'text';
                }
                // Don't create highlight element immediately - wait for user to type
            } else {
                hideHighlightIndicator();
                // Reset cursor
                document.body.style.cursor = 'default';
                const docContent = document.getElementById('docContent');
                if (docContent) {
                    docContent.style.cursor = 'text';
                }
                currentHighlightElement = null;
                
                // Move cursor outside any highlight elements when exiting mode
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    let parentElement = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
                    let highlightElement = null;
                    
                    // Find if we're inside a highlight element
                    while (parentElement && parentElement.id !== 'docContent') {
                        if (parentElement.tagName === 'STRONG') {
                            highlightElement = parentElement;
                            break;
                        }
                        parentElement = parentElement.parentNode;
                    }
                    
                    // If inside a highlight, move cursor outside it
                    if (highlightElement) {
                        // Create a space after the highlight element if it doesn't exist
                        let nextNode = highlightElement.nextSibling;
                        if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
                            nextNode = document.createTextNode(' ');
                            highlightElement.parentNode.insertBefore(nextNode, highlightElement.nextSibling);
                        }
                        
                        // Move cursor to after the highlight element
                        const newRange = document.createRange();
                        newRange.setStart(nextNode, nextNode.textContent.length);
                        newRange.setEnd(nextNode, nextNode.textContent.length);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            }
        }
    });
    
    // Handle typing in highlighting mode
    document.addEventListener('input', function(e) {
        if (e.target.id === 'docContent') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                
                // Get the last typed character
                const textNode = container.nodeType === Node.TEXT_NODE ? container : container.childNodes[container.childNodes.length - 1];
                if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
                    const text = textNode.textContent;
                    const lastChar = text[text.length - 1];
                    
                    // Check if space was typed and we're inside a highlight element
                    if (lastChar === ' ') {
                        let parentElement = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
                        let isInsideHighlight = false;
                        let highlightElement = null;
                        
                        while (parentElement && parentElement.id !== 'docContent') {
                            if (parentElement.tagName === 'STRONG') {
                                isInsideHighlight = true;
                                highlightElement = parentElement;
                                break;
                            }
                            parentElement = parentElement.parentNode;
                        }
                        
                        // If space was typed inside a highlight, move cursor outside
                        if (isInsideHighlight && highlightElement) {
                            // Remove the space from the highlight element
                            textNode.textContent = text.slice(0, -1);
                            
                            // Create a text node with the space after the highlight element
                            const spaceNode = document.createTextNode(' ');
                            highlightElement.parentNode.insertBefore(spaceNode, highlightElement.nextSibling);
                            
                            // Move cursor after the space
                            const newRange = document.createRange();
                            newRange.setStart(spaceNode, 1);
                            newRange.setEnd(spaceNode, 1);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            
                            return; // Exit early to prevent further processing
                        }
                    }
                    
                    // Handle highlighting mode
                    if (isHighlightingMode) {
                        // Check if we're not already inside a highlight element
                        let parentElement = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
                        let isInsideHighlight = false;
                        
                        while (parentElement && parentElement.id !== 'docContent') {
                            if (parentElement.tagName === 'STRONG') {
                                isInsideHighlight = true;
                                break;
                            }
                            parentElement = parentElement.parentNode;
                        }
                        
                        // If not inside a highlight, create one
                        if (!isInsideHighlight) {
                            // Create highlight element with the last character
                            const highlightElement = document.createElement('strong');
                            highlightElement.style.cssText = `
                                background-color: #8cdf82;
                                padding: 3px 6px;
                                border-radius: 5px;
                                font-weight: 600;
                                color: #161b22;
                            `;
                            highlightElement.textContent = lastChar;
                            
                            // Remove the last character from the text node
                            textNode.textContent = text.slice(0, -1);
                            
                            // Insert the highlight element after the text node
                            if (textNode.parentNode) {
                                textNode.parentNode.insertBefore(highlightElement, textNode.nextSibling);
                                
                                // Move cursor to end of highlight element
                                const newRange = document.createRange();
                                newRange.setStart(highlightElement, highlightElement.childNodes.length);
                                newRange.setEnd(highlightElement, highlightElement.childNodes.length);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                        }
                    } else {
                        // If highlighting mode is OFF, ensure we're not inside a highlight element
                        let parentElement = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
                        let highlightElement = null;
                        
                        while (parentElement && parentElement.id !== 'docContent') {
                            if (parentElement.tagName === 'STRONG') {
                                highlightElement = parentElement;
                                break;
                            }
                            parentElement = parentElement.parentNode;
                        }
                        
                        // If we're typing inside a highlight but mode is off, move outside
                        if (highlightElement) {
                            // Remove the last character from inside the highlight
                            textNode.textContent = text.slice(0, -1);
                            
                            // Create a text node with the character after the highlight
                            const newTextNode = document.createTextNode(lastChar);
                            highlightElement.parentNode.insertBefore(newTextNode, highlightElement.nextSibling);
                            
                            // Move cursor to end of the new text node
                            const newRange = document.createRange();
                            newRange.setStart(newTextNode, newTextNode.textContent.length);
                            newRange.setEnd(newTextNode, newTextNode.textContent.length);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                        }
                    }
                }
            }
        }
    });
}

export async function initApp() {
    // Only initialize if we're on the index page
    if (window.location.pathname !== '/index') {
        return;
    }

    // Setup user profile
    setupUserProfile();

    // Check authentication status
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.idToken) {
        console.log('✅ User authenticated:', userData.email);
    } else {
        console.log('⚠️  User not authenticated - documents will save locally only');
    }
    
    // Load documents from server if authenticated
    await loadDocumentsFromFirebase();

    console.log(`Debug: docs.length after loading = ${docs.length}`);
    console.log(`Debug: docs array =`, docs);

    // If documents are available, select one to open
    if (docs.length > 0) {
        const randomIndex = Math.floor(Math.random() * docs.length);
        currentDocIndex = randomIndex;
        currentDoc = docs[currentDocIndex];
        console.log(`📄 Selected document: "${docs[currentDocIndex].name}" (${randomIndex + 1}/${docs.length})`);
        console.log(`Debug: currentDoc set to:`, currentDoc);
    } else {
        currentDoc = null;
        currentDocIndex = -1;
        console.log('📄 No documents available');
    }

    newDocButton.addEventListener("click", function () {
        createNewDoc();
    });

    // Set up stats button event listener (always available)
    const statsButton = document.getElementById("statsButton");
    if (statsButton) {
        statsButton.addEventListener("click", showDocumentStats);
    }
    
    const closeStatsButton = document.getElementById("closeStatsButton");
    if (closeStatsButton) {
        closeStatsButton.addEventListener("click", hideDocumentStats);
    }

    // Setup highlighting mode
    setupHighlightingMode();

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
    
    // Render the selected document or blank state
    if (currentDoc) {
        renderDocInputs(currentDoc);
    } else {
        renderDocInputs("blank");
    }
    setupAutosave();
}
