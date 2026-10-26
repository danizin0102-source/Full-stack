let canvas1 = document.getElementById("ex1");
let ctx1 = canvas1.getContext("2d");

// quadrado
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'blue';
ctx1.fillRect(0,0,50,50);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.fillRect(0,370,30,30);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.fillRect(30,370,30,30);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.fillRect(0,350,30,30);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'red';
ctx1.fillRect(350,0,50,50);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'black';
ctx1.fillRect(340,370,30,30);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'black';
ctx1.fillRect(370,370,30,30);
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'black';
ctx1.fillRect(370,340,30,30);
ctx1.closePath();

// linhas
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'blue';
ctx1.strokeStyle = 'blue';
ctx1.moveTo(0,0);
ctx1.lineTo(200,200);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'red';
ctx1.strokeStyle = 'red';
ctx1.moveTo(400,0);
ctx1.lineTo(200,200);
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

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'green';
ctx1.strokeStyle = 'green';
ctx1.moveTo(200,200);
ctx1.lineTo(200,380);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

// arcos
ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = '';
ctx1.strokeStyle = 'green';
ctx1.arc(200,200,80,1*Math.PI,2*Math.PI);
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.strokeStyle = 'lightgreen';
ctx1.arc(100,270,20,0*Math.PI,2.0*Math.PI);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'yellow';
ctx1.strokeStyle = 'lightgreen';
ctx1.arc(300,270,20,0*Math.PI,2.0*Math.PI);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'cyan';
ctx1.strokeStyle = 'green';
ctx1.arc(200,400,50,1*Math.PI,2*Math.PI);
ctx1.fill();
ctx1.stroke();
ctx1.closePath();

ctx1.beginPath();
ctx1.lineWidth = 2;
ctx1.fillStyle = 'cyan';
ctx1.strokeStyle = 'blue';
ctx1.arc(200,150,20,0*Math.PI,2.0*Math.PI);
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