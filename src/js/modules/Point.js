export default class Point {

	constructor(x, y, color, size, context) {

		this.x = x;
		this.y = y;
		this.r = size/2;
		this.color = color;
		this.ctx = context;

	}

	draw() {

		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();

	}
}
