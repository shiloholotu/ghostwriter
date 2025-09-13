if(localStorage["docs"] == null){
    localStorage["docs"] = JSON.stringify({});
}

// creating new documents

function newDoc(){

    // random id key for documents
    const abc123 = "abcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for(let i = 0; i < 10; i++){
        const ind = parseInt(Math.random() * abc123.length);
        key += abc123[ind];
    }

    const newDoc = {
        name:"New Document",
        timestamp: Date.now(),
        content:"Type in me!"
    };

    const docs = JSON.parse(localStorage["docs"]);
    docs[key] = newDoc;
    localStorage["docs"] = JSON.stringify(docs);

    return key;
}

// list doc names and ids

function listDocs(){
    const docs = JSON.parse(localStorage["docs"]);
    const ret = [];

    for(let i in docs) ret.push([i,docs[i]]);
    return ret;
}



// saving documents

function saveDoc(id, name, content){
    const doc = {
        name:name,
        timestamp: Date.now(),
        content:content
    };


    const docs = JSON.parse(localStorage["docs"]);
    docs[id] = doc;
    localStorage["docs"] = JSON.stringify(docs);

}



// loading documents

function loadDoc(id){
    const docs = JSON.parse(localStorage(["docs"]));
    return docs[id];
}

// deleting documents

function delDoc(id){
    const docs = JSON.parse(localStorage["docs"]);
    delete docs[id];
    localStorage["docs"] = JSON.stringify(docs);
}

