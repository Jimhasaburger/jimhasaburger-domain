const BASE71_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@$%?&<()";

function encodeBase71(){
    let input = document.getElementById("base71Number").value;
    let n = parseInt(input);
    if(isNaN(n)){ alert("Enter a valid number"); return; }
    let out = "";
    if(n===0) out = BASE71_CHARS[0];
    while(n>0){
        let r = n % 71;
        n = Math.floor(n/71);
        out = BASE71_CHARS[r] + out;
    }
    document.getElementById("base71Encoded").textContent = out;
}

function decodeBase71(){
    let s = document.getElementById("base71String").value.trim();
    let n = 0;
    for(let c of s){
        let i = BASE71_CHARS.indexOf(c);
        if(i===-1){ alert("Invalid char: "+c); return; }
        n = n*71 + i;
    }
    document.getElementById("base71Decoded").textContent = n;
}
