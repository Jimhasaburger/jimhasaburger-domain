const BASE71_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@$%?&<()";

function base71Decode(s){
    let n = 0;
    for(let c of s){
        let i = BASE71_CHARS.indexOf(c);
        if(i===-1) throw new Error("Invalid Base71 char: "+c);
        n = n*71 + i;
    }
    return n;
}

function decodeSoundID(){
    let s = document.getElementById("soundString").value.trim();
    try {
        let len0 = parseInt(s[0],16)+1;
        let pos1 = 1+len0;
        let len1 = parseInt(s[pos1],16)+1;
        let base71Value = s.slice(pos1+1,pos1+1+len1);
        let id = base71Decode(base71Value);
        document.getElementById("soundIDDecoded").textContent = id;
    } catch(e){
        document.getElementById("soundIDDecoded").textContent = "Failed to decode";
    }
}
