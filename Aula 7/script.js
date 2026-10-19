let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// retângulos
ctx.beginPath();
ctx.lineWidth = 2;
ctx.fillStyle = 'blue';
ctx.strokeStyle = 'red';
ctx.fillRect(10,10,50,50);
ctx.strokeRect(10,10,50,50);
ctx.closePath();

// linhas
ctx.beginPath();
ctx.lineWidth = 2;
ctx.fillStyle = 'blue';
ctx.strokeStyle = 'red';
ctx.moveTo(200,150);
ctx.lineTo(60,10);
ctx.lineTo(60,250);
ctx.lineTo(200,250);
ctx.lineTo(200,150);
ctx.fill();
ctx.stroke();
ctx.closePath();

// arcos
ctx.beginPath();
ctx.lineWidth = 2;
ctx.fillStyle = 'blue';
ctx.strokeStyle = 'red';
ctx.arc(200,200,50,1.5*Math.PI,2.5*Math.PI);
ctx.fill();
ctx.stroke();
ctx.closePath();

// texto
ctx.beginPath();
ctx.lineWidth = 2;
ctx.fillStyle = 'blue';
ctx.strokeStyle = 'red';
ctx.font = "90px Arial";
ctx.textAlign = "center";
ctx.fillText("Olá", 200, 350);
ctx.strokeText("Olá", 200, 350);
ctx.closePath();

let canvas1 = document.getElementById("ex1");
let ctx1 = canvas1.getContext("2d");

// quadrado
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'red';
ctx1.fillRect(0,0,50,50);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.fillRect(0,350,50,50);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'blue';
ctx1.fillRect(350,0,50,50);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'green';
ctx1.fillRect(350,350,50,50);
ctx1.closePath();

// linhas
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'red';
ctx1.strokeStyle = 'red';
ctx1.moveTo(0,0);
ctx1.lineTo(400,400);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'blue';
ctx1.strokeStyle = 'blue';
ctx1.moveTo(400,0);
ctx1.lineTo(0,400);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'green';
ctx1.strokeStyle = 'green';
ctx1.moveTo(0,200);
ctx1.lineTo(400,200);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

// arcos
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = '';
ctx1.strokeStyle = 'green';
ctx1.arc(200,200,50,0*Math.PI,1*Math.PI);
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.strokeStyle = 'lightgreen';
ctx1.arc(70,150,20,0*Math.PI,2.0*Math.PI);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.strokeStyle = 'lightgreen';
ctx1.arc(330,150,20,0*Math.PI,2.0*Math.PI);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

// texto
ctx1.beginPath();
ctx1.lineWidth = 1;
ctx1.fillStyle = 'black';
ctx1.strokeStyle = 'black';
ctx1.font = "20px Arial";
ctx1.textAlign = "center";
ctx1.fillText("Desenvolvimento Web", 200, 80);
ctx1.strokeText("Desenvolvimento Web", 200, 80);
ctx1.closePath();

let canvas2 = document.getElementById("ex2");
let ctx2 = canvas2.getContext("2d");

// arcos
ctx2.beginPath();
ctx2.lineWidth = 2;
ctx2.fillStyle = 'yellow';
ctx2.strokeStyle = 'yellow';
ctx2.arc(330,150,20,0*Math.PI,2.0*Math.PI);
ctx2.fill();
ctx2.stroke();
ctx2.closePath();

let canvas3 = document.getElementById("ex3");
let ctx3 = canvas3.getContext("2d");

let retangulo1 = {
    x: 10,
    y: 10,
    l: 50,
    a: 50,
    desenha: function(ctx, cor_fill, cor_stroke){
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.fillStyle = cor_fill;
    ctx.strokeStyle = cor_stroke;
    ctx.fillRect(this.x,this.y,this.l,this.a);
    ctx.strokeRect(this.x,this.y,this.l,this.a);
    ctx.closePath();
}
}

let retangulo2 = {
    x: 10,
    y: 340,
    l: 50,
    a: 50,
    cor_fill: 'blue',
    cor_stroke: 'yellow',
    desenha: function(ctx, cor_fill, cor_stroke){
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.fillStyle = cor_fill;
    ctx.strokeStyle = cor_stroke;
    ctx.fillRect(this.x,this.y,this.l,this.a);
    ctx.strokeRect(this.x,this.y,this.l,this.a);
    ctx.closePath();
}
}

let canvas4 = document.getElementById("ex4");
let ctx4 = canvas4.getContext("2d");

let retangulo3 = {
    x: 10,
    y: 40,
    l: 50,
    a: 50,
    cor_fill: 'blue',
    cor_stroke: 'yellow',
    desenha: function(ctx, cor_fill, cor_stroke){
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.fillStyle = cor_fill;
    ctx.strokeStyle = cor_stroke;
    ctx.fillRect(this.x,this.y,this.l,this.a);
    ctx.strokeRect(this.x,this.y,this.l,this.a);
    ctx.closePath();
}
}

retangulo1.desenha(ctx3);
retangulo2.desenha(ctx2);
retangulo3.desenha(ctx4);

    let aux = 2;
function animacao(){
    // apagar o canvas
    ctx3.clearRect(0,0,400,400)
    ctx2.clearRect(0,0,400,400)
    ctx4.clearRect(0,0,400,400)
    // atualizar o objeto
    if(retangulo1.x >= 360){
        aux = -2;
    }
    else if(retangulo1.x <= 0){
        aux = 2;
    }
    retangulo1.x += aux;
    // desenhar novamente
    retangulo1.desenha(ctx3);
    retangulo2.desenha(ctx2);
    retangulo3.desenha(ctx4);
    requestAnimationFrame(animacao)
}

animacao();

document.addEventListener("keydown", function(evento){
    console.log(evento);
    let tecla = evento.key;

    if(tecla == "ArrowUp"){retangulo2.y -= 6};
    if(tecla == "ArrowDown"){retangulo2.y += 6};
    if(tecla == "ArrowLeft"){retangulo2.x -= 6};
    if(tecla == "ArrowRight"){retangulo2.x += 6};

})

document.addEventListener("mousemove", function(evento){
    console.log(evento)
    let rect = canvas4.getBoundingClientRect();
    let x_mouse = evento.clientX - rect.left;
    let y_mouse = evento.clientY - rect.top;
    console.log(x_mouse,y_mouse)

    retangulo3.x = x_mouse
    retangulo3.y = y_mouse
})