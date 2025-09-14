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