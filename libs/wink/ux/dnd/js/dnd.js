/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a drag and drop management system. It will handle sources and targets
 * 
 * @methods:
 * 	--> addSource: add a new source to the dnd object
 * 	--> addTarget: add a new target to the dnd object
 * 	--> updateTargets: update the targets positions
 * 	--> clean: reset the dnd object
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> zone: the drag zone where to listen to touch events
 * 
 * @properties:
 * 	data =
 * 	{
 * 		zone = the drag zone where to listen to touch events (default is document)
 * 	}
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_amd/core'], function(wink)
{
	wink.ux.Dnd = function(properties)
	{
		this.uId            = wink.getUId();
		
		this.zone           = null;
		
		this._targets       = [];
		this._sources       = [];
		
		this._multitouch    = 0;
		
		this._startEvent    = null;
		this._endEvent      = null;
		
		this._currentSource = null;
		this._currentTarget = null;
		this._currentAvatar = null;
		
		this._lastX         = 0;
		this._lastY         = 0;
		
		wink.mixin(this, properties);
		
		this._initListeners();
	};
	
	wink.ux.Dnd.prototype =
	{
		/**
		 * add a new Source to the Dnd
		 * 
		 * @parameters:
		 * 	--> source: a new Source
		 */
		addSource: function(source)
		{
			this._sources[this._sources.length] = 
			{
				source: source
			};
		},
		
		/**
		 * add a new Target to the Dnd
		 * 
		 * @parameters:
		 * 	--> target: a new Target
		 */
		addTarget: function(target)
		{
			target.dnd = this;
			
			var x1 = $(target.id).offsetLeft;
			var y1 = $(target.id).offsetTop;
			var x2 = x1 + $(target.id).clientWidth;
			var y2 = y1 + $(target.id).clientHeight;
			
			this._targets[this._targets.length] = 
			{
				target: target, 
				X1: x1, 
				Y1: y1, 
				X2: x2, 
				Y2: y2
			};
		},
		
		/**
		 * Update the targets positions
		 */
		updateTargets: function()
		{
			var l = this._targets.length;
			
			for (var i = 0; i<l; i++) 
			{
				if ( $(this._targets[i].target.id))
				{
					var t = $(this._targets[i].target.id);
					
					var x1 = t.offsetLeft;
					var y1 = t.offsetTop;
					var x2 = x1 + t.clientWidth;
					var y2 = y1 + t.clientHeight;
					
					this._targets[i].X1 = x1;
					this._targets[i].X2 = x2;
					this._targets[i].Y1 = y1;
					this._targets[i].Y2 = y2;
				}
			}
		},
		
		/**
		 * Reset the Dnd
		 */
		clean: function()
		{
			this._targets = [];
			this._sources = [];
		},
		
		/**
		 * Starts dragging a new avatar if the user touched a d&d capable object
		 * 
		 * @parameters:
		 * 	--> event: the event corresponding to the mouse/finger
		 */
		_startDrag: function(event)
		{		
			if ( event.multitouch )
			{
				this._multitouch++;
				return;
			}
			
			this._startEvent = event;
			
			if (event.target.className && event.target.className.search(/dnd_movable/i) > -1)
			{
				// See if the element being dragged is a registered source
				this._currentSource = this._getSource(event.target.id);
		        
				if (this._currentSource !== null)
				{
					this._currentSource.activate();
		
					this._currentAvatar = 
					{
		                target: this._currentSource.getAvatar(),
						beginX: event.x,
		                beginY: event.y,
		                pozX: event.target.pozXinit,
		                pozY: event.target.pozYinit
		            };
					
					document.body.appendChild(this._currentAvatar.target);
				}
				
		    }
		},
		
		/**
		 * Drags a source around
		 * 
		 * @parameters:
		 * 	--> event: the event corresponding to the mouse/finger
		 */
		_drag: function(event)
		{
			if ( this._multitouch > 0 )
			{
				return;
			}
			
			if (this._currentAvatar !== null)
			{
				this._currentAvatar.target.pozXinit = this._currentAvatar.pozX + event.x - this._currentAvatar.beginX;	
				this._currentAvatar.target.pozYinit = this._currentAvatar.pozY + event.y - this._currentAvatar.beginY;	
				
				this._currentAvatar.target.translate(this._currentAvatar.target.pozXinit, this._currentAvatar.target.pozYinit);
				
				// check if we are over a drop target
				this._currentTarget = this._getTarget(event.x, event.y);
				
				if ( this._currentTarget !== null )
				{
					for ( var i=0; i<this._currentSource._events.length; i++)
					{
						if ( this._currentSource._events[i].event == this._currentTarget._event )
						{
							// make the drop target react
							this._currentTarget.onSourceOver(this._currentSource);
						}
					}
				} 
				
				// Save the current position
				this.lastX = event.x;
				this.lastY = event.y;
		
				// Vertical scroll
				if ( event.y >= ( (window.innerHeight + window.scrollY)-60 ) )
				{
					scrollTo(window.scrollX, window.scrollY + 5);
				} else if ( (event.y <= (window.scrollY + 60)) && window.scrollY > 0 )
				{
					scrollTo(window.scrollX, window.scrollY - 5);
				}
				
				// Horizontal scroll
				if ( event.x >= ( (window.innerWidth + window.scrollX)-40 ) )
				{
					scrollTo(window.scrollX + 5, window.scrollY);
				} else if ( (event.x <= (window.scrollX + 40)) && window.scrollX > 0 )
				{
					scrollTo(window.scrollX - 5, window.scrollY);
				}
		    }
		},
		
		/**
		 * Stop dragging a source. React if the source has been dropped on a compliant target
		 * 
		 * @parameters:
		 * 	--> event: the event corresponding to the mouse/finger
		 */
		_endDrag: function(event)
		{	
			if ( this._multitouch > 0 )
			{
				this._multitouch--;
				return;
			}
			
			this._endEvent = event;
			
			// Check if a click event must be generated
			if ( ((this._endEvent.timestamp-this._startEvent.timestamp) < 250) && (Math.abs(this._endEvent.x-this._startEvent.x) < 20))
			{
				this._endEvent.dispatch(this._endEvent.target, 'click');
			}
			
			if (this._currentAvatar !== null)
			{
				
				// check if we are over a drop target
				this._currentTarget = this._getTarget(this.lastX, this.lastY);
				
				if ( this._currentTarget !== null )
				{
					// make the drop target react
					this._currentTarget._onDrop(this._currentSource);
				}
				
				// remove the avatar
				document.body.removeChild(this._currentAvatar.target);
				
				// reset the drag and drop
				this._currentSource.deactivate();
				
				this._currentSource = null;
				this._currentTarget = null;
				this._currentAvatar = null;
				
				this.lastX = 0;
				this.lastY = 0;
		
				this.updateTargets();
		    }
		},
		
		/**
		 * Get a particular Source
		 * 
		 * @parameters
		 * 	--> id: id of the source we want to retrieve
		 */
		_getSource: function(id)
		{
			if ( id !== null && id != '')
			{
				for ( var i=0; i<this._sources.length; i++)
				{
					if ( this._sources[i].source.id == id )
					{
						return (this._sources[i].source);
					}
				}
			}
			return null;
		},
		
		/**
		 * Get a particular Target
		 * 
		 * @parameters
		 * 	--> pageX: position of the mouse/finger on the X-axis
		 * 	--> pageY: position of the mouse/finger on the Y-axis
		 */
		_getTarget: function(pageX, pageY)
		{
			var t = null;
			var l = this._targets.length;
			
			for (var i=0; i<l; i++)
			{
				if ( this._targets[i].X1 <= pageX && pageX <= this._targets[i].X2 )
				{
					if ( this._targets[i].Y1 <= pageY && pageY <= this._targets[i].Y2 )
					{
						t = this._targets[i].target;
					} else
					{
						this._targets[i].target.onSourceOut();
					}
				} else
				{
					this._targets[i].target.onSourceOut();
				}
			}
			return t;
		},
		
		/**
		 * Adds listeners for mouse/finger events
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(wink.isSet(this.zone)?this.zone:document, "start", { context: this, method: "_startDrag", arguments: null }, { preventDefault: true, tracking: false });
			wink.ux.touch.addListener(wink.isSet(this.zone)?this.zone:document, "move", { context: this, method: "_drag", arguments: null }, { preventDefault: true });
			wink.ux.touch.addListener(wink.isSet(this.zone)?this.zone:document, "end", { context: this, method: "_endDrag", arguments: null }, { preventDefault: true });
		}
	};
	
	//Bindings
	wink.ux.dnd = wink.ux.Dnd;
	
	/**
	 * Implements a drag and drop source. The source can be moved around in the page and can react when dropped on a certain target
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		id = identifier of a DOM node representing the source
	 * 	}
	 * 
	 * @methods:
	 * 	--> registerEvent: add a new event on which the source can react
	 * 	--> getAvatar: MUST be implemented by the application. It returns a DOM node corresponding to the drag avatar
	 * 	--> activate: activate the listeners corresponding to all the registered events of the source. This method is called by the dnd object
	 * 	--> deactivate: deactivate the listeners corresponding to all the registered events of the source. This method is called by the dnd object
	 *
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> id: the id of the DOM node representing the source
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ux.dnd.Source = function(properties)
	{
		this.uId     = wink.getUId();
		this.id      = properties.id;
		
		this._events = [];
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
		
	};
	
	wink.ux.dnd.Source.prototype = 
	{
		/**
		 * Add a new event on which the source can react
		 * 
		 * @parameters:
		 * 	--> event: the name of the event we want to listen to and that will be fired by a Target
		 * 	--> context: the context where to execute the callback method
		 * 	--> method: callback method. It is called when the event is fired. 
		 * 
		 */
		registerEvent: function(event, context, method)
		{
			this._events.push(
				{
					event: event,
					context: context,
					method: method
				}
			);
		},
		
		/**
		 * MUST be implemented by the application. It MUST return a DOM node corresponding to the drag avatar
		 */
		getAvatar: function()
		{
			return null;
		},
		
		/**
		 * Activate the listeners corresponding to all the registered events of the source. This method is called by the Dnd
		 */
		activate: function()
		{
			var l = this._events.length;
	
			for ( var i=0; i<l; i++)
			{
				wink.subscribe(this._events[i].event, {context: this._events[i].context, method: this._events[i].method});
			}
		},
		
		/**
		 * deactivate the listeners corresponding to all the registered events of the source. This method is called by the Dnd
		 */
		deactivate: function()
		{
			var l = this._events.length;
			for ( var i=0; i<l; i++)
			{
				wink.unsubscribe(this._events[i].event, {context: this._events[i].context, method: this._events[i].method});
			}
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( wink.isNull($(this.id)) )
			{
				wink.log('[dnd.Source] id property must be a valid DOM Node identifier');
				return false;
			}
		},
		
		/**
		 * Initialize the Source node
		 */
		_initDom: function()
		{
			wink.addClass($(this.id), 'dnd_movable');
			
			$(this.id).pozXinit = 0;
			$(this.id).pozYinit = 0;
		}
	};
	
	/**
	 * Implements a drag and drop target. Sources can be dropped on it and it will react if its associated event correspond to the current source
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		id = identifier of a DOM node representing the target
	 * 		event = name of the event that will be fired on a drop
	 * 	}
	 * 
	 * @methods:
	 * 	--> onSourceOver: SHOULD be overwritten by the application. This method is called by the dnd object when a compliant source is over the target
	 * 	--> onSourceOut: SHOULD be overwritten by the application. This method is called by the dnd object when a compliant source is out of the target
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> id: the id of the DOM node representing the target
	 * 	--> dnd: the manager associated to the target
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ux.dnd.Target = function(properties)
	{
		this.uId     = wink.getUId();
		this.id      = properties.id;
		this.dnd     = null;
		
		this._event  = properties.event;
		this._isOver = false;
		
		if  ( this._validateProperties() ===  false )return;
	};
	
	wink.ux.dnd.Target.prototype =
	{
		/**
		 * SHOULD be overwritten by the application. This method is called by the dnd object when a compliant source is over the target
		 */
		onSourceOver: function()
		{
			if(!this._isOver)
			{
				this.dnd.updateTargets();
				this._isOver = true;
			}
		},
		
		/**
		 * SHOULD be overwritten by the application. This method is called by the dnd object when a compliant source is out of the target
		 */
		onSourceOut: function()
		{
			if(this._isOver)
			{
				this.dnd.updateTargets();
				this._isOver = false;
			}
		},
		
		/**
		 * This method is called by the Dnd when a compliant source is dropped on the target. It fires the event associated to the target
		 * 
		 * @parameters:
		 * 	--> source: the dropped Source
		 */
		_onDrop: function(source)
		{
			if(this._isOver)
			{
				this.dnd.updateTargets();
				wink.publish(this._event, {'target': this, 'source' : source});
				this._isOver = false;
			}
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( wink.isNull($(this.id)) )
			{
				wink.log('[dnd.Target] id property must be a valid DOM Node identifier');
				return false;
			}
			
			if ( !wink.isSet(this._event) )
			{
				wink.log('[dnd.Target] event must not be an empty or NULL string');
				return false;
			}
		}
	};
	
	return wink.ux.Dnd;
});