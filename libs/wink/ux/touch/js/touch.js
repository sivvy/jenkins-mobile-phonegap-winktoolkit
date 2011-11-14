/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an object that interfaces with all event listeners and listened elements.
 * It provides an abstraction layer for managing the events of the finger or the mouse so that the caller does not care about the target platform.
 * The only types of events managed, which must be provided to methods addListener and removeListener are "start", "move" and "end",
 * "gesturestart", "gesturemove", "gestureend".
 * The callback is a structure that takes the following form : { context, method [,arguments] }.
 * When events occur, the touch object handles them invoking callbacks with the resulting event and associated arguments.
 * 
 * @methods:
 * 	--> addListener: add a new listener
 * 	--> removeListener: remove an existing listener
 *  --> getTouchProperties: retrieve the touch properties
 *
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 *
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../_base/_base/js/base', '../../../_base/error/js/error', '../../../_base/_feat/js/feat_event', '../../event/js/event'], function(wink) 
{
	var _els = []; // touch elements
	
	var _SE = "start";
	var _ME = "move";
	var _EE = "end";
	var _GS_SE = "gesturestart";
	var _GS_CE = "gesturechange";
	var _GS_EE = "gestureend";
	
	var hasprop = wink.has.prop;
	var _MAP = {
		"start": hasprop("touchstart"),
		"move": hasprop("touchmove"),
		"end": hasprop("touchend"),
		"gesturestart": hasprop("gesturestart"),
		"gesturechange": hasprop("gesturechange"),
		"gestureend": hasprop("gestureend")
	};
	var _MAP_INV = {};
	for (var key in _MAP)
	{
		var value = _MAP[key];
		_MAP_INV[value] = key;
	}

	/**
	 * add a new listener
	 * 
	 * @parameters:
	 * 	--> domNode: the DOM node reference
	 * 	--> eventType: the event type that must match with one of {"start", "move", "end", "gesturestart", "gesturemove", "gestureend" }
	 * 	--> callback: the callback
	 *  --> options: The options associated to the listener
	 *  	{
	 * 			preventDefault: Indicates whether an automatic preventDefault must be done (default is false)
	 *  		tracking: Indicates whether the node must be tracked after the first start event (taken into account in the first method call) (default is true)
	 *  		captureFlow: Indicates whether the capture event flow is used (default is false)
	 *  	}
	 */
	var addListener = function(domNode, eventType, callback, options)
	{
		if (wink.isUndefined(_MAP[eventType]))
		{
			wink.log('[touch] Cannot add listener for unknown eventType: ' + eventType);
			return false;
		}
		
		if (!wink.isSet(options))
		{
			options = {};
		}
		if (options === true)
		{
			options = { preventDefault: true }; // backwards compatibility
		}
		var opts = {
			preventDefault: options.preventDefault === true ? true : false,
			tracking: options.tracking === false ? false : true,
			captureFlow: options.captureFlow === true ? true : false
		};
		
		var touchElement = null;
		var index = _getTouchElementIndex(domNode);
		if (index == null) 
		{
			var properties = { domNode: domNode, tracking: opts.tracking };
			touchElement = new wink.ux.touch.Element(properties);
			_els.push(touchElement);
		}
		else
		{
			touchElement = _els[index];
		}
		
		if (!touchElement.isListening(eventType))
		{
			if (touchElement.eventHandler == null) {
				touchElement.eventHandler = function(e) {
					_handleEvent(e, touchElement);
				};
			}
			touchElement.eventCaptures[eventType] = opts.captureFlow;
			touchElement.domNode.addEventListener(_MAP[eventType], touchElement.eventHandler, touchElement.eventCaptures[eventType]);
		}
		touchElement.addEventCallback(eventType, callback, opts.preventDefault);
	};
	
	/**
	 * remove an existing listener
	 * 
	 * @parameters:
	 * 	--> domNode: the DOM node
	 * 	--> eventType: the event type that must match with one of {"start", "move", "end", "gesturestart", "gesturemove", "gestureend" }
	 * 	--> callback: the callback
	 */
	var removeListener = function(domNode, eventType, callback) 
	{
		var index = _getTouchElementIndex(domNode);
		if (index != null) 
		{
			var touchElement = _els[index];
			touchElement.removeEventCallback(eventType, callback);
			if (!touchElement.isListening(eventType))
			{
				touchElement.domNode.removeEventListener(_MAP[eventType], touchElement.eventHandler, touchElement.eventCaptures[eventType]);
			}
		}
	};
	
	/**
	 * Returns the given touch properties.
	 * 
	 * @parameters:
	 * 	--> touch: the touch
	 */
	var getTouchProperties = function(touch)
	{
		var properties = {};
		properties.x = touch.pageX;
		properties.y = touch.pageY;
		properties.target = touch.target;
		return properties;
	};
	
	/**
	 * @parameters:
	 * 	--> domNode: the DOM node
	 */
	var _getTouchElementIndex = function(domNode) 
	{
		var i, l = _els.length;
		for (i = 0; i < l; i++) 
		{
			var touchElementI = _els[i];
			if (touchElementI.domNode == domNode) 
			{
				return i;
			}
		}
		return null;
	};
	
	/**
	 * @parameters:
	 * 	--> e: a DOM event
	 */
	var _handleEvent = function(e, touchElement)
	{
		var eventType = _MAP_INV[e.type];
		var uxEvent = _createUxEvent(eventType, e);
		
		if (!touchElement.isListening(_SE) || touchElement.tracking == false) 
		{
			touchElement.tracked = true;
		} 
		else if (eventType == _SE)
		{
			touchElement.tracked = true;
		}
		if (touchElement.tracked == true)
		{
			if (eventType == _EE)
			{
				touchElement.tracked = false;
			}
			touchElement.notifyEvent(uxEvent);
		}
	};
	
	/**
	 * @parameters:
	 * 	--> type: the event type that must maches with one of {"start", "move", "end", "gesturestart", "gesturemove", "gestureend" }
	 * 	--> e: a DOM event
	 */
	var _createUxEvent = function(type, e)
	{
		var properties = {};
		
		properties.type 		= type;
		properties.srcEvent 	= e;
		properties.timestamp 	= e.timeStamp;
		properties.multitouch	= false;
		
		if (!properties.timestamp)
		{
			properties.timestamp = new Date().getTime();
		}
		
		if (wink.has("touch"))
		{
			if (type == _GS_SE 
			 || type == _GS_CE
			 || type == _GS_EE)
			{
				properties.target = e.target;
				properties.x = 0;
				properties.y = 0;
			}
			else
			{
				var lastTouch = null;
				if (type == _EE) 
				{
					if (e.changedTouches && e.changedTouches.length > 0) 
					{
						lastTouch = e.changedTouches[0];
					}
				}
				else 
				{
					if (e.targetTouches && e.targetTouches.length > 0) 
					{
						lastTouch = e.targetTouches[0];
					}
					else if (e.changedTouches && e.changedTouches.length > 0) 
					{
						lastTouch = e.changedTouches[0];
					}
				}
				if (lastTouch != null) 
				{
					var props = getTouchProperties(lastTouch);
					properties.x = props.x;
					properties.y = props.y;
					properties.target = props.target;
					if (e.touches && e.touches.length > 1)
					{
						properties.multitouch = true;
					}
				}
			}
		}
		else 
		{
			var props = getTouchProperties(e);
			properties.x = props.x;
			properties.y = props.y;
			properties.target = props.target;
		}
		
		return new wink.ux.Event(properties);
	};

	wink.ux.touch =
	{
		addListener: addListener,
		removeListener: removeListener,
		getTouchProperties: getTouchProperties
	};

	/**
	 * Implements an object encapsulating the concept of the DOM element receiving user events.
	 * An element is linked to one or more events and each event refers to one or more callbacks.
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		domNode: the DOM Node
	 * 		tracking: to indicate the tracking mode
	 * 	}
	 * 
	 * @methods:
	 * 	--> addEventCallback: add a new callback associated to the given event type
	 * 	--> removeEventCallback: remove a callback associated to the given event type
	 * 	--> isListening: determines whether the TouchElement should be notified of events that matches to the given one because at least one callback target exists
	 * 	--> notifyEvent: notifies the TouchElement so that it manages the given wink.ux.Event
	 * 
	 * @attributes:
	 *  --> uId: unique identifier of the component
	 *  --> domNode: the dom node associated to the touch element
	 *  --> tracking: indicates whether the touch element is in tracking mode
	 *  --> tracked: indicates whether the touch element is currently tracked
	 * 
	 * @author:
	 * 	--> Sylvain LALANDE
	 */

	wink.ux.touch.Element = function(properties)
	{
		this.uId				= wink.getUId();
		this.tracked			= false;
		this.eventHandler		= null;
		this.eventCaptures		= {};
		this._els				= {}; // events listened
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
	};
	
	wink.ux.touch.Element.prototype = 
	{
		/**
		 * Adds a new callback associated to the given event type
		 * 
		 * @parameters:
		 * 	--> eventType: type of event
		 * 	--> callback: the callback to add
		 * 	--> preventDefault: lets do a "preventDefault" automatically when receiving the event
		 */
		addEventCallback: function(eventType, callback, preventDefault)
		{
			if (!wink.isCallback(callback))
			{
				wink.log('[touch.Element] Invalid callback');
				return false;
			}
			
			var listenedEvent = this._els[eventType];
			
			if (!listenedEvent)
			{
				listenedEvent = 
				{
					preventDefault: preventDefault,
					callbacks: []
				};
				this._els[eventType] = listenedEvent;
			}
			else 
			{
				var callbacks = listenedEvent.callbacks;
				var j, l = callbacks.length;
				for (j = 0; j < l; j++)
				{
					var cj = callbacks[j];
					if (callback.context == cj.context && callback.method == cj.method) 
					{
						return false;
					}
				}
			}
			listenedEvent.callbacks.push(callback);
			return true;
		},
	
		/**
		 * Removes a callback associated to the given event type
		 * 
		 * @parameters:
		 * 	--> eventType: type of event
		 * 	--> callback: the callback to remove
		 */
		removeEventCallback: function(eventType, callback)
		{
			if (!wink.isCallback(callback))
			{
				wink.log('[touch.Element] Invalid callback');
				return false;
			}
			var listenedEvent = this._els[eventType];
			if (!listenedEvent)
			{
				return false;
			}
			var callbacks = listenedEvent.callbacks;
			
			var j, l = callbacks.length;
			for (j = 0; j < l; j++)
			{
				var cj = callbacks[j];
				if (callback.context == cj.context && callback.method == cj.method) 
				{
					listenedEvent.callbacks.splice(j, 1);
					break;
				}
			}
			return true;
		},
	
		/**
		 * Indicates whether the TouchElement should be notified of events that matches to the given one because at least one callback target exists
		 * 
		 * @parameters:
		 * 	--> eventType: type of event
		 */
		isListening: function(eventType) 
		{
			var listenedEvent = this._els[eventType];
			if (listenedEvent && listenedEvent.callbacks.length > 0)
			{
				return true;
			}
			return false;
		},
	
		/**
		 * Notifies the TouchElement so that it handles the given wink.ux.Event
		 * 
		 * @parameters:
		 * 	--> uxEvent: the wink.ux.Event instance to manage
		 */
		notifyEvent: function(uxEvent)
		{
			var listenedEvent = this._els[uxEvent.type];
			if (listenedEvent) {
				if (listenedEvent.preventDefault == true)
				{
					uxEvent.preventDefault();
				}
				
				var callbacks = listenedEvent.callbacks;
				for (var j = 0; j < callbacks.length; j++)
				{
					wink.call(callbacks[j], uxEvent);
				}
			}
		},
	
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if (!wink.isSet(this.domNode) || this.domNode == '')
			{
				wink.log('[touch.Element] domNode must be specified');
				return false;
			}
		}
	};

	return wink.ux.touch;
});