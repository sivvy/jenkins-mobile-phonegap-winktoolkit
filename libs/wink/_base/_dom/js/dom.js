/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/** 
 * DOM Extends.
 * 
 * @methods:
 * 	--> winkGetTopPosition:  Extends HTMLElements in order to retrieve their top position
 * 	--> winkGetLeftPosition: Extends HTMLElements in order to retrieve their left position
 * 	--> winkTranslate: Extends HTMLElements in order to translate the node
 * 	--> winkScale: Extends HTMLElements in order to scale the node
 * 	--> winkRotate: Extends HTMLElements in order to rotate the node
 * 	--> winkListenToGesture: Extends HTMLElements in order to listen to gesture
 * 	--> winkUnlistenToGesture: Extends HTMLElements in order to unlisten to gesture
 * 
 * @dependencies:
 * 	--> wink.ux.gesture (only for listenToGesture and unlistenToGesture use)
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1 (partial), Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_base/_base/js/base'], function(wink)
{
	var htmlelement = HTMLElement.prototype;
	
	var isUndef = wink.isUndefined;
		
	/**
	 * Extends HTMLElements in order to retrieve their top position
	 * @parameters : 
	 * 	--> parentNode : If specified, the returned value is relative to the parentNode node. 
	 * 					 If parentNode is not a parent node of the current HTML element or if not specified, the returned value will be an absolute top position
	 */
	var getTopPosition = function(parentNode)
	{
		var topValue = 0;
		var obj = this;
		if(wink.isSet(parentNode))
		{
			while (obj && obj != parentNode) 
			{
				topValue += obj.offsetTop;
				obj = obj.offsetParent;
			}
		} else {
			while (obj) 
			{
				topValue += obj.offsetTop;
				obj = obj.offsetParent;
			}	
		}
		
		return topValue;
	};
	
	/**
	 * Extends HTMLElements in order to retrieve their left position
	 * @parameters : 
	 * 	--> parentNode : If specified, the returned value is relative to the parentNode node. 
	 * 					 If parentNode is not a parent node of the current HTML element or if not specified, the returned value will be an absolute left position
	 */
	var getLeftPosition = function(parentNode)
	{
		var leftValue = 0;
		var obj = this;
		if(wink.isSet(parentNode))
		{
			while (obj && obj != parentNode) 
			{
				leftValue += obj.offsetLeft;
				obj = obj.offsetParent;
			}
		} else {
			while (obj) 
			{
				leftValue += obj.offsetLeft;
				obj = obj.offsetParent;
			}	
		}
		return leftValue;
	};
	
	/**
	 * Extends HTMLElements in order to translate the node
	 * 
	 * @parameters:
	 *  --> x: x position
	 *	--> y: y position
	 *  --> force2d: used to prevent "translate3d"
	 *
	 * x and y must both be integers or both with percentage notation
	 */
	var winkTranslate = function(x, y, force2d)
	{
		wink.fx.applyTranslate(this, x, y, force2d);
	};
	
	/**
	 * Extends HTMLElements in order to scale the node
	 * 
	 * @parameters:
	 *  --> x: The x ratio of the scale
	 *	--> y: The y ratio of the scale
	 */
	var winkScale = function(x, y)
	{
		wink.fx.applyScale(this, x, y);
	};
	
	/**
	 * Extends HTMLElements in order to rotate the node
	 * 
	 * @parameters:
	 *  --> x: The angle of the rotation in degrees
	 */
	var winkRotate = function(angle)
	{
		wink.fx.applyRotate(this, angle);
	};
	
	/**
	 * Extends HTMLElements in order to listen to gesture
	 * 
	 * @parameters:
	 *  --> gesture: the gesture name to listen (see wink.ux.gesture)
	 *	--> callback: the callback to invoke when this gesture is done
	 *	--> options: The options associated to the listener
	 *		{
	 *			preventDefault: Indicates whether an automatic preventDefault must be done (default is false)
	 *		}
	 */
	var winkListenToGesture = function(gesture, callback, options)
	{
		wink.ux.gesture.listenTo(this, gesture, callback, options);
	};
	
	/**
	 * Extends HTMLElements in order to unlisten to gesture
	 * 
	 * @parameters:
	 *  --> gesture: the gesture name to unlisten (see wink.ux.gesture)
	 *	--> callback: the callback associated to this gesture
	 */
	var winkUnlistenToGesture = function(gesture, callback)
	{
		wink.ux.gesture.unlistenTo(this, gesture, callback);
	};
	
	htmlelement.winkGetTopPosition = getTopPosition;
	htmlelement.winkGetLeftPosition = getLeftPosition;
	htmlelement.winkTranslate = winkTranslate;
	htmlelement.winkScale = winkScale;
	htmlelement.winkRotate = winkRotate;
	htmlelement.winkListenToGesture = winkListenToGesture;
	htmlelement.winkUnlistenToGesture = winkUnlistenToGesture;
	
	// Bindings
	if ( isUndef(htmlelement.getTopPosition)) { htmlelement.getTopPosition = getTopPosition; }
	if ( isUndef(htmlelement.getLeftPosition)) { htmlelement.getLeftPosition = getLeftPosition; }
	if ( isUndef(htmlelement.rotate)) { htmlelement.rotate = winkRotate; }
	if ( isUndef(htmlelement.scale)) { htmlelement.scale = winkScale; }
	if ( isUndef(htmlelement.translate)) { htmlelement.translate = winkTranslate; }
	if ( isUndef(htmlelement.listenToGesture)) { htmlelement.listenToGesture = winkListenToGesture; }
	if ( isUndef(htmlelement.unlistenToGesture)) { htmlelement.unlistenToGesture = winkUnlistenToGesture; }
	
	return wink;
});