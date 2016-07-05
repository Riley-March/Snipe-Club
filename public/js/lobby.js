var messageApp = angular.module('app', []);
var canvas;
var ctx;
var localPlayer;
var keys;
var socket;
var lastTime;
var startTime;
var topViewport;
var leftViewport;
var lastUpdate;
var camera;
var map;
var xoffset;
var yoffset;
var gameWidth;
var gameHeight;
var ready = false;
var remotePlayers = [];
var bullets = [];
var clientTime = 0;

var init = function(){
	socket = io.connect();
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
	canvas.width = screenWidth;
	canvas.height = screenHeight;
	keys = new Keys();
	setEventHandlers();
	setInterval(function(){
		startTime = Date.now();
		socket.emit("ping");
	}, 2000);
	lastUpdate = Date.now()
};

var setEventHandlers = function() {
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	socket.on("connect", onSocketConnected);
	socket.on("connect ok", connectOk);
	socket.on("disconnect", onSocketDisconnect);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
	socket.on("pong", onPong);
	socket.on("update angle", onUpdateAngle);
	socket.on("new bullet", onNewBullet);
	socket.on("update", serverUpdate);
};

function onPong(){
	latency = Date.now() - startTime;
	//console.log(latency);
}

function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

function onSocketConnected() {
	var url = document.location.href,
	params = url.split('?')[1].split('&'),
	data = {}, tmp;
	for (var i = 0, l = params.length; i < l; i++) {
		tmp = params[i].split('=');
		data[tmp[0]] = tmp[1];
	}
	socket.emit('new player', {name: data.name});
};

function connectOk(data){
	localPlayer = new Player(data.localPlayer.x, data.localPlayer.y, data.localPlayer.color);
	gameWidth = data.gameWidth;
	gameHeight = data.gameHeight;
	xoffset = -gameWidth;
	yoffset = -gameHeight;
	camera = new Camera(localPlayer, canvas);
	map = new Map(screenWidth, screenHeight, gameWidth, gameHeight, xoffset, yoffset);
	ready = true;
}

function onSocketDisconnect() {
	//socket.close();
};

function onNewPlayer(data) {
	var addPlayer = true;
	for (var i = 0 ;i < remotePlayers.length; i++){
		if (addPlayer && remotePlayers[i].getId() === data.newPlayer.getId()){
			addPlayer = false;
		}
	}
	if (addPlayer){
		remotePlayers.push(data.newPlayer);
	}
};

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);
	
	if (!movePlayer) {
		console.log("Player not found: "+ data.id);
		return;
	};
	
	movePlayer.setLocation(data.x, data.y);
	//movePlayer.moveTo(data.x, data.y);
};

function onUpdateAngle(data){
	var updatePlayer = playerById(data.id);
	if(!updatePlayer){
		console.log("Player not found: " + data.id);
		return;
	}
	updatePlayer.setAngle(data.angle);
}

function onNewBullet(data){
	var player = playerById(data.id);
	shootOtherBullet(player);
}

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	if (!removePlayer) {
		console.log("Player not found: " + data.id);
		return;
	};
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
	console.log(data.id + " Disconnected");
};

function animate() {
	var now = Date.now();
	var dt = now - lastUpdate;
	clientTime += dt;
	lastUpdate = now;
	update(dt);
	draw();
	window.requestAnimFrame(animate);
};

function serverUpdate(data){
	//console.log("Players: " + data.players);
	//console.log("Bullets: " + data.bullets);
}

function update(dt) {
	if(ready){
		// ACTUAL MOVEMENT:
		var pMov = localPlayer.update(keys, dt, map);
		for (var i = 0; i < remotePlayers.length; ++i){
			remotePlayers[i].moveToTarget(dt);
		}
		
		document.onmousemove = function(e){
		    var cursorX = e.pageX;
		    var cursorY = e.pageY;
		    var pRotate = localPlayer.rotate(cursorX, cursorY);
		    if(pRotate){
		    	socket.emit("update angle", {angle: localPlayer.getAngle(), id: localPlayer.getId()});
		    } 
		}
		document.onmousedown = function(e){
			var pShoot = shootPlayerBullet(localPlayer);
			if(pShoot){
				socket.emit("shoot bullet", {angle: localPlayer.getAngle(), xPos: localPlayer.getGlobalX(), yPos: localPlayer.getGlobalY(), id: localPlayer.getId()});
			}
		}
		// UPDATE CAMERA:
		camera.update(dt, localPlayer);
		var xS = camera.getXSpeed();
		var yS = camera.getYSpeed();
		
		// CAMERA BASED MOVEMENT:
		localPlayer.moveLocal(-xS, -yS);
		map.move(xS, yS, ctx);
		
		// BULLET UPDATE: 
		for(var i = 0; i < bullets.length; i++) {
			var bullet = bullets[i];
			if (!bullet.updatePath(dt)){
				// DESTROY BULLET:
				bullets.splice(bullets.indexOf(bullet), 1);
			} else {
				bullet.move(-xS, -yS);
			}
//			
//			// BULLET COLLISION:
//			// TODO:
//			for (var x = 0; x < remotePlayers.length; ++x){
//				// CHECK:
//				// if (...)
//			}
		}
	}
	
	// UPDATE SERVER LOCATION:
	if (pMov) {
		socket.emit("move player", {x: localPlayer.getGlobalX(), y: localPlayer.getGlobalY(), id: localPlayer.getId()});
	}
};

//function checkLineIntersection(startPointL1, endPointL1, startPointL2, endPointL2) {
//	var col = false;
//    var denominator, a, b, numerator1, numerator2;
//    a = startPointL1.getY() - startPointL2.getY();
//    b = startPointL1.getX() - startPointL2.getX();
//    numerator1 = ((endPointL2.getX() - startPointL2.getX()) * a) - ((endPointL2.getY() - startPointL2.getY()) * b);
//    numerator2 = ((endPointL1.getX() - startPointL1.getX()) * a) - ((endPointL1.getY() - startPointL1.getY()) * b);
//    a = numerator1 / denominator;
//    b = numerator2 / denominator;
//    if (a > 0 && a < 1) {
//    	col = true;
//    }
//    if (b > 0 && b < 1) {
//    	col = true;
//    return col;
//};

function draw() {
	if(ready){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		map.draw(localPlayer, ctx, xoffset, yoffset);
		for(var i = 0; i < bullets.length; i++){
			var bullet = bullets[i];
			bullet.draw(ctx);
		}
		localPlayer.draw(ctx);
		for (var i = 0; i < remotePlayers.length; i++) {
			if(remotePlayers[i].getId() != localPlayer.getId()){
				remotePlayers[i].drawOtherPlayer(ctx);
			}
		}; 
	}
};

function shootPlayerBullet(player){
	var startPoint = new Point2D(player.getCenterX(), player.getCenterY());
	var endPoint = new Point2D(player.getCenterX(), player.getCenterY());
	var direction = -((player.getAngle() - 90) * Math.PI / 180);
	var width = 5;
	bullets.push(new Bullet(startPoint, endPoint, direction, width));
	return true;
}

function shootOtherBullet(player){
	var startPoint = new Point2D(map.getLeftBorder().getX1() + player.getGlobalCenterX(), map.getTopBorder().getY1() + player.getGlobalCenterY());
	var endPoint = new Point2D(map.getLeftBorder().getX1() + player.getGlobalCenterX(), map.getTopBorder().getY1() + player.getGlobalCenterY());
	var direction = -((player.getAngle() - 90) * Math.PI / 180);
	var width = 5;
	bullets.push(new Bullet(startPoint, endPoint, direction, width));
	return true;
}

function playerById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getId() === id){
			return remotePlayers[i];
		}
	};
	return false;
};
