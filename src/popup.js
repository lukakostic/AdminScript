


async function getAutoFolder(){
    try{
        let root = (await browser.bookmarks.getTree())[0];   
        autoF = root.children.filter(b=>b.title=='Bookmarks Toolbar'&&b.type=="folder")[0].children.filter(b=>b.title=='AUTO'&&b.type=="folder")[0];
        subF = autoF.children.filter(b=>b.type=="folder");
    }catch(e){err(e);}
}

async function getAll(){
    return await browser.tabs.query({currentWindow: true});
}
async function getSelected(){
    return (await getAll()).filter(g=>g.highlighted);
}
function cleanTab(t){
    delete t['favIconUrl'];
    return t;
}
async function savAll(to){
    
    getAll().then(data=>{
        data = data.map(cleanTab);
        browser.tabs
        .executeScript({code:`console.log(${JSON.stringify(data)})`})//{ file: "/content_scripts/beastify.js" })
        //.then(listenForClicks)
        //.catch(reportExecuteScriptError);
     })   
}
async function savSel(to){
    getSelected().then(data=>{
        data = data.map(cleanTab);
        browser.tabs
        .executeScript({code:`console.log(${JSON.stringify(data)})`})//{ file: "/content_scripts/beastify.js" })
        //.then(listenForClicks)
        //.catch(reportExecuteScriptError);
     })   
}

function bId(id){return document.getElementById(id);}


function err(txt){
    bId('error-content').innerText = bId('error-content').innerText +"\n"+ JSON.stringify(txt);
}

function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    let title = text;
    button.addEventListener('click', function() {
        //handleButtonClick(buttonId);
        clicked(title);
    });
    return button;
}

let scripts = [];
async function getAllScripts(){
    scripts = await browser.runtime.sendMessage({cmd:"GetAll"});
    err(scripts)
}
async function reloadAll(){
    scripts = await browser.runtime.sendMessage({cmd:"ReloadAll"});
}

document.addEventListener('DOMContentLoaded', async function() {

    bId('reloadAll').addEventListener('click',async ()=>{
       await reloadAll();
    });
    bId('execAll').addEventListener('click',async ()=>{
        getSelected().then(async (st)=>{
            await getAllScripts();
            st=st[0];
            err(st.title)
            err(scripts[0].code)
            try{
                browser.tabs.executeScript(
                    st.id,
                    {
                    code: `(()=>{try{${scripts[0].code}}catch(_e_){console.error(_e_);}})()`,
                    // code:`let c = document.querySelector('div#playlist-actions div#start-actions');
                    // let b = document.createElement('button');
                    // b.textContent = 'Bookmark';
                    // c.appendChild(b);`
                });
            }catch(e){err(e.message)}
        })
    });
return;

    bId('toggleDescriptionButton').addEventListener('click',toggleDescription);
    //bId("savSel").addEventListener("click", savSel);
    //bId("savAll").addEventListener("click", savAll);


    getAutoFolder().then(()=>{
        /*
        let btnCnt = bId('buttonContainer');

        for (let i = 0; i < subF.length; i++) {
            const button = createButton(subF[i].title);
            btnCnt.appendChild(button);
        }
*/
        drawChildren(subF,true,document.getElementById('tree-container'));

    }).catch(
        errC=>err(errC.message)
    );

    
    getSelected().then(st=>{
        st=st[0];
        //err(st);
        if(st.url.includes('youtube.com/watch?v=') || st.url.includes('youtu.be')){
        
        try{
            browser.tabs.executeScript(
                st.id,
                {
                code: `try{
                    console.log("Present");
                browser.runtime.sendMessage({
                yt_playlist:    Array.from( document.querySelectorAll('.playlist-items ytd-playlist-panel-video-renderer')).map(v=>{
                    let url = "https://youtube.com"+v.querySelector('#wc-endpoint').getAttribute('href');
                    let title = v.querySelector('span#video-title').innerText;
                    return {url,title};
                })
                });
                console.log("SENT");
            }catch(e){console.log(e);}`
                // code:`let c = document.querySelector('div#playlist-actions div#start-actions');
                // let b = document.createElement('button');
                // b.textContent = 'Bookmark';
                // c.appendChild(b);`
            });
        }catch(e){err(e.message)}
        }
    });

  });


browser.runtime.onMessage.addListener((message) => {
    //err(message)
    err("Playlist detected");
    if(message.yt_playlist){
        yt_playlist = message.yt_playlist;
        
        let btnCnt = bId('buttonContainer');

        const button = document.createElement('button');
        button.textContent = "#Youtube-playlist";
        button.addEventListener('click', function() {
            //handleButtonClick(buttonId);
            usePlaylist = true;
        });
        
        btnCnt.appendChild(button);
    }
});

function toggleDescription() {
    const descriptionContainer = document.getElementById('descriptionContainer');
    const button = document.getElementById('toggleDescriptionButton');

    if (descriptionContainer.style.maxHeight) {
      descriptionContainer.style.maxHeight = null;
      button.textContent = 'Toggle Description';
    } else {
      descriptionContainer.style.maxHeight = descriptionContainer.scrollHeight + 'px';
      button.textContent = 'Collapse Description';
    }
  }


  // Function to generate HTML for a tree node
  function generateTreeNode(node) {
    let treeNode = document.createElement("li");

    let expandButton = document.createElement("button");
    expandButton.classList.add("expand-button");
    let hasChildren = (node.children && node.children.filter(c=>c.type=='folder').length>0);
    expandButton.textContent = hasChildren ? "+" : "–"; // Set content based on whether there are children
    expandButton.addEventListener("click", () => toggleNode(node, treeNode, expandButton));
    expandButton.disabled = !hasChildren;

    let nodeButton = document.createElement("button");
    nodeButton.textContent = node.title;
    let nn = node;
    nodeButton.addEventListener('click',()=>{
        clicked(nn);
    });

    treeNode.appendChild(expandButton);
    treeNode.appendChild(nodeButton);

    return treeNode;
  }

  function drawChildren(children,folderOnly,container){

    const childrenList = document.createElement("ul");
    childrenList.classList.add("tree-node");

    if(folderOnly) children= children.filter(c=>c.type=='folder');
    
    children.forEach(child => {
        const childNode = generateTreeNode(child);
        childrenList.appendChild(childNode);
    });

    container.appendChild(childrenList);
  }

  // Function to toggle node expansion
  function toggleNode(node, treeNode, expandButton) {
    const childrenList = treeNode.querySelector("ul.tree-node");

    if (childrenList) {
      childrenList.remove(); // Remove existing children if any
      expandButton.textContent = "+"; // Set to plus sign when collapsed
    } else {
      if (node.children && node.children.length > 0) {
        drawChildren(node.children,true,treeNode);
        expandButton.textContent = "–"; // Set to minus sign when expanded
      }
    }
  }

  // Function to render the tree
  function renderTree(treeData, container) {
    const treeContainer = document.getElementById(container);
    const rootNode = generateTreeNode(treeData);

    const treeList = document.createElement("ul");
    treeList.classList.add("tree-node");
    treeList.appendChild(rootNode);

    treeContainer.appendChild(treeList);
  }