let STORAGE_MODE = {
    "hms" : 1,
    "http-multi-server" : 1,
    "os": 1,

    "cache":2,
    "browser":2,
};
let storageMode = STORAGE_MODE.hms; 

let scripts = [];

let PORT = 8742;
//appends to site url
let URL = (s)=>(`http://0.0.0.0:${PORT}/${s}`);

let readfile = async (path,retText=true)=>{
    let resp = await fetch(URL(`readfile/${path}`),
        {method:"GET"});
    if(retText) return (await resp.text());
    else return (await resp);
};
let ls = async (path,removeQuotes=true)=>{
    let resp = await fetch( URL(`ls/${path}`) ,
        {method:"GET"});
    let txt = (await resp.text()).split('\n');
    txt.pop(); // remove empty line
    if(removeQuotes)
        txt = txt.map(s=>s.substring(1,s.length-1));
    return txt;
};

let SCRIPTS_PATH = "/data/_Projects/AdminScript_Scripts/";

async function lsAllScripts(){
    console.log("ls all scripts ");
    let sc = await ls(SCRIPTS_PATH,true);
    sc = sc.filter(s=>s.toLowerCase().endsWith(".js"));
    console.log("sc ",sc);
    return sc;
}

function err(e){console.error(e)};

async function getCodeFile(path){
    console.log("get file ",path);
    return await readfile(path);
}


async function loadAllScripts(){
    try{
        scripts = null;
        let sc = await lsAllScripts();
        //err(scripts);
        scripts = await Promise.all(sc.map(async (path)=>{
            let code = await getCodeFile(path);
            return {path,code};
        }));

        console.log(scripts);
    }catch(excp){err(excp.message)}
}


browser.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
    //console.log("GOTMESSAGE , ",message);
    //console.log("GOTMESSAGE , ",scripts.length);
    if(message?.cmd == "ReloadAll"){
        await loadAllScripts();
        return Promise.resolve(scripts);
    }
    else if(message?.cmd == "GetAll"){
        return Promise.resolve(scripts);
    }
    else return Promise.resolve(message);
});

(()=>{
    loadAllScripts();  

    //Start websocket to watch for changes:
    const socket = new WebSocket(`ws://0.0.0.0:${PORT+1}`);

    let watch = ()=>socket.send(`/watch/${SCRIPTS_PATH}`);

    // Connection opened
    socket.addEventListener("open", (event) => {
        watch();
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
        console.log("Message from server ", event.data);
        let data = JSON.parse(event.data);
        //console.log(data);
        if(data.type=="WATCH_CHANGED"){
            loadAllScripts();
            watch();
        }

    });


})();