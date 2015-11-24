require(['modules/Curve'], function(Curve){

	var ctx = document.querySelector('canvas').getContext("2d");
		ctx.canvas.width = 280*3;
		ctx.canvas.height = 140*3;

	var frames = 60;

	var curve = new Curve(ctx, frames);

	var div = document.querySelector('div');
	var span = document.querySelector('span');

	curve.on('mousemove', function() {
		span.innerHTML = 'X: '+this.mouseX+', Y: '+this.mouseY;
	});

	frame = -1;

	loop();

	function draw() {

		frame++;
		if (frame > frames) frame = 0;

		div.style.left = 100+((window.innerWidth-300) * curve.xGetY(frame))+'px';
	}

	function loop() {
		draw();
		requestAnimationFrame(loop);
	}

});
