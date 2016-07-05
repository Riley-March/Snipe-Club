//Server Setup
var express = require('express');
var app = express();
var http = require('http').Server(app);
var socket = require('socket.io')(http);
var path = require('path');
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Classes
var Player = require("./server_modules/Player").Player;
var Wall = require("./server_modules/Wall").Wall;
var Pellet = require("./server_modules/Pellet").Pellet;
var Point2D = require("./server_modules/Point2D").Point2D;

// Add public directory for use
app.configure(function() {
	app.use(express.static(path.join(__dirname, 'public')));
});

// Setup Variables
var players = [];
var walls = [];
var pellets = [];
var sockets = {};
var gameWidth = 1000;
var gameHeight = 1000;
var squareSize = 50;
var pelletSize = 10;
var lastUpdate = Date.now();
var moveSequences = [];

// Set Event Handlers
var setEventHandlers = function() {
	socket.sockets.on("connection", onSocketConnection);
};

// Set routes
function onSocketConnection(client) {
	client.on("disconnect", onDisconnect);
	client.on("setup player", onSetupPlayer);
	client.on("ping", onPing);
	client.on("update", onHeartbeat);
};

// Setup Player
function onSetupPlayer(data) {
	var pSpawnX = getRandomInt(squareSize, gameWidth - (squareSize * 2));
	var pSpawnY = getRandomInt(squareSize, gameHeight - (squareSize * 2));
	var randomColor = '#FE30F7';
	var newPlayer = new Player(pSpawnX, pSpawnY, randomColor, data.name,
			this.id, squareSize);
	socket.to(this.id).emit('setup game', {
		localPlayer : newPlayer,
		gameWidth : gameWidth,
		gameHeight : gameHeight,
		squareSize : squareSize,
	});
	newPlayer.lastHeartbeat = new Date().getTime();
	this.broadcast.emit('new player', {
		newPlayer : newPlayer
	});
	for (var i = 0; i < players.length; i++) {
		socket.to(this.id).emit('new player', {
			newPlayer : players[i]
		});
	}
	players.push(newPlayer);
	console.log(this.id + ": " + newPlayer.name + " Connected");
	sockets[this.id] = socket;

	if (walls.length < 1) {
		// FIRST PLAYER JOINS LOBBY:
		generateMap();
	}

	// Send Map Data to new Player:
	socket.to(this.id).emit('setup map', {
		walls : walls,
		pellets : pellets
	});
}

// Generate Level:
function generateMap() {
	var randX = 0;
	var randY = 0;

	// WALLS:
	for (var x = 0; x < gameWidth / 85; ++x) {
		randX = Math.ceil(getRandomInt(0, gameWidth - squareSize) / squareSize)
				* squareSize;
		randY = Math
				.ceil(getRandomInt(0, gameHeight - squareSize) / squareSize)
				* squareSize;
		walls.push(new Wall(randX, randY, squareSize));
	}

	// PELLETS:
	for (var x = 0; x < walls.length / 1.75; ++x) {
		pellets.push(new Pellet(gameWidth, gameHeight, pelletSize, walls, x));
	}
}

// Player heartbeat
function onHeartbeat(data) {
	var movePlayer = playerById(data.input.id);
	movePlayer.lastHeartbeat = new Date().getTime();
	if (data.input.speed > 1)
		data.input.speed = 1;
	if (data.input != undefined) {
		movePlayer.processInput(data.input, gameWidth, gameHeight, walls,
				pellets);
		movePlayer.lastProcessedInput = data.input.sequence;
	}
}

// Update Game:
function update() {
	var now = Date.now();
	var dt = now - lastUpdate;
	lastUpdate = now;
}

// Send Updates
function sendUpdates() {
	// GET PELLET DATA:
	var pelletsToSend = [];
	for (var i = 0; i < pellets.length; ++i) {
		if (pellets[i].sendToClient) {
			pellets[i].sendToClient = false;
			pelletsToSend.push(pellets[i]);
		}
	}

	// Send Data to all Players:
	players.forEach(function(player) {
		sockets[player.id].emit('update player', {
			x : player.x,
			y : player.y,
			angle : player.angleRad,
			score : player.points,
			id : player.id,
			pellets : pelletsToSend,
			lastProcessedInput : player.lastProcessedInput
		});
	});
}

// Player Disconnect
function onDisconnect() {
	var removePlayer = playerById(this.id);
	players.splice(players.indexOf(removePlayer), 1);
	console.log(removePlayer.id + ' Disconnected');
	players.forEach(function(player) {
		sockets[player.id].emit('remove player', {
			id : removePlayer.id
		});
	});
}

// Check Latency
function onPing() {
	socket.emit("pong");
}

// Send index page html
app.get('/', function(req, res) {
	res.sendfile("public/html/index.html");
});

// Send game page html
app.get('/lobby', function(req, res) {
	res.sendfile("public/html/lobby.html");
});

// Turn on server
http.listen(server_port, server_ip_address, function() {
	console.log("App Listening on " + server_ip_address + ", server_port "
			+ server_port)
});

// Find player by id
function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}
	return false;
};

// RANDOM:
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(update, 1000 / 100);
setInterval(sendUpdates, 1000 / 60);
setEventHandlers();