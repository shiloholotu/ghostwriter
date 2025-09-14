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
                <button class="editButton"><img src="static/assets/flash.svg">Fill in the blanks</button>
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