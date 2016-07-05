var Point2D = function(sX, sY) {
	var x = sX;
	var y = sY;

	return {
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
exports.Point2D = Point2D;