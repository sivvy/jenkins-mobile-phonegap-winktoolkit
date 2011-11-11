/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a carousel
 * 
 * @methods:
 * 	--> getDomNode: return the dom node containing the Carousel
 * 	--> goToItem: go the the specified item in the Carousel
 * 	--> refreshContainerWidth: refresh container width with the specified value 
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> itemsWidth: the width of the items of the Carousel
 * 	--> itemsHeight: the height of the items of the Carousel
 * 	--> display: either vertical or horizontal
 * 	--> displayDots: whether or not to display the position indicators
 * 	--> autoAdjust: should the Carousel auto-adjust items position after each movement
 * 	--> autoAdjustDuration: the transition duration for the auto adjust slide
 * 	--> autoPlay: does the Carousel automatically starts sliding
 * 	--> autoPlayDuration: The time interval between two autoplays
 * 	--> firstItemIndex: the item to be displayed in the center of the page at startup
 * 	--> containerWidth: the width of the div containing the carousel
 * 	--> itemsAlign: the alignment of the first item of the carousel
 * 	--> items: the list of carousel items to create
 * 	--> touchPropagation: indicates whether the touch event on the Carousel must be propagated
 * 
 * @events:
 * 	--> /carousel/events/switch: the event is fired when we swith items (return the current item index and the carouselId)
 * 
 * @properties:
 * 	data =
 * 	{
 * 		itemsWidth = the width of the items of the Carousel (DEFAULT: 250)
 * 		itemsHeight = the height of the items of the Carousel (DEFAULT: 100)
 * 		display = either vertical or horizontal (DEFAULT: "horizontal")
 * 		displayDots = whether or not to display the position indicators (DEFAULT: 1)
 * 		autoAdjust = should the Carousel auto-adjust items position after each movement (DEFAULT: 1)
 * 		autoAdjustDuration = the transition duration for the auto adjust slide (DEFAULT: 800ms)
 * 		autoPlay = does the Carousel automatically starts sliding (DEFAULT: 0)
 * 		autoPlayDuration = The time interval between two autoplays (DEFAULT: 800)
 * 		firstItemIndex = the item to be displayed in the center of the page at startup (DEFAULT: 1)
 * 		containerWidth = the width of the div containing the carousel (DEFAULT: window.innerWidth) 
 * 		itemsAlign = the alignment of the first item of the carousel (VALUES:"left", "center", DEFAULT: "center")
 * 		items =
 * 		{
 * 			type = type of the content (can be a DOM node or a string)
 * 			content = the content of the item
 * 		}
 * 		touchPropagation = indicates whether the touch event on the Carousel must be propagated
 * 	}
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */
define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.Carousel = function(properties)
	{
		this.uId                = wink.getUId();
		
		this.items              = [];
		
		this.firstItemIndex     = 1;
		
		this.itemsWidth         = 250;
		this.itemsHeight        = 100;
		
		this.display            = this._HORIZONTAL_POSITION;
		
		this.containerWidth     = window.innerWidth;
		this.containerHeight    = null;
		
		this.displayDots        = 1;
		this.autoAdjust         = 1;
		this.autoAdjustDuration = 800;
		this.autoPlay           = 0;
		this.autoPlayDuration   = 3000;
		this.itemsAlign         = this._CENTER_POSITION;
		this.touchPropagation	= true;
		
		this._currentItemIndex  = 0;
		
		this._containerWidthSet = 0;
	
		this._beginXY           = 0;
		this._currentXY         = 0;
		
		this._position          = 0;
		
		this._iD                = 0;
		this._cD                = 0;
		
		this._minXY             = 0;
		this._maxXY             = 0;
		
		this._autoPlayInterval  = null;
		this._autoPlayDirection = 1;
		
		this._startEvent        = null;
		this._endEvent          = null;
		
		this._itemsList         = [];
		this._dotsList          = [];
		
		this._domNode           = null;
		this._headerNode        = null;
		this._itemsNode         = null;
		this._dotsNode          = null;
		this._footerNode        = null;
	
		wink.mixin(this, properties);
		
		if ( this._validateProperties() ===  false )return;
		if ( wink.isSet(properties.containerWidth) )this._containerWidthSet = 1;
		
		this._initProperties();
		this._initDom();
		this._positionItems();
		this._initListeners();
	};
	
	wink.ui.xy.Carousel.prototype =
	{
		_LEFT_POSITION: 'left',
		_CENTER_POSITION: 'center',
		_VERTICAL_POSITION: 'vertical',
		_HORIZONTAL_POSITION: 'horizontal',
	
		/**
		 * return the dom node containing the Carousel
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Cleans the dom of the Carousel content nodes. To invoke only if Carousel no longer used.
		 */
		clean: function()
		{
			for (var i = 0; i < this._itemsList.length; i++) {
				this._itemsList[i].getDomNode().innerHTML = '';
			}
			this._domNode.innerHTML = '';
		},
		
		/**
		 * display the selected item
		 * 
		 * @parameters:
		 * 	--> index: the index of the item we want to move to
		 */
		goToItem: function(index)
		{
			var l = this._itemsList.length;
			
			for ( var i=0; i<l; i++)
			{
				if(this.itemsAlign == this._CENTER_POSITION)
				{
					this._itemsList[i].position = ((i-index)*this._iD + (this._cD-this._iD)/2);
				} else
				{
					this._itemsList[i].position = (i-index)*this._iD;
				}
			}
			
			this.position = (this.firstItemIndex-index)*this._iD;
			
			wink.fx.apply(this._itemsNode, {
				"transition-duration": this.autoAdjustDuration + 'ms',
				"transition-timing-function": 'ease-out'
			});
			
			this._currentXY = (this.firstItemIndex-index)*this._iD;
			
			if ( this.display == this._HORIZONTAL_POSITION )
			{
				this._itemsNode.translate((this.firstItemIndex-index)*this._iD, 0);
			} else
			{
				this._itemsNode.translate(0, (this.firstItemIndex-index)*this._iD);
			}
				
			this._currentItemIndex = index;
			
			this._selectItem(this._currentItemIndex);
			
			wink.publish('/carousel/events/switch', {'carouselId': this.uId, 'currentItemIndex': this._currentItemIndex});
		},
		
		/**
		 * Refresh containerWidth, set container width, refresh min and max values
		 * 
		 * @parameters:
		 * 	--> containerWidth: The width of the carousel's container
		 */
		refreshContainerWidth: function(containerWidth)
		{	
			this._setContainerWidth(containerWidth);
			this._setMinMaxValues();
		},
		
		/**
		 * add a new item in the Carousel
		 * 
		 * @parameters:
		 * 	--> type: the type of the content ("node" or "string")
		 * 	--> content: the content of the item
		 * 	--> index: the position of the item in the carousel
		 */
		_addItem: function(type, content, index)
		{
			var node, item;
			
			if ( type == 'node' )
			{
				node = content;
			} else
			{
				node = document.createElement('div');
				node.innerHTML = content;
			}
			
			item = new wink.ui.xy.Carousel.Item({'width': this.itemsWidth, 'height': this.itemsHeight, 'node': node, 'index': (index-this.firstItemIndex)});
		
			this._itemsList.push(item);
		},
		
		/**
		 * Listen to the start events
		 *
		 * @parameters
		 * 	--> event: the wink.ux.Event
		 */
		_touchStart: function(event)
		{
			this._startEvent = event;
			
			if (this.display == this._HORIZONTAL_POSITION)
			{
				var _c = event.x;
			} else
			{
				var _c = event.y;
			}
			
			if (this.touchPropagation == false)
			{
				this._startEvent.stopPropagation();
			}
			
			if ( this._autoPlayInterval != null )
			{
				clearInterval(this._autoPlayInterval);
				this._autoPlayInterval = null;
			}
			
			this._beginXY = _c;
			
			wink.fx.apply(this._itemsNode, {
				"transition-duration": '',
				"transition-timing-function": ''
			});
		},
		
		/**
		 * Listen to the move events
		 *
		 * @parameters
		 * 	--> event: the wink.ux.Event
		 */
		_touchMove: function(event)
		{
			if (this.display == this._HORIZONTAL_POSITION)
			{
				var _c = event.x;
			} else
			{
				var _c = event.y;
			}
			
			// If the auto adjust parameter is not set, stop the movement at both ends of the carousel
			if ( (this.autoAdjust == 0) && (((this._currentXY + _c - this._beginXY) > this._minXY) || ((this._currentXY + _c - this._beginXY)< this._maxXY )))
			{
				return;
			}
			
			// Update items positions
			var l = this._itemsList.length;
			
			for ( var i=0; i<l; i++)
			{
				this._itemsList[i].position = (this._itemsList[i].beginXY + _c - this._beginXY);
			}
			
			// Update carousel position
			this.position = this._currentXY + _c - this._beginXY;
			
			if ( this.display == this._HORIZONTAL_POSITION )
			{
				this._itemsNode.translate(this.position, 0);
			} else
			{
				this._itemsNode.translate(0, this.position);
			}
		},
		
		/**
		 * Listen to the end events
		 *
		 * @parameters
		 * 	--> event: the wink.ux.Event
		 */
		_touchEnd: function(event)
		{
			this._endEvent = event;
			
			if (this.display == this._HORIZONTAL_POSITION)
			{
				var _sc = this._startEvent.x;
				var _ec = this._endEvent.x;
			} else
			{
				var _sc = this._startEvent.y;
				var _ec = this._endEvent.y;
			}
			
			// Check if a click event must be generated
			if ( ((this._endEvent.timestamp-this._startEvent.timestamp) < 250) && (Math.abs(_ec - _sc) < 20))
			{
				this._endEvent.dispatch(this._endEvent.target, 'click');
				return;
			}
			
			// Update items positions
			var l = this._itemsList.length;
			
			for ( var i=0; i<l; i++)
			{
				this._itemsList[i].beginXY = this._itemsList[i].position;
			}
			
			// Check which item to set as the currentItem
			var min = (this.itemsAlign == this._CENTER_POSITION)?Math.abs(this._itemsList[0].beginXY-((this._cD-this._iD)/2)):Math.abs(this._itemsList[0].beginXY);
			var minItem = 0;
			
			for ( var i=0; i<l; i++)
			{
				// If we are at the left end of the carousel, even a tiny right-to-left movement will cause the carousel to slide
				if ( this._currentItemIndex == 0 )
				{
					if ( _ec - _sc < 0 )
					{
						if ( this._itemsList.length == 1 )
						{
							minItem = 0;
						} else
						{
							minItem = 1;
						}
						break;
					} 
				}
				
				var condition = (this.itemsAlign == this._CENTER_POSITION)?Math.abs(this._itemsList[i].beginXY-((this._cD-this._iD)/2)):Math.abs(this._itemsList[i].beginXY);
				if (condition < min)
				{
					// a tiny left-to-right or right-to-left movement will cause the carousel to slide
					if ( i != this._currentItemIndex )
					{
						min = (this.itemsAlign == this._CENTER_POSITION)?Math.abs(this._itemsList[i].beginXY-((this._cD-this._iD)/2)):Math.abs(this._itemsList[i].beginXY);
						minItem = i;
					} else
					{
						// If we are at the right end of the carousel, even a tiny left-to-right movement will cause the carousel to slide
						if ( this._currentItemIndex == (l-1) )
						{
							if (_ec - _sc < 0)
							{
								minItem = i;
								break;
							}
						}
					}
				}
			}
			
			this._currentItemIndex = minItem;
			
			// Update the 'dots' indicator
			this._selectItem(this._currentItemIndex);
			
			// Fire the '/carousel/events/switch' event
			wink.publish('/carousel/events/switch', {'carouselId': this.uId, 'currentItemIndex': this._currentItemIndex});
			
			// If the autoAdjust parameter is set, move the items with a transition movement, elese don't
			if ( this.autoAdjust == 1)
			{
				wink.fx.apply(this._itemsNode, {
					"transition-duration": this.autoAdjustDuration + 'ms',
					"transition-timing-function": 'ease-out'
				});
				
				this._currentXY = (this.firstItemIndex-minItem)*this._iD;
				
				if ( this.display == this._HORIZONTAL_POSITION )
				{
					this._itemsNode.translate((this.firstItemIndex-minItem)*this._iD, 0);
				} else
				{
					this._itemsNode.translate(0, (this.firstItemIndex-minItem)*this._iD);
				}
			} else
			{
				if(!wink.isUndefined(this.position))
				{
					this._currentXY = this.position;
				}
			}
		},
		
		/**
		 * Display the selected 'dot'
		 * 
		 * @parameters:
		 * 	--> index: the index of the item in the list
		 */
		_selectItem: function(index)
		{
			var l = this._itemsList.length;
			
			for ( var i=0; i<l; i++)
			{
				this._itemsList[i].beginXY = (this.itemsAlign == this._CENTER_POSITION)?(i-index)*this._iD + (this._cD-this._iD)/2:(i-index)*this._iD;
				
				if ( i == index )
				{
					wink.addClass(this._dotsList[i], 'ca_selected');
				} else
				{
					wink.removeClass(this._dotsList[i], 'ca_selected');
				}
			}
		},
		
		/**
		 * Set the position of all the items at startup
		 */
		_positionItems: function()
		{
			var l = this._itemsList.length;
			
			for ( var i=0; i<l; i++)
			{
				this._itemsList[i].position = (this.itemsAlign == this._CENTER_POSITION)?(this._itemsList[i].index*this._iD + (this._cD-this._iD)/2):(this._itemsList[i].index*this._iD);
				this._itemsList[i].beginXY = this._itemsList[i].position;
				
				if ( this.display == this._HORIZONTAL_POSITION )
				{
					this._itemsList[i].getDomNode().translate(this._itemsList[i].position, 0);
				} else
				{
					this._itemsList[i].getDomNode().translate((this.itemsAlign == this._CENTER_POSITION)?((this.containerWidth - this.itemsWidth)/2):0, this._itemsList[i].position);
				}
			}
		},
		
		/**
		 * Update the items' positions when the orientation changes
		 */
		_updateItemsPosition: function()
		{
			if ( this._containerWidthSet == 0 )
			{
				this.containerWidth = window.innerWidth;
				
				if ( this.display == this._HORIZONTAL_POSITION )
				{
					this._cD = window.innerWidth;
				}
	
				var l = this._itemsList.length;
				
				for ( var i=0; i<l; i++)
				{
					if(this.itemsAlign == this._CENTER_POSITION)
					{
						if ( this.display == this._HORIZONTAL_POSITION )
						{
							this._itemsList[i].getDomNode().translate((this._itemsList[i].index*this._iD + (this._cD-this._iD)/2), 0);
						} else
						{
							this._itemsList[i].getDomNode().translate((this.containerWidth - this.itemsWidth)/2, (this._itemsList[i].index*this._iD + (this._cD-this._iD)/2));
						}
					} else
					{
						if ( this.display == this._HORIZONTAL_POSITION )
						{
							this._itemsList[i].getDomNode().translate(this._itemsList[i].index*this._iD, 0);
						} else
						{
							this._itemsList[i].getDomNode().translate(0, this._itemsList[i].index*this._iD);
						}
					} 
				}
			}
		},
		
		/**
		 * Slide the carousel automatically
		 */
		_startAutoPlay: function()
		{
			if ( this._currentItemIndex >= (this._itemsList.length-1) )
				this._autoPlayDirection = -1;
			
			if ( this._currentItemIndex <= 0 )
				this._autoPlayDirection = 1;
			
			
			if ( this._autoPlayDirection == 1 )
			{
				this.goToItem(this._currentItemIndex+1);
			} else
			{
				this.goToItem(this._currentItemIndex-1);
			}
		},
		
		/**
		 * Initialize the 'touch' and orientation change listeners
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(this._itemsNode, "start", { context: this, method: "_touchStart", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._itemsNode, "move", { context: this, method: "_touchMove", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(this._itemsNode, "end", { context: this, method: "_touchEnd", arguments: null }, { preventDefault: true });
			
			window.addEventListener("orientationchange", wink.bind(function(){this._updateItemsPosition();}, this), false);
		},
		
		/**
		 * Initialize the Carousel DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			
			if ( this.display == this._HORIZONTAL_POSITION )
			{
				this._domNode.className = 'ca_container';
			} else
			{
				this._domNode.className = 'ca_container ca_vertical';
			}
			
			this._headerNode = document.createElement('div');
			this._headerNode.className = 'ca_header';
			
			this._itemsNode = document.createElement('div');
			this._itemsNode.className = 'ca_items';
			this._itemsNode.style.height = this.itemsHeight + 'px';
			
			this._dotsNode = document.createElement('div');
			this._dotsNode.className = 'ca_dots';
			
			this._footerNode = document.createElement('div');
			this._footerNode.className = 'ca_footer';
			
			var l = this._itemsList.length;
		
			for ( var i=0; i<l; i++)
			{
				var dot = document.createElement('img');
				dot.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
				
				if ( i == this.firstItemIndex )
				{
					dot.className = 'ca_dot ca_selected';
				} else
				{
					dot.className = 'ca_dot';
				}
				
				if ( i == (l-1) )
				{
					dot.style.clear = 'both';
				}
				
				this._dotsList.push(dot);
				this._dotsNode.appendChild(dot);
				
				this._itemsNode.appendChild(this._itemsList[i].getDomNode());
			}
			
			if ( this.displayDots == 0 )
			{
				this._dotsNode.style.display = 'none';
			}
			
			this._setMinMaxValues();
			
			this._domNode.appendChild(this._headerNode);
			this._domNode.appendChild(this._itemsNode);
			this._domNode.appendChild(this._dotsNode);
			this._domNode.appendChild(this._footerNode);
			
			if ( this.autoPlay == 1 )
			{
				this._autoPlayInterval = wink.setInterval(this, '_startAutoPlay', this.autoPlayDuration);
			}
		},
	  
		/**
		 * Set containerWidth, refresh min and max values and
		 * 
		 * @parameters:
		 * 	--> containerWidth: the width of the container
		 */
		_setContainerWidth: function(containerWidth)
		{	
			// Check container width
			if (!wink.isUndefined(containerWidth))
			{
				if ( !wink.isInteger(containerWidth) || containerWidth < 0 )
				{
					wink.log('[Carousel] The property containerWidth must be a positive integer');
					return false;
				}
				
				this.containerWidth = containerWidth;
				
				if ( this.display == this._HORIZONTAL_POSITION )
				{
					this._cD = containerWidth;
				}
			}	
		},
		
		/**
		 * Set containerWidth, refresh min and max values and 
		 */
		_setMinMaxValues: function()
		{	
			if (this.autoAdjust == 0)
			{ 
				if(this.itemsAlign == this._CENTER_POSITION)
				{                  
					this._minXY = ((this.firstItemIndex)*this._iD)-((this._cD-this._iD)/2);
				} else
				{
					this._minXY = ((this.firstItemIndex)*this._iD);
				}
				
				if(this.itemsAlign == this._CENTER_POSITION)
				{
					this._maxXY = ((this.firstItemIndex-this._itemsList.length)*this._iD)+((this._cD+this._iD)/2);
				} else
				{
					this._maxXY = ((this.firstItemIndex-this._itemsList.length)*this._iD)+this._cD;	
				}
			}
		},
		
		/**
		 * Validate the Carousel properties
		 */
		_validateProperties: function()
		{
			// Check Items width
			if ( !wink.isInteger(this.itemsWidth) || this.itemsWidth < 0 )
			{
				wink.log('[Carousel] The property itemsWidth must be a positive integer');
				return false;
			}
			
			// Check Items height
			
			if ( !wink.isInteger(this.itemsHeight) || this.itemsHeight < 0 )
			{
				wink.log('[Carousel] The property itemsHeight must be a positive integer');
				return false;
			}
			
			// Check the firstItem parameter
			if ( !wink.isInteger(this.firstItemIndex) || this.firstItemIndex < 0 )
			{
				wink.log('[Carousel] The property firstItemIndex must be a positive integer');
				return false;
			}
			
			// Check the dots parameter
			if ( !wink.isInteger(this.displayDots) || (this.displayDots != 0 && this.displayDots != 1) )
			{
				wink.log('[Carousel] The property displayDots must be either 0 or 1');
				return false;
			}
			
			// Check the auto adjust parameter
			if ( !wink.isInteger(this.autoAdjust) || (this.autoAdjust != 0 && this.autoAdjust != 1) )
			{
				wink.log('[Carousel] The property autoAdjust must be either 0 or 1');
				return false;
			}
			
			// Not displaying the dots if the auto-adjust parameter is not set to 1
			if ( this.autoAdjust == 0 )
			{
				this.displayDots = 0;
			}
			
			// Check the auto adjust duration parameter
			if ( !wink.isInteger(this.autoAdjustDuration))
			{
				wink.log('[Carousel] The property autoAdjustDuration must be an integer');
				return false;
			}
			
			// Check the auto play parameter
			if ( !wink.isInteger(this.autoPlay) || (this.autoPlay != 0 && this.autoPlay != 1) )
			{
				wink.log('[Carousel] The property autoPlay must be either 0 or 1');
				return false;
			}
			
			// Check the auto play duration parameter
			if ( !wink.isInteger(this.autoPlayDuration) )
			{
				wink.log('[Carousel] The property autoPlayDuration must be an integer');
				return false;
			}
			
			// Check items list
			if ( !wink.isArray(this.items))
			{
				wink.log('[Carousel] The items must be contained in an array');
				return false;
			}
			
			// Check propagation
			if ( !wink.isBoolean(this.touchPropagation))
			{
				this.touchPropagation = false;
			}
			
			// Check container width
			if ( !wink.isUndefined(this.containerWidth))
			{
				this._setContainerWidth(this.containerWidth);
			}
			
			// Check items alignement
			if ( !wink.isString(this.itemsAlign) || (this.itemsAlign != this._CENTER_POSITION && this.itemsAlign != this._LEFT_POSITION))
			{
				wink.log('[Carousel] The property itemsAlign must be a positive integer');
				return false;
			}
		},
		
		/**
		 * Initialize the Carousel properties
		 */
		_initProperties: function()
		{
			var l = this.items.length;
			
			for ( var i=0; i<l; i++)
			{
				this._addItem(this.items[i].type, this.items[i].content, i);
			}
			
			this._currentItemIndex = this.firstItemIndex;
			
			this.containerHeight = this.itemsHeight;
			
			if ( this.display == this._HORIZONTAL_POSITION )
			{
				this._iD = this.itemsWidth;
				this._cD = this.containerWidth;
			} else
			{
				this._iD = this.itemsHeight;
				this._cD = this.containerHeight;
			}
		}
	};
	
	/**
	 * Implements a carousel item
	 * 
	 * @methods:
	 * 	--> getDomNode: return the dom node containing the item
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> width: The width of the item
	 * 	--> height: The height of the item
	 * 	--> position: The current position in pixels of the item in the Carousel
	 * 	--> beginXY: The start position in pixels of the item in the Carousel
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		index = the initial position of the item in the Carousel
	 * 		height = the height of the item
	 * 		width = the width of the item
	 * 		node = the DOM node containing the item
	 * 	}
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 * 
	 */
	wink.ui.xy.Carousel.Item = function(properties)
	{
		this.uId      = wink.getUId();
		
		this.index    = properties.index;
		
		this.width    = properties.width;
		this.height   = properties.height;
		
		this.beginXY   = 0;
		this.position = 0;
		
		this._domNode = properties.node;
		
		this._initDom();
	};
	
	wink.ui.xy.Carousel.Item.prototype =
	{
		/**
		 * return the dom node containing the item
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Initialize the Carousel DOM nodes
		 */
		_initDom: function()
		{
			wink.addClass(this._domNode, 'ca_item');
			
			wink.fx.apply(this._domNode, {
				width: this.width + 'px',
				height: this.height + 'px'
			});
		}
	};
	
	return wink.ui.xy.Carousel;
});