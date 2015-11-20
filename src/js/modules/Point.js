define(function(){

	function Point(x, y, context) {
		this.x = x;
		this.y = y;
		this.r = 2;
		this.ctx = context;
	}
	Point.prototype.draw = function() {
		this.ctx.fillStyle = '#f00';
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();
	};

	return Point;

});