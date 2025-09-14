if(localStorage["docs"] == null){
    localStorage["docs"] = JSON.stringify({});
}


function newDoc(){
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


function listDocs(){
    const docs = JSON.parse(localStorage["docs"]);
    const ret = [];

    for(let i in docs) ret.push([i,docs[i]]);
    return ret;
}





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



function loadDoc(id){
    const docs = JSON.parse(localStorage["docs"]);
    return docs[id];
}


function delDoc(id){
    const docs = JSON.parse(localStorage["docs"]);
    delete docs[id];
    localStorage["docs"] = JSON.stringify(docs);
}

