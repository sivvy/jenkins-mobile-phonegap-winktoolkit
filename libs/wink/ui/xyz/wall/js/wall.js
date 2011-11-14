/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Creates a 3D wall (3 rows of images)
 * 
 * @properties:
 * 	data = 
 * 	{
 * 		thumbHeight = the height in pixels of the thumbnails to be displayed (DEFAULT_VALUE = 75)
 *		thumbWidth = the width in pixels of the thumbnails to be displayed (DEFAULT_VALUE = 125)
 *		thumbMargins = the right margin in pixels of each thumb (DEFAULT_VALUE = 0)
 *		speed = the srcolling speed of the 3D wall (DEFAULT_VALUE = 1.2)
 *		wallDatas = {
 *  		row1 = the images to be displayed in the first row of the wall
 *  		row2 = the images to be displayed in the second row of the wall
 *			row3 = the images to be displayed in the third row of the wall
 *		}
 *	}
 *
 * @methods:
 * 	--> getDomNodes: returns the 'wall' main dom node but also the 'leftPad' and 'rightPad'
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> thumbHeight: the height in pixels of the images
 * 	--> thumbWidth: the width in pixels of the images
 * 	--> thumbMargins: the right margin in pixels of each thumb
 *  --> speed: the srcolling speed of the 3D wall
 *  --> wallDatas: the bricks of the wall
 * 
 * @events
 *	--> /wall/events/click: click on a thumbnail
 *
 * @dependencies:
 * 	--> wink.fx._xyz
 *
 * @compatibility:
 * 	--> Iphone OS2 (slow), Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../../_amd/core', '../../../../fx/_xyz/js/3dfx'], function(wink)
{
	wink.ui.xyz.Wall = function(properties)
	{
		this.uId           = wink.getUId();
		
		this.thumbHeight   = 75;
		this.thumbWidth    = 125;
		this.thumbMargins  = 0;
		this.speed         = 1.2;
		
		this.wallDatas     = null;
		
		this._slidingDist  = 350;
		this._rollerWidth  = 0;
		
		this._stopped      = true;
		
		this._motionTimer  = null;
		
		this._domNode      = null;
		this._row1Node     = null;
		this._row2Node     = null;
		this._row3Node     = null;
		this._wallNode     = null;
		this._rollerNode   = null;
		this._padLeftNode  = null;
		this._padRightNode = null;
		
		wink.mixin(this, properties);
		
		if ( this._validateProperties() === false )return;
	
		this._initProperties();	
		this._initDom();
		this._positionTransformOrigin();
		this._initListeners();
	};
	
	wink.ui.xyz.Wall.prototype =
	{
		/**
		 * Returns the 'wall' main dom node but also the 'leftPad' and 'rightPad'
		 */
		getDomNodes: function()
		{
			return {'wall': this._domNode, 'leftPad': this._padLeftNode, 'rightPad': this._padRightNode};
		},
		
		/**
		 * Adds a new image to the Wall
		 */
		_addBricks: function(bricks, rowNode)
		{
			var l = bricks.length;
			
			for ( var i=0; i<l; i++ )
			{
				var img = document.createElement('img');
				
				img.src = bricks[i].img;
				wink.fx.apply(img, {
					height: this.thumbHeight + 'px',
					width: this.thumbWidth + 'px'
				});
				
				img.onclick = function()
				{
					wink.publish('/wall/events/click', {'item': this});
				};
	
				rowNode.appendChild(img);
				
				img.translate((i*(this.thumbWidth+this.thumbMargins)), 0);
			}
		},
		
		/**
		 * Start rolling the wall to the left
		 */
		_padLeftStart: function()
		{
			var x1 = wink.fx.getTransformPosition(this._wallNode).x;
			var x2 = this._rollerWidth - document.documentElement.offsetWidth - this._slidingDist + x1;
			
			if ( Math.abs(x1) >= (this._rollerWidth - document.documentElement.offsetWidth - this._slidingDist) )
			{
				return;
			} else
			{
				this._stopped = false;
			}
	
			wink.fx.applyTransformTransition(this._rollerNode, '1s', 0, 'ease-in');
			wink.fx.applyTransformTransition(this._wallNode, (x2/this.speed) + 'ms', 0, 'ease-in');
			
			wink.fx.set3dTransform(this._rollerNode, { type: "rotate", x: 0, y: 1, z: 0, angle: 30 }, false);
			this._wallNode.translate(-(this._rollerWidth - document.documentElement.offsetWidth - this._slidingDist), 0, 0);
			
			this._motionTimer = wink.setTimeout(this, '_padLeftEnd', x2/this.speed);
		},
		
		/**
		 * Stop rolling the wall to the left
		 */
		_padLeftEnd: function()
		{	
			if ( this._stopped == false )
			{
				clearTimeout(this._motionTimer);
	
				var x = wink.fx.getTransformPosition(this._wallNode).x;
				
				wink.fx.applyTransformTransition(this._rollerNode, (3*(this._slidingDist/this.speed)-100) + 'ms', 100, 'ease-out');
				wink.fx.applyTransformTransition(this._wallNode, 3*(this._slidingDist/this.speed) + 'ms', 0, 'ease-out');
				
				wink.fx.set3dTransform(this._rollerNode, { type: "rotate", x: 0, y: 1, z: 0, angle: 0 }, false);
				this._wallNode.translate(x - this._slidingDist, 0, 0);
				
				this._stopped = true;
			}
		},
		
		/**
		 * Start rolling the wall to the right
		 */
		_padRightStart: function()
		{
			var x1 = wink.fx.getTransformPosition(this._wallNode).x;
			var x2 = Math.abs(x1);
			
			if ( Math.abs(x1) <= this._slidingDist )
			{
				return;
			} else
			{
				this._stopped = false;
			}
			
			wink.fx.applyTransformTransition(this._rollerNode, '1s', 0, 'ease-in');
			wink.fx.applyTransformTransition(this._wallNode, (x2/this.speed) + 'ms', 0, 'ease-in');
			
			wink.fx.set3dTransform(this._rollerNode, { type: "rotate", x: 0, y: 1, z: 0, angle: -30 }, false);
			this._wallNode.translate(-this._slidingDist, 0, 0);
			
			this._motionTimer = wink.setTimeout(this, '_padRightEnd', x2/this.speed);
		},
		
		/**
		 * Stop rolling the wall to the right
		 */
		_padRightEnd: function()
		{
			if ( this._stopped == false )
			{
				clearTimeout(this._motionTimer);
				
				var x = wink.fx.getTransformPosition(this._wallNode).x;
				
				wink.fx.applyTransformTransition(this._rollerNode, (3*(this._slidingDist/this.speed)-100) + 'ms', 100, 'ease-out');
				wink.fx.applyTransformTransition(this._wallNode, 3*(this._slidingDist/this.speed) + 'ms', 0, 'ease-out');
		
				wink.fx.set3dTransform(this._rollerNode, { type: "rotate", x: 0, y: 1, z: 0, angle: 0 }, false);
				this._wallNode.translate(x + this._slidingDist + this.thumbMargins, 0, 0);
				
				this._stopped = true;
			}
		},
		
		_positionTransformOrigin : function()
		{
			wink.fx.apply(this._rollerNode, {
				"transform-origin": (document.documentElement.offsetWidth/2) + 'px'
			});
		},
		
		/**
		 * validate the properties
		 */
		_validateProperties: function()
		{		
			if ( !wink.isSet(this.wallDatas) || !wink.isSet(this.wallDatas.row1) || !wink.isSet(this.wallDatas.row2) || !wink.isSet(this.wallDatas.row3) ) 
			{
				wink.log('[Wall] The 3 rows of the wallmust be specified using the wallDatas property');
				return false;
			}
			
			if ( !wink.isNumber(this.thumbHeight) ) 
			{
				wink.log('[Wall] The thumbHeight property must be an integer');
				return false;
			}
			
			if ( !wink.isNumber(this.thumbWidth) ) 
			{
				wink.log('[Wall] The thumbWidth property must be an integer');
				return false;
			}
			
			if ( !wink.isNumber(this.thumbMargins) ) 
			{
				wink.log('[Wall] The thumbMargins property must be an integer');
				return false;
			}
			
			if ( !wink.isNumber(this.speed) ) 
			{
				wink.log('[Wall] The speed property must be an integer');
				return false;
			}
			
			return true;
		},
		
		/**
		 * initialize the properties
		 */
		_initProperties: function()
		{
			this._rollerWidth = this.wallDatas.row1.length*(this.thumbWidth+this.thumbMargins);
		},
		
		/**
		 * Initiate touch events listeners
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(this._padLeftNode, "start", { context: this, method: "_padLeftStart", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._padLeftNode, "end", { context: this, method: "_padLeftEnd", arguments: null }, { preventDefault: true });
			
			wink.ux.touch.addListener(this._padRightNode, "start", { context: this, method: "_padRightStart", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._padRightNode, "end", { context: this, method: "_padRightEnd", arguments: null }, { preventDefault: true });
			
			window.addEventListener("orientationchange", wink.bind(function(){this._positionTransformOrigin();}, this), false);
		},
		
		/**
		 * Creates the DOM nodes of the wall
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
				
			this._row1Node = document.createElement('div');
			this._row2Node = document.createElement('div');
			this._row3Node = document.createElement('div');
			
			this._wallNode = document.createElement('div');
			this._rollerNode = document.createElement('div');
			
			this._padLeftNode = document.createElement('div');
			this._padRightNode = document.createElement('div');
			
			this._row1Node.id = 'row1';
			this._row1Node.className = 'wa_row';
			this._row1Node.style.height = (this.thumbHeight+4) + 'px';
			
			this._row2Node.id = 'row2';
			this._row2Node.className = 'wa_row';
			this._row2Node.style.height = (this.thumbHeight+4) + 'px';
			
			this._row3Node.id = 'row3';
			this._row3Node.className = 'wa_row';
			this._row3Node.style.height = (this.thumbHeight+4) + 'px';
			
			this._rollerNode.className = 'wa_roller';
			this._rollerNode.style.width = this._rollerWidth + 'px'; 
			
			this._padLeftNode.className = 'wa_padLeft';
			this._padRightNode.className = 'wa_padRight';
			
			this._addBricks(this.wallDatas.row1, this._row1Node);
			this._addBricks(this.wallDatas.row2, this._row2Node);
			this._addBricks(this.wallDatas.row3, this._row3Node);
			
			this._wallNode.appendChild(this._row1Node);
			this._wallNode.appendChild(this._row2Node);
			this._wallNode.appendChild(this._row3Node);
			
			this._rollerNode.appendChild(this._wallNode);
	
			this._domNode.className = 'wa_container';
			this._domNode.appendChild(this._rollerNode);
			
			document.body.appendChild(this._padLeftNode);
			document.body.appendChild(this._padRightNode);
		}
	};
	
	return wink.ui.xyz.Wall;
});