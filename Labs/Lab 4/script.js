y = Math.floor(Math.random() * 100);
console.log(y);

function verificar() {

    x = document.getElementById("xxx").value;
    console.log(x);    

    if (x > y) {
        document.getElementById("r2").innerHTML = "O número digitado é maior";
    }

    else if (x < y) {
        document.getElementById("r3").innerHTML = "O número digitado é menor";
    }

    else if (x == y) {  
        document.getElementById("r2").innerHTML = "O número digitado é igual";
    }

}