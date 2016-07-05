var Camera = function(newTarget, canvas) {
	var target = newTarget;
	var xPos = canvas.width / 2 - 25;
	var yPos = canvas.height / 2 - 25;
	var tXPos = target.getX();
	var tYPos = target.getY();
	var globalX;
	var globalY;
	var speed;
	var direction;
	var xSpeed;
	var ySpeed;
	var dist;

	var update = function(delta, gameWidth) {
		updateTarget(target);
		dist = Math.sqrt((xPos - tXPos) * (xPos - tXPos) + (yPos - tYPos)
				* (yPos - tYPos));
		if (dist > gameWidth) {
			// REACHED MAX DISTANCE:
			moveToTarget();
		} else {
			if (!atTarget()) {
				speed = ((dist / 80) * (0.3) * delta);
				direction = Math.atan2((tYPos - yPos), (tXPos - xPos));
				xSpeed = speed * Math.cos(direction);
				ySpeed = speed * Math.sin(direction);
			} else {
				xSpeed = 0;
				ySpeed = 0;
				moveToTarget();
			}
		}
	}

	var moveToTarget = function() {
		updateTarget(target);
		xSpeed = (tXPos - xPos);
		ySpeed = (tYPos - yPos);
	}

	var updateTarget = function(targetObject) {
		tXPos = targetObject.getX();
		tYPos = targetObject.getY();
	}

	var atTarget = function() {
		return (dist < target.getScale() / 30);
	}

	var getXSpeed = function() {
		return xSpeed;
	}

	var getYSpeed = function() {
		return ySpeed;
	}

	var getDirection = function() {
		return direction;
	}

	var getTargetX = function() {
		return tXPos;
	}

	var getTargetY = function() {
		return tYPos;
	}

	return {
		update : update,
		updateTarget : updateTarget,
		moveToTarget : moveToTarget,
		atTarget : atTarget,
		getXSpeed : getXSpeed,
		getYSpeed : getYSpeed,
		getDirection : getDirection,
		getTargetX : getTargetX,
		getTargetY : getTargetY
	}
}
