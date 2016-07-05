var Point2D = function(sX, sY) {
	var x = sX;
	var y = sY;
	
	var setLocation = function(newX, newY){
		x = newX;
		y = newY;
	}
	
	var move = function(xM, yM){
		x += xM;
		y += yM;
	}
	
	return {
		setLocation: setLocation,
		move: move,
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
        }
	}
};