# curves.js
bézier curve editor for animations to manipulate values over time

can be used from a script tag or as AMD module

Initialization
--------------
```js
  var context = document.querySelector('canvas').getContext("2d");
      context.canvas.width = 280;
      context.canvas.height = 140;
      
  var lengthInFrames = 300;

  var curve = new Curve(context, lengthInFrames);
```

Usage
-----
```js
  var frame = -1;

  function loop() {
  
    if (frame > lengthInFrames) {
      frame = 0
    }
    
    var currentValue = curve.xGetY(frame);
    
    frame++;
    requestAnimationFrame(loop);
  }
```

![Curves.js](http://www.tuxpaint.org/gallery/antonis/Some_Music.png)

Click anywhere to create a new point

Doubleclick to remove a point

Shift-click to toggle control points

Hold alt while dragging to snap to grid

Methods
-------

#### .xGetY(xValue)

    returns the curves Y-value for a given X-value

#### .setPointStyle(color, pointSize)
    
    Changes point color and size to the desired values
    
#### .setLineStyle(color, lineWidth)

    Changes line color and width to the desired values
    
#### .on(event, callback)

    adds custom functions on given event

  
