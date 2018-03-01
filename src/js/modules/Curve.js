import BezierPoint from "./BezierPoint";

export default class Curve {

	constructor(context, interval, cpDist) {

		this.BezierPoint = BezierPoint;

		this.cpDist = cpDist ? cpDist : context.canvas.width * 0.2;

		this.pointColor = '#f00';
		this.pointSize = 4;

		this.lineColor = '#fff';
		this.lineWidth = 1;

		this.points = [
			new BezierPoint(0, context.canvas.height, context, this.pointColor, this.pointSize, this.cpDist),
			new BezierPoint(context.canvas.width, 0, context, this.pointColor, this.pointSize, this.cpDist)
		];

		this.ctx = context;
		this.cw = context.canvas.width;
		this.ch = context.canvas.height;

		this.mouseX = 0;
		this.mouseY = 0;

		this.events = {};

		this.interval = interval;

		this.canvasEvents();
		this.createLUT();
		this.draw();

	}

	xGetY(frame) {

		let tolerance = 0.0001;
		
		let iMin = 0;
		let iMax = 5000;
		let key = (iMin+iMax)/2;

		let xTarget = frame/this.interval;
		let xCurrent = this.lookupX[key];

		let i = 0;

		while (Math.abs(xTarget-xCurrent) > tolerance){
			i++;
			
			if (xCurrent > xTarget) {
				iMax = key;
			} else if (xCurrent < xTarget) {
				iMin = key;
			}
			key = Math.round((iMin+iMax)/2);
			xCurrent = this.lookupX[key];

			if (i > 20) {
				break;
			}
		}

		return this.lookupY[key];

	}

	createLUT() {
		
		this.lookupX = [];
		this.lookupY = [];

		//Percent Based Tesselation
		for (let i = 1; i < this.points.length; i++) {
			let p1 = this.points[i-1];
			let p2 = this.points[i];
			let pct = (p2.position.x/this.cw) - (p1.position.x/this.cw);
			for (let t = 0; t < 1; t+=1/(5000*pct)) {
				let x = (Math.pow((1-t),3)*p1.position.x) + (3*Math.pow((1-t),2)*t*p1.cp2.x) + (3*(1-t)*Math.pow(t,2)*p2.cp1.x) + (Math.pow(t,3)*p2.position.x);
				let y = (Math.pow((1-t),3)*p1.position.y) + (3*Math.pow((1-t),2)*t*p1.cp2.y) + (3*(1-t)*Math.pow(t,2)*p2.cp1.y) + (Math.pow(t,3)*p2.position.y);
				this.lookupX.push(x/this.cw);
				this.lookupY.push(-y/this.ch+1);
			}
		}

	}

	on(event, func) {
		this.events['on'+event] = func.bind(this);
	}

	canvasEvents() {

		let x,
			y,
			dist,
			dragReady,
			dragCP,
			draging;

		let _this = this;
		
		this.ctx.canvas.addEventListener('mousemove', function(evt){

			let bbox = this.getBoundingClientRect();

			x = evt.clientX - bbox.left;
			y = evt.clientY - bbox.top;

			_this.mouseX = x;
			_this.mouseY = y;

			for (let i = 0; i < _this.points.length; i++) {
				let p = _this.points[i];

				if (!draging) {

					dist = Math.sqrt((x-p.position.x)*(x-p.position.x) + (y-p.position.y)*(y-p.position.y));
					if (dist <= _this.pointSize/2+2) {
						this.style.cursor = 'pointer';
						dragReady = i;
						break;
					} else {
						dist = Math.sqrt((x-p.cp1.x)*(x-p.cp1.x) + (y-p.cp1.y)*(y-p.cp1.y));
						if (dist <= _this.pointSize/2+2) {
							this.style.cursor = 'pointer';
							dragReady = i;
							dragCP = 'cp1';
							break;
						} else {
							dist = Math.sqrt((x-p.cp2.x)*(x-p.cp2.x) + (y-p.cp2.y)*(y-p.cp2.y));
							if (dist <= _this.pointSize/2+2) {
								this.style.cursor = 'pointer';
								dragReady = i;
								dragCP = 'cp2';
								break;
							} else {
								this.style.cursor = 'initial';
								dragReady = false;
								dragCP = false;
							}
						}
					}

				}

			}

			if (keys[18]) {
				let deltaW = _this.cw / 20;
				let deltaH = _this.ch/ 10;

				let posX = Math.floor((x+deltaW/2) / deltaW);
				let posY = Math.floor((y+deltaH/2) / deltaH);

				x = deltaW * posX;
				y = deltaH * posY;
			}

			if (draging) {
				if (dragCP == 'cp1') {
					_this.points[dragReady].cp1.x = x;
					_this.points[dragReady].cp1.y = y;

					_this.points[dragReady].move();

					if (!keys[16]) {
						_this.points[dragReady].cp2.x = x - _this.points[dragReady].v1x*2;
						_this.points[dragReady].cp2.y = y - _this.points[dragReady].v1y*2;
					}
				} else if (dragCP == 'cp2') {

					_this.points[dragReady].cp2.x = x;
					_this.points[dragReady].cp2.y = y;

					_this.points[dragReady].move();

					if (!keys[16]) {
						_this.points[dragReady].cp1.x = x - _this.points[dragReady].v2x*2;
						_this.points[dragReady].cp1.y = y - _this.points[dragReady].v2y*2;
					}
				} else {
					_this.points[dragReady].move();

					_this.points[dragReady].position.x = x;
					_this.points[dragReady].position.y = y;

					if (dragReady === 0) {
						_this.points[dragReady].position.x = 0;
					}
					if (dragReady == _this.points.length-1) {
						_this.points[dragReady].position.x = _this.cw;
					}

					_this.points[dragReady].cp1.x = _this.points[dragReady].position.x + _this.points[dragReady].v1x;
					_this.points[dragReady].cp1.y = _this.points[dragReady].position.y + _this.points[dragReady].v1y;
					_this.points[dragReady].cp2.x = _this.points[dragReady].position.x + _this.points[dragReady].v2x;
					_this.points[dragReady].cp2.y = _this.points[dragReady].position.y + _this.points[dragReady].v2y;

					let temp;

					if (_this.points[dragReady-1] && _this.points[dragReady+1]) {
						if (_this.points[dragReady].position.x > _this.points[dragReady+1].position.x) {
							temp = _this.points[dragReady];
							_this.points[dragReady] = _this.points[dragReady+1];
							_this.points[dragReady+1] = temp;
							dragReady++;
						}
						if (_this.points[dragReady-1].position.x > _this.points[dragReady].position.x) {
							temp = _this.points[dragReady];
							_this.points[dragReady] = _this.points[dragReady-1];
							_this.points[dragReady-1] = temp;
							dragReady--;
						}
					}

				}
				_this.events.ondrag ? _this.events.ondrag() : null;
				_this.draw();
			}

			_this.events.onmousemove ? _this.events.onmousemove() : null;

		});
		this.ctx.canvas.addEventListener('mousedown', function(evt){
			evt.preventDefault();

			if (dragReady || dragReady === 0) {
				draging = true;
			} else {
				if (dist > 5) {
					dragReady = _this.addPoint(x, y);
					draging = true;
					this.style.cursor = 'pointer';
					_this.draw();
					_this.events.onnewpoint ? _this.events.onnewpoint() : null;
				}
			}

		});
		this.ctx.canvas.addEventListener('mouseup', function(evt){

			draging = false;
			if (dist > 5) {
				dragReady = dragCP = false;
			}

			for (let i = 0; i < _this.points.length; i++) {
				let p = _this.points[i];
				dist = Math.sqrt((x-p.position.x)*(x-p.position.x) + (y-p.position.y)*(y-p.position.y));
				if (dist <= _this.pointSize/2+2) {
					this.style.cursor = 'pointer';
					dragReady = i;
					break;
				}
			}

			_this.createLUT();

		});
		this.ctx.canvas.addEventListener('mouseleave', function(evt){

			if (draging) {
				if (evt.offsetX < 0 || evt.offsetX > _this.cw) {
					if (evt.offsetX < 0) {
						if (dragCP == 'cp1') {
							_this.points[dragReady].cp1.x = 0;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp2.x = 0 - _this.points[dragReady].v1x*2;
								_this.points[dragReady].cp2.y = y - _this.points[dragReady].v1y*2;
							}
						} else if (dragCP == 'cp2') {
							_this.points[dragReady].cp2.x = 0;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp1.x = 0 - _this.points[dragReady].v2x*2;
								_this.points[dragReady].cp1.y = y - _this.points[dragReady].v2y*2;
							}
						} else {
							_this.points[dragReady].position.x = 0;
							_this.points[dragReady].cp1.x = 0 + _this.points[dragReady].v1x;
							_this.points[dragReady].cp2.x = 0 + _this.points[dragReady].v2x;
						}
					} else {
						if (dragCP == 'cp1') {
							_this.points[dragReady].cp1.x = _this.cw;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp2.x = _this.cw - _this.points[dragReady].v1x*2;
								_this.points[dragReady].cp2.y = y - _this.points[dragReady].v1y*2;
							}
						} else if (dragCP == 'cp2') {
							_this.points[dragReady].cp2.x = _this.cw;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp1.x = _this.cw - _this.points[dragReady].v2x*2;
								_this.points[dragReady].cp1.y = y - _this.points[dragReady].v2y*2;
							}
						} else {
							_this.points[dragReady].position.x = _this.cw;
							_this.points[dragReady].cp1.x = _this.cw + _this.points[dragReady].v1x;
							_this.points[dragReady].cp2.x = _this.cw + _this.points[dragReady].v2x;
						}
					}
				} else if (evt.offsetY < 0 || evt.offsetY > _this.ch) {
					if (evt.offsetY < 0) {
						if (dragCP == 'cp1') {
							_this.points[dragReady].cp1.y = 0;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp2.x = x - _this.points[dragReady].v1x*2;
								_this.points[dragReady].cp2.y = 0 - _this.points[dragReady].v1y*2;
							}
						} else if (dragCP == 'cp2') {
							_this.points[dragReady].cp2.y = 0;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp1.x = x - _this.points[dragReady].v2x*2;
								_this.points[dragReady].cp1.y = 0 - _this.points[dragReady].v2y*2;
							}
						} else {
							_this.points[dragReady].position.y = 0;
							_this.points[dragReady].cp1.y = 0 + _this.points[dragReady].v1y;
							_this.points[dragReady].cp2.y = 0 + _this.points[dragReady].v2y;
						}
					} else {
						if (dragCP == 'cp1') {
							_this.points[dragReady].cp1.y = _this.ch;

							_this.points[dragReady].move();
							if (!keys[16]) {
								_this.points[dragReady].cp2.x = x - _this.points[dragReady].v1x*2;
								_this.points[dragReady].cp2.y = _this.ch - _this.points[dragReady].v1y*2;
							}
						} else if (dragCP == 'cp2') {
							_this.points[dragReady].cp2.y = _this.ch;

							_this.points[dragReady].move();

							if (!keys[16]) {
								_this.points[dragReady].cp1.x = x - _this.points[dragReady].v2x*2;
								_this.points[dragReady].cp1.y = _this.ch - _this.points[dragReady].v2y*2;
							}
						} else {
							_this.points[dragReady].position.y = _this.ch;
							_this.points[dragReady].cp1.y = _this.ch + _this.points[dragReady].v1y;
							_this.points[dragReady].cp2.y = _this.ch + _this.points[dragReady].v2y;
						}
					}
				}
			}

			_this.draw();
			_this.createLUT();

			draging = dragReady = dragCP = false;

		});
		this.ctx.canvas.addEventListener('click', function(evt){
			if (keys[16] && !dragCP) {
				_this.points[dragReady].collapse();
				_this.draw();
				_this.createLUT();
				_this.events.ontogglecontrol ? _this.events.ontogglecontrol() : null;
			}
		});
		this.ctx.canvas.addEventListener('dblclick', function(evt){
			_this.points.splice(dragReady, 1);
			draging = dragReady = dragCP = false;
			dist = 1000;
			this.style.cursor = 'initial';
			_this.draw();
			_this.createLUT();
			_this.events.onremovepoint ? _this.events.onremovepoint() : null;
		});

	}

	addPoint(x, y) {
		
		this.points.push(new BezierPoint(x, y, this.ctx, this.pointColor, this.pointSize, this.cpDist));

		this.points.sort(function(a, b){
			return a.position.x - b.position.x;
		});

		for (let i = 0; i < this.points.length; i++) {
			let p = this.points[i];
			if (x == p.position.x && y == p.position.y) {
				return i;
			}
		}

	}

	setPointStyle(color, size) {
		
		for (let i = 0; i < this.points.length; i++) {
			this.points[i].setPointStyle(color, size);
			this.pointColor = color;
			this.pointSize = size;
		}
		this.draw();

	}

	setLineStyle(color, width) {
		
		this.lineColor = color;
		this.lineWidth = width;
		this.draw();

	}

	draw() {
		
		this.ctx.clearRect(0, 0, this.cw, this.ch);
		
		this.ctx.strokeStyle = '#444';
		this.ctx.lineWidth = 1;

		for (let i = 1; i < 10; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo((this.cw/10)*i-0.5, 0);
			this.ctx.lineTo((this.cw/10)*i-0.5, this.ch);
			this.ctx.stroke();
		}
		for (let i = 1; i < 5; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, (this.ch/5)*i-0.5);
			this.ctx.lineTo(this.cw, (this.ch/5)*i-0.5);
			this.ctx.stroke();
		}

		this.ctx.lineWidth = 0.5;
		for (let i = 1; i < 20; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo((this.cw/20)*i-0.5, 0);
			this.ctx.lineTo((this.cw/20)*i-0.5, this.ch);
			this.ctx.stroke();
		}
		for (let i = 1; i < 10; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, (this.ch/10)*i-0.5);
			this.ctx.lineTo(this.cw, (this.ch/10)*i-0.5);
			this.ctx.stroke();
		}

		this.ctx.strokeStyle = this.lineColor;
		this.ctx.lineWidth = this.lineWidth;

		this.ctx.beginPath();
		this.ctx.moveTo(this.points[0].position.x, this.points[0].position.y);
		for (let i = 1; i < this.points.length; i++) {
			let p = this.points[i];
			let pP = this.points[i-1];
			this.ctx.bezierCurveTo(pP.cp2.x, pP.cp2.y, p.cp1.x, p.cp1.y, p.position.x, p.position.y);
		}
		this.ctx.stroke();

		for (let i = 0; i < this.points.length; i++) {
			this.points[i].draw();
		}

	}
}


const keys = [];
window.addEventListener('keydown', function(e){
	keys[e.keyCode] = true;
});
window.addEventListener('keyup', function(e){
	delete keys[e.keyCode];
});