import {processDocument} from './processing.js';

// populate side bar with docs
let currentDoc = "";
const docButtonContainer = document.getElementById("docButtons");
function renderDocList(){
    const docList = listDocs();

    docList.sort((a, b) => b[1].timestamp - a[1].timestamp);


    let html = "";

    for(let i of docList){
        if(i[0] == currentDoc) html += `<button class='docButton' style="background:var(--lighter-gray)">${i[1]["name"]}</button>`;
    }

    for(let i of docList){
        
        if(i[0] != currentDoc) html += `<button class='docButton' onclick="openDoc('${i[0]}')">${i[1]["name"]}</button>`;
        else continue;
    }

    if(html == ""){
        html = "<p id='noSavedDocs'>You have no saved documents. Try making one!</p>"
    }

    docButtonContainer.innerHTML = html;
}
renderDocList();





function renderDocInputs(id){
    let html = "";
    if(id == "blank"){
        html = `
            
            <div id='docPlaceholder'>
                <img src="static/assets/logo-white.png">
                <p>Click on a document or make a new one!</p>
            </div>
        `
    }
    else{
        currentDoc = id;
        const cur = loadDoc(id);
        html = `
        
            <input id="docTitle" type="text" value="${cur.name}">
            <div style="width:100%;display:flex;margin-bottom:20px;">
                <button class="editButton" onclick="processDocument()"><img src="static/assets/flash.svg">Fill in the blanks</button>
                <button id="deleteButton" class="editButton" style="margin-left:10px" onclick="deleteCurrentDoc()"><img src="static/assets/trash.svg">Delete document</button>
                
            </div>
            <div id="docContent" contenteditable="true" id="textbox">
                ${cur.content}
            </div>
        `
    }
    document.getElementById("docContainer").innerHTML = html;
}
renderDocInputs("blank");




function saveCurrentDoc(){
    if(currentDoc == "")return;
    const title = document.getElementById("docTitle").value;
    const content = document.getElementById("docContent").innerHTML;
    saveDoc(currentDoc,title,content);
}

function openDoc(id){
    saveCurrentDoc();
    renderDocInputs(id);
    renderDocList();
}

function deleteCurrentDoc(){
    delDoc(currentDoc);
    openDoc("blank");
}

function createNewDoc(){
    const id = newDoc();
    openDoc(id);
}


// Save as .txt button logic
const saveTxtButton = document.getElementById("saveTxtButton");
if (saveTxtButton) {
    saveTxtButton.onclick = function() {
        const docTitle = document.getElementById("docTitle").value || "document";
        const docContent = document.getElementById("docContent").innerText;
        const blob = new Blob([docContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = docTitle.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
}

// Stats popup logic
const statsButton = document.getElementById("statsButton");
const statsOverlay = document.getElementById("statsOverlay");
const statsContent = document.getElementById("statsContent");
const closeStatsButton = document.getElementById("closeStatsButton");

function getWordStats(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return {
        wordCount: words.length,
        charCount: text.length,
        lineCount: text.split(/\n/).length
    };
}

if (statsButton && statsOverlay && statsContent && closeStatsButton) {
    statsButton.onclick = function() {
        const docContent = document.getElementById("docContent").innerText;
        const stats = getWordStats(docContent);
        statsContent.innerHTML =
            `<b>Words:</b> ${stats.wordCount}<br>` +
            `<b>Characters:</b> ${stats.charCount}<br>` +
            `<b>Lines:</b> ${stats.lineCount}`;
        statsOverlay.style.display = "flex";
    };
    closeStatsButton.onclick = function() {
        statsOverlay.style.display = "none";
    };
    // Optional: close overlay when clicking outside the popup
    statsOverlay.onclick = function(e) {
        if (e.target === statsOverlay) statsOverlay.style.display = "none";
    };
}