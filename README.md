# curvesjs
bézier curve editor for animations to manipulate values over time

try it out [here](http://sidneydouw.github.io/curves.js/)

Install
-------

```
  bower install curvesjs
```

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
  var currentFrame = 0;

  function loop() {
  
    if (currentFrame > lengthInFrames) {
      currentFrame = 0
    }
    
    var currentValue = curve.xGetY(currentFrame);
    
    currentFrame++;
    requestAnimationFrame(loop);
  }
```

![Curves.js](http://sidneydouw.ddns.net:1234/curves.js.png)

Click anywhere to create a new point

Doubleclick to remove a point

Shift-click to toggle control points

Hold alt while dragging to snap to grid

Hold shift while dragging to move controlpoints individually

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
    
#### Events
    
```js

    curve.on('mousemove', function(){
      //fires whenever the mouse moves over the canvas
    });
    
    curve.on('drag', function(){
      //fires whenever a point changes position
    });
    
    curve.on('newpoint', function(){
      //fires whenever a new point is created
    });
    
    curve.on('removepoint', function(){
      //fires whenever an existing point is removed
    });
    
    curve.on('togglecontrol' function(){
      //fires whenever a points controlpoints are toggled
    });

```
  
License(MIT)
------------

Copyright 2015 Sidney Douw.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
