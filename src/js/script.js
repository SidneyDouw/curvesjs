require(['modules/Curve'], function(Curve){

	var ctx = document.querySelector('canvas').getContext("2d");
		ctx.canvas.width = 280*3;
		ctx.canvas.height = 140*3;

	var frames = 120;

	curve = new Curve(ctx, frames);

	var div = document.querySelector('div');
		
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
