var Player = function(x, y, color, name, id, spd, bSpd) {
	var x = x;
	var y = y;
	var xOf = 0;
	var yOf = 0;
	var distToServerPos = 0;
	var scale = 50;
	var id = id;
	var name = name;
	var points = 0;
	var color = color;
	var angle = 0;
	var angleRad = angle;
	var squeeze = 1;
	var camMoveX = 0;
	var camMoveY = 0;
	var speed = spd;
	var bSpeed = bSpd;
	var speedMult = speed;
	var target = {
			x : -1,
			y : -1
	};
	
	var targetLocation = null;
	var deltaTimer = -1;
	var deltaTick = null;
	
	var movementTicks = 100; // Assuming 1 tick / second?
	var processTarget = function() {
		if (targetLocation == null) {
			return;
		}
		deltaTick = {
			x: (targetLocation.x - x) / movementTicks,
			y: (targetLocation.y - y) / movementTicks	
		}
		deltaTimer = movementTicks;
		targetLocation = null;
	}
	
	var moveTo = function(tX, tY) {
		tX += (camMoveX + xOf);
		tY += (camMoveY + yOf);
		x = tX;
		y = tY;
		
		// Add the desired location to the queue
		targetLocation = {
			x: tX,
			y: tY	
		}
		if (deltaTimer <= 0) {
			processTarget();
		}
	}
	
	var setTarget = function(tX, tY) {
		if (target.x == -1 && target.y == -1){
			x = (tX + camMoveX + xOf);
			y = (tY + camMoveY + yOf);
		}
		target.x = (tX + camMoveX + xOf);
		target.y = (tY + camMoveY + yOf);
	}
	
	var moveCamera = function(camX, camY) {
		camMoveX += camX;
		camMoveY += camY;
		x += camX;
		y += camY;
	}
	
	var processInput = function(input, map, walls, pellets) {
		// LOCAL PLAYER:
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
			if (x < map.getLeftBorder().getX1()) {
				x = oldX;
			} else if (x > map.getRightBorder().getX1()) {
				x = oldX;
			}
			if (y < map.getTopBorder().getY1()) {
				y = oldY;
			} else if (y > map.getBottomBorder().getY1()) {
				y = oldY;
			}
			// WALL COLLISION:
			for (var i = 0; i < walls.length; ++i) {
				if (walls[i].containsPoint(x, y)){
					if (oldX < walls[i].x - walls[i].scalePad ||
							oldX > walls[i].x + walls[i].scale + walls[i].scalePad) {
						// HIT WALL FROM RIGHT OR LEFT:
						x = oldX;
					} else if (oldY < walls[i].y - walls[i].scalePad|| 
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
				if (pellets[i].active) {
					 aC = (scale / 2) + pellets[i].scale;
					 xC = x - pellets[i].x;
					 yC = y - pellets[i].y;
					 if (aC > Math.sqrt((xC * xC) + (yC * yC))) {
						// COLLIDED:
						points += 1;
						pellets[i].active = false;
					 }   
				}
			}
		} 
	}
	
	var update = function(map, dt) {
		// TWEEN OTHERS:
		if (deltaTimer > 0) {
			x += deltaTick.x;
			y += deltaTick.y;
			deltaTimer--;
		} else {
			processTarget();
		}
	} 
	
	function draw(ctx) {
		// DRAW SHAPE:
		var rotation = (Math.PI / 180) * angle;
		var radius = scale / 4;
		ctx.fillStyle = '#BE1942';
		ctx.strokeStyle = "#FF2159";
		ctx.lineJoin = "round";
		ctx.lineWidth = radius;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(rotation);
		ctx.beginPath();
		ctx.moveTo(0, (-2 * scale / 3));
		ctx.lineTo((-scale / 2) * squeeze, scale / 3);
		ctx.lineTo((scale / 2) * squeeze, scale / 3);
		ctx.lineTo(0, (-2 * scale / 3));
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
		
		// RESET:
		ctx.restore();
		
		// DRAW NAME:
		if (name != undefined) {
			var textSize = (scale / 3);
			ctx.strokeStyle = "#555555";
			ctx.fillStyle = "#FFFFFF";
			ctx.font = ("bold " + textSize + "px Arial");
			ctx.lineWidth = (textSize / 7);
			ctx.textAlign = "center";
			ctx.textBaseline = 'bottom';
			var textY = (y + (scale * 1.2));
			ctx.strokeText(name,x, textY);
			ctx.fillText(name, x, textY);
		}
	}

	var getX = function() {
		return x;
	}
	
	var getWorldX = function (){
		return (x - (camMoveX + xOf));
	}
	
	var getY = function() {
		return y;
	}

	var getWorldY = function (){
		return (y - (camMoveY + yOf));
	}
	
	var getScale = function() {
		return scale;
	}

	var setAngle = function(ang) {
		angleRad = ang;
		angle = (ang * (180 / Math.PI)) + 90;
	}

	var getAngle = function() {
		return angle;
	}

	var setXOff = function(of) {
		xOf = of;
	}

	var setYOff = function(of) {
		yOf = of;
	}

	return {
		getX : getX,
		getWorldX : getWorldX,
		getY : getY,
		getWorldY : getWorldY,
		update : update,
		processInput : processInput,
		getScale : getScale,
		draw : draw,
		id : id,
		moveCamera : moveCamera,
		moveTo : moveTo,
		setTarget : setTarget,
		setAngle : setAngle,
		setXOff : setXOff,
		setYOff : setYOff,
		 get squeeze() {
            return squeeze;
        },
        set squeeze(sq) {
        	squeeze = sq;
        },
        get speed() {
            return speed;
        },
        set speed(sp) {
        	speed = sp;
        },
        set speedMult(sp) {
        	speedMult = sp;
        },
        get points() {
            return points;
        },
        set points(nP) {
        	points = nP;
        }
	}
};