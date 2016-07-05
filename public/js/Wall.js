var Wall = function(x, y, xO, yO, scale) {
	var x = x + xO;
	var y = y + yO;
	var scale = scale;
	var scalePad = scale / 3;
	var radius = scale / 4;
	var rH = radius / 3; // PADDING

	var moveCamera = function(camX, camY) {
		x += camX;
		y += camY;
	}
	
	var containsPoint = function (xO, yO){
		if ((xO >= x - scalePad && xO <= x + scale + scalePad)
				&& (yO >= y  - scalePad && yO <= y + scale + scalePad)){
			return true;
		}
		return false;
	}

	function draw(ctx) {
		// DRAW SHAPE:
		ctx.beginPath();
		ctx.moveTo(x + rH, y + rH);
		ctx.lineTo(x + scale - rH, y + rH);
		ctx.lineTo(x + scale - rH, y + scale - rH);
		ctx.lineTo(x + rH, y + scale - rH);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}

	return {
		containsPoint : containsPoint,
		moveCamera : moveCamera,
		draw : draw, 
		get x() {
            return x;
        },
        set x(xN) {
        	x = xN;
        },
        get y() {
            return y;
        },
        set y(yN) {
        	y = yN;
        },
        get radius() {
            return radius;
        },
        get scale() {
            return scale;
        },
        get scalePad() {
            return scalePad;
        }
	}
};