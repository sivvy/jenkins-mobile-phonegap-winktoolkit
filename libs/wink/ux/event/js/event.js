/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an encapsulation of an event
 * 
 * @properties:
 * 	data =
 * 	{
 * 		type 			= type of event (start, move, end, gesturestart, gesturemove, gestureend)
 * 		x				= x coordinate of the event
 * 		y				= y coordinate of the event
 * 		timestamp		= the event timestamp
 * 		target			= the target element
 * 		srcEvent		= the original source event
 * 		multitouch		= boolean that indicates whether the current event occurs in a multi-touch context
 * 	}
 * 
 * @methods:
 * 	--> preventDefault: allows to prevent default behavior
 *  --> stopPropagation: allows to stop event propagation
 * 	--> dispatch: assigns the event to another target
 * 
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> type: the type of event (start, move, end, gesturestart, gesturemove, gestureend)
 *  --> x: the x coordinate of the event
 *  --> y: the y coordinate of the event
 *  --> timestamp: the timestamp of the event
 *  --> target: the event target
 *  --> srcEvent: the original source event
 *  --> multitouch: a boolean that indicates whether there was more than one touch when the event was raised
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_base/_base/js/base', '../../../_base/error/js/error', '../../../_base/json/js/json'], function(wink)
{	
	var undef = wink.isUndefined;
	var isSet = wink.isSet;

	wink.ux.Event = function(properties)
	{
		this.uId		= wink.getUId();
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
	};
	
	wink.ux.Event.prototype = 
	{
		/**
		 * allows to prevent default behavior
		 */
		preventDefault: function()
		{
			this.srcEvent.preventDefault();
		},
	
		/**
		 * allows to stop event propagation
		 */
		stopPropagation: function()
		{
			this.srcEvent.stopPropagation();
		},
	
		/**
		 * assigns the event to another target
		 * 
		 * @parameters:
		 * 	--> target: the dom node that will receive the event
		 * 	--> type: [optional] dispatch as this type
		 */
		dispatch: function(target, type)
		{
			var srcEvent = this.srcEvent;
			var targetedType = srcEvent.type;
			if (isSet(type))
			{
				targetedType = type;
			}
			var cloneEvent = _createEvent(srcEvent, targetedType);
			target.dispatchEvent(cloneEvent);
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			var l = function(p) {
				wink.log('[Event] ' + p + ' must be specified');
			};
			if ( !isSet(this.type) || this.type == '' )
			{
				l('type');
				return false;
			}
			if ( undef(this.x) )
			{
				l('x');
				return false;
			}
			if ( undef(this.y) )
			{
				l('y');
				return false;
			}
			if ( !isSet(this.timestamp) )
			{
				l('timestamp');
				return false;
			}
			if ( undef(this.target) )
			{
				l('target');
				return false;
			}
			if ( !isSet(this.srcEvent) )
			{
				l('srcEvent');
				return false;
			}
		}
	};
	
	/**
	 * 
	 * @parameters:
	 * 	--> sourceEvent: the source event
	 *  --> type: the event type
	 * 
	 * @return a new event
	 */
	var _createEvent = function(sourceEvent, type)
	{
		var s = sourceEvent;
		var eventInterface = "HTMLEvents";
		
		if (/blur|focus|resize|scroll/i.test(type)) {
			eventInterface = "UIEvent";
		} else if (/click|mouse(down|move|up)/i.test(type)) {
			eventInterface = "MouseEvent";
		} else if (/touch(start|move|end|cancel)/i.test(type)) {
			eventInterface = "TouchEvent";
		}
		
		var event = document.createEvent(eventInterface);
		var ct = s.changedTouches;
		if (eventInterface == "HTMLEvents") {
			event.initEvent(type, s.bubbles, s.cancelable);
		} else if (eventInterface == "UIEvent") {
			event.initUIEvent(type, s.bubbles, s.cancelable, window, s.detail);
		} else if (eventInterface == "MouseEvent") {
			var sx = s.screenX, sy = s.screenY, cx = s.clientX, cy = s.clientY;
			if (s.initTouchEvent && ct && ct.length > 0) {
				var t = ct[0];
				sx = t.screenX;
				sy = t.screenY;
				cx = t.clientX;
				cy = t.clientY;
			}
			event.initMouseEvent(type, s.bubbles, s.cancelable, document.defaultView, s.detail, sx, sy, cx, cy, s.ctrlKey, s.altKey, s.shiftKey, s.metaKey, s.button, s.relatedTarget);
		} else if (eventInterface == "TouchEvent") {
			event.initTouchEvent(type, s.bubbles, s.cancelable, window, s.detail, s.screenX, s.screenY, s.clientX, s.clientY, s.ctrlKey, s.altKey, s.shiftKey, s.metaKey, s.touches, s.targetTouches, ct, s.scale, s.rotation);
		}
		
		return event;
	};
	
	return wink.ux.Event;
});