# curves.js
bézier curve editor for animations to manipulate values over time

can be used from a script tag or as AMD module

Initialization
--------------
```js
  var canvasContext = document.querySelector('canvas').getContext("2d");
  var lengthInFrames = 300;

  var curve = new Curve(canvasContext, lengthInFrames);
```

Usage
-----
```js
  var frame = -1;

  function loop() {
    
    var currentValue = curve.xGetY(frame)
    
    frame++;
    requestAnimationFrame(loop);
  }
```
