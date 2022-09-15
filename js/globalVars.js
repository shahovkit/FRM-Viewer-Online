var canvas = document.getElementById('output');
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

var tickInterval;
let FRMJson;
let scale = 1;

let tangent = [
    -0.75,
    0,
    0.75,
    -0.75,
    0,
    0.75
]