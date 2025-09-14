const docButtonContainer = document.getElementById("docButtons");
function renderDocList(){
    const docList = listDocs();
    let html = "";
    for(let i of docList){
        console.log(i);
        html += `<button class='docButton'>${i[1]["name"]}</button>`;
    }

    if(html == ""){
        html = "<p id='noSavedDocs'>You have no saved documents. Try making one!</p>"
    }

    docButtonContainer.innerHTML = html;
}
renderDocList();