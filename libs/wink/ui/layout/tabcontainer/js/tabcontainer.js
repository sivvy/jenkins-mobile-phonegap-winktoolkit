/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a tab container
 * 
 * @methods:
 *	--> addTab: add a new tab to the tab container
 *	--> removeTab: remove a tab
 *	--> selectTab: select a tab
 *	--> getDomNode: returns the DOM node containing the tab container
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> displayArrows: whether te left and right arrows are displayed
 * 	--> firstSelectedTab: the index of the tab to display at the container's startup
 * 	--> tabs: the initial list of tabs of the tab container
 *
 * @events:
 * 	--> /tabcontainer/events/tabselected: return the selected tab
 *
 * @properties:
 * 	data = 
 * 	{
 * 		displayArrows = if set to 0, the right and left arrows won't be displayed (default is 1)
 * 		firstSelectedTab = the index of the tab to display at the container's startup (default is item 0. 0 represents the first tab in the container)	
 * 		tabs = the list of tabs to add to the tab container (must be an array of strings representing actual dom nodes ids)
 *	}
 *
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */
define(['../../../../_amd/core'], function(wink)
{
	wink.ui.layout.TabContainer = function(properties)
	{
		this.uId                = wink.getUId();
		
		this.displayArrows     = 1;
		this.firstSelectedTab  = 0;
		
		this.tabs               = undefined;
		
		this._NEXT_DURATION		= 200;
		this._NEAREST_DURATION	= 200;
		
		this._tabsIdsList       = [];
		this._tabsList 			= [];
		
		this._domNode           = null;
		this._tabsNode	        = null;
		this._moveableNode		= null;
		this._itemsNode			= null;
		this._leftArrowNode		= null;
		this._rightArrowNode	= null;
		
		this._visibleAreaSize	= 0;
		this._moveableAreaSize	= 0;
		this._timerResizer		= null;
		this._currentItem		= 0;
		this._currentPosition	= 0;
		this._startPosition		= 0;
		
		this._selectingItem		= null;
		this._selectedItem		= null;
		
		this._dragging			= false;
		this._tracking			= false;
		this._firstTouch 		= null;
		this._currentTouch 		= null;
		this._lastTouch 		= null;
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
		this._initControler();
		this._initProperties();
	};
	
	wink.ui.layout.TabContainer.prototype =
	{	
		/**
		 * add a new tab to the tab container
		 * 
		 * @parameters:
		 * 	--> item: an object containing a contentNode (containing the tab content) and a title
		 */
		addTab: function(item)
		{
			if ( item.contentNode.id == '' )
			{
				item.contentNode.id = wink.getUId();
			}
			
			var index = this._tabsList.length;
			
			var tab = new wink.ui.layout.TabContainer.Tab({'contentNode': item.contentNode, 'title': item.title});
			
			tab.index =  index;
			
			this._moveableNode.appendChild(tab.getTabNode());
			this._domNode.appendChild(tab.getContentNode());
			
			this._tabsList.push(tab);
			this._tabsIdsList.push(item.contentNode.id);
	
			//wink.ux.touch.addListener(tab.getTabNode(), "start", { context: this, method: "_handleItemClick", arguments: item.contentNode.id }, { preventDefault: true });
			tab.getTabNode().onclick = wink.bind(this._handleItemClick, this, item.contentNode.id);
			
			if (this._timerResizer == null)
			{
				this._timerResizer = wink.setTimeout(this, '_updateSizes', 100);
			}
			
			return item.contentNode.id;
		},
		
		/**
		 * Remove a tab
		 * 
		 * @parameters
		 * 	--> id: the id of the tab to remove
		 */
		removeTab: function(id)
		{	
			var l = this._tabsList.length;
			
			if ( l == 1 )
			{
				return;
			}
			
			for ( var i=0; i<l; i++ )
			{
				if ( this._tabsList[i].id == id )
				{
					this._moveableAreaSize -= this._tabsList[i].itemSize;
					
					this._moveableNode.removeChild(this._tabsList[i].getTabNode());
					this._domNode.removeChild(this._tabsList[i].getContentNode());
					
					if ( this._tabsList[i] == this._selectedItem )
					{
						if ( i == 0 )
						{
							this._displayTab(this._tabsList[i+1]);
						} else
						{
							this._displayTab(this._tabsList[i-1]);
						}
					}
					
					//wink.ux.touch.removeListener(this._tabsList[i].getTabNode(), "start", { context: this, method: "_handleItemClick", arguments: id });
					this._tabsList[i].getTabNode().onclick = null;
					
					delete this._tabsList[i].getTabNode();
					delete this._tabsList[i].getContentNode();
					
					this._tabsList.splice(i, 1);
					this._tabsIdsList.splice(i, 1);
					
					if ( this._currentItem > this._tabsList.length-1 )
					{
						this._currentItem = this._tabsList.length-1;
					}
					
					if (this._timerResizer == null)
					{
						this._timerResizer = wink.setTimeout(this, '_updateSizes', 100);
					}
					
					this._goToLast();
					
					return;
				}
			}
		},
		
		/**
		 * Select a tab
		 * 
		 * @parameters
		 * 	--> id: the id of the tab to select
		 */
		selectTab: function(id)
		{	
			var l = this._tabsList.length;
			
			for ( var i=0; i<l; i++ )
			{
				if ( this._tabsList[i].id == id )
				{
					
					this._currentItem = i;
					var x = this._tabsList[i].position;
					this._translateTo(x, this._NEXT_DURATION);
					this._goToLast();
					this._displayTab(this._tabsList[i]);
					return;
				}
			}
		},
		
		/**
		 * returns the DOM node containing the tab container
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Display a tab
		 * 
		 * @parameters:
		 * 	--> item: the tab to display
		 */
		_displayTab: function(item)
		{
			if (this._selectedItem != null)
			{
				this._selectedItem.deactivate();
			}
			
			this._selectedItem = item;
			this._selectedItem.activate();
		},
		
		/**
		 * The user started touching the tabs area
		 * 
		 * @parameters:
		 * 	--> e: the touchstart event
		 */
		_handleTouchStart: function(e)
		{
			this._tracking = true;
			this._dragging = false;
			
			this._firstTouch = e;
			this._startPosition = this._currentPosition;
		},
	
		/**
		 * The user started is moving the tabs area
		 * 
		 * @parameters:
		 * 	--> e: the touchmove event
		 */
		_handleTouchMove: function(e) 
		{
			if (this._tracking == false)
			{
				return;
			}
	
			this._dragging = true;
			
			this._currentTouch = e;
			
			var dx = this._currentTouch.x - this._firstTouch.x;
			var x = this._startPosition - dx;
			
			this._translateTo(x, 0);
			this._isWhollyVisible(this._tabsList.length - 1);
		},
		
		/**
		 * The user stopped touching the tabs area
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleTouchEnd: function(e) {
			if (this._tracking == false)
			{
				return;
			}
			this._tracking = false;
			this._dragging = false;
			
			this._lastTouch = e;
			
			this._backToNearestItem();
			this._selectingItem = null;
		},
		
		/**
		 * The user started to touch the left arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleLeftArrowPressed: function(e)
		{
			wink.addClass(this._leftArrowNode, 'tc_pressed');
		},
		
		/**
		 * The user started to touch the right arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleRightArrowPressed: function(e)
		{
			wink.addClass(this._rightArrowNode, 'tc_pressed');
		},
	
		/**
		 * The user stopped touching the left arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleLeftArrowUnpressed: function(e)
		{
			wink.removeClass(this._leftArrowNode, 'tc_pressed');
		},
	
		/**
		 * The user stopped touching the right arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleRightArrowUnpressed: function(e)
		{
			wink.removeClass(this._rightArrowNode, 'tc_pressed');
		},
		
		/**
		 * The user started clicked on the left arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleLeftArrowClicked: function(e)
		{
			this._next();
		},
		
		/**
		 * The user started clicked on the right arrow
		 * 
		 * @parameters:
		 * 	--> e: the touchend event
		 */
		_handleRightArrowClicked: function(e)
		{
			this._previous();
		},
		
		/**
		 * translate the tab area
		 * 
		 * @parameters:
		 * 	--> x: the translation distance in pixels 
		 * 	--> duration: the duration of the translation
		 */
		_translateTo: function(x, duration)
		{
			wink.fx.applyTransformTransition(this._moveableNode, duration + "ms", "0ms", "default");
			this._currentPosition = x;
			this._moveableNode.translate(-this._currentPosition);
		},
		
		/**
		 * Mark the tab being currently selected
		 * 
		 * @parameters
		 *	--> e: the touchstart event
		 *	--> index: the index of the tab
		 */
		_handleItemClick: function(id)
		{
			var l = this._tabsList.length;
			for ( var i=0; i<l; i++ )
			{
				if ( this._tabsList[i].id == id )
				{
					this._selectingItem = this._tabsList[i];
					this._displayTab(this._selectingItem);
					wink.publish('/tabcontainer/events/tabselected', {'id': this._selectingItem.id});
					
					break;
				}
			}
		},
		
		/**
		 * Check if a tab is currently in the visible area
		 * 
		 * @parameters
		 *	--> index: the index of the tab
		 */
		_isWhollyVisible: function(index)
		{
			var start = this._tabsList[index].position;
			var end = start + this._tabsList[index].size;
			if (start >= this._currentPosition && end <= (this._currentPosition + this._visibleAreaSize))
			{
				return true;
			}
			
			return false;
		},
		
		/**
		 * Adjust the tabs area after a user slided it
		 */
		_backToNearestItem: function()
		{
			var nearestItem = this._getNearestItem();
			this._translateTo(nearestItem.position, this._NEAREST_DURATION);
			this._currentItem = nearestItem.index;
			this._goToLast();
		},
		
		/**
		 * Retrieve the closest tab from the current position
		 */
		_getNearestItem: function()
		{
			var nearestItemIndex = null;
			var dMin = Number.MAX_VALUE;
			
			for (var i = 0; i < this._tabsList.length; i++)
			{
				var dx = Math.abs(this._currentPosition - this._tabsList[i].position);
				if (dx <= dMin)
				{
					dMin = dx;
					nearestItemIndex = i;
				} else
				{
					break;
				}
			}
			return this._tabsList[nearestItemIndex];
		},
		
		/**
		 * Adjust the position of the tabs area by trying to go to the last item
		 */
		_goToLast: function()
		{
			if ((this._tabsList[this._tabsList.length-1].position + this._tabsList[this._tabsList.length-1].size) < this._visibleAreaSize)
			{
				this._goToFirst();
				return;
			}
			
			var lastVisible = this._isWhollyVisible(this._tabsList.length - 1);
			
			if (this._tabsList.length > 1 && lastVisible)
			{
				var lastItem = this._tabsList[this._tabsList.length - 1];
				var targetPos = lastItem.position + lastItem.size - this._visibleAreaSize;
				this._translateTo(targetPos, this._NEAREST_DURATION);
				this._currentItem = lastItem.index;
				return true;
			}
		},
		
		/**
		 * Go to the first tab
		 */
		_goToFirst: function()
		{
			this._translateTo(this._tabsList[0].position, this._NEAREST_DURATION);
		},
		
		/**
		 * Slide to the next tab
		 */
		_next: function()
		{
			if (this._currentItem >= this._tabsList.length - 1)
			{
				return;
			}
			this._currentItem++;
			var x = this._tabsList[this._currentItem].position;
			this._translateTo(x, this._NEXT_DURATION);
			this._goToLast();
		},
		
		/**
		 * Slide to the previous tab
		 */
		_previous: function()
		{
			if (this._currentItem == 0)
			{
				return;
			}
			var onLast = (this._currentItem == this._tabsList[this._tabsList.length - 1].index);
			
			if (onLast)
			{
				this._previousUntilNoLast();
				return;
			}
			
			this._currentItem--;
			var x = this._tabsList[this._currentItem].position;
			this._translateTo(x, this._NEXT_DURATION);
			this._goToLast();
		},
		
		/**
		 * Slide to the previous tab until the last is no more visible
		 */
		_previousUntilNoLast: function()
		{
			while (this._isWhollyVisible(this._tabsList.length - 1))
			{
				if (this._currentItem == 0)
				{
					return;
				}
				
				this._currentItem--;
				var x = this._tabsList[this._currentItem].position;
				this._translateTo(x, this._NEXT_DURATION);
				
				if ((this._tabsList[this._tabsList.length-1].position + this._tabsList[this._tabsList.length-1].size) < this._visibleAreaSize)
				{
					return;
				}
			}
		},
		
		/**
		 * Update the tabs area and visible area sizes
		 */
		_updateSizes: function()
		{
			if (this._timerResizer != null)
			{
				clearTimeout(this._timerResizer);
				this._timerResizer = null;
			}
			
			this._moveableAreaSize = 0;
			this._visibleAreaSize = this._tabsNode.offsetWidth - (this._leftArrowNode.offsetWidth + this._rightArrowNode.offsetWidth);
			
			for (var i = 0; i < this._tabsList.length; i++)
			{
				this._tabsList[i].updateMaxWidth(this._visibleAreaSize-60);
				this._tabsList[i].size = this._tabsList[i].getTabNode().offsetWidth;
				this._tabsList[i].position = this._moveableAreaSize;
				
				this._moveableAreaSize += this._tabsList[i].size;
			}
			
			this._moveableNode.style.width = this._moveableAreaSize + "px";
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( wink.isUndefined(this.tabs) )
			{
				wink.log('[TabContainer] tabs parameter must be set');
				return false;
			}
			
			if ( !wink.isInteger(this.firstSelectedTab) )
			{
				wink.log('[TabContainer] firstSelectedTab must be an integer');
				return false;
			}
			
			if ( (this.displayArrows != 0) && (this.displayArrows != 1))
			{
				wink.log('[TabContainer] the displayArrows parameter must be either 0 or 1');
				return false;
			}
				
			var l = this.tabs.length;
			
			for ( var i=0; i<l; i++)
			{
				if ( $(this.tabs[i]) == this.tabs[i])
				{
					wink.log('[TabContainer] all the parameters should be dom nodes ids');
					return false;
				}
			}
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			var l = this.tabs.length;
			
			for ( var i=0; i<l; i++)
			{
				var title = $(this.tabs[i]).getElementsByClassName('tc_title')[0];
				
				if ( wink.isUndefined(title) )
				{
					title = 'no title';
				} else
				{
					$(this.tabs[i]).removeChild(title);
					title = title.innerHTML;
				}
				
				this.addTab({'contentNode': $(this.tabs[i]), 'title': title});
			}
			
			wink.setTimeout(this, 'selectTab', 100, this.tabs[this.firstSelectedTab]);
		},
		
		/**
		 * Initialize the listeners
		 */
		_initControler: function() 
		{
			wink.ux.touch.addListener(this._leftArrowNode, "start", { context: this, method: "_handleLeftArrowPressed", arguments: null }, { preventDefault: false });
			wink.ux.touch.addListener(this._rightArrowNode, "start", { context: this, method: "_handleRightArrowPressed", arguments: null }, { preventDefault: false });
			wink.ux.touch.addListener(this._moveableNode, "start", { context: this, method: "_handleTouchStart", arguments: null }, { preventDefault: false });
			
			wink.ux.touch.addListener(this._moveableNode, "move", { context: this, method: "_handleTouchMove", arguments: null }, { preventDefault: false });
			
			wink.ux.touch.addListener(this._leftArrowNode, "end", { context: this, method: "_handleLeftArrowUnpressed", arguments: null }, { preventDefault: false });
			wink.ux.touch.addListener(this._rightArrowNode, "end", { context: this, method: "_handleRightArrowUnpressed", arguments: null }, { preventDefault: false });
			wink.ux.touch.addListener(this._moveableNode, "end", { context: this, method: "_handleTouchEnd", arguments: null }, { preventDefault: false });
			
			this._rightArrowNode.onclick = wink.bind(this._handleRightArrowClicked, this);
			this._leftArrowNode.onclick = wink.bind(this._handleLeftArrowClicked, this);
			
			window.addEventListener("orientationchange", wink.bind(function(){this._updateSizes(); this._goToLast();}, this), false);
		},
		
		/**
		 * Initialize the tab container node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'w_box w_border_bottom';
			
			this._tabsNode = document.createElement('div');
			
			this._itemsNode	= document.createElement('div');
			this._moveableNode = document.createElement('div');
			this._leftArrowNode	= document.createElement('div');
			this._leftArrow	= document.createElement('div');
			this._rightArrowNode = document.createElement('div');
			this._rightArrow = document.createElement('div');
			
			if ( this.displayArrows == 0 )
			{
				this._leftArrowNode.style.display = 'none';
				this._rightArrowNode.style.display = 'none';
				this._itemsNode.style.left = '0px';
			}
	
			this._leftArrowNode.appendChild(this._leftArrow);
			this._rightArrowNode.appendChild(this._rightArrow);
			
			this._itemsNode.appendChild(this._moveableNode);
			this._tabsNode.appendChild(this._leftArrowNode);
			this._tabsNode.appendChild(this._itemsNode);
			this._tabsNode.appendChild(this._rightArrowNode);
	
			this._domNode.appendChild(this._tabsNode);
	
			
			wink.addClass(this._tabsNode, 'w_tabs w_border_bottom');
			wink.addClass(this._itemsNode, 'tc_tabs_items');
			wink.addClass(this._moveableNode, 'tc_tabs_moveable');
			wink.addClass(this._leftArrowNode, 'tc_arrow w_bg_dark');
			wink.addClass(this._leftArrow, 'w_icon w_button_previous');
			wink.addClass(this._rightArrowNode, 'tc_arrow tc_right w_bg_dark');
			wink.addClass(this._rightArrow, 'w_icon w_button_next');
			
			wink.fx.applyTransformTransition(this._moveableNode, "0ms", "0ms", "ease-out");
		}
	};
	
	
	/**
	 * Implement a tab to be added to the tab container
	 * 
	 * @methods:
	 *	--> getContentNode: returns the DOM node containing the content of the tab
	 *	--> getTabNode: returns the DOM node containing the tab
	 *	--> activate: activate the tab
	 * 	--> deactivate: deactivate the tab
	 * 	--> updateMaxWidth: Update the maximum width of the tab
	 *
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> id: the dom node id of the tab
	 * 	--> index: the position of tab in the list of tabs
	 * 	--> size: size in pixels of the tab
	 * 	--> position: position in pixels of the tab inside the tabsNode
	 * 
	 * @properties:
	 * 	data =
	 *  {
	 *  	contentNode = a DOM node corresponding to the tab content
	 *  	title = the title of the tab 
	 *  }
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ui.layout.TabContainer.Tab = function(properties)
	{
		this.uId          = wink.getUId();
		this.id           = null;
		
		this.index        = 0;
		this.size         = 0;
		this.position     = 0;
		
		this._title       = properties.title;
		
		this._contentNode = properties.contentNode;
		this._tabNode     = null;
		
		this._initProperties();
		this._initDom();
	};
	
	wink.ui.layout.TabContainer.Tab.prototype =
	{
		/**
		 * returns the DOM node containing the content of the tab
		 */
		getContentNode: function()
		{
			return this._contentNode;
		},
		
		/**
		 * returns the DOM node containing the tab
		 */
		getTabNode: function()
		{
			return this._tabNode;
		},
		
		/**
		 * activate the tab
		 */
		activate: function()
		{
			wink.removeClass(this._tabNode, 'w_bg_light');
			
			wink.addClass(this._tabNode, 'w_bg_dark');
			wink.addClass(this._tabNode, 'tc_on');
			wink.addClass(this._contentNode, 'tc_on');
		},
		
		/**
		 * deactivate the tab
		 */
		deactivate: function()
		{
			wink.removeClass(this._contentNode, 'tc_on');
			wink.removeClass(this._tabNode, 'tc_on');
			wink.removeClass(this._tabNode, 'w_bg_dark');
			
			wink.addClass(this._tabNode, 'w_bg_light');
		},
		
		/**
		 * Update the maximum width of the tab
		 * 
		 * @parameters
		 * 	--> width: the maximum width in pixels
		 */
		updateMaxWidth: function(width)
		{
			this._tabNode.style.maxWidth = width + 'px';
		},
		
		/**
		 * Initialize the tab node
		 */
		_initDom: function()
		{
			this._tabNode = document.createElement('div');
			this._tabNode.innerHTML = this._title;
			
			wink.addClass(this._contentNode, 'w_bloc tc_bloc');
			wink.addClass(this._tabNode, 'w_tab w_border w_radius_top_left w_radius_top_right w_bg_light');
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			this.id = this._contentNode.id;
		}
	};
	
	return wink.ui.layout.TabContainer;
});