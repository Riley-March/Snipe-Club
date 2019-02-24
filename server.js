var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var bodyParser = require('body-parser');
var socket = require('socket.io')(http);
var Player = require("./server_modules/Player").Player;
var Bullet = require("./server_modules/Bullet").Bullet;

var players = [];
var bullets = [];
var gameWidth = 2000;
var gameHeight = 2000;
var squareSize = 50;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.configure(function(){
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.bodyParser());
});

var port = 3000;

var setEventHandlers = function() {
	socket.sockets.on("connection", onSocketConnection);	
};

function onSocketConnection(client) {
	client.on("disconnect", onClientDisconnect);
	client.on("setup player", onSetupPlayer);
	client.on("new player", onNewPlayer);
	client.on("move player", onMovePlayer);
	client.on("chat message", onChatMessage);
	client.on("ping", onPing);
	client.on("update angle", updateAngle);
	client.on("shoot bullet", shootBullet);
};

function onSetupPlayer(data){
	var randomX = Math.floor((Math.random() * gameWidth) + 1);
	var randomY = Math.floor((Math.random() * gameHeight) + 1);
	var randomColor = '#FE30F7';
	var newPlayer = new Player(randomX, randomY, randomColor, data.name, this.id);
	socket.emit('setup game', {localPlayer: newPlayer, gameWidth: gameWidth, gameHeight: gameHeight, squareSize: squareSize});
	this.broadcast.emit('new player', {newPlayer: newPlayer});
	console.log(newPlayer.id + " Connected");
}

function onNewPlayer(data) {
	socket.emit('setup game', {localPlayer: newPlayer, gameWidth: gameWidth, gameHeight: gameHeight});
	this.broadcast.emit('new player', {newPlayer: newPlayer});
	for(var i = 0; i < players.length; i++){
		var existingPlayer = players[i];
		socket.emit('new player', {newPlayer: existingPlayer});
	}	
	players.push(newPlayer);
	console.log(newPlayer.id + " Connected");
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	//this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
}

function onChatMessage() {
	var msg = {
		user: socket.id,
		msg: newMessage
	};
	socket.emit('chat message', msg);
}

function onClientDisconnect() {
	var removePlayer = playerBySocketId(this.id);
	players.splice(players.indexOf(removePlayer), 1);
	this.broadcast.emit("remove player", {id: removePlayer.id});
    console.log(removePlayer.id + ' Disconnected');
}

function updateAngle(data){
	var updatePlayer = playerById(data.id);
	updatePlayer.setAngle(data.angle);
	//this.broadcast.emit("update angle", {id: updatePlayer.id, angle: updatePlayer.getAngle()});
}

function shootBullet(data){
	var shootPlayer = playerById(data.id);
	var bullet = new Bullet(data.xPos, data.yPos, data.angle, shootPlayer.id);
	bullets.push(bullet);
	//this.broadcast.emit("new bullet", {id: shootPlayer.id});
}

function onPing(){
	socket.emit("pong");
}

function sendUpdates(){
	socket.emit("update", {players: players, bullets: bullets});
}

app.get('/', function (req, res) {
	res.sendfile("public/html/index.html");
});

app.get('/lobby', function(req, res){
	res.sendfile("public/html/lobby.html");
});

app.post('/checkUsername', function(req, res){
	var username = req.body.name;
	if(players.length >= 1){
		for(var i = 0; i < players.length; i++){
			if(players.indexOf(players[i].name) != -1){
				res.send(true);
			}else{
				res.send(false);
			}
		}
	}else{
		res.send(false);
	}
});

http.listen(port, function () {
	console.log(`Listening on port ${port}`)
});

function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	return false;
};

function playerBySocketId(id){
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].socketId == id)
			return players[i];
	};
	return false;
}

setInterval(sendUpdates, 100);
setEventHandlers();