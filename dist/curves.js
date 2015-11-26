(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		root.Curve = factory();
	}
}(this, function() {/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('modules/Point',[],function(){

	function Point(x, y, color, size, context) {
		this.x = x;
		this.y = y;
		this.r = size/2;
		this.color = color;
		this.ctx = context;
	}
	Point.prototype.draw = function() {
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();
	};

	return Point;

});

define('modules/BezierPoint',['modules/Point'], function(Point){

	function BezierPoint(x, y, context, color, size, cpDist) {

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
	BezierPoint.prototype.collapse = function() {
		
		if (!this.collapsed) {
			this.collapsed = true;
			this.cp1.x = this.cp2.x = this.position.x;
			this.cp1.y = this.cp2.y = this.position.y;
		} else {
			this.collapsed = false;
			this.cp1.x = this.position.x - this.cpDist;
			this.cp2.x = this.position.x + this.cpDist;
		}

	};
	BezierPoint.prototype.move = function() {
		if (!this.collapsed) {
			this.v1x = this.cp1.x - this.position.x;
			this.v1y = this.cp1.y - this.position.y;
			this.v2x = this.cp2.x - this.position.x;
			this.v2y = this.cp2.y - this.position.y;
		} else {
			this.v1x = this.v1y = this.v2x = this.v2y = 0;
		}

	};
	BezierPoint.prototype.setPointStyle = function(color, size) {
		this.position.color = color;
		this.cp1.color = color;
		this.cp2.color = color;
		this.position.r = size/2;
		this.cp1.r = size/2;
		this.cp2.r = size/2;
	};
	BezierPoint.prototype.draw = function() {

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

	};

	return BezierPoint;

});

define('modules/Curve',['modules/BezierPoint'], function(BezierPoint){

	function Curve(context, interval, cpDist) {

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
	Curve.prototype.on = function(event, func) {
		this.events['on'+event] = func.bind(this);
	};
	Curve.prototype.canvasEvents = function() {

		var x,
			y,
			dist,
			dragReady,
			dragCP,
			draging;

		var _this = this;
		
		this.ctx.canvas.addEventListener('mousemove', function(evt){

			var bbox = this.getBoundingClientRect();

			x = evt.clientX - bbox.left;
			y = evt.clientY - bbox.top;

			_this.mouseX = x;
			_this.mouseY = y;

			for (var i = 0; i < _this.points.length; i++) {
				var p = _this.points[i];

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
				var deltaW = _this.cw / 20;
				var deltaH = _this.ch/ 10;

				var posX = Math.floor((x+deltaW/2) / deltaW);
				var posY = Math.floor((y+deltaH/2) / deltaH);

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

			for (var i = 0; i < _this.points.length; i++) {
				var p = _this.points[i];
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

	};
	Curve.prototype.addPoint = function(x, y) {
		
		this.points.push(new BezierPoint(x, y, this.ctx, this.pointColor, this.pointSize, this.cpDist));

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
	Curve.prototype.setPointStyle = function(color, size) {
		
		for (var i = 0; i < this.points.length; i++) {
			this.points[i].setPointStyle(color, size);
			this.pointColor = color;
			this.pointSize = size;
		}
		this.draw();

	};
	Curve.prototype.setLineStyle = function(color, width) {
		
		this.lineColor = color;
		this.lineWidth = width;
		this.draw();

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

		this.ctx.strokeStyle = this.lineColor;
		this.ctx.lineWidth = this.lineWidth;

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

define('main',['modules/Curve'], function(Curve){
	
	return Curve;

});

	return require('main');
}));
