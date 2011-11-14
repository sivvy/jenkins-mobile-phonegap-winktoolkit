/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a Cover Flow. Developed to be as flexible and configurable as possible.
 * The user must pay attention to the fact that the parameters significantly affect performance (reflected and displayTitle especially)
 * 
 * @properties:
 * 	data =
 * 	{
 * 		covers: 					An array of covers ( cover: { image, title, backFaceId, action } )
 * 			--> A cover is composed of :
 * 				- image: 			URL of the cover image
 * 				- [title]: 			the id of the title node that will appear below image (mandatory if "displayTitle" is set to true)
 * 				- [backFaceId]: 	the id of the backface node that will appear when selecting a cover (if no action is specified)
 * 				- [action]:			the callback action that will be invoked when selecting a cover
 * 
 * 		size: 						the Cover Flow size
 * 		position:					the initial selected cover
 * 		viewportWidth: 				the width of the viewport
 * 		reflected: 					boolean that indicates if reflection must be displayed
 * 		displayTitle: 				boolean that indicates if title must be displayed
 * 		fadeEdges: 					boolean that indicates if fade along Cover Flow edges must be displayed
 * 		handleOrientationChange: 	boolean that indicates if the component must resized itself automatically if orientation has changed
 * 		handleGesture: 				boolean that indicates if gestures must be handled to rotate the Cover Flow on x-axis
 * 		backgroundColor: 			the background color value as { r: redValue, g: greenValue, b: blueValue }
 * 		coverSpacing: 				[optional] the spacing between covers
 * 		displayTitleDuration: 		[optional] the duration in millisecond of the title display
 * 		borderSize:					[optional] the cover shaded border size
 * 	}
 * 
 * @methods:
 * 	--> getDomNode: 				Returns the Cover Flow dom node
 *  --> updateSize: 				Update the Cover Flow size and the viewportWidth
 *  --> setBackgroundColor: 		Set the Cover Flow background color
 *  --> getPosition:				get current position
 *  --> setPosition:				set position
 *
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> covers: the list of covers
 *  --> backgroundColor: the background color of the coverflow
 *  --> reflected: whether reflection is displayed
 *  --> displayTitle: whether a title is displayed for each cover
 *  --> fadeEdges: whether the coverflow edges are faded
 *  --> size: the coverflow size
 *  --> viewportWidth: the width of the viewport
 *  --> handleGesture: whether the coverflow can be rotated
 *  --> handleOrientationChange: whether the coverflow is automatically resized on orientation changes
 *  --> coverSpacing: spacing between covers
 *  --> displayTitleDuration: how long it takes the title to be displayed
 *  --> borderSize: the covers border size
 *
 * @dependencies:
 * 	--> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 *  --> wink.ux.MovementTracker
 *  --> wink.ux.gesture
 *  --> wink.ux.window
 * 
 * @compatibility:
 * 	--> Iphone OS2 (slow), Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx', '../../../../ux/movementtracker/js/movementtracker', '../../../../ux/gesture/js/gesture', '../../../../ux/window/js/window'], function(wink)
{
	wink.ui.xyz.CoverFlow = function(properties) {
		this.uId				     = wink.getUId();
		
		this.covers			         = null;
		this.backgroundColor	     = null;
		this.reflected			     = false;
		this.displayTitle		     = false;
		this.fadeEdges			     = false;
		this.size				     = 0;
		this.viewportWidth		     = null;
		this.handleGesture		     = false;
		this.handleOrientationChange = false;
		this.coverSpacing		     = null;
		this.displayTitleDuration    = 0;
		this.borderSize		         = null;
		
		this._domNode				 = null;
		this._trayNode				 = null;
		this._gestureNode			 = null;
		this._faderLeft				 = null;
		this._faderRight			 = null;
		this._movementtracker 		 = null;
		this._positions				 = null;
		this._transformations		 = null;
		this._transformsQueue		 = null;
		this._renderer				 = null;
		this._middleViewIndex		 = null;
		this._lastRenderedIndex 	 = null;
		this._timerTitle			 = null;
		
		this._dragging				 = false;
		this._displayMode			 = false;
		this._flipping				 = false;
		
		this._view 					 = {
			x: 0,
			sizeX: 0,
			shiftX: 25,
			shiftFromMiddle: 200,
			coverRotation: 55,
			coverScale: 0.28,
			zMiddleCover: 175,
			zAroundCover: 0,
			numberOfCoverToRender: 5,
			distanceToCenter: 0,
			distanceFromTop: 0,
			zGestureNode: 1000,
			observerRotation: 0,
			currentObserverRotation: 0
		};
		
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xyz.CoverFlow.prototype = {
		_Z_INDEX_BACKGROUND: 5,
		_DURATION_BACKTO_BOUND: 200,
		_DURATION_MIDDLE: 600,
		_DURATION_AROUND: 300,
		_DURATION_FLIP: 1000,
		_TRANSITION_FUNC: 'default',
		_OUTOFBOUND_FRICTIONAL_FORCES: 4,
		_RENDERER_INTERVAL: 15,
		_DELAY_BEFORE_IMAGE_LOADING: 50,
		_PERSPECTIVE: 500,
		_REFLECTION_ATTENUATION: 0.6,
		_DELAY_FOR_TITLE_DISPLAY: 400,
			
		/**
		 * Returns the Cover Flow dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Update the Cover Flow size and the viewportWidth
		 * 
		 * @parameters:
		 *	--> size: the component size
		 *	--> viewportWidth: the viewport width
		 */
		updateSize: function(size, viewportWidth)
		{
			this.size = size;
			this.viewportWidth = viewportWidth;
			var v = this._view;
			
			// View
			var ratioShift = 0.07;
			if (wink.isSet(this.coverSpacing))
			{
				ratioShift = (this.coverSpacing * 0.003);
			}
			v.shiftX  = ratioShift * size;
			this._positions 		= [];
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				this._positions[i] = (v.shiftX * i);
			}
			v.sizeX = this._positions[l - 1];
			v.shiftFromMiddle = 0.7 * size;
			
			var ratioTraySize = Math.max((viewportWidth / size) - 1, 0);
			v.distanceToCenter = ratioTraySize * (size / 2);
			v.distanceFromTop = size * (v.coverScale / 1.5);
			
			// DOM
			var viewWidth = size * (1 + ratioTraySize);
			var viewWidthPx = viewWidth + "px";
			var sizePx = size + "px";
			
			wink.fx.apply(this._domNode, {
				width: viewWidthPx,
				height: sizePx
			});
			wink.fx.apply(this._trayNode, {
				width: viewWidthPx,
				height: sizePx
			});
			wink.fx.apply(this._gestureNode, {
				width: viewWidthPx,
				height: sizePx
			});
			
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				
				wink.fx.apply(c.coverNode, {
					width: sizePx,
					height: sizePx
				});
				wink.fx.apply(c.coverInnerNode, {
					width: sizePx,
					height: sizePx
				});
				wink.fx.apply(c.imageNode, {
					width: sizePx,
					height: sizePx
				});
				wink.fx.apply(c.coverReflection, {
					width: sizePx
				});
				
				if (this.reflected)
				{
					wink.fx.apply(c.coverReflectionBack, {
						width: sizePx,
						height: this._REFLECTION_ATTENUATION * size + "px"
					});
				}
				if (this.displayTitle)
				{
					wink.fx.apply(c.titleNode, {
						width: sizePx
					});
				}
			}
			
			if (this.fadeEdges)
			{
				var fl = this._faderLeft, fr = this._faderRight;
				var faderWidth		= viewportWidth / 15;
				fl.width			= faderWidth;
				fl.height			= size;
				fr.width			= faderWidth;
				fr.height			= size;
				fr.style.left		= viewWidth - faderWidth + 1 + "px";
				this._updateEdgeFaders();
			}
	
			// Transform
			this._createTransformations();
			this._initTransformations();
			this._slideTo(this._positions[this._currentPosition], true);
		},
		/**
		 * Set the Cover Flow background color
		 */
		setBackgroundColor: function(color)
		{
			var bg = this.backgroundColor = color;
			var bs = this.borderSize;
	
			var inverseColor = {
				r: (255 - bg.r),
				g: (255 - bg.g),
				b: (255 - bg.b)
			};
			var rgbaBg = "rgba(" + bg.r + ", " + bg.g + ", " + bg.b + ", 1.0)";
			
			this._domNode.style.backgroundColor = rgbaBg;
			//this._gestureNode.style.opacity = 0.0;
			
			var coverShadow = bs + "px -" + bs + "px 6px rgba(" + inverseColor.r + ", " + inverseColor.g + ", " + inverseColor.b + ", 0.5)";
			
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				if (this.reflected)
				{
					c.coverReflectionBack.style.backgroundColor = rgbaBg;
				}
				if (wink.isSet(bs) && bs > 0)
				{
					wink.fx.apply(c.imageNode, { 
						"box-shadow": coverShadow
					});
				}
			}
			
			if (this.fadeEdges)
			{
				this._updateEdgeFaders();
			}
		},
		/**
		 * Get position
		 */
		getPosition: function()
		{
			return this._currentPosition;
		},
		/**
		 * Set position
		 */
		setPosition: function(pos)
		{
			this._slideTo(this._positions[pos], true);
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			var toSpecify = function(property) {
				wink.log('[CoverFlow] Error: ' + property + ' property must be specified');
			};
			var logError = function(error) {
				wink.log('[CoverFlow] Error: ' + error);
			};
			
			if (!wink.isSet(this.covers) || this.covers.length == 0)
			{
				logError('covers property must be specified with at least one cover');
				return false;
			}
			if (!wink.isSet(this.size))
			{
				toSpecify('size');
				return false;
			}
			if (wink.isSet(this.position) && (this.position < 0 || this.position > (this.covers.length - 1)))
			{
				logError('bad position');
				return false;
			}
			if (!wink.isSet(this.viewportWidth))
			{
				toSpecify('viewportWidth');
				return false;
			}
			if (!wink.isSet(this.backgroundColor))
			{
				toSpecify('backgroundColor');
				return false;
			}
			if (!wink.isSet(this.backgroundColor.r) 
				|| !wink.isSet(this.backgroundColor.g)
				|| !wink.isSet(this.backgroundColor.b)) {
				logError('backgroundColor property must be specified with "r, g, b" values');
				return false;
			}
			if (!wink.isSet(this.reflected))
			{
				toSpecify('reflected');
				return false;
			}
			if (!wink.isSet(this.displayTitle))
			{
				toSpecify('displayTitle');
				return false;
			}
			if (!wink.isSet(this.handleOrientationChange))
			{
				toSpecify('handleOrientationChange');
				return false;
			}
			if (!wink.isSet(this.handleGesture))
			{
				toSpecify('handleGesture');
				return false;
			}
			
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				if (!this._isValidCover(cvs[i]))
				{
					logError('bad cover structure');
					return false;
				}
			}
			return true;
		},
		/**
		 * Check if the given cover is valid.
		 * 
		 * @parameters:
		 * 	--> cover: the cover to check
		 */
		_isValidCover: function(cover)
		{
			var isValid = true;
			isValid = isValid && wink.isSet(cover);
			isValid = isValid && wink.isSet(cover.image);
			isValid = isValid && wink.isSet(cover.title);
			return isValid;
		},
		/**
		 * Initialize datas with given properties
		 */
		_initProperties: function() 
		{
			this._currentPosition 			= this.position || Math.floor(this.covers.length / 2);
			this._view.x					= 0;
			this._middleViewIndex 			= Math.floor(this._view.numberOfCoverToRender / 2);
			this._lastRenderedIndex			= this._currentPosition;
			this._transformsQueue			= [];
	
			if (this.handleOrientationChange === true)
			{
				wink.subscribe('/window/events/orientationchange', { context: this, method: '_onOrientationChange' });
			}
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			var dn = this._domNode = document.createElement('div');
			wink.fx.apply(dn, {
				"user-select": "none"
			});
			
			var tn = this._trayNode = document.createElement('div');
			tn.style.position = "absolute";
			dn.appendChild(tn);
			
			var gn = this._gestureNode = document.createElement('div');
			gn.style.position = "absolute";
			dn.appendChild(gn);
			
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				var coverNode = document.createElement('div');
				var coverOutlineNode = document.createElement('div');
				var coverInnerNode = document.createElement('div');
				var imageNode = document.createElement('img');
				var coverReflection = document.createElement('div');
				
				coverInnerNode.appendChild(imageNode);
				coverInnerNode.appendChild(coverReflection);
				coverOutlineNode.appendChild(coverInnerNode);
				coverNode.appendChild(coverOutlineNode);
				tn.appendChild(coverNode);
				
				coverNode.style.position = "absolute";
				coverInnerNode.style.position = "absolute";
				
				c.coverNode 		= coverNode;
				c.coverOutlineNode 	= coverOutlineNode;
				c.coverInnerNode 	= coverInnerNode;
				c.imageNode 		= imageNode;
				c.coverReflection 	= coverReflection;
				
				c.transformation 	= null;
				c.diffTransform		= true;
				c.displayed 		= false;
				
				if (this.reflected)
				{
					var coverReflectionFront = document.createElement('canvas');
					var coverReflectionBack = document.createElement('div');
					coverReflection.appendChild(coverReflectionFront);
					coverReflection.appendChild(coverReflectionBack);
					coverReflectionFront.style.position = "absolute";
					coverReflectionBack.style.position = "absolute";
					
					c.coverReflectionFront = coverReflectionFront;
					c.coverReflectionBack	= coverReflectionBack;
				}
				if (this.displayTitle)
				{
					var titleNode = document.createElement('div');
					coverReflection.appendChild(titleNode);
					titleNode.style.position = "absolute";
					//titleNode.style.textAlign = "center";
					var titleInnerNode = $(c.title);
					titleNode.appendChild(titleInnerNode);
					
					c.titleNode = titleNode;
					c.titleInnerNode = titleInnerNode;
				}
	
				wink.fx.apply(c.coverNode, {
					"perspective": this._PERSPECTIVE,
					"transform-style": "preserve-3d"
				});
				wink.fx.apply(c.coverOutlineNode, {
					"transform-style": "preserve-3d"
				});
			}
			
			if (this.fadeEdges)
			{
				var fl = this._faderLeft = document.createElement('canvas');
				var fr = this._faderRight = document.createElement('canvas');
				dn.appendChild(fl);
				dn.appendChild(fr);
				fl.style.position = "absolute";
				fr.style.position = "absolute";
			}
			
			this._hideBackFaces();
			this._organizeDepth();
			this.updateSize(this.size, this.viewportWidth);
			this.setBackgroundColor(this.backgroundColor);		
			wink.setTimeout(this, "_setImages", this._DELAY_BEFORE_IMAGE_LOADING);
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			this._movementtracker = new wink.ux.MovementTracker({ target: this._gestureNode });
			wink.subscribe('/movementtracker/events/mvtbegin', { context: this, method: '_handleMovementBegin' });
			wink.subscribe('/movementtracker/events/mvtchanged', { context: this, method: '_handleMovementChanged' });
			wink.subscribe('/movementtracker/events/mvtstored', { context: this, method: '_handleMovementStored' });
			
			if (this.handleGesture)
			{
				this._gestureNode.listenToGesture(
					"instant_rotation", 
					{ context: this, method: "_handleRotation", arguments: null }, 
					{ preventDefault: true }
				);
				this._gestureNode.listenToGesture(
					"gesture_end", 
					{ context: this, method: "_handleGestureEnd", arguments: null }, 
					{ preventDefault: true }
				);
			}
		},
		/**
		 * Handle the rotation Gesture that impacts the Cover Flow rotation on x-axis
		 * 
		 * @parameters:
		 *	--> gestureInfos: see wink.ux.gesture Events
		 */
		_handleRotation: function(gestureInfos)
		{
			if (this._displayMode == false)
			{
				var v = this._view;
				var targetedRotation = v.observerRotation + gestureInfos.rotation;
				if (targetedRotation > 17 || targetedRotation < -70)
				{
					return;
				}
				v.currentObserverRotation = targetedRotation;
				var i, cvs = this.covers, l = cvs.length;
				for (i = 0; i < l; i++)
				{
					var c = cvs[i];
					wink.fx.setTransformPart(c.coverOutlineNode, 3, { type: "rotate", x: 1, y: 0, z: 0, angle: v.currentObserverRotation });
					wink.fx.applyComposedTransform(c.coverOutlineNode);
				}
			}
		},
		/**
		 * Handle the end of the Gesture
		 * 
		 * @parameters:
		 *	--> gestureInfos: see wink.ux.gesture Events
		 */
		_handleGestureEnd: function(gestureInfos)
		{
			if (this._displayMode == false)
			{
				this._view.observerRotation = this._view.currentObserverRotation;
			}
		},
		/**
		 * Handles the movement start
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementBegin: function(publishedInfos) 
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			this._dragging = false;
		},
		/**
		 * Handles the movement updates.
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementChanged: function(publishedInfos) 
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			if (this._displayMode)
			{
				return;
			}
			
			var movement = publishedInfos.movement;
			
			var beforeLastPoint = movement.pointStatement[movement.pointStatement.length - 2];
			var lastPoint = movement.pointStatement[movement.pointStatement.length - 1];
			
			var dx = lastPoint.x - beforeLastPoint.x;
			dx /= 2;
			
			var boundsInfos = this._getBoundsInfos(this._view.x);
			if (boundsInfos.outsideOfBounds) {
				if ( (boundsInfos.direction > 0 && lastPoint.directionX > 0)
					|| (boundsInfos.direction < 0 && lastPoint.directionX < 0) ) {
					dx /= this._OUTOFBOUND_FRICTIONAL_FORCES;
				}
			}
			
			this._dragging = true;
			this._slideTo(this._view.x - dx);
		},
		/**
		 * Handles the movement end : flip, unflip or invoke action
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementStored: function(publishedInfos)
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			
			if (this._dragging == false)
			{
				if (this._flipping)
				{
					return;
				}
				
				var position = this._currentPosition;
				var lastPoint = publishedInfos.movement.pointStatement[publishedInfos.movement.pointStatement.length - 1];
				var absPos = this._getAbsolutePosition(this._domNode);
				
				if (this._displayMode)
				{
					if (!this._onMiddleCover(lastPoint.x - absPos.x, lastPoint.y - absPos.y))
					{
						this._flipping = true;
						this._unflipCover(position);
					}
					else
					{
						var uxEvent = publishedInfos.uxEvent;
						uxEvent.dispatch(uxEvent.target, "click");
					}
				}
				else
				{
					if (this._onMiddleCover(lastPoint.x - absPos.x, lastPoint.y - absPos.y))
					{
						var coverClicked = this.covers[position];
						if (wink.isSet(coverClicked.action))
						{
							if (!wink.isCallback(coverClicked.action))
							{
								wink.log('[CoverFlow] Invalid action for cover : ' + position);
								return;
							}
							wink.call(coverClicked.action, coverClicked);
						}
						else if (wink.isSet(coverClicked.backFaceId))
						{
							this._flipping = true;
							this._prepareCoverBackFace(position);
							wink.setTimeout(this, "_flipCover", 1, position);
						}
					}
				}
				return;
			}
			if (this._backToBounds()) {
				return;
			}
		},
		/**
		 * Prepare the backface of the selected cover in order to flip
		 *
		 * @parameters:
		 * 	--> position: the position of the cover to prepare
		 */
		_prepareCoverBackFace: function(position)
		{
			var cp = this.covers[position];
			var backFaceNode = $(cp.backFaceId);
			
			wink.fx.apply(backFaceNode, {
				display: "block",
				position: "absolute",
				width: this.size + "px",
				height: this.size + "px",
				"backface-visibility": "hidden"
			});
			
			wink.fx.apply(cp.coverInnerNode, {
				"transform-origin-z": this._view.zMiddleCover + "px",
				"backface-visibility": "hidden"
			});
	
			wink.fx.set3dTransform(backFaceNode, { type: "rotate", x: 0, y: 1, z: 0, angle: 180 });
			
			wink.fx.applyTransformTransition(cp.coverOutlineNode, '0ms', '0ms', this._TRANSITION_FUNC);
			wink.fx.setTransformPart(cp.coverOutlineNode, 2, { type: "translate", x: 0, y: 0, z: this._view.zMiddleCover });
			wink.fx.applyComposedTransform(cp.coverOutlineNode);
	
			cp.coverOutlineNode.appendChild(backFaceNode);
		},
		/**
		 * Flip the selected cover in order to display the back face
		 *
		 * @parameters:
		 * 	--> position: the position of the cover to flip
		 */
		_flipCover: function(position)
		{
			var cp = this.covers[position];
			wink.fx.onTransitionEnd(cp.coverOutlineNode, wink.bind(this._postFlipCover, this, position));
			
			wink.fx.applyTransformTransition(cp.coverOutlineNode, this._DURATION_FLIP + 'ms', '0ms', this._TRANSITION_FUNC);
			wink.fx.setTransformPart(cp.coverOutlineNode, 1, { type: "rotate", x: 0, y: 1, z: 0, angle: 180 });
			wink.fx.setTransformPart(cp.coverOutlineNode, 2, { type: "translate", x: 0, y: this._view.distanceFromTop, z: this._view.zMiddleCover * 1.5 });
			wink.fx.setTransformPart(cp.coverOutlineNode, 3, { type: "rotate", x: 1, y: 0, z: 0, angle: 0 });
			wink.fx.applyComposedTransform(cp.coverOutlineNode);
			this._displayMode = true;
		},
		/**
		 * Handles the end of the flip process
		 *
		 * @parameters:
		 * 	--> position: the position of the cover flipped
		 */
		_postFlipCover: function(position)
		{
			this._flipping = false;
			this._gestureNode.style.zIndex = this._Z_INDEX_BACKGROUND;
			wink.fx.set3dTransform(this._gestureNode, { type: "translate", x: 0, y: 0, z: this._view.zMiddleCover / 2 });
		},
		/**
		 * Unflip the selected cover in order to display the front face
		 *
		 * @parameters:
		 * 	--> position: the position of the cover to unflip
		 */
		_unflipCover: function(position)
		{
			var cp = this.covers[position];
			wink.fx.setTransformPart(cp.coverOutlineNode, 1, { type: "rotate", x: 0, y: 1, z: 0, angle: 0 });
			wink.fx.setTransformPart(cp.coverOutlineNode, 2, { type: "translate", x: 0, y: 0, z: 0 });
			wink.fx.setTransformPart(cp.coverOutlineNode, 3, { type: "rotate", x: 1, y: 0, z: 0, angle: this._view.currentObserverRotation });
			wink.fx.applyComposedTransform(cp.coverOutlineNode);
			wink.fx.apply(cp.coverInnerNode, {
				"transform-origin-z": "0px"
			});
			
			wink.fx.onTransitionEnd(cp.coverOutlineNode, wink.bind(this._postUnflipCover, this, position));
		},
		/**
		 * Handles the end of the unflip process
		 *
		 * @parameters:
		 * 	--> position: the position of the cover unflipped
		 */
		_postUnflipCover: function(position)
		{
			var cp = this.covers[position];
			wink.fx.applyTransformTransition(cp.coverOutlineNode, '0ms', '0ms', this._TRANSITION_FUNC);
			var backFaceNode = $(cp.backFaceId);
			backFaceNode.style.display = "none";
			this._displayMode = false;
			this._flipping = false;
			
			this._gestureNode.style.zIndex = this._Z_INDEX_BACKGROUND + 4;
			wink.fx.set3dTransform(this._gestureNode, { type: "translate", x: 0, y: 0, z: this._view.zGestureNode });
		},
		/**
		 * Handles an orientation change
		 * 
		 * @parameters:
		 * 	--> properties: see wink.ux.Window Events
		 */
		_onOrientationChange: function(properties)
		{
			var viewportWidth = properties.width;
			this.updateSize(this.size, viewportWidth);
		},
		/**
		 * Returns the current position (the middle Cover) that depends on covers positions
		 * 
		 * @parameters:
		 * 	--> x: the current coordinate
		 */
		_getPosition: function(x)
		{
			var currentPosition = null;
			var i, ps = this._positions, l = ps.length;
			for (i = 0; i < l; i++)
			{
				currentPosition = i;
				if (x < (ps[i] + (this._view.shiftX / 2)))
				{
					break;
				}
			}
			return currentPosition;
		},
		/**
		 * Slide to the given position.
		 * 
		 * @parameters:
		 * 	--> x: the targeted position
		 * 	--> force: true only if view must be slided even if there is no position difference
		 */
		_slideTo: function(x, force) 
		{
			var v = this._view;
			var newX = wink.math.round(x, 2);
			if (newX != v.x || force === true)
			{
				v.x = newX;
				wink.fx.set3dTransform(this._trayNode, { type: "translate", x: -v.x + v.distanceToCenter, y: -v.distanceFromTop, z: 0 });
				this._updateView();
			}
		},
		/**
		 * Updates the view if the current displayed cover has changed. 
		 */
		_updateView: function()
		{
			var newPosition = this._getPosition(this._view.x);
			if (newPosition != this._currentPosition)
			{
				this._currentPosition = newPosition;
				this._addToQueue(this._currentPosition);
			}
		},
		/**
		 * Starts the renderer process
		 */
		_startRenderer: function()
		{
			if (this._renderer == null)
			{
				this._renderer = wink.setTimeout(this, '_rendererProcess', 1);
			}
		},
		/**
		 * Stops the renderer process
		 */
		_stopRenderer: function()
		{
			if (this._renderer != null)
			{
				clearTimeout(this._renderer);
				this._renderer = null;
			}
		},
		/**
		 * Execute the renderer process : compute and apply transformations successively on the different positions requested by the user
		 */
		_rendererProcess: function()
		{
			var tq = this._transformsQueue, tql = tq.length, tq0 = tq[0];
			if (tq0.rendering == false)
			{
				tq0.rendering = true;
				var position = tq0.position;
				
				wink.fx.onTransitionEnd(this.covers[position].coverInnerNode, wink.bind(this._handleCoverRendered, this, position));
				
				this._updateTransformations(position);
				var durationForMiddle = wink.math.round(this._DURATION_MIDDLE / (tql * 2), 0);
				var durationForAround = wink.math.round(this._DURATION_AROUND / (tql * 2), 0);
				this._updateTransitions(position, durationForMiddle, durationForAround);
				this._applyTransformations();
			}
			else if (tq0.rendered == true)
			{
				tq.shift();
				tql = tq.length;
				if (tql == 0)
				{
					this._stopRenderer();
					return;
				}
			}
			else
			{
				if (tql > 1)
				{
					this._handleCoverRendered(tq0.position);
				}
			}
			
			this._renderer = wink.setTimeout(this, '_rendererProcess', this._RENDERER_INTERVAL);
		},
		/**
		 * Handles a rendered cover
		 * 
		 * @parameters:
		 * 	--> index: the index of the rendered cover
		 */
		_handleCoverRendered: function(index) 
		{
			this._lastRenderedIndex = index;
			var tq = this._transformsQueue;
			if (tq.length == 0)
			{
				return;
			}
			tq[0].rendered = true;
		},
		/**
		 * Add to the renderer process queue the given position
		 * 
		 * @parameters:
		 * 	--> position: the position to render
		 */
		_addToQueue: function(position)
		{
			this._transformsQueue.push({
				timestamp: new Date().getTime(),
				position: position,
				rendered: false,
				rendering: false
			});
			this._startRenderer();
		},
		/**
		 * Update transformation of the covers
		 * 
		 * @parameters:
		 * 	--> middlePosition: the middle position
		 */
		_updateTransformations: function(middlePosition)
		{
			var shift = Math.abs(this._lastRenderedIndex - middlePosition) - 1;
			var half = this._middleViewIndex + shift;
			
			var start = middlePosition - half;
			var end = middlePosition + (half + 1);
			
			var cvs = this.covers, l = cvs.length;
			
			if (middlePosition < half)
			{
				start = 0;
			}
			if (end > l)
			{
				end = l;
			}
			
			for (var i = 0; i < l; i++)
			{
				cvs[i].diffTransform = false;
			}
			
			for (var i = start; i < end; i++)
			{
				var c = cvs[i];
				c.oldTransformation = c.transformation;
				c.transformation	= this._getTargetedTransformation(i, middlePosition);
				c.diffTransform  	= this._transformationsDifferent(c.oldTransformation, c.transformation);
			}
		},
		/**
		 * Update transitions of the covers
		 * 
		 * @parameters:
		 * 	--> middlePosition: the middle position
		 * 	--> durationForMiddle: the transition duration for the cover at the middle
		 * 	--> durationForAround: the transition duration for the covers around
		 */
		_updateTransitions: function(middlePosition, durationForMiddle, durationForAround)
		{
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				if (c.diffTransform)
				{
					var tf = this._TRANSITION_FUNC;
					if (i == middlePosition)
					{
						wink.fx.applyTransformTransition(c.coverInnerNode, durationForMiddle + 'ms', '0ms', tf);
					}
					else
					{
						wink.fx.applyTransformTransition(c.coverInnerNode, durationForAround + 'ms', '0ms', tf);
					}
				}
			}
		},
		/**
		 * Apply transformation to the covers
		 */
		_applyTransformations: function()
		{
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				if (c.diffTransform)
				{
					wink.fx.setTransformPart(c.coverInnerNode, 1, c.transformation.rotation);
					wink.fx.setTransformPart(c.coverInnerNode, 2, c.transformation.translation);
					wink.fx.applyComposedTransform(c.coverInnerNode);
						
					if (this.displayTitle)
					{
						var dd = this.displayTitleDuration;
						if (i == this._currentPosition)
						{
							if (dd > 0)
							{
								if (wink.isSet(this._timerTitle))
								{
									clearTimeout(this._timerTitle);
									this._timerTitle = null;
								}
								this._timerTitle = wink.setTimeout(this, "_showTitle", this._DELAY_FOR_TITLE_DISPLAY, i);
							}
							else
							{
								this._showTitle(i);
							}
						}
						else
						{
							if (dd > 0)
							{
								wink.fx.applyTransition(c.titleNode, "opacity", '0ms', '0ms', this._TRANSITION_FUNC);
							}
							this._setTitleOpacity(i, 0.0);
						}
					}
				}
			}
		},
		/**
		 * Returns true if the givens transformations are considered different
		 * 
		 * @parameters:
		 * 	--> t1: the first transformation
		 * 	--> t2: the second transformation
		 */
		_transformationsDifferent: function(t1, t2)
		{
			return (t1.rotation.angle != t2.rotation.angle);
		},
		/**
		 * Initialize transformations of the covers
		 */
		_initTransformations: function()
		{
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				wink.fx.initComposedTransform(c.coverNode);
				wink.fx.setTransformPart(c.coverNode, 1, { type: "scale", x: this._view.coverScale, y: this._view.coverScale, z: 1 });
				wink.fx.setTransformPart(c.coverNode, 2, { type: "translate", x: this._positions[i], y: 0, z: 0 });
				wink.fx.storeComposedTransform(c.coverNode);
				wink.fx.removeComposedTransform(c.coverNode);
				
				wink.fx.initComposedTransform(c.coverOutlineNode);
				
				wink.fx.initComposedTransform(c.coverInnerNode);
				c.transformation = this._getTargetedTransformation(i, this._currentPosition);
			}
			this._applyTransformations();
			wink.fx.set3dTransform(this._gestureNode, { type: "translate", x: 0, y: 0, z: this._view.zGestureNode });
		},
		/**
		 * Create transformations to load later
		 */
		_createTransformations: function()
		{
			var v = this._view,
				cr = v.coverRotation,
				za = v.zAroundCover,
				sm = v.shiftFromMiddle;
			this._transformations = {
				left: {
					rotation: 		{ type: "rotate", x: 0, y: 1, z: 0, angle: cr },
					translation: 	{ type: "translate", x: -sm, y: 0, z: za }
				},
				middle: {
					rotation: 		{ type: "rotate", x: 0, y: 1, z: 0, angle: 0 },
					translation: 	{ type: "translate", x: 0, y: 0, z: v.zMiddleCover }
				},
				right: {
					rotation: 		{ type: "rotate", x: 0, y: 1, z: 0, angle: -cr },
					translation: 	{ type: "translate", x: sm, y: 0, z: za }
				}
			};
		},
		/**
		 * Returns the transformation to apply to the given index
		 * 
		 * @parameters:
		 * 	--> index: the current index
		 * 	--> middle: the middle index
		 */
		_getTargetedTransformation: function(index, middle)
		{
			var tfs = this._transformations;
			if (index < middle)
			{
				return tfs.left;
			}
			else if (index > middle)
			{
				return tfs.right;
			}
			else
			{
				return tfs.middle;
			}
		},
		/**
		 * Show the title
		 * 
		 * @parameters:
		 * 	--> index: the index of the associated cover
		 */
		_showTitle: function(index)
		{
			if (wink.isSet(this._timerTitle))
			{
				clearTimeout(this._timerTitle);
				this._timerTitle = null;
			}
			if (index == this._currentPosition)
			{
				var dd = this.displayTitleDuration;
				if (dd > 0)
				{
					wink.fx.applyTransition(this.covers[index].titleNode, "opacity", dd + 'ms', '0ms', this._TRANSITION_FUNC);
				}
				this._setTitleOpacity(index, 1.0);
			}
		},
		/**
		 * Updates sur title opacity
		 * 
		 * @parameters:
		 * 	--> index: the index of the associated cover
		 * 	--> opacity: the opacity value
		 */
		_setTitleOpacity: function(index, opacity)
		{
			this.covers[index].titleNode.style.opacity = opacity;
		},
		/**
		 * Hides all back faces
		 */
		_hideBackFaces: function()
		{
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				if (wink.isSet(c.backFaceId))
				{
					var backFaceNode = $(c.backFaceId);
					backFaceNode.style.display = "none";
				}
			}
		},
		/**
		 * Set all cover images
		 */
		_setImages: function()
		{
			var i, cvs = this.covers, l = cvs.length;
			for (i = 0; i < l; i++)
			{
				var c = cvs[i];
				if (this.reflected)
				{
					this._applyReflection(i);
				}
				c.imageNode.src = c.image;
			}
		},
		/**
		 * Organize the Cover Flow depth
		 */
		_organizeDepth: function()
		{
			var zib = this._Z_INDEX_BACKGROUND;
			this._domNode.style.zIndex = zib;
			this._trayNode.style.zIndex = zib + 1;
			this._gestureNode.style.zIndex = zib + 4;
			
			if (this.reflected)
			{
				var i, cvs = this.covers, l = cvs.length;
				for (i = 0; i < l; i++)
				{
					var c = cvs[i];
					if (this.displayTitle)
					{
						c.titleNode.style.zIndex 			= zib + 4;
					}
					c.coverReflectionFront.style.zIndex 	= zib + 3;
					c.coverReflectionBack.style.zIndex 		= zib + 2;
				}
			}
			if (this.fadeEdges)
			{
				this._faderLeft.style.zIndex 	= zib + 4;
				this._faderRight.style.zIndex 	= zib + 4;
			}
		},
		/**
		 * Apply Reflection on a cover
		 * 
		 * @parameters:
		 * 	--> index: the index of the cover to reflect
		 */
		_applyReflection: function(index)
		{
			var c = this.covers[index];
			var img = c.imageNode;
			var canvas = c.coverReflectionFront;
			c.imageLoadingHandler = wink.bind(function () {
				this._reflect(index, img, canvas, img.width, img.height);
			}, this);
			img.addEventListener("load", c.imageLoadingHandler);
		},
		/**
		 * Reflection process
		 * 
		 * @parameters:
		 * 	--> index: the index of the cover to reflect
		 * 	--> image: the image to reflect
		 * 	--> canvas: the target canvas
		 * 	--> width: the width of the canvas
		 * 	--> height: the height of the canvas
		 */
		_reflect: function(index, image, canvas, width, height)
		{
		    canvas.width = width;
		    canvas.height = height;
	
		    var ctx = canvas.getContext("2d");
	
		    ctx.save();
	
		    ctx.translate(0, (height / 1.5));
		    ctx.scale(1, -1);
		    ctx.drawImage(image, 0, 0, width, height / 1.5);
	
		    ctx.restore();
	
		    ctx.globalCompositeOperation = "destination-out";
	
		    var gradient = ctx.createLinearGradient(0, 0, 0, height);
		    gradient.addColorStop(0, "rgba(255, 255, 255, " + this._REFLECTION_ATTENUATION + ")");
		    gradient.addColorStop(0.6, "rgba(255, 255, 255, 1.0)");
		    
		    ctx.fillStyle = gradient;
		    ctx.fillRect(0, 0, width, height);
		    image.removeEventListener("load", this.covers[index].imageLoadingHandler);
		},
		/**
		 * Update the edge faders
		 */
		_updateEdgeFaders: function()
		{
			var bg = this.backgroundColor,
				fl = this._faderLeft,
				fr = this._faderRight,
				ctx = fl.getContext("2d");
			
		    var gradient = ctx.createLinearGradient(0, 0, fl.width, 0);
		    gradient.addColorStop(0.0, "rgba(" + bg.r + ", " + bg.g + ", " + bg.b + ", 1.0)");
		    gradient.addColorStop(1.0, "rgba(" + bg.r + ", " + bg.g + ", " + bg.b + ", 0.0)");
		    
		    ctx.fillStyle = gradient;
		    ctx.fillRect(0, 0, fl.width, fl.height);
		    
		    ctx = fr.getContext("2d");
	
		    gradient = ctx.createLinearGradient(0, 0, fr.width, 0);
		    gradient.addColorStop(0.0, "rgba(" + bg.r + ", " + bg.g + ", " + bg.b + ", 0.0)");
		    gradient.addColorStop(1.0, "rgba(" + bg.r + ", " + bg.g + ", " + bg.b + ", 1.0)");
		    
		    ctx.fillStyle = gradient;
		    ctx.fillRect(0, 0, fr.width, fr.height);
		},
		/**
		 * Go back to bound if necessary.
		 */
		_backToBounds: function()
		{
			var boundsInfos = this._getBoundsInfos(this._view.x);
			if (boundsInfos.outsideOfBounds) {
				this._slideTo(boundsInfos.positionOfBound, this._DURATION_BACKTO_BOUND);
				return true;
			}
			return false;
		},
		/**
		 * Get bounds informations that allows caller to determine if the target is out of bounds,
		 * the direction associated, the distance to the bound and the position to reach.
		 * 
		 * @parameters:
		 * 	--> nextX: the next position on x
		 */
		_getBoundsInfos: function(nextX)
		{
			var v = this._view;
			var boundsInfos = {};
			boundsInfos.outsideOfBounds = false;
			
			if (nextX < 0 || nextX > v.sizeX) {
				boundsInfos.outsideOfBounds = true;
				if (nextX < 0) {
					boundsInfos.distanceToBound = Math.abs(nextX);
					boundsInfos.direction = 1;
					boundsInfos.positionOfBound = 0;
				} else {
					boundsInfos.distanceToBound = Math.abs(nextX - v.sizeX);
					boundsInfos.direction = -1;
					boundsInfos.positionOfBound = v.sizeX;
				}
			}
			return boundsInfos;
		},
		/**
		 * This method allows to determine if the digit selection refers to the middle cover
		 * 
		 * @parameters:
		 * 	--> x: the digit position on x-axis
		 * 	--> y: the digit position on y-axis
		 */
		_onMiddleCover: function(x, y)
		{
			var v = this._view,
				s = this.size,
				rf = wink.math.round;
			var coverSize = rf((s * v.coverScale) * 1.5, 0); // depends on perspective
			var ymin = rf((s / 2) - (coverSize / 2) - v.distanceFromTop, 0);
			var xmin = rf((s / 2) - (coverSize / 2) + v.distanceToCenter, 0);
			var ymax = ymin + coverSize;
			var xmax = xmin + coverSize;
			
			if (this._displayMode)
			{
				coverSize = rf((s * v.coverScale) * 2.1, 0); // depends on perspective
				ymin = rf((s / 2) - (coverSize / 2) - (v.distanceFromTop / 2.1), 0);
				xmin = rf((s / 2) - (coverSize / 2) + v.distanceToCenter, 0);
				ymax = ymin + coverSize;
				xmax = xmin + coverSize;
			}
			
			if (x >= xmin && x <= xmax && y >= ymin && y <= ymax)
			{
				return true;
			}
			return false;
		},
		/**
		 * @parameters:
		 * 	--> node: the node
		 */
		_getAbsolutePosition: function(node)
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
		}
	};
	
	return wink.ui.xyz.CoverFlow;
});
