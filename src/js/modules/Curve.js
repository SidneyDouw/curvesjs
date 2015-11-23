define(['modules/BezierPoint', 'jquery'], function(BezierPoint, $){

	function Curve(context, interval, cpDist) {

		this.cpDist = cpDist ? cpDist : context.canvas.width * 0.2;

		this.points = [
			new BezierPoint(0, context.canvas.height, context, cpDist),
			new BezierPoint(context.canvas.width, 0, context, cpDist)
		];

		this.ctx = context;
		this.cw = context.canvas.width;
		this.ch = context.canvas.height;

		this.interval = interval;

		this.canvasEvents();
		this.createLUT();
		this.draw();

	}
	Curve.prototype.xGetY = function(frame) {

		var tolerance = 0.0001;
		
		var iMin = 0;
		var iMax = 5000;
		var key = (iMin+iMax)/2;

		var xTarget = frame/this.interval;
		var xCurrent = this.lookupX[key];

		var i = 0;

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

	};
	Curve.prototype.createLUT = function() {
		
		this.lookupX = [];
		this.lookupY = [];

	//	this.ctx.fillStyle = '#a50';

		//Percent Based Tesselation
		for (var i = 1; i < this.points.length; i++) {
			var p1 = this.points[i-1];
			var p2 = this.points[i];
			var pct = (p2.position.x/this.cw) - (p1.position.x/this.cw);
			for (var t = 0; t < 1; t+=1/(5000*pct)) {
				var x = (Math.pow((1-t),3)*p1.position.x) + (3*Math.pow((1-t),2)*t*p1.cp2.x) + (3*(1-t)*Math.pow(t,2)*p2.cp1.x) + (Math.pow(t,3)*p2.position.x);
				var y = (Math.pow((1-t),3)*p1.position.y) + (3*Math.pow((1-t),2)*t*p1.cp2.y) + (3*(1-t)*Math.pow(t,2)*p2.cp1.y) + (Math.pow(t,3)*p2.position.y);
				this.lookupX.push(x/this.cw);
				this.lookupY.push(-y/this.ch+1);
	//			this.ctx.fillRect(x, y, 3, 3);
			}
		}

	};
	Curve.prototype.canvasEvents = function() {

		var x,
			y,
			dist,
			dragReady,
			dragCP,
			draging;

		var _this = this;
		
		$(this.ctx.canvas).on('mousemove', function(evt){

			x = evt.clientX - $(this).offset().left;
			y = evt.clientY - $(this).offset().top;

			for (var i = 0; i < _this.points.length; i++) {
				var p = _this.points[i];

				if (!draging) {

					dist = Math.sqrt((x-p.position.x)*(x-p.position.x) + (y-p.position.y)*(y-p.position.y));
					if (dist <= 5) {
						$(this).css('cursor', 'pointer');
						dragReady = i;
						break;
					} else {
						dist = Math.sqrt((x-p.cp1.x)*(x-p.cp1.x) + (y-p.cp1.y)*(y-p.cp1.y));
						if (dist <= 5) {
							$(this).css('cursor', 'pointer');
							dragReady = i;
							dragCP = 'cp1';
							break;
						} else {
							dist = Math.sqrt((x-p.cp2.x)*(x-p.cp2.x) + (y-p.cp2.y)*(y-p.cp2.y));
							if (dist <= 5) {
								$(this).css('cursor', 'pointer');
								dragReady = i;
								dragCP = 'cp2';
								break;
							} else {
								$(this).css('cursor', 'initial');
								dragReady = false;
								dragCP = false;
							}
						}
					}

				}

			}

			if (keys[18]) {
				var deltaW = _this.cw / 20;
				var deltaH = _this.ch/ 10;

				var posX = Math.floor((x+deltaW/2) / deltaW);
				var posY = Math.floor((y+deltaH/2) / deltaH);

				x = deltaW * posX;
				y = deltaH * posY;
			}

			$('span').text('X: '+ x +', Y: '+ y);

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

					var temp;

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

				_this.draw();
			}

		}).on('mousedown', function(evt){
			evt.preventDefault();

			if (dragReady || dragReady === 0) {
				draging = true;
			} else {
				if (dist > 5) {
					dragReady = _this.addPoint(x, y);
					draging = true;
					$(this).css('cursor', 'pointer');
					_this.draw();
				}
			}

		}).on('mouseup', function(evt){

			draging = false;
			if (dist > 5) {
				dragReady = dragCP = false;
			}

			for (var i = 0; i < _this.points.length; i++) {
				var p = _this.points[i];
				dist = Math.sqrt((x-p.position.x)*(x-p.position.x) + (y-p.position.y)*(y-p.position.y));
				if (dist <= 5) {
					$(this).css('cursor', 'pointer');
					dragReady = i;
					break;
				}
			}

			_this.createLUT();

		}).on('mouseleave', function(evt){

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

		}).on('click', function(evt){
			if (keys[16] && !dragCP) {
				_this.points[dragReady].collapse();
				_this.draw();
				_this.createLUT();
			}
		}).on('dblclick', function(evt){
			_this.points.splice(dragReady, 1);
			draging = dragReady = dragCP = false;
			dist = 1000;
			$(this).css('cursor', 'initial');
			_this.draw();
			_this.createLUT();
		});

	};
	Curve.prototype.addPoint = function(x, y) {
		
		this.points.push(new BezierPoint(x, y, this.ctx, this.cpDist));

		this.points.sort(function(a, b){
			return a.position.x - b.position.x;
		});

		for (var i = 0; i < this.points.length; i++) {
			var p = this.points[i];
			if (x == p.position.x && y == p.position.y) {
				return i;
			}
		}

	};
	Curve.prototype.setColor = function(color) {
		
		for (var i = 0; i > this.points.length; i++) {
			this.points[i].setColor(color);
		}

	};
	Curve.prototype.draw = function() {
		
		this.ctx.clearRect(0, 0, this.cw, this.ch);
		
		this.ctx.strokeStyle = '#444';
		this.ctx.lineWidth = 1;

		for (i = 1; i < 10; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo((this.cw/10)*i-0.5, 0);
			this.ctx.lineTo((this.cw/10)*i-0.5, this.ch);
			this.ctx.stroke();
		}
		for (i = 1; i < 5; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, (this.ch/5)*i-0.5);
			this.ctx.lineTo(this.cw, (this.ch/5)*i-0.5);
			this.ctx.stroke();
		}

		this.ctx.lineWidth = 0.5;
		for (i = 1; i < 20; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo((this.cw/20)*i-0.5, 0);
			this.ctx.lineTo((this.cw/20)*i-0.5, this.ch);
			this.ctx.stroke();
		}
		for (i = 1; i < 10; i++) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, (this.ch/10)*i-0.5);
			this.ctx.lineTo(this.cw, (this.ch/10)*i-0.5);
			this.ctx.stroke();
		}

		this.ctx.strokeStyle = '#fff';

		this.ctx.beginPath();
		this.ctx.moveTo(this.points[0].position.x, this.points[0].position.y);
		for (i = 1; i < this.points.length; i++) {
			var p = this.points[i];
			var pP = this.points[i-1];
			this.ctx.bezierCurveTo(pP.cp2.x, pP.cp2.y, p.cp1.x, p.cp1.y, p.position.x, p.position.y);
		}
		this.ctx.stroke();

		for (var i = 0; i < this.points.length; i++) {
			this.points[i].draw();
		}

	};


	var keys = [];
	window.addEventListener('keydown', function(e){
		keys[e.keyCode] = true;
	});
	window.addEventListener('keyup', function(e){
		delete keys[e.keyCode];
	});

	return Curve;

});
