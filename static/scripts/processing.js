async function processDocument() {
    // get text and convert bold to brackets
    let text = document.getElementById("docContent").innerHTML
        .replaceAll("<b>", "{")
        .replaceAll("</b>", "}");
    
    // extract prompts into array
    const prompts = [];
    const matches = text.match(/\{([^}]+)\}/g);
    
    if (matches) {
        matches.forEach(match => {
            prompts.push(match.slice(1, -1)); // remove { and }
        });
    }
    
    if (prompts.length === 0) {
        alert("No bold text found!");
        return;
    }
    
    try {
        // send array to Python
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompts: prompts })
        });
        
        const data = await response.json();
        
        // replace prompts with results
        let updatedText = text;
        for (let i = 0; i < prompts.length; i++) {
            const originalPrompt = `{${prompts[i]}}`;
            const result = data.results[i];
            updatedText = updatedText.replace(originalPrompt, result);
        }
        
        // update document
        document.getElementById("docContent").innerHTML = updatedText;
        
    } catch (error) {
        alert("Error: " + error.message);
    }
}