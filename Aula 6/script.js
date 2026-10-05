
function soma(a , b) {
    return a + b;
}

let c = soma(7,9);
console.log(c);


let i1 = document.getElementById("i1") .value;

function imprimir() {
    let i1 = document.getElementById("i1") .value;
    console.log(i1);
}


function soma() {
    let x = parseInt(document.getElementById("r2").value);
    let y = parseInt(document.getElementById("r3").value);
    let z = x + y;
    document.getElementById("r1").innerHTML = z;
}