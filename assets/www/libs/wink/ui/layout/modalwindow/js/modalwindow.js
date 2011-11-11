/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a Modal Window.
 * 
 * A modal window can make a content as an icon, this content can be displayed as a window. 
 * An icon is optionally movable, is associated with an image and the transition time between the view as an icon 
 * and the view as content is customizable.
 * 
 * @properties:
 * 	data =
 * 	{
 * 		iconView: 			Property structure as { image, x, y, sizeX, sizeY } that identifies the position, the size and the image of the icon view
 * 		modalView: 			Property structure as { content, x, y, sizeX, sizeY } that identifies the position, the size and the content node Id of the modal view
 * 		displayDuration: 	[optional] the duration of the transition from icon to modal view and conversely
 * 		canDrag: 			[optional] boolean that indicates if icon dragging is enabled
 * 	}
 * 
 * @methods:
 * 	--> getDomNode: 		Returns the ModalWindow dom node
 *
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> iconView: the characteristics of the icon view
 *  --> modalView: the characteristics of the modal view
 *  --> displayDuration: the duration of the transition from icon to modal view and conversely
 *  --> canDrag: is icon dragging enabled
 *
 * @dependencies:
 * 	--> wink.ux.MovementTracker
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../../_amd/core', '../../../../ux/movementtracker/js/movementtracker'], function(wink)
{
	wink.ui.layout.ModalWindow = function(properties)
	{
		this.uId					= wink.getUId();
		
		this.iconView 				= {
			x: 0,
			y: 0,
			refX: 0,
			refY: 0,
			sizeX: 0,
			sizeY: 0,
			image: null
		};
		this.modalView 			= {
			x: 0,
			y: 0,
			sizeX: 0,
			sizeY: 0,
			content: null
		};
		this.displayDuration 		= 0;
		this.canDrag				= false;
		
		this._domNode				= null;
		this._iconNode				= null;
		this._iconImgNode			= null;
		this._modalNode				= null;
		this._modalContentNode		= null;
		this._modalCloseNode		= null;
		
		this._scaleX				= null;
		this._scaleY				= null;
		this._movementtracker		= null;
		this._showed 				= null;
		this._dragging				= null;
		this._currentDuration		= null;
	
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.layout.ModalWindow.prototype =
	{
		_Z_INDEX_BACKGROUND: 1,
		_TRANSITION_FUNC: 'default',
		
		/**
		 * Returns the ModalWindow dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Shifts the close node to the given position
		 * 
		 * @parameters:
		 *	--> x: position on x-axis
		 *	--> y: position on y-axis
		 */
		shiftCloseNode: function(x, y)
		{
			this._modalCloseNode.translate(x, y, true);
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			if (!wink.isSet(this.iconView))
			{
				this._raisePropertyError('iconView');
				return false;
			}
			if (!wink.isSet(this.modalView))
			{
				this._raisePropertyError('modalView');
				return false;
			}
			return true;
		},
		/**
		 * Raise the property error
		 */
		_raisePropertyError: function(property)
		{
			wink.log('[ModalWindow] Error: ' + property + ' missing or invalid');
		},
		/**
		 * Initialize datas with given properties
		 */
		_initProperties: function() 
		{
			this._showed 				= false;
			this._dragging				= false;
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._iconNode = document.createElement('div');
			this._iconImgNode = document.createElement('img');
			this._modalNode = document.createElement('div');
			this._modalCloseNode = document.createElement('div');
			this._modalContentNode = $(this.modalView.content);
			
			wink.addClass(this._iconNode, 'w_icon');
			wink.addClass(this._modalNode, 'w_box w_window w_bloc w_border w_radius w_bg_dark');
			wink.addClass(this._modalCloseNode, 'w_icon w_float w_button_close');
			
			wink.fx.apply(this._domNode, {
				"user-select": "none",
				position: "absolute",
				width: this.modalView.sizeX + "px",
				height: this.modalView.sizeY + "px"
			});
			wink.fx.apply(this._iconNode, {
				position: "absolute",
				width: "100%",
				height: "100%"
			});
			wink.fx.apply(this._iconImgNode, {
				width: "100%",
				height: "100%"
			});
			wink.fx.apply(this._modalNode, {
				position: "absolute",
				width: this.modalView.sizeX + "px",
				height: this.modalView.sizeY + "px"
			});
			wink.fx.apply(this._modalCloseNode, {
				top: "0px",
				left: "0px"
			});
			
			this._modalCloseNode.translate(-20, -20, true);
			this._modalNode.translate(0, 0, true); // WORKAROUND - IPhone OS2
	
			this._iconNode.appendChild(this._iconImgNode);
			this._modalNode.appendChild(this._modalContentNode);
			this._domNode.appendChild(this._modalCloseNode);
			this._domNode.appendChild(this._iconNode);
			this._domNode.appendChild(this._modalNode);
			
			this._iconImgNode.src = this.iconView.image;
			
			this._hide();
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			this._movementtracker = new wink.ux.MovementTracker({ target: this._domNode });
			wink.subscribe('/movementtracker/events/mvtBegin', {context: this, method: '_handleMovementBegin'});
			wink.subscribe('/movementtracker/events/mvtChanged', {context: this, method: '_handleMovementChanged'});
			wink.subscribe('/movementtracker/events/mvtStored', {context: this, method: '_handleMovementStored'});
			
			wink.ux.touch.addListener(this._modalCloseNode, "start", { context: this, method: "_handleClick" }, { preventDefault: true });
		},
		/**
		 * Handles the start.
		 * 
		 * @parameters:
		 *	--> uxEvent: the uxEvent associated
		 */
		_handleClick: function(uxEvent)
		{
			this._closing = true;
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
			this._applyTransitions(0);
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
			if (this._showed == true)
			{
				return;
			}
			
			this._dragging = true;
			if (this.canDrag == true)
			{
				var movement = publishedInfos.movement;
				var firstPoint = movement.pointStatement[movement.pointStatement.length - 2];
				var lastPoint = movement.pointStatement[movement.pointStatement.length - 1];
				
				var dx = lastPoint.x - firstPoint.x;
				var dy = lastPoint.y - firstPoint.y;
				
				this._moveIcon(this.iconView.x + wink.math.round(dx, 0), this.iconView.y + wink.math.round(dy, 0));
			}
		},
		/**
		 * Handles the movement end
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
			
			if (this._closing == true)
			{
				this._hide();
				this._closing = false;
				return;
			}
			
			if (this._showed == false)
			{
				if (this._dragging == false)
				{
					this._show();
				}
			}
		},
		/**
		 * Show the modal window content
		 */
		_show: function()
		{
			this._showed = true;
			
			this._applyTransitions(this.displayDuration);
			this._iconNode.style.opacity = 0;
			this._modalCloseNode.style.opacity = 1;
			this._modalNode.style.opacity = 1;
			this._enlarge();
			this._orderAll();
		},
		/**
		 * Hide the content, iconize modal window
		 */
		_hide: function()
		{
			this._showed = false;
			
			this._applyTransitions(this.displayDuration);
			this._iconNode.style.opacity = 1;
			this._modalCloseNode.style.opacity = 0;
			this._modalNode.style.opacity = 0;
			this._iconize();
			this._orderAll();
		},
		/**
		 * Enlarge the modal window
		 */
		_enlarge: function()
		{
			this._domNode.scale(1, 1);
			this._domNode.translate(this.modalView.x, this.modalView.y);
		},
		/**
		 * Iconize the modal window
		 */
		_iconize: function()
		{
			this._scaleX				= wink.math.round(this.iconView.sizeX / this.modalView.sizeX, 2);
			this._scaleY				= wink.math.round(this.iconView.sizeY / this.modalView.sizeY, 2);
			this.iconView.refX			= -(this.modalView.sizeX / 2) + (this.iconView.sizeX / 2);
			this.iconView.refY			= -(this.modalView.sizeX / 2) + (this.iconView.sizeX / 2);
			
			this._domNode.scale(this._scaleX, this._scaleY);
			this._moveIcon(this.iconView.x, this.iconView.y);
		},
		/**
		 * Move icon to the given location
		 * 
		 * @parameters:
		 * 	--> x: x coordinates
		 * 	--> y: y coordinates
		 */
		_moveIcon: function(x, y)
		{
			this.iconView.x = x;
			this.iconView.y = y;
	
			this._domNode.translate(this.iconView.x + this.iconView.refX, this.iconView.y + this.iconView.refY);
		},
		/**
		 * Order all layers on depth
		 */
		_orderAll: function()
		{
			var zref = this._Z_INDEX_BACKGROUND;
			if (this._showed == false)
			{
				this._domNode.style.zIndex = zref;
				this._iconNode.style.zIndex = zref + 1;
				this._modalNode.style.zIndex = zref;
				this._modalCloseNode.style.zIndex = zref;
			}
			else
			{
				this._domNode.style.zIndex = zref + 1;
				this._iconNode.style.zIndex = zref + 1;
				this._modalNode.style.zIndex = zref + 2;
				this._modalCloseNode.style.zIndex = zref + 3;
			}
		},
		/**
		 * Apply transitions according to the given duration
		 * 
		 * @parameters:
		 * 	--> duration: the transition duration
		 */
		_applyTransitions: function(duration)
		{
			if (duration != this._currentDuration)
			{
				wink.fx.applyTransformTransition(this._domNode, duration + 'ms', '0ms', this._TRANSITION_FUNC);
				wink.fx.applyTransition(this._iconNode, 'opacity', duration + 'ms', '0ms', this._TRANSITION_FUNC);
				wink.fx.applyTransition(this._modalNode, 'opacity', duration + 'ms', '0ms', this._TRANSITION_FUNC);
				this._currentDuration = duration;
			}
		}
	};
	
	return wink.ui.layout.ModalWindow;
});