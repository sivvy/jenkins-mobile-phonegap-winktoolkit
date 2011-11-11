/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The wink feature detection provider.
 * 
 * @methods:
 *  --> has: Test if the given feature is supported
 *  --> inquire: Inquires about the given feature
 *  --> inquireMap: Inquires about a map of features
 *  --> setProp: Set a property associated to the feature detection
 *  --> deferProp: defer the property recovery on a function or on a feature detection
 *  --> prop: Get a property associated to the feature detection
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_base/_base/js/base'], function(wink)
{
	var features = {},
		properties = {};
	
	/**
	 * Test if the given feature is supported
	 * 
	 * @parameters:
	 *  --> feature: the feature to test
	 */
	function has(feature) {
		if (isFunc(features[feature])) {
			features[feature] = features[feature]();
		}
		return features[feature];
	}
	
	/**
	 * Inquires about the given feature
	 * 
	 * @parameters:
	 *  --> feature: the feature to inquire
	 *  --> assertSupported: the function that investigates or the boolean value if known
	 *  --> now: allows to investigate now
	 */
	function inquire(feature, assertSupported, now) {
		if (typeof features[feature] != "undefined") {
			return;
		}
		var assert = assertSupported;
		if (now && isFunc(assertSupported)) {
			assert = assertSupported();
		}
		features[feature] = assert;
	}

	/**
	 * Inquires about a map of features
	 * 
	 * @parameters:
	 *  --> map: the map of features
	 *  --> now: allows to investigate now
	 */
	function inquireMap(map, now) {
		if (!map || map.length == 0) {
			return;
		}
		for (var f in map) {
			inquire(f, map[f], now);
		}
	}
	
	/**
	 * Set a property associated to the feature detection
	 * 
	 * @parameters:
	 *  --> key: the property
	 *  --> value: the value
	 */
	function setProp(key, value) {
		properties[key] = value;
	}
	
	/**
	 * defer the property recovery on a function or on a feature detection
	 * 
	 * @parameters:
	 *  --> key: the property
	 *  --> proc: the defered process
	 */
	function deferProp(key, proc) {
		if (isFunc(proc)) {
			setProp(key, proc);
		} else {
			setProp(key, function() {
				has(proc);
			});
		}
	}
	
	/**
	 * Get a property associated to the feature detection
	 * 
	 * @parameters:
	 *  --> key: the property
	 */
	function prop(key) {
		var v = properties[key];
		if (isFunc(v)) {
			v();
			v = properties[key];
			if (isFunc(v)) {
				v = key;
			}
		}
		return v || key;
	}
	
	function isFunc(f) {
		return (typeof f == "function");
	}
	
	wink.has = has;
	wink.has.prefixes = [ "-webkit-", "-moz-", "-o-", "-ms-", "-khtml-" ];
	wink.has.prefix = null;
	wink.has.inquire = inquire;
	wink.has.inquireMap = inquireMap;
	wink.has.setProp = setProp;
	wink.has.deferProp = deferProp;
	wink.has.prop = prop;
	
	return wink.has;
});
