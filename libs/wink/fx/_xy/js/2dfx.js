/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Object providing a layer of abstraction with all specifics related to the css rules.
 * 
 * @methods:
 * 	--> addClass: 					add a css class to the node
 * 	--> removeClass: 				remove a css class from the node
 * 	--> apply:			 			apply styles to a given node
 * 	--> applyTransition: 			apply a transition to the given node
 *  --> applyTransformTransition: 	apply a transform transition to the given node
 *  --> onTransitionEnd:			connect a function to the end of a transition on the given node
 *  --> getTransformPosition: 		returns the instantaneous position of the node, even during a transition.
 *  --> applyTranslate:				apply the CSS Translation to the given node (HTMLElement.translate recommended)
 *  --> applyScale:					apply the CSS Scale to the given node (HTMLElement.scale recommended)
 *  --> applyRotate: 				apply the CSS Rotation (z-axis) to the given node (HTMLElement.rotate recommended)
 * 	--> getTransform: 				returns the transform affected to the given node
 * 	--> setTransform: 				apply the given transformation to the given node
 * 
 * @compatibility:
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_base/_base/js/base', '../../../_base/_feat/js/feat_css'], function(wink) 
{
	var _isSet = wink.isSet;
	var getprop = wink.has.prop;
	var _local = {
		u: undefined
	};

	/**
	 * add a css class to the node
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 *	--> classStr: 	the css class to add
	 */
	var addClass = function(node, classStr) 
	{
		var cls = node.className;
		if ((" " + cls + " ").indexOf(" " + classStr + " ") < 0)
		{
			node.className = cls + (cls ? ' ' : '') + classStr;
		}
	};
	/**
	 * remove a css class from the node
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 *	--> classStr: 	the css class to remove
	 */
	var removeClass = function(node, classStr)
	{
		var t = wink.trim((" " + node.className + " ").replace(" " + classStr + " ", " "));
		if (node.className != t)
		{
			node.className = t;
		}
	};
	/**
	 * apply styles to a given node
	 * 
	 * @parameters:
	 *	--> node: 		the node on which styles will be applied
	 *	--> properties: an object containing all the properties to set
	 */
	var apply = function(node, properties)
	{
		var p, s = node.style;
		for (p in properties)
		{
			var styleResolved = getprop(p);
			s[styleResolved] = properties[p];
		}
	};
	/**
	 * apply a transition to the given node
	 * 
	 * @parameters:
	 *	--> node: 		the node on which transition will be applied
	 *	--> property: 	the transition property
	 *	--> duration: 	the transition duration
	 *	--> delay: 		the transition delay
	 *	--> func: 		the transition function
	 */
	var applyTransition = function(node, property, duration, delay, func) 
	{
		apply(node, {
			"transition-property": _resolveProperties(property),
	    	"transition-duration": duration,
	    	"transition-delay": delay,
	    	"transition-timing-function": func
		});
	};
	/**
	 * apply a transform transition to the given node
	 * 
	 * @parameters:
	 *	--> node: 		the node on which transition will be applied
	 *	--> duration: 	the transition duration
	 *	--> delay: 		the transition delay
	 *	--> func: 		the transition function
	 */
	var applyTransformTransition = function(node, duration, delay, func) 
	{
		applyTransition(node, "transform", duration, delay, func);
	};
	/**
	 * connect a function to the end of a transition on the given node.
	 * returns the listener in order to be able to remove it.
	 * 
	 * @parameters:
	 *	--> node:		the node on which a transition is applied
	 *	--> func:		the function to connect
	 *  --> persistent: specify that the listener must be kept (optional)
	 */
	var onTransitionEnd = function(node, func, persistent)
	{
		var trend = getprop("transitionend");
		var postwork = function(e) {
			if (persistent !== true) {
				node.removeEventListener(trend, postwork, false);
			}
			func(e);
		};
		node.addEventListener(trend, postwork, false);
		return postwork;
	};
	/**
	 * Returns the instantaneous position of the node, even during a transition.
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 */
	var getTransformPosition = function(node)
	{
		var result = {
			x: null,
			y: null
		};
		var transform = getTransform(node);
		
		if (!wink.has("css-matrix"))
		{
			var reg = new RegExp(/matrix/i);
			if (reg.test(transform)) 
			{
				var reg = new RegExp("[, ()]+", "g");
				var transformSplited = transform.split(reg);
				if (transformSplited.length > 6 && transformSplited[0] == "matrix")
				{
					result.x = parseInt(transformSplited[5]);
					result.y = parseInt(transformSplited[6]);
				}
			}
		}
		else
		{
			var transformMatrix = new WebKitCSSMatrix(transform);
			result.x = transformMatrix.m41;
			result.y = transformMatrix.m42;
		}
		return result;
	};
	/**
	 * apply the CSS Translation to the given node
	 * 
	 * @parameters:
	 *	--> node: 		The node to translate
	 *	--> x: 			The x coordinate of the translation
	 *	--> y: 			The y coordinate of the translation
	 *  --> force2d:	true to prevent "translate3d"
	 */
	var applyTranslate = function(node, x, y, force2d)
	{
		_computeTransform(node, x, y, _local.u, _local.u, _local.u, force2d);
	};
	/**
	 * apply the CSS Scale to the given node
	 * 
	 * @parameters:
	 *	--> node: 	The node to scale
	 *	--> x: 		The x ratio of the scale
	 *	--> y: 		The y ratio of the scale
	 */
	var applyScale = function(node, x, y)
	{
		_computeTransform(node, _local.u, _local.u, x, y, _local.u, _local.u);
	};
	/**
	 * apply the CSS Rotation to the given node
	 * 
	 * @parameters:
	 *	--> node: 	The node to scale
	 *	--> angle: 	The angle of the rotation in degrees
	 */
	var applyRotate = function(node, angle)
	{
		_computeTransform(node, _local.u, _local.u, _local.u, _local.u, angle, _local.u);
	};
	/**
	 * return the transform affected to the given node
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 */
	var getTransform = function(node) 
	{
		return window.getComputedStyle(node)[getprop("transform-property")];
	};
	/**
	 * apply the given transformation to the given node
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 *	--> transform: 	the transformation to affect
	 */
	var setTransform = function(node, transform) 
	{
		apply(node, {
			"transform-property": transform
		});
	};
	/**
	 * apply the computed transformation to the given node
	 * 
	 * @parameters:
	 *	--> node: 		the DOM node
	 *	--> tx: 		The x coordinate of the translation
	 *	--> ty: 		The y coordinate of the translation
	 *	--> sx: 		The x ratio of the scale
	 *	--> sy: 		The y ratio of the scale
	 *	--> a: 			The angle of the rotation in degrees
	 *  --> force2d:	used to prevent "translate3d"
	 */
	var _computeTransform = function(node, tx, ty, sx, sy, a, force2d)
	{
		var o = node._cssT || {};
		o = node._cssT = {
			t: (_isSet(tx) || _isSet(ty)) ? { tx: tx, ty: ty } : o.t,
			s: (_isSet(sx) || _isSet(sy)) ? { sx: sx, sy: sy } : o.s,
			r: _isSet(a) ? { a: a } : o.r
		};
		
		var hasT = (o.t && (_isSet(o.t.tx) || _isSet(o.t.ty))),
			hasS = (o.s && (_isSet(o.s.sx) || _isSet(o.s.sy))),
			hasR = (o.r && _isSet(o.r.a)),
			force2d = force2d;
		
		if (!wink.has("css-translate3d")
			|| (wink.ua.isAndroid && (hasS || hasR))) { // WORKAROUND - Android issue 12541 (>= 2.2) : translate3d combined with scale / rotate fails
			force2d = true;
		}
		
		var t = hasT ? _getTranslateTransform(o.t.tx, o.t.ty, force2d) : "",
			s = hasS ? _getScaleTransform(o.s.sx, o.s.sy) : "",
			r = hasR ? _getRotateTransform(o.r.a) : "",
			c = wink.trim(t + " " + s + " " + r);

		setTransform(node, c);
	};
	/**
	 * Get the translation transformation.
	 * 
	 * @parameters:
	 *	--> x: x coordinate
	 *	--> y: y coordinate
	 *  --> force2d: true to prevent "translate3d"
	 */
	var _getTranslateTransform = function(x, y, force2d)
	{
		var transform = "";
		var xParam = x;
		if (!_isSet(xParam))
		{
			xParam = 0;
		}
		var yParam = y;
		if (!_isSet(yParam))
		{
			yParam = 0;
		}
		var zParam = "0";
		
		var isPercentage = false;
		isPercentage = isPercentage || (wink.isString(xParam) && (xParam.indexOf('%', 0) != -1));
		isPercentage = isPercentage || (wink.isString(yParam) && (yParam.indexOf('%', 0) != -1));
		if (!isPercentage)
		{
			xParam = xParam + "px";
			yParam = yParam + "px";
			zParam = zParam + "px";
		}
		
		if (force2d) 
		{
			transform = "translate(" + xParam + ", " + yParam + ")";
		}
		else
		{
			transform = "translate3d(" + xParam + ", " + yParam + ", " + zParam + ")";
		}
		return transform;
	};
	/**
	 * Get the scale transformation.
	 * 
	 * @parameters:
	 *	--> x: ratio on x
	 *	--> y: ratio on y
	 */
	var _getScaleTransform = function(x, y)
	{
		var transform = "";
		var xParam = x;
		if (!_isSet(xParam))
		{
			xParam = 1;
		}
		var yParam = y;
		if (!_isSet(yParam))
		{
			yParam = 1;
		}
		transform = "scale(" + xParam + ", " + yParam + ")";
		return transform;
	};
	/**
	 * Get the rotate transformation.
	 * 
	 * @parameters:
	 *	--> degree: rotation angle in degree
	 */
	var _getRotateTransform = function(angle)
	{
		var transform = "";
		var angleParam = angle;
		if (!_isSet(angleParam))
		{
			angleParam = 0;
		}
		transform = "rotate(" + angleParam + "deg)";
		return transform;
	};
	/**
	 * Resolve the given property which may be a separated list of properties
	 * 
	 * @parameters:
	 *  --> str: the property to resolve
	 */
	var _resolveProperties = function(str)
	{
		var propertyResolved = str;
		if (str.indexOf(",") == -1) {
			propertyResolved = getprop(str);
		} else {
			var parts = str.split(",");
			var i, l = parts.length;
			for (i = 0; i < l; i++) {
				parts[i] = getprop(wink.trim(parts[i]));
			}
			propertyResolved = parts.join(",");
		}
		
		return propertyResolved;
	};
	
	wink.fx = 
	{
		addClass: addClass,
		removeClass: removeClass,
		apply: apply,
		applyTransition: applyTransition,
		applyTransformTransition: applyTransformTransition,
		onTransitionEnd: onTransitionEnd,
		getTransformPosition: getTransformPosition,
		applyTranslate: applyTranslate,
		applyScale: applyScale,
		applyRotate: applyRotate,
		getTransform: getTransform,
		setTransform: setTransform
	};
	
	//Bindings
	wink.addClass = addClass;
	wink.removeClass = removeClass;
	
	return wink.fx;
});