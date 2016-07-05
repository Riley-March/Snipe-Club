var Map = function(screenWidth, screenHeight, gameWidth, gameHeight, xoffset,
		yoffset, squareSize) {
	var screenWidth = screenWidth;
	var screenHeight = screenHeight;
	var gameWidth = gameWidth;
	var gameHeight = gameHeight;
	var xoffset = xoffset;
	var yoffset = yoffset;
	var squareSize = squareSize;

	var leftBorder = new Border(0, 0, 0, gameHeight, 5);
	var topBorder = new Border(0, 0, gameWidth, 0, 5);
	var rightBorder = new Border(gameWidth, 0, gameWidth, gameHeight, 5);
	var bottomBorder = new Border(0, gameHeight, gameWidth, gameHeight, 5);

	var draw = function(target, context) {
		context.fillStyle = "#362159";
		context.fillRect(0, 0, screenWidth, screenHeight);

		// DRAW GRID:
		if (squareSize > 0) {
			context.lineWidth = 2;
			context.strokeStyle = "#564291";
			context.beginPath();
			for (var x = xoffset; x < screenWidth; x += squareSize) {
				context.moveTo(x, 0);
				context.lineTo(x, screenHeight);
			}
			for (var y = yoffset; y < screenHeight; y += squareSize) {
				context.moveTo(0, y);
				context.lineTo(screenWidth, y);
			}
			context.stroke();
		}

		context.strokeStyle = "#564291";
		context.lineJoin = "round";
		context.lineWidth = 6;
		context.beginPath();
		leftBorder.draw(context);
		topBorder.draw(context);
		rightBorder.draw(context);
		bottomBorder.draw(context);
		context.stroke();
		context.restore();
	}

	var move = function(cameraXSpeed, cameraYSpeed) {
		cameraXSpeed = -cameraXSpeed;
		cameraYSpeed = -cameraYSpeed;
		xoffset += cameraXSpeed;
		yoffset += cameraYSpeed;
		leftBorder.move(cameraXSpeed, cameraYSpeed);
		topBorder.move(cameraXSpeed, cameraYSpeed);
		rightBorder.move(cameraXSpeed, cameraYSpeed);
		bottomBorder.move(cameraXSpeed, cameraYSpeed);
	}

	var getLeftBorder = function() {
		return leftBorder;
	}

	var getTopBorder = function() {
		return topBorder;
	}

	var getRightBorder = function() {
		return rightBorder;
	}

	var getBottomBorder = function() {
		return bottomBorder;
	}

	var setScreenWidth = function(screenWidth) {
		screenWidth = screenWidth;
	}

	var setScreenHeight = function(screenHeight) {
		screenHeight = screenHeight;
	}

	var getZeroX = function() {
		return leftBorder.getX1();
	}

	var getZeroY = function() {
		return leftBorder.getY1();
	}

	return {
		draw : draw,
		move : move,
		setScreenWidth : setScreenWidth,
		setScreenHeight : setScreenHeight,
		getLeftBorder : getLeftBorder,
		getTopBorder : getTopBorder,
		getRightBorder : getRightBorder,
		getBottomBorder : getBottomBorder,
		getZeroX : getZeroX,
		getZeroY : getZeroY
	}
}