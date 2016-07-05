var Pellet = function(x, y, xO, yO, scale, index) {
	var xO = xO;
	var yO = yO;
	var x = x + xO;
	var y = y + yO;
	var scale = scale;
	var hScale = scale / 2;
	var sclAnim = 1;
	var radius = scale;
	var index = index;
	var rotation = (Math.PI / 180) * 45;
	var active = true;
	
	var moveCamera = function(camX, camY) {
		if(active) {
			x += camX;
			y += camY;
		}
	}
	
	var updateInfo = function(info, map){
		x = info.x + map.getZeroX();
		y = info.y + map.getZeroY();
		active = true;
		sclAnim = 0;
	}
	
	function draw(ctx) {
		// ANIMATE:
		if (sclAnim < 1){
			sclAnim += 0.05;
			if (sclAnim > 1)
				sclAnim = 1;
		}
		context.lineWidth = radius * sclAnim;

		// DRAW SHAPE:
		if (active){
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rotation);
			ctx.translate(-x,-y);
			ctx.beginPath();
			ctx.moveTo(x - (hScale * sclAnim), y - (hScale * sclAnim));
			ctx.lineTo(x + (hScale * sclAnim), y - (hScale * sclAnim));
			ctx.lineTo(x + (hScale * sclAnim), y + (hScale * sclAnim));
			ctx.lineTo(x - (hScale * sclAnim), y + (hScale * sclAnim));
			ctx.closePath();
			ctx.stroke();
			ctx.fill();
			
			// FINISH:
			ctx.restore();
		}
	}
	
	return {
		moveCamera : moveCamera,
		draw : draw,
		updateInfo : updateInfo,
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
        get index() {
            return index;
        },
        get radius() {
            return radius;
        },
        get active() {
            return active;
        },
        set active(aN) {
        	active = aN;
        }
	};
}