/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Displays an iPhone-like popup menu. You have to define the 1 to 6 items.
 * 
 * @methods:
 * 	--> addItem: 				adds an item to the Menu
 *  --> toggle: 				hide/display the Menu
 *  
 * @attributes:
 *  --> uId : 					unique identifier of the component
 *  --> domNode : 				the main node of the Menu component to insert in the DOM
 * 
 * @events:
 *  --> /menu/events/click: 	raised when theuser clicks on an item whose "transition" is not a basic one. { url: the target URL, transition: the transition type associatedto this item }
 *  --> /menu/events/open: 		raised when the Menu is opened. no parameter
 *  --> /menu/events/close: 	raised when the Menu is closed. no parameter
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Frédéric MOULIS
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.Menu = function(properties)
	{
		if (wink.isUndefined(wink.ui.xy.Menu.singleton))
		{
			this._properties 	= properties;
			this.uId 			= wink.getUId();
			
			this._domNode 		= null;
			this._closeNode		= null;
			
			this._items 		= [];
			this._displayed		= false;
			
			this._view			= {
				x: 0,
				y: 0
			};
			
			wink.mixin(this._view, properties);
			
			if (this._validateProperties() === false) return;
			
			this._initDom();
			this._initListeners();
			
			wink.ui.xy.Menu.singleton = this;
		} 
		else
		{
			return wink.ui.xy.Menu.singleton;
		}
	};
	
	wink.ui.xy.Menu.prototype =
	{
		_DISPLAY_DURATION: 400,
	
		/**
		 * Returns the Menu dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Hides / Displays the menu
		 */
		toggle: function()
		{
			if (this._displayed == false) 
			{
				this._show();
			} 
			else 
			{
				this._hide();
			}
		},
		/**
		 * Adds an item to the menu
		 * 
		 * @parameters:
		 * 	--> item: item object ( item: { itemClass, title, callback } )
		 * 		--> An item is composed of :
		 * 			- [itemClass]: 		the class associated to the item that allows css adjustment
		 * 			- [title]: 			the title of the item
		 * 			- [callback]:		the callback action that will be invoked when selecting the item
		 */
		addItem: function(item)
		{
			this._items.push(item);
			var itemClass = item.itemClass;
			var title = item.title;
			var callback = item.callback;
			
			var itemNode = document.createElement('div');
			var imageNode = document.createElement('div');
			var titleNode = document.createElement('div');
			var titleTextNode = document.createElement('span');
			
			itemNode.appendChild(imageNode);
			itemNode.appendChild(titleNode);
			titleNode.appendChild(titleTextNode);
			this._domNode.appendChild(itemNode);
			
			wink.addClass(itemNode, 'mn_menu_item w_border_right w_border_bottom');
			wink.addClass(imageNode, 'mn_image');
			wink.addClass(titleNode, 'mn_title');
			wink.addClass(titleTextNode, 'mn_title_text');
			
			if (wink.isSet(itemClass))
			{
				wink.addClass(itemNode, itemClass);
			}
			
			if (wink.isSet(title))
			{
				titleTextNode.innerHTML = title;
			}
			
			if (wink.isSet(callback) && wink.isCallback(callback))
			{
				itemNode.onclick = function()
				{
					wink.call(callback);
				};
			}
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{		
			this._domNode = document.createElement('div');
			
			this._closeNode = document.createElement('div');
			this._closeNode.className = "w_icon w_float w_button_close";
			
			this._domNode.appendChild(this._closeNode);
			
			wink.addClass(this._domNode, 'w_box w_window mn_menu w_border w_radius w_bg_dark');
			
			wink.fx.apply(this._domNode, {
				visibility: 'hidden',
				opacity: 0
			});
	
			this._domNode.translate(this._view.x, this._view.y);
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			wink.ux.touch.addListener(this._closeNode, "end", { context: this, method: "_hide" }, { preventDefault: true });
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			if (!wink.isNumber(parseFloat(this._view.x)))
			{
				wink.log('[Menu] the x property must be an integer');
				return false;
			}
			if (!wink.isNumber(parseFloat(this._view.y)))
			{
				wink.log('[Menu] the y property must be an integer');
				return false;
			}
			return true;
		},
		/**
		 * Shows the Menu
		 */
		_show: function()
		{
			wink.layer.show();
			
			wink.fx.applyTransition(this._domNode, 'opacity', this._DISPLAY_DURATION + 'ms', '0ms', 'ease-in');
			
			wink.fx.apply(this._domNode, {
				visibility: 'visible',
				opacity: 1
			});
			
			wink.fx.onTransitionEnd(this._domNode, wink.bind(this._postShow, this));
			
			wink.publish('/menu/events/open', null);
		},
		/**
		 * Post show management
		 */
		_postShow: function()
		{
			this._displayed = true;
		},
		/**
		 * Hides the Menu
		 */
		_hide: function()
		{
			wink.fx.applyTransition(this._domNode, 'opacity', this._DISPLAY_DURATION + 'ms', '0ms', 'ease-out');
			
			this._domNode.style.opacity = 0;
			
			wink.fx.onTransitionEnd(this._domNode, wink.bind(this._postHide, this));
		},
		/**
		 * Post hide management
		 */
		_postHide: function()
		{
			this._domNode.style.visibility = "hidden";
			this._displayed = false;
			
			wink.layer.hide();
			
			wink.publish('/menu/events/close', null);
		}
	};
	
	return wink.ui.xy.Menu;
});