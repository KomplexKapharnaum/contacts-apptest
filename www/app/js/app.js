// Executing main.js
console.log('running main.js');

document.getElementById('main').innerHTML = 'START';

function1();
function2();

document.getElementById('main').innerHTML = 'OK';

console.log('done main.js');

var socket = io('https://apptest.kxkm.net');

socket.on('ping', function() {
    console.log('ping');
    socket.emit('pong');
})
