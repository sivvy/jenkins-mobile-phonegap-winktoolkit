/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a tracer that allows to erase the trace after a specified time.
 * 
 * @methods:
 * 	--> getDomNode: 	Returns the main DOM node of the component
 *  --> toggle: 		Starts / Stops rendering
 * 
 * @attributes:
 * 	--> uId: 			unique identifier of the component
 * 
 * @properties:
 * 	{
 * 		height:			the height of the trace container
 * 		width:			the width of the trace container
 * 		duration: 		the life time of the trace before erasing
 * 		linewidth: 		the line width
 * 		refreshrate:	the refresh rate of rendering process
 * 		linestyle:		the style of the line (may be a color or a background image)
 * 		fadeonend:		option to allows to fade on touch end
 * 		onMovement:		a callback that allows to be notified when a movement is done
 *	}
 *
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.Trace = function(properties)
	{
		this.uId             = wink.getUId();
		
		wink.mixin(this, properties);
			
		if (this._validateProperties() === false)return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xy.Trace.prototype = 
	{
		/**
		 * Returns the main DOM node of the Spinner
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Starts / Stops rendering
		 */
		toggle: function()
		{
			if (this._timer)
			{
				this._stopRendering();
			}
			else
			{
				this._startRendering();
			}
		},
		
		/**
		 * Starts the rendering process
		 */
		_startRendering: function()
		{
			var _this = this;
			if (_this._timer)
			{
				return;
			}
			
			var _this = this,
				mvts = _this._movements,
				l = mvts.length;
			
			if (l != 0) {
				var pos = l - 1;
				if (mvts[pos].length == 0) {
					pos = l - 2;
				}

				var last = mvts[pos];
				if (last && last.length > 0) {
					var t = new Date().getTime(),
						delta = t - last[last.length - 1].t;
					
					var i;
					for (i = 0; i < l; i++) {
						var mvt = mvts[i];
						if (mvt.length <= 1) {
							continue;
						}
						
						var j, jl = mvt.length;
						for (j = 0; j < jl; j++) {
							mvt[j].t += delta;
						}
					}
				}
			}
			_this._timer = wink.setInterval(_this, '_render', _this.refreshrate);
		},
		
		/**
		 * Stops the rendering process
		 */
		_stopRendering: function()
		{
			clearInterval(this._timer);
			this._timer = null;
		},
		
		/**
		 * 
		 */
		_render: function()
		{
			var _this = this;

			if (_this.fadeonend && _this._drag) {
				return;
			}
			
			var time = new Date().getTime(),
				lifetimemax = _this.duration,
				mvts = new Array().concat(_this._movements);

			_this._clear();

			var i, l = mvts.length;
			for (i = 0; i < l; i++) {
				var mvt = mvts[i];
				if (mvt.length <= 1) {
					continue;
				}

				for (var j = 1; j < mvt.length; j++) {
					var p1 = mvt[j - 1],
						p2 = mvt[j],
						lifetime = time - p2.t;
					
					if (this.fadeonend && !mvt.canFade) {
						lifetime = 0;
					}
					
					if (lifetime > lifetimemax) {
						mvt.splice((j - 1), 1);
						j = 0;
						_drawLine(_this._ctx, p1, p2, _this._getColor(0), _this.linewidth);
					} else {
						var opacity = 1 - (lifetime / lifetimemax);
						_drawLine(_this._ctx, p1, p2, _this._getColor(opacity), _this.linewidth);
					}
				}
			}
		},
		
		/**
		 * 
		 */
		_start: function(uxEvent)
		{
			this._drag = true;
			this._addPoint(uxEvent);
		},
		
		/**
		 * 
		 */
		_move: function(uxEvent)
		{
			var _this = this;
			_this._addPoint(uxEvent);
			var currentMvt = _this._movements[_this._movements.length - 1],
				l = currentMvt.length,
				pp = currentMvt[l - 2],
				cp = currentMvt[l - 1];

			_drawLine(_this._ctx, pp, cp, _this._getColor(1), _this.linewidth);
		},
		
		/**
		 * 
		 */
		_end: function(uxEvent)
		{
			var _this = this,
				mvts = _this._movements,
				l = mvts .length;
			
			_this._addPoint(uxEvent);
			
			if (_this.onMovement) {
				_this.onMovement(mvts[l - 1]);
			}
			
			_this._clearOldMovements();
			
			if (this.fadeonend) {
				var t = new Date().getTime(),
					i, mvts = _this._movements,
					l = mvts .length;
				
				for (i = 0; i < l; i++) {
					var mvt = mvts[i];
					
					if (!mvt.canFade) {
						mvt.canFade = true;
						
						var j, jl = mvt.length;
						for (j = 0; j < jl; j++) {
							mvt[j].t = t;
						}
					}
				}
			}
			
			_this._movements.push([]);
			_this._mvtIndex = _this._movements.length - 1;
			this._drag = false;
		},
		
		/**
		 * 
		 */
		_clear: function()
		{
			var _this = this;
			_this._ctx.fillStyle = 'transparent';
			_this._ctx.fillRect(0, 0, _this.width, _this.height);
			_this._domNode.width = _this.width;		
		},
		
		/**
		 * 
		 */
		_addPoint: function(uxEvent)
		{
			var _this = this;
			if (_this._movements.length == 0) {
				_this._movements.push([]);
				_this._mvtIndex = _this._movements.length - 1;
			}
			var lastMvt = _this._movements[_this._mvtIndex];
			var pos = _getAbsolutePosition(_this._domNode);
			lastMvt.push({ x: (uxEvent.x - pos.x), y: (uxEvent.y - pos.y), t: uxEvent.timestamp, absx: uxEvent.x, absy: uxEvent.y });
		},
		
		/**
		 * 
		 */
		_getColor: function(opacity)
		{
			if (this._linepattern) {
				return this._linepattern;
			}
			var ls = this._linestyle;
			return 'rgba(' + ls.r + ', ' + ls.g + ', ' + ls.b + ', ' + opacity + ')';
		},
		
		/**
		 * 
		 */
		_clearOldMovements: function()
		{
			var i, mvts = this._movements;
			for (i = 0; i < mvts.length; i++) {
				var mvt = mvts[i];
				if (mvt.length <= 1) {
					mvts.splice(i, 1);
				}
			}
		},
		
		/**
		 * Validate the spinner properties
		 */
		_validateProperties: function()
		{
			return true;
		},
		
		/**
		 * Initialize the Spinner DOM node
		 */
		_initDom: function()
		{
			var _this = this,
				dn = _this._domNode = document.createElement('canvas');
			
			dn.translate(0, 0); 
			
			_this._ctx = dn.getContext('2d');
			
			dn.width = _this.width;
			dn.height = _this.height;
			
			wink.addClass(dn, "tr_container");
			
			if (!_this._linestyle) {
				var mt = (/^data:image.*/).exec(_this.linestyle);
				if (mt) {
					var pattern = new Image();
					pattern.src = _this.linestyle;
					_this._linepattern = _this._ctx.createPattern(pattern, 'repeat');
				} else {
					_this._linestyle = _getRGB('#000');
				}
			}
			
			_this._render();
			_this._startRendering();
		},
		
		/**
		 * Initialize the lyrics properties
		 */
		_initProperties: function()
		{
			var _this = this,
				_assign = function(p, defaultValue) {
					if (_this[p] === 0) {
						return;
					}
					_this[p] = _this[p] || defaultValue;
				};
			
			_assign('height', 200);
			_assign('width', 200);
			_assign('duration', 1000);
			_assign('linewidth', 1);
			_assign('refreshrate', 100);
			_assign('linestyle', '#000');
			_assign('fadeonend', false);
			_assign('onMovement', null);
			
			_this._linestyle = _getRGB(_this.linestyle);
			_this._movements = [];
			_this._mvtIndex = 0;
		},
		
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			var n = this._domNode;
			wink.ux.touch.addListener(n, "start", { context: this, method: "_start" }, { preventDefault: true });
			wink.ux.touch.addListener(n, "move", { context: this, method: "_move" });
			wink.ux.touch.addListener(n, "end", { context: this, method: "_end" });
		}
	};
	
	/**
	 * @parameters:
	 * 	--> node: the node
	 */
	var _getAbsolutePosition = function(node)
	{
		var trfPos = { x: 0, y: 0 };
		var topValue = 0;
		var ptr = node;
		while (ptr && ptr != document.body)
		{
			var trf = wink.fx.getTransformPosition(ptr);
			trfPos.x += trf.x;
			trfPos.y += trf.y;
			ptr = ptr.parentNode;
		}
		return { x: node.getLeftPosition() + trfPos.x, y: node.getTopPosition() + trfPos.y };
	};
	
	/**
	 * 
	 */
	var _drawLine = function(ctx, p1, p2, color, linewidth)
	{
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.closePath();
		ctx.strokeStyle = color;
		ctx.lineWidth = linewidth;
		ctx.stroke();
	};
	
	/**
	 * 
	 */
	var _getRGB = function(colorS)
	{
		var mt = null,
			rgb = null;
		
		var mt = (/^data:image.*/).exec(colorS);
		if (mt) {
			return null;
		}
		
		if (!mt) {
			mt = (/^#?([a-fA-F0-9]{1,2})([a-fA-F0-9]{1,2})([a-fA-F0-9]{1,2})$/).exec(colorS);
			if (mt) {
				for (var i = 1; i < 4; i++) {
					mt[i] = mt[i].length == 1 ? mt[i] + mt[i] : mt[i];
				}
				rgb = { r: parseInt(mt[1], 16), g: parseInt(mt[2], 16), b: parseInt(mt[3], 16), a: 1.0 };
			}
		}
		if (!mt) {
			mt = (/[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)?/).exec(colorS);
			if (mt) {
				rgb = { r: mt[1], g: mt[2], b: mt[3], a: mt[4] || 1.0 };
			}
		}
		return rgb;
	};
	
	return wink.ui.xy.Trace;
});