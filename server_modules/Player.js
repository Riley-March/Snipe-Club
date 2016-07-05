var Player = function(x, y, color, name, id, scale) {
	var x = x;
	var y = y;
	var lastHeartbeat;
	var angle = 0;
	var angleRad = angle;
	var squeeze = 1;
	var speedMult = 0;
	var speed = 0.2;
	var bSpeed = 0.35;
	var name = name;
	var id = id;
	var color = color;
	var socketId = socketId;
	var scale = scale;
	
	// SCORE:
	var points = 0;
	
	var processInput = function(input, gW, gH, walls, pellets) {
		// SERVER PLAYER:
		setAngle(input.angle);
		speedMult = input.speed * input.time;
		if  (speedMult > 0) {
			var oldX = x;
			var oldY = y;
			if (input.boost){
				x += ((speedMult * bSpeed) * Math.cos(angleRad));
				y += ((speedMult * bSpeed) * Math.sin(angleRad));
			} else {
				x += ((speedMult * speed) * Math.cos(angleRad));
				y += ((speedMult * speed) * Math.sin(angleRad));	
			}
			if (x < 0) {
				x = oldX;
			} else if (x > gW) {
				x = oldX;
			}
			if (y < 0) {
				y = oldY;
			} else if (y > gH) {
				y = oldY;
			}
			// WALL COLLISION:
			for (var i = 0; i < walls.length; ++i){
				if (walls[i].containsPoint(x, y)){
					if (oldX < walls[i].x - walls[i].scalePad ||
							oldX > walls[i].x + walls[i].scale + walls[i].scalePad){
						// HIT WALL FROM RIGHT OR LEFT:
						x = oldX;
					} else if (oldY < walls[i].y - walls[i].scalePad || 
							oldY > walls[i].y + walls[i].scale + walls[i].scalePad){
						// HIT WALL FROM TOP OR BOTTOM:
						y = oldY;
					}
				}
			}
			
			// PELLET COLLISION:
			var aC;
			var xC;
			var yC;
			for (var i = 0; i < pellets.length; ++i){
				 aC = (scale / 2) + pellets[i].scale;
				 xC = x - pellets[i].x;
				 yC = y - pellets[i].y;
				 if (aC > Math.sqrt((xC * xC) + (yC * yC))) {
					// COLLIDED:
					points += 1;
					// PUT INDEX OF PELLET INTO PLAYERS REF ARRAY.
					// DE ACTIVATE TEH PELLET FOR NOW
					// TODO
					pellets[i].randomizePos(gW, gH);
					pellets[i].sendToClient = true;
				 }   
			}
		}
	}

	var setAngle = function(ang) {
		angleRad = ang;
		angle = (ang * (180 / Math.PI)) + 90;
	}

	return {
		// STATIC:
		name : name,
		id : id,
		socketId : socketId,
		processInput : processInput,
		color : color,
		speed : speed,
		bSpeed : bSpeed,
		scale : scale,
		// DYNAMIC:
		setAngle : setAngle,
		get angle() {
            return angle;
        },
        get angleRad() {
            return angleRad;
        },
        get x() {
            return x;
        },
        set x(nX) {
        	x = nX;
        }, 
        get y() {
            return y;
        },
        set y(nY) {
        	y = nY;
        },
        get squeeze() {
            return squeeze;
        },
        set squeeze(sq) {
        	squeeze = sq;
        },
        get lastHeartbeat() {
            return lastHeartbeat;
        },
        set lastHeartbeat(hb) {
        	lastHeartbeat = hb;
        },
        get points() {
            return points;
        },
        set points(nP) {
        	points = nP;
        },
        set speedMult(sM) {
        	speedMult = sM;
        },
        get speedMult() {
            return speedMult;
        }
	}
};
exports.Player = Player;