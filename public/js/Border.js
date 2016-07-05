var Border = function(x1, y1, x2, y2){
	var x1 = x1;
	var y1 = y1;
	var x2 = x2;
	var y2 = y2;
	
	var draw = function(context){
	    context.moveTo(x1, y1);
	    context.lineTo(x2, y2);
	}

	var move = function(camX, camY){
		x1 += camX;
		x2 += camX;
		y1 += camY;
		y2 += camY;
	}

	var getX1 = function() {
		return x1;
	};

	var getY1 = function() {
		return y1;
	};
	
	var getY2 = function() {
		return x2;
	};

	var getX2 = function() {
		return y2;
	};
	
	return {
		move: move,
		draw: draw,
		getX1: getX1,
		getY1: getY1,
		getX2, getX2,
		getY2, getY2
	}
}

