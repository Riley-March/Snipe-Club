var canvas;
var context;
var socket;

var localPlayer;
var target = {
	x : 0,
	y : 0
};
var players = [];
var bullets = [];
var walls = [];
var pellets = [];

var camera;
var gameWidth;
var gameHeight;
var screenWidth;
var screenHeight;
var xOffset;
var yOffset;
var map;
var squareSize;

var startTime;
var lastUpdate;
var clientTime;
var delta;
var ready = false;
var now;
var latency;
var moveSequence = 0;
var movementInputs = [];
var inputInfo = {
	angle : 0,
	speed : 0,
	boostMode : false
};
var lastPingTimer;

var init = function() {
	// Setup Socket
	socket = io.connect();
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;

	// Setup Canvas
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	context.lineJoin = "round";
	canvas.width = screenWidth;
	canvas.height = screenHeight;

	// Setup Event Handlers
	setEventHandlers();

	// Check Latency
	lastPingTimer = 0;
	setInterval(function() {
		startTime = Date.now();
		socket.emit("ping");
		lastPingTimer += 2;
	}, 2000);
	lastUpdate = Date.now();
	delta = 0;
}

var setEventHandlers = function() {
	// Set Routes For Connections
	socket.on("setup game", onSetupGame);
	socket.on("new player", onNewPlayer);
	socket.on("update player", onUpdatePlayer);
	socket.on("remove player", onRemovePlayer);
	socket.on("setup map", onSetupMap);
	socket.on("pong", onPong);
}

function onSetupGame(data) {
	// Setup Local Player And Game:
	if (localPlayer == null) {
		localPlayer = new Player(data.localPlayer.x, data.localPlayer.y,
				data.localPlayer.color, data.localPlayer.name,
				data.localPlayer.id, data.localPlayer.speed,
				data.localPlayer.bSpeed);
		target = {
			x : localPlayer.x,
			y : localPlayer.x
		};
		gameWidth = data.gameWidth;
		gameHeight = data.gameHeight;
		xOffset = -gameWidth;
		yOffset = -gameHeight;
		squareSize = data.squareSize;
		camera = new Camera(localPlayer, canvas);
		map = new Map(screenWidth, screenHeight, gameWidth, gameHeight,
				xOffset, yOffset, squareSize);

		// Move Camera to Player Position:
		camera.moveToTarget();
		moveWorld(camera.getXSpeed(), camera.getYSpeed());

		// MOUSE MOVEMENT:
		canvas.onmousemove = function(e) {
			e.preventDefault();
			target.x = e.pageX;
			target.y = e.pageY;

			// GET INPUT RELATED DATA:
			inputInfo.angle = Math.atan2((target.y - localPlayer.getY()),
					(target.x - localPlayer.getX()));
			var dist = Math.sqrt((localPlayer.getX() - target.x)
					* (localPlayer.getX() - target.x)
					+ (localPlayer.getY() - target.y)
					* (localPlayer.getY() - target.y));
			var speedMult = dist / (canvas.height / 4);
			if (speedMult > 1)
				speedMult = 1;
			inputInfo.speed = speedMult;
		}

		// Mouse: (TOGGLE BOOST MODE)
		canvas.onmousedown = function(e) {
			e.preventDefault();
			inputInfo.boostMode = true;
		}
		canvas.onmouseup = function(e) {
			e.preventDefault();
			inputInfo.boostMode = false;
		}
		// Set Ready:
		ready = true;
	}
}

function onSetupMap(data) {
	walls = []; // Clear
	for (var i = 0; i < data.walls.length; ++i) {
		if (data.walls[i] != undefined) {
			walls.push(new Wall(data.walls[i].x, data.walls[i].y, map
					.getZeroX(), map.getZeroY(), squareSize));
		}
	}
	pellets = []; // Clear
	for (var i = 0; i < data.pellets.length; ++i) {
		if (data.pellets[i] != undefined) {
			pellets.push(new Pellet(data.pellets[i].x, data.pellets[i].y, map
					.getZeroX(), map.getZeroY(), data.pellets[i].scale,
					data.pellets[i].index, data.pellets[i].points));
		}
	}
}

function onNewPlayer(data) {
	// Add New Player To Game
	if (localPlayer != undefined && data.newPlayer.id != localPlayer.id) {
		newPlayer = new Player(data.newPlayer.x, data.newPlayer.y,
				data.newPlayer.color, data.newPlayer.name, data.newPlayer.id,
				data.newPlayer.speed, data.newPlayer.bSpeed);
		newPlayer.setXOff(map.getZeroX());
		newPlayer.setYOff(map.getZeroY());
		players.push(newPlayer);
	}
}

function onRemovePlayer(data) {
	// Remove Player When disconnect:
	var removePlayer = playerById(data.id);
	if (removePlayer != undefined) {
		players.splice(players.indexOf(removePlayer), 1);
	}
}

function onUpdatePlayer(data) {
	if (ready) {
		if (data.id === localPlayer.id) {
			// SET GENERAL INFO:
			localPlayer.moveTo(data.x, data.y);
			localPlayer.setAngle(data.angle);
			// IF POINT DIFFERENCE IS TO GREAT:
			if (Math.abs(localPlayer.points - data.score) >= 6)
				localPlayer.points = data.score;
			for (var i = 0; i < data.pellets.length; ++i) {
				pellets[data.pellets[i].index].updateInfo(data.pellets[i], map);
			}

			// MOVE ADJUSTER:
			var j = 0;
			while (j < movementInputs.length) {
				var oldInput = movementInputs[j];
				if (oldInput.sequence <= data.lastProcessedInput) {
					movementInputs.splice(j, 1);
				} else {
					localPlayer.processInput(oldInput, map, walls, pellets);
					j++;
				}
			}
		} else {
			// SET INFO:
			var movePlayer = playerById(data.id);
			if (movePlayer != undefined) {
				movePlayer.moveTo(data.x, data.y);
				movePlayer.setAngle(data.angle);
				movePlayer.points = data.score;
			}
		}
	}
}

function animate() {
	// Animation Loop
	if (ready) {
		now = Date.now();
		delta = now - lastUpdate;
		clientTime += delta;
		lastUpdate = now;
		update(delta);
		draw();
	}
	setTimeout(animate, 1000 / 60);
}

function update(dt) {
	// Update Camera
	camera.update(dt, gameWidth);
	var xS = camera.getXSpeed();
	var yS = camera.getYSpeed();

	// LOCAL PLAYER:
	var isBoosting = (inputInfo.boostMode);
	var input = {
		id : localPlayer.id,
		time : dt,
		angle : inputInfo.angle,
		speed : inputInfo.speed,
		boost : isBoosting,
		sequence : moveSequence++,
	};
	if (inputInfo.speed <= 0) {
	} else {
		socket.emit("update", {
			input : input
		});
		movementInputs.push(input);
		localPlayer.processInput(input, map, walls, pellets);
	}

	// OTHER PLAYERS:
	for (var i = 0; i < players.length; i++) {
		players[i].update(map, dt);
	}

	moveWorld(xS, yS);
}

function moveWorld(xS, yS) {
	// Player Movement:
	localPlayer.moveCamera(-xS, -yS);

	// Other Players Movement:
	for (var i = 0; i < players.length; i++) {
		players[i].moveCamera(-xS, -yS);
	}

	// Map Movement:
	map.move(xS, yS);

	// Wall Movement:
	for (var i = 0; i < walls.length; ++i) {
		walls[i].moveCamera(-xS, -yS);
	}

	// Pellet Movement:
	for (var i = 0; i < pellets.length; ++i) {
		pellets[i].moveCamera(-xS, -yS);
	}
}

function draw() {
	// Clear Canvas
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw Map
	map.draw(localPlayer, context);

	// Draw Pellets:
	if (pellets.length > 0) {
		context.fillStyle = "#beb541";
		context.strokeStyle = "#f4e854";
	}
	for (var i = 0; i < pellets.length; ++i) {
		pellets[i].draw(context);
	}

	// Draw Other Players
	for (var i = 0; i < players.length; i++) {
		players[i].draw(context);
	}

	// Draw Player
	localPlayer.draw(context);

	// Draw Walls:
	if (walls.length > 0) {
		context.lineWidth = walls[0].radius;
		context.fillStyle = '#4A3A78';
		context.strokeStyle = "#755CC1";
	}
	for (var i = 0; i < walls.length; ++i) {
		walls[i].draw(context);
	}

	// Draw Console Text
	// drawText(0, 20, " Player X: " + localPlayer.getX() + " Player Y: "
	// + localPlayer.getY());
	// drawText(0, 40, " Players in Lobby: " + (players.length + 1));
	// drawText(0, 60, " Ping: " + latency);
	// drawText(0, 80, " Local Move Sequences: " + movementInputs.length);
	// drawText(0, 100, " Last Ping: " + lastPingTimer);
	// drawText(0, 120, " Player Score: " + localPlayer.points);

	// DRAW UI:
	var UIPadding = screenHeight / 40;

	// SCORE:
	var textSize = (screenHeight / 27);
	var scoreText = ("Energy: " + localPlayer.points);
	context.font = "bold " + textSize + "px Arial";
	var textMeasure = context.measureText(scoreText);
	context.globalAlpha = 0.6;
	context.fillStyle = "black";
	var boxY = (screenHeight - (textSize / 2)) - (UIPadding / 1.5);
	var boxX = (screenWidth / 2);
	context.fillRect(boxX - ((textMeasure.width / 2) + UIPadding), boxY
			- (textSize + (UIPadding / 2)),
			(textMeasure.width + (UIPadding * 2)), (textSize + (UIPadding)));
	context.globalAlpha = 1;
	context.fillStyle = "white";
	context.textAlign = "center";
	context.fillText(scoreText, boxX, boxY);

	// MAP:
	context.globalAlpha = 0.6;
	context.fillStyle = "black";
	var mapScale = screenHeight / 4;
	var mapStartX = screenWidth - (mapScale + UIPadding);
	var mapStartY = UIPadding;
	var dotScale = mapScale / 52;
	context.fillRect(mapStartX, mapStartY, mapScale, mapScale);
	context.globalAlpha = 1;
	context.fillStyle = 'red';
	context.beginPath();
	var tmpX = (mapStartX + (mapScale * (localPlayer.getWorldX() / gameWidth)));
	var tmpY = (mapStartY + (mapScale * (localPlayer.getWorldY() / gameHeight)));
	context.arc(tmpX, tmpY, dotScale, 0, 2 * Math.PI, false);
	context.fill();
	context.fillStyle = 'white';
	for (var i = 0; i < players.length; ++i) {
		context.beginPath();
		tmpX = (mapStartX + (mapScale * (players[i].getWorldX() / gameWidth)));
		tmpY = (mapStartY + (mapScale * (players[i].getWorldY() / gameHeight)));
		context.arc(tmpX, tmpY, dotScale, 0, 2 * Math.PI, false);
		context.fill();
	}
}

function onPong() {
	// Check Latency
	latency = Date.now() - startTime;
	lastPingTimer = 0;
}

// Load game menu on page ready
$(document).ready(function() {
	$('#overlay, #overlay-back').fadeIn(500);
	drawMenuBackground();
});

// Load game when player has loaded
$('#submitButton').on('click', function() {
	$('#overlay').fadeOut(500);
	var playerName = document.getElementById("name").value;
	socket.emit('setup player', {
		name : playerName
	});
});

// Draw map background for menu screen
function drawMenuBackground() {
	context.fillStyle = "#362159";
	context.fillRect(0, 0, screenWidth, screenHeight);
	context.lineWidth = 2;
	context.strokeStyle = "#564291";
	context.beginPath();
	for (var x = 0; x < screenWidth; x += 50) {
		context.moveTo(x, 0);
		context.lineTo(x, screenHeight);
	}
	for (var y = 0; y < screenHeight; y += 50) {
		context.moveTo(0, y);
		context.lineTo(screenWidth, y);
	}
	context.stroke();
	context.restore();

	context.fillStyle = "white";
	context.textAlign = "center";
	var textSize = (screenHeight / 35);
	context.font = "bold " + textSize + "px Arial";
	context.fillText("created by sidney de vries & riley march",
			screenWidth / 2, screenHeight - (textSize / 1.5));
}

// Draw status text
function drawText(x, y, text) {
	context.fillStyle = "white";
	context.textAlign = "left";
	context.font = "12px Arial";
	context.fillText(text, x, y);
}

// Find player by socket id
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	}
	return false;
}

// Window Resize
window.addEventListener('resize', function() {
	if (map != undefined) {
		screenWidth = window.innerWidth;
		screenHeight = window.innerHeight;
		canvas.width = screenWidth;
		canvas.height = screenHeight;
		map.setScreenWidth(screenWidth);
		map.setScreenHeight(screenHeight);
	}
}, true);