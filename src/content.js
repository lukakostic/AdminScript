//alert("Content")


let scripts = [];

async function getAllScripts(){
    scripts = await browser.runtime.sendMessage({cmd:"GetAll"});
}
async function reloadAll(){
    scripts = await browser.runtime.sendMessage({cmd:"ReloadAll"});
}
async function work() {
    console.error("Scripts",scripts);
    //alert(JSON.stringify(scripts));
        scripts.forEach(s=>{
            (new Function(s.code))();
        });
    //window.eval(`(()=>{try{${scripts[0].code}}catch(_e_){console.error(_e_);}})()`);
    /*
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
    */
}

(async ()=>{
    await getAllScripts();
    
    if(document.readyState === "complete" || document.readyState === "interactive")
        await work();
    else 
        document.addEventListener('DOMContentLoaded', work);
})();