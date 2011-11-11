/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a 2D Gesture recognition engine
 * 
 * Based on the $1 gesture recognizer
 * 
 * http://depts.washington.edu/aimgroup/proj/dollar/
 */

/**
 * Implements the gesture recognition engine
 * 
 * @properties:
 * 	data = 
 * 	{
 * 		node = the DOM node where to listen to for the gesture recognition	
 * 		templates = an array containing the various templates to use for the recognition
 * 		gestureStartCallback =
 * 		{
 * 			method = the callback method to call after a start
 * 			context = the context of the callback method
 * 		}
 * 		gestureCallback =
 * 		{
 * 			method = the callback method to call after a move
 * 			context = the context of the callback method
 * 		}
 * 		gestureEndCallback =
 * 		{
 * 			method = the callback method to call after an end
 * 			context = the context of the callback method
 * 		}
 *	}
 * 
 * @methods:
 * 	--> getDomNode: returns the domNode associated to the gesture recognizer
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> utils: set of mathematic functions used by the Gesture recognition algorithm
 * 
 * @events
 * 	--> /gesturerecognizer/events/result: the recognition is done (return the name of the closest template and the associated score)
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_amd/core'], function(wink)
{
	wink.ux.GestureRecognizer = function(properties)
	{
		this.uId                   = wink.getUId();
		
		this._properties           = properties;
		
		this._gestureStartCallback = null;
		this._gestureCallback      = null;
		this._gestureEndCallback   = null;
		
		this._points               = [];
		this._templates            = [];
		
		this._isDown               = false;
		
		this.numTemplates          = 8,
		this.numPoint              = 64,
		this.squareSize            = 250.0,
		this.origin                = {x: 0, y: 0},
		this.diagonal              = Math.sqrt(this.squareSize * this.squareSize + this.squareSize * this.squareSize),
		this.halfDiagonal          = 0.5 * this.diagonal,
		this.angleRange            = wink.ux.GestureRecognizer.prototype.utils.deg2Rad(45.0),
		this.anglePrecision        = wink.ux.GestureRecognizer.prototype.utils.deg2Rad(2.0),
		this.phi                   = 0.5 * (-1.0 + Math.sqrt(5.0));	
	
		this._domNode              = null;
		
		if ( this._validateProperties() ===  false )return;
	
		this._initListeners();
	};
	
	wink.ux.GestureRecognizer.prototype =
	{
		/**
		 * Set of mathematic functions used by the Gesture recognition algorithm
		 */
		utils :
		{
			resample: function(points, n)
			{
				var I = wink.ux.GestureRecognizer.prototype.utils.pathLength(points) / (n - 1);
				var D = 0.0;
				var newpoints = new Array(points[0]);
				for (var i = 1; i < points.length; i++)
				{
					var d = wink.ux.GestureRecognizer.prototype.utils.distance(points[i - 1], points[i]);
					if ((D + d) >= I)
					{
						var qx = points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
						var qy = points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
						var q = {x: qx, y: qy};
						newpoints[newpoints.length] = q;
						points.splice(i, 0, q);
						D = 0.0;
					}
					else D += d;
				}
	
				if (newpoints.length == n - 1)
				{
					newpoints[newpoints.length] = {x: points[points.length - 1].x, y: points[points.length - 1].y};
				}
				
				return newpoints;
			},
			
			indicativeAngle: function(points)
			{
				var c = wink.ux.GestureRecognizer.prototype.utils.centroid(points);
				return Math.atan2(c.y - points[0].y, c.x - points[0].x);
			},
			
			rotateBy: function(points, radians)
			{
				var c = wink.ux.GestureRecognizer.prototype.utils.centroid(points);
				var cos = Math.cos(radians);
				var sin = Math.sin(radians);
				
				var newpoints = new Array();
				for (var i = 0; i < points.length; i++)
				{
					var qx = (points[i].x - c.x) * cos - (points[i].y - c.y) * sin + c.x;
					var qy = (points[i].x - c.x) * sin + (points[i].y - c.y) * cos + c.y;
					newpoints[newpoints.length] = {x: qx, y: qy};
				}
				return newpoints;
			},
			
			scaleTo: function(points, size)
			{
				var B = wink.ux.GestureRecognizer.prototype.utils.boundingBox(points);
				var newpoints = new Array();
				for (var i = 0; i < points.length; i++)
				{
					var qx = points[i].x * (size / B.width);
					var qy = points[i].y * (size / B.height);
					newpoints[newpoints.length] = {x: qx, y: qy};
				}
				return newpoints;
			},
			
			translateTo: function(points, pt)
			{
				var c = wink.ux.GestureRecognizer.prototype.utils.centroid(points);
				var newpoints = new Array();
				for (var i = 0; i < points.length; i++)
				{
					var qx = points[i].x + pt.x - c.x;
					var qy = points[i].y + pt.y - c.y;
					newpoints[newpoints.length] = {x: qx, y: qy};
				}
				return newpoints;
			},
			
			distanceAtBestAngle: function(points, T, a, b, threshold, phi)
			{
				var x1 = phi * a + (1.0 - phi) * b;
				var f1 = wink.ux.GestureRecognizer.prototype.utils.distanceAtAngle(points, T, x1);
				var x2 = (1.0 - phi) * a + phi * b;
				var f2 = wink.ux.GestureRecognizer.prototype.utils.distanceAtAngle(points, T, x2);
				
				while (Math.abs(b - a) > threshold)
				{
					if (f1 < f2)
					{
						b = x2;
						x2 = x1;
						f2 = f1;
						x1 = phi * a + (1.0 - phi) * b;
						f1 = wink.ux.GestureRecognizer.prototype.utils.distanceAtAngle(points, T, x1);
					}
					else
					{
						a = x1;
						x1 = x2;
						f1 = f2;
						x2 = (1.0 - phi) * a + phi * b;
						f2 = wink.ux.GestureRecognizer.prototype.utils.distanceAtAngle(points, T, x2);
					}
				}
				return Math.min(f1, f2);
			},
			
			distanceAtAngle: function(points, T, radians)
			{
				var newpoints = wink.ux.GestureRecognizer.prototype.utils.rotateBy(points, radians);
				return wink.ux.GestureRecognizer.prototype.utils.pathDistance(newpoints, T.points);
			},
			
			centroid: function(points)
			{
				var x = 0.0, y = 0.0;
				for (var i = 0; i < points.length; i++)
				{
					x += points[i].x;
					y += points[i].y;
				}
				x /= points.length;
				y /= points.length;
				return {x: x, y: y};
			},
			
			boundingBox: function(points)
			{
				var minx = +Infinity, maxx = -Infinity, miny = +Infinity, maxy = -Infinity;
				for (var i = 0; i < points.length; i++)
				{
					if (points[i].x < minx)
						minx = points[i].x;
					if (points[i].x > maxx)
						maxx = points[i].x;
					if (points[i].y < miny)
						miny = points[i].y;
					if (points[i].y > maxy)
						maxy = points[i].y;
				}
				return {x: minx, y: miny, width: maxx - minx, height: maxy - miny};
			},
			
			pathDistance: function(pts1, pts2)
			{
				var d = 0.0;
				for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
					d += wink.ux.GestureRecognizer.prototype.utils.distance(pts1[i], pts2[i]);
				return d / pts1.length;
			},
			
			pathLength: function(points)
			{
				var d = 0.0;
				for (var i = 1; i < points.length; i++)
					d += wink.ux.GestureRecognizer.prototype.utils.distance(points[i - 1], points[i]);
				return d;
			},
			
			distance: function(p1, p2)
			{
				var dx = p2.x - p1.x;
				var dy = p2.y - p1.y;
				return Math.sqrt(dx * dx + dy * dy);
			},
			
			deg2Rad: function(d)
			{ 
				return (d * Math.PI / 180.0);
			},
			
			rad2Deg: function(r)
			{
				return (r * 180.0 / Math.PI);
			}
		},
			
		/**
		 * the DOM node where to listen to for the gesture recognition
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Listen to the start events
		 * 
		 * @parameters:
		 * 	--> e: the start event
		 */
		_touchStart: function(e)
		{
			var x = e.x;
	        var y = e.y;
	        
	        this._points.length = 1;
	        this._points[0] = {x: x, y: y};
	        
	        this._isDown = true;
	        
	        if ( this._gestureStartCallback != null )
			{
	        	wink.call(this._gestureStartCallback, e);	
			}
		},
		
		/**
		 * Listen to the move events
		 * 
		 * @parameters:
		 * 	--> e: the move event
		 */
		_touchMove: function(e)
		{
			var x = e.x;
	        var y = e.y;
			
			if (this._isDown)
			{
				this._points[this._points.length] = {x: x, y: y};
			}
			
			if ( this._gestureCallback != null )
			{
				wink.call(this._gestureCallback, e);
			}
		},
		
		/**
		 * Listen to the end events
		 * 
		 * @parameters:
		 * 	--> e: the end event
		 */
		_touchEnd: function(e)
		{
			if (this._isDown)
			{
				if (this._points.length >= 10)
				{
					var result = this._recognize(this._points);
	
					wink.publish('/gesturerecognizer/events/result', result);
				} else
				{
					wink.publish('/gesturerecognizer/events/result', {'result': null, 'score': 0});
				}
				
				this._isDown = false;
				
				if ( this._gestureEndCallback != null )
				{
					wink.call(this._gestureEndCallback, e);	
				}
			}
		},
		
		/**
		 * Add a new template to the templates list
		 * 
		 * @parameters:
		 * 	--> name: the name of the template
		 * 	--> points: an array of GRPoints representing the shape
		 */
		_addTemplate: function(name, points)
		{
			var template = new this.Template(name, this.numPoint, this.squareSize, this.origin, points);
			this._templates.push(template);
		},
		
		/**
		 * Launch the recognition on all the captured points since the beginning of the movement
		 * 
		 * @parameters:
		 * 	--> points: all the captured points since the beginning of the movement
		 */
		_recognize: function(points)
		{
			points = wink.ux.GestureRecognizer.prototype.utils.resample(points, this.numPoint);
			var radians = wink.ux.GestureRecognizer.prototype.utils.indicativeAngle(points);
			points = wink.ux.GestureRecognizer.prototype.utils.rotateBy(points, -radians);
			points = wink.ux.GestureRecognizer.prototype.utils.scaleTo(points, this.squareSize);
			points = wink.ux.GestureRecognizer.prototype.utils.translateTo(points, this.origin);
			var b = +Infinity;
			var t = 0;
			for (var i = 0; i < this._templates.length; i++)
			{
				var d = wink.ux.GestureRecognizer.prototype.utils.distanceAtBestAngle(points, this._templates[i], -this.angleRange, +this.angleRange, this.anglePrecision, this.phi);
				
				if (d < b)
				{
					b = d;
					t = i;
				}
			}
			
			var score = 1.0 - (b / this.halfDiagonal);
			
			return {'result': this._templates[t].name, 'score': score};
		},
		
		/**
		 * Initialize start, move and end listeners
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(this._domNode, "start", { context: this, method: "_touchStart", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._domNode, "move", { context: this, method: "_touchMove", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._domNode, "end", { context: this, method: "_touchEnd", arguments: null }, { preventDefault: true });
		},
		
		/**
		 * validate the GestureRecognizer properties
		 */
		_validateProperties: function()
		{
			if ( wink.isUndefined(this._properties.templates) || !wink.isArray(this._properties.templates) )
			{
				wink.log('[GestureRecognizer] the templates must be defined and must be set in an array');
				return false;
			} else
			{
				var l = this._properties.templates.length;
				
				for ( var i=0; i<l; i++)
				{
					this._addTemplate(this._properties.templates[i].name, this._properties.templates[i].points);
				}
				
				this.numTemplates = l;
			}
			
			if ( this._properties && !wink.isUndefined(this._properties.node))
			{	
				this._domNode = this._properties.node;
			} else
			{
				wink.log('[GestureRecognizer] The node property must be defined');
				return false;
			}
			
			if ( this._properties && this._properties.gestureStartCallback )
			{
				if ( wink.isCallback(this._properties.gestureStartCallback) )
				{
					this._gestureStartCallback = this._properties.gestureStartCallback;
				} else
				{
					wink.log('[GestureRecognizer] Invalid gestureStartCallback');
					return false;
				}
			}
			
			if ( this._properties && this._properties.gestureCallback)
			{
				if ( wink.isCallback(this._properties.gestureCallback) )
				{
					this._gestureCallback = this._properties.gestureCallback;
				} else
				{
					wink.log('[GestureRecognizer] Invalid gestureCallback');
					return false;
				}
			}
			
			if ( this._properties && this._properties.gestureEndCallback)
			{
				if ( wink.isCallback(this._properties.gestureEndCallback) )
				{
					this._gestureEndCallback = this._properties.gestureEndCallback;
				} else
				{
					wink.log('[GestureRecognizer] Invalid gestureEndCallback');
					return false;
				}
			}
		},
		
		/**
		 * Representation of a recognition template
		 */
		Template: function (name, numPoint, squareSize, origin, points)
		{
			this.name   = name;
	
			this.points = wink.ux.GestureRecognizer.prototype.utils.resample(points, numPoint);
			var radians = wink.ux.GestureRecognizer.prototype.utils.indicativeAngle(this.points);
			this.points = wink.ux.GestureRecognizer.prototype.utils.rotateBy(this.points, -radians);
			this.points = wink.ux.GestureRecognizer.prototype.utils.scaleTo(this.points, squareSize);
			this.points = wink.ux.GestureRecognizer.prototype.utils.translateTo(this.points, origin);
		}
	};
	
	return wink.ux.GestureRecognizer;
});