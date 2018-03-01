import Point from "./Point";


export default class BezierPoint {

	constructor(x, y, context, color, size, cpDist) {

		this.cpDist = cpDist;

		this.color = color;
		this.size = size;

		this.position = new Point(x, y, this.color, this.size, context);
		this.cp1 = new Point(x-this.cpDist, y, this.color, this.size, context);
		this.cp2 = new Point(x+this.cpDist, y, this.color, this.size, context);

		this.ctx = context;
		this.r = 2;

		this.collapsed = false;

	}

	collapse() {
	
		if (!this.collapsed) {
			this.collapsed = true;
			this.cp1.x = this.cp2.x = this.position.x;
			this.cp1.y = this.cp2.y = this.position.y;
		} else {
			this.collapsed = false;
			this.cp1.x = this.position.x - this.cpDist;
			this.cp2.x = this.position.x + this.cpDist;
		}

	}

	move() {

		if (!this.collapsed) {
			this.v1x = this.cp1.x - this.position.x;
			this.v1y = this.cp1.y - this.position.y;
			this.v2x = this.cp2.x - this.position.x;
			this.v2y = this.cp2.y - this.position.y;
		} else {
			this.v1x = this.v1y = this.v2x = this.v2y = 0;
		}

	}

	setPointStyle(color, size) {

		this.position.color = color;
		this.cp1.color = color;
		this.cp2.color = color;
		this.position.r = size/2;
		this.cp1.r = size/2;
		this.cp2.r = size/2;
	}

	draw() {

		this.ctx.lineWidth = 0.2;

		this.ctx.beginPath();
		this.ctx.moveTo(this.position.x, this.position.y);
		this.ctx.lineTo(this.cp1.x, this.cp1.y);
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.moveTo(this.position.x, this.position.y);
		this.ctx.lineTo(this.cp2.x, this.cp2.y);
		this.ctx.stroke();

		this.position.draw();
		this.cp1.draw();
		this.cp2.draw();

	}
}