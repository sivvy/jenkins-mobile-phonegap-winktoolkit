/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a FlipDisc that allows the user to browse a list of images.
 * 
 * @properties:
 * 	data =
 * 	{
 * 		images: array of images
 * 		offsetY: the offset position on y (in pixel)
 * 		shiftY: the shift between images (in pixel)
 * 	}
 * 
 * @methods:
 * 	--> getDomNode: Returns the FlipDisc dom node
 *  --> next: Displays the next image
 *  --> previous: Displays the previous image
 *  
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> images: the list of images of the flipdisc
 *  --> offsetY: the offset position on the y-axis
 *  --> shiftY: the shift between images
 *  
 * @events
 * 	--> /flipdisc/events/click: click on the first visible image
 *
 * @dependencies:
 * 	--> wink.fx._xyz
 *  --> wink.fx._animation
 *  --> wink.ux.gesture
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../../_amd/core', '../../../../fx/_xyz/js/3dfx', '../../../../fx/_animation/js/animation', '../../../../ux/gesture/js/gesture'], function(wink)
{
	wink.ui.xyz.FlipDisc = function(properties) 
	{
		this.uId				= wink.getUId();
	
		this.images 		    = null;
		this.offsetY			= 0;
		this.shiftY				= 0;
		
		this._domNode			= null;
	
		this._elements			= [];
		this._transformations	= [];
		
		this._initialized		= false;
		this._currentPosition 	= 0;
		this._runningStep		= false;
		this._doubleClick		= false;
		this._currentRotation	= 0;
		this._oldRotation		= 0;
		
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
		
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xyz.FlipDisc.prototype = {
		_Z_INDEX_BACKGROUND: 5,
			
		/**
		 * Returns the FlipDisc dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Displays the next image
		 */
		next: function()
		{
			if (this._runningStep == true)
			{
				return;
			}
			this._runningStep = true;
			
			var ctx = {
				transform: function(params, transformation) {
					wink.fx.set3dTransform(params.node, transformation);
				},
				// Process the first step of the "next" operation : rotate the first image
				_nextStep1: function(node)
				{
					wink.fx.animate(node, {
						property: 'transform',
						value: { context: this, method: 'transform', arguments: [ { type: "rotate", x: 1, y: 0, z: 0, angle: -120 } ] },
						duration: 800,
						delay: 1,
						func: 'cubic-bezier(0.6, 0, 0.9, 0)'
					}, { onEnd: { context: ctx, method: '_nextStep2', arguments: [ node ] } });
				},
				// Process the second step of the "next" operation : draw back the first and bring down next images
				_nextStep2: wink.bind(function(params, node)
				{
					this._currentPosition = ((this._currentPosition + 1) % this.images.length);
					this._organizeDepth();
					this._applyTransformations({ context: ctx, method: '_nextStep3', arguments: [ node ] });
					
					wink.fx.animate(node, {
						property: 'transform',
						value: { context: ctx, method: 'transform', arguments: [ { type: "rotate", x: 1, y: 0, z: 0, angle: -0.1 } ] },
						duration: 200,
						delay: 200,
						func: 'default'
					});
				}, this),
				// Process the third step of the "next" operation : inverse the image rotation
				_nextStep3: wink.bind(function(params, node, position)
				{
					this._runningStep = false;
				}, this)
			};
			ctx._nextStep1(this._elements[this._currentPosition].imgNode);
		},
		/**
		 * Displays the previous image
		 */
		previous: function()
		{
			if (this._runningStep == true)
			{
				return;
			}
			this._runningStep = true;
			
			var ctx = {
				transform: function(params, transformation) {
					wink.fx.set3dTransform(params.node, transformation);
				},
				_previousStep1: function(node)
				{
					wink.fx.animate(node, {
						property: 'transform',
						value: { context: ctx, method: 'transform', arguments: [ { type: "rotate", x: 1, y: 0, z: 0, angle: -120 } ] },
						duration: 10,
						delay: 1,
						func: 'cubic-bezier(0.6, 0, 0.9, 0)'
					}, { onEnd: { context: ctx, method: '_previousStep2', arguments: [ node ] } });
				},
				_previousStep2: wink.bind(function(params, node)
				{
					this._currentPosition = ((this._currentPosition + this.images.length - 1) % this.images.length);
					this._organizeDepth();
					this._applyTransformations();
					
					wink.fx.animate(node, {
						property: 'transform',
						value: { context: ctx, method: 'transform', arguments: [ { type: "rotate", x: 1, y: 0, z: 0, angle: -0.1 } ] },
						duration: 600,
						delay: 200,
						func: 'default'
					}, { onEnd: { context: ctx, method: '_previousStep3', arguments: [ node ] } });
				}, this),
				_previousStep3: wink.bind(function(params, node)
				{
					this._runningStep = false;
				}, this)
			};
			var lastPos = (this._currentPosition - 1 + this.images.length) % this.images.length;
			ctx._previousStep1(this._elements[lastPos].imgNode);
		},
		/**
		 * Handles the click.
		 * 
		 * @parameters:
		 *	--> uxEvent: the uxEvent associated to the click
		 *  --> index: the index of the image clicked in the image list
		 */
		_handleOneDigitClick: function(uxEvent, index)
		{
			if (this._runningStep == true)
			{
				return;
			}
			if (this._doubleClick == true)
			{
				return;
			}
			wink.publish("/flipdisc/events/click", {
				image: this.images[this._currentPosition],
				index: this._currentPosition
			});
		},
		/**
		 * Handles the double click.
		 * 
		 * @parameters:
		 *	--> gestureInfos: the gesture informations (rotation)
		 */
		_handleRotation: function(gestureInfos)
		{
			if (this._runningStep == true)
			{
				return;
			}
			this._doubleClick = true;
			
			this._currentRotation = wink.math.round(gestureInfos.rotation - this._oldRotation, 0);
			this._oldRotation = gestureInfos.rotation;
			
			if (this._currentRotation >= 0)
			{
				this.next();
			}
			else
			{
				this.previous();
			}
		},
		/**
		 * Handles the start.
		 * 
		 * @parameters:
		 *	--> uxEvent: the uxEvent associated
		 */
		_handleOneDigitStart: function(uxEvent)
		{
			this._doubleClick = false;
		},
		/**
		 * Handles the gesture end.
		 * 
		 * @parameters:
		 *	--> gestureInfos: the gesture informations
		 */
		_handleGestureEnd: function(gestureInfos)
		{
			this._oldRotation = 0;
			this._doubleClick = true;
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			if (!wink.isSet(this.images) || this.images.length == 0)
			{
				wink.log('[FlipDisc] Error: images property must be specified with at least one image');
				return false;
			}
			
			return true;
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			wink.fx.apply(this._domNode, {
				width: "100%",
				height: "100%",
				"user-select": "none"
			});
			
			for ( var i = 0; i < this.images.length; i++)
			{
				var itemNode = document.createElement('div');
				var imgNode = document.createElement('img');
				
				wink.fx.apply(itemNode, {
					perspective: "1000",
					position: "absolute",
					width: "100%",
					height: "100%"
				});
				wink.fx.apply(imgNode, {
					"box-shadow": "2px -2px 6px rgba(0, 0, 0, 0.5)",
					display: "none",
					width: "100%",
					height: "99%"
				});
				
				imgNode.src = this.images[i];
				itemNode.appendChild(imgNode);
				this._domNode.appendChild(itemNode);
	
				this._elements[i] = {
					containerNode: itemNode,
					imgNode: imgNode
				};
			}
			
			this._organizeDepth();
			this._createTransformations();
			this._applyTransformations({ context: this, method: '_initDomEnd' });
		},
		/**
		 * 
		 */
		_initDomEnd: function()
		{
			for ( var i = 0; i < this.images.length; i++)
			{
				var imgNode = this._elements[i].imgNode;
				
				wink.fx.apply(imgNode, {
					display: "",
					"transform-origin": "0px 100%"
				});
				wink.fx.set3dTransform(imgNode, { type: "rotate", x: 1, y: 0, z: 0, angle: -0.1 });
			}
			this._initialized = true;
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			wink.ux.touch.addListener(this._domNode, "start", { context: this, method: "_handleOneDigitStart" }, { preventDefault: true });
			wink.ux.touch.addListener(this._domNode, "end", { context: this, method: "_handleOneDigitClick" });
	
			this._domNode.listenToGesture(
				"rotation", 
				{ context: this, method: "_handleRotation" }, 
				{ preventDefault: true }
			);
			this._domNode.listenToGesture(
				"gesture_end", 
				{ context: this, method: "_handleGestureEnd" }, 
				{ preventDefault: true }
			);
		},
		/**
		 * Organize images depth : zIndex must match
		 */
		_organizeDepth: function()
		{
			if (wink.has("css-perspective")) {
				return;
			}
			var zIndexForeground = this._Z_INDEX_BACKGROUND + this.images.length;
			
			for ( var i = 0; i < this.images.length; i++)
			{
				var j = ((this._currentPosition + i) % this.images.length);
				this._elements[j].containerNode.style.zIndex = zIndexForeground;
				zIndexForeground--;
			}
		},
		/**
		 * Initialize transformations of the elements
		 */
		_createTransformations: function()
		{
			var percentage = 0.8;
			var yPosFirst = this.offsetY;
			var yDelta = 0;
			var percentageY = 1;
	
			for ( var i = 0; i < this.images.length; i++)
			{
				var yPos = yPosFirst - yDelta;
				
				this._transformations[i] = {
					scale: { type: "scale", x: percentage, y: percentage, z: 1 },
					translate: { type: "translate", x: 0, y: yPos, z: -i }
				};
				
				percentage = percentage - (percentage * 0.2);
				percentageY = percentageY - (percentageY * 0.2);
				yDelta = yDelta + (this.shiftY * percentageY);
				
				wink.fx.initComposedTransform(this._elements[i].containerNode);
				wink.fx.initComposedTransform(this._elements[i].imgNode);
			}
		},
		/**
		 * Apply the given transformations to a node
		 * 
		 * @parameters:
		 *	--> params: object as { node } given by fx.animation call
		 *	--> transformations: the list of transformations to apply
		 */
		transform: function(params, transformations) {
			var node = params.node;
			
			for (var i = 0; i < transformations.length; i++) {
				wink.fx.setTransformPart(node, (i + 1), transformations[i]);
			}
			wink.fx.applyComposedTransform(node);
		},
		/**
		 * Apply transformations to the elements
		 * 
		 * @parameters:
		 *	--> onEnd: the callback invoked when transformations are applied
		 */
		_applyTransformations: function(onEnd)
		{
			var animGroup = new wink.fx.animation.AnimationGroup();
			
			for (var i = 0; i < this.images.length; i++)
			{
				var j = ((this._currentPosition + i) % this.images.length);
				var k = (i + 1) % this.images.length;
	
				var transformations = [ this._transformations[i].scale, this._transformations[i].translate ];
				var anim = new wink.fx.animation.Animation();
				anim.addStep({
					property: 'transform',
					value: { context: this, method: 'transform', arguments: [ transformations ] },
					duration: this._initialized ? 600 : 0,
					delay: this._initialized ? (k * 50) : 0,
					func: 'default'
				});
				animGroup.addAnimation(this._elements[j].containerNode, anim);
			}
			animGroup.start({ onEnd: onEnd });
		}
	};
	
	return wink.ui.xyz.FlipDisc;
});