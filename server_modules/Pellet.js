var Pellet = function(xW, yW, scale, walls, index) {
	var x = xW;
	var y = yW;
	var scale = scale;
	var walls = walls;
	var failSaveCount = 0;
	var sendToClient = false;
	var index = index;
	randomizePos(x, y);
	
	function randomizePos(gW, gH) {
		failSaveCount ++; // MAKE SURE IT DOESNT TRY TOO MANY TIMES
		x = Math.floor(Math.random() * (gW - 0 + 1)) + 0;
		y = Math.floor(Math.random() * (gH - 0 + 1)) + 0;
		var finalized = true;
		for (var i = 0; i < walls.length; ++i){
			if (failSaveCount < 4 && walls[i].containsPoint(x, y)) {
				finalized = false;
				randomizePos(gW, gH);
				break;
			}
		}
		if (finalized) {
			failSaveCount = 0;
			sendToClient = true;
		}
	}
	
	return {
		sendToClient : sendToClient,
		randomizePos : randomizePos,
		index : index,
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
        }
	};
}
exports.Pellet = Pellet;
