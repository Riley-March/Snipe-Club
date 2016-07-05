var Wall = function(x, y, scale) {
	var x = x;
	var y = y;
	var scale = scale;
	var scalePad = scale / 3;
	
	var containsPoint = function (xO, yO){
		if ((xO >= x - scalePad && xO <= x + scale + scalePad)
				&& (yO >= y  - scalePad && yO <= y + scale + scalePad)){
			return true;
		}
		return false;
	}
	
	return {
		containsPoint : containsPoint,
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
        get scale() {
            return scale;
        },
        get scalePad() {
            return scalePad;
        }
	};
}
exports.Wall = Wall;