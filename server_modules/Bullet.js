var Bullet = function(start, end, dir, id, uniID) {
	var startPoint = start;
	var endPoint = end;
	var direction = dir;
	var width = 5;
	var speed = 20;
	var ownerId = id;
	var uID = uniID;

	var updatePath = function(delta) {
		endPoint.x = (endPoint.x + ((speed * delta) * Math.cos(direction)));
		endPoint.y = (endPoint.y + ((speed * delta) * Math.sin(direction)));
		width -= (delta / 100);
		if (width <= 0) {
			return false;
		}
		return true;
	}

	return {
		updatePath : updatePath,
		get startPoint() {
            return startPoint;
        },
        get endPoint() {
            return endPoint;
        },
        get uID() {
            return uID;
        }
	};
}
exports.Bullet = Bullet;