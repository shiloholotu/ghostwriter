if(localStorage["docs"] == null){
    localStorage["docs"] = JSON.stringify({});
}

// creating new documents

function newDoc(){
    const newDoc = {
        timestamp: Date.now(),
        content:""
    };

    const docs = JSON.parse(localStorage["docs"]);

    // random key to keep document names unique
    const abc = "abcdefghijklmnopqrstuvwxyz";
    let key = "";
    for(let i = 0; i < 10; i++){
        const ind = parseInt(Math.random() * abc.length);
        key += abc[ind];
    }


    docs["New Document" + abc] = newDoc;
    localStorage["docs"] = JSON.stringify(docs);
}

// saving documents

function saveDoc(name, content){
    const doc = {
        timestamp: Date.now(),
        content:content
    };


     const docs = JSON.parse(localStorage["docs"]);

    docs[name] = newDoc;
    localStorage["docs"] = JSON.stringify(docs);

}

