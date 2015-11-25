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

		var lengthInFrames = 60;

		var ctx = document.querySelector('canvas').getContext("2d");
			ctx.canvas.width = 200*4;
			ctx.canvas.height = 100*4;

		var div = document.querySelector('div');
		var span = document.querySelector('span');

		var curve = new Curve(ctx, lengthInFrames);
			curve.setPointStyle('#0ff', 6);

			curve.on('mousemove', function() {
				span.innerHTML = 'X: ' + this.mouseX + ', Y: ' + this.mouseY;
			});

		var currentFrame = -1;

		function loop() {

			if (currentFrame > lengthInFrames) {
				currentFrame = 0;
			}

			var curveValue = curve.xGetY(currentFrame);

			div.style.left = curveValue*90 + '%';

			currentFrame++;

			requestAnimationFrame(loop);
		}

		loop();

	</script>

</body>
</html>
