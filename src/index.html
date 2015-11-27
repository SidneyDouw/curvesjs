<!DOCTYPE html>
<html>
<head>
	<title>Curves</title>

	<link rel="stylesheet" type="text/css" href="css/styles.min.css">

	<script type="text/javascript" src="js/lib/curves.min.js"></script>
</head>
<body>

	<div></div>

	<canvas></canvas>

	<span></span>

	<script type="text/javascript">

		var lengthInFrames = 120;

		var ctx = document.querySelector('canvas').getContext("2d");
			ctx.canvas.width = 200*4;
			ctx.canvas.height = 100*4;

		var div = document.querySelector('div');
		var span = document.querySelector('span');

		var curve = new Curve(ctx, lengthInFrames);
			curve.setPointStyle('#222', 8);
			curve.setLineStyle('#f5663F', 2);

			curve.on('mousemove', function() {
				span.innerHTML = 'X: ' + this.mouseX + ', Y: ' + this.mouseY;
			});

			curve.on('drag', function() {
				console.log('point is being dragged');
			});

			curve.on('newpoint', function() {
				console.log('point has been created');
			});

			curve.on('removepoint', function() {
				console.log('point has beed removed');
			});

			curve.on('togglecontrol', function() {
				console.log('toggled controlpoints');
			});

		var currentFrame = -1;

		function loop() {

			if (currentFrame > lengthInFrames) {
				currentFrame = 0;
			}

			var curveValue = curve.xGetY(currentFrame);

			div.style.left = curveValue*93 + '%';

			currentFrame++;

			requestAnimationFrame(loop);
		}

		loop();

	</script>

</body>
</html>
