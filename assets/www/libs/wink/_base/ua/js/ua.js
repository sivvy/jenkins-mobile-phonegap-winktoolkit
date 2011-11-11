/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Object providing a layer of abstraction with all specifics related to the platform hosting the code.
 * 
 * @attributes:
 *  --> isWebkit: 					Indicates whether webkit is available
 *  --> isMobile: 					Indicates whether the platform is a mobile
 *  --> isIPhone: 					Indicates whether the platform is a IPhone
 *  --> isIPod:						Indicates whether the platform is a IPod
 *  --> isIPad: 					Indicates whether the platform is a IPad
 *  --> isIOS:						Indicates whether the platform is a IOS
 *  --> isAndroid: 					Indicates whether the platform is a Android
 *  --> isBlackBerry: 				Indicates whether the platform is a BlackBerry
 *  --> isBada:						Indicates whether the platform is a Bada
 *  --> isSafari: 					Indicates whether the browser is Safari
 *  --> isMozilla: 					Indicates whether the browser is Mozilla
 *  --> isOpera:					Indicates whether the browser is Opera
 *  --> webkitVersion: 				The webkit major version
 *  --> webkitMinorVersion: 		The webkit minor version
 *  --> webkitUpdateVersion: 		The webkit update version
 *  --> browserVersion: 			The browser major version
 *  --> browserMinorVersion: 		The browser minor version
 *  --> browserUpdateVersion: 		The browser update version
 *  --> osVersion: 					The OS major version
 *  --> osMinorVersion: 			The OS minor version
 *  --> osUpdateVersion: 			The OS update version
 *  
 * Examples : 
 * |----------------------------------------------------------------------------------------------------|
 * | Plaform			| webkitV 	| wMV 	| wUV 	| browserV 	| bMV 	| bUV 	| osV 	| osMV 	| osUV 	|
 * |----------------------------------------------------------------------------------------------------|
 * |IPhone OS 3			| 528		| 18	| 0		| 4			| 0		| 0		| 3		| 1		| 2	 	|
 * |IPhone OS 2			| 525		| 18	| 1		| 3			| 1		| 1		| 2		| 2		| 1	 	|
 * |Android HTC Hero	| 528		| 5		| 0		| 3			| 1		| 2		| 1		| 5		| 0	 	|
 * |PC					| 531		| 21	| 8		| 4			| 0		| 4		| 0		| 0		| 0	 	|
 * |----------------------------------------------------------------------------------------------------|
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../_base/_base/js/base'], function(wink)
{
	var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, t, u, v, w, bb, ba, op;
	a = b = c = d = e = f = g = h = bb = ba = op = false;
	i = j= k = l = m = n = o = p = q = r = 0;
	
	var isSet = wink.isSet;
	
	var regTest = function(reg, str) {
		return RegExp(reg).test(str);
	};
	var regExec = function(reg, str) {
		return RegExp(reg).exec(str);
	};
	
	// Extracts the version number in the given string.
	//  str: the working source string
	//  reg: the regular expression that identifies the working substring
	//  separator: the separator between the version parts
	var _ext = function(str, reg, separator) {
		var result = {
			v: 0,
			r: 0,
			u: 0
		};
		var fields = regExec(reg, str);
		if (isSet(fields) && fields.length > 1)
		{
			var versionString = fields[2];
			var invalidCharacter = regExec("[^\\" + separator + "0-9]", versionString);
			if (isSet(invalidCharacter))
			{
				versionString = versionString.slice(0, invalidCharacter.index);
			}
			var version = versionString.split(separator);
			if (version.length > 0)
			{
				result.v = version[0];
			}
			if (version.length > 1)
			{
				result.r = version[1];
			}
			if (version.length > 2)
			{
				result.u = version[2];
			}
			if (version.length > 3)
			{
				result.u += "." + version[3];
			}
		}
		return result;
	};

	t = navigator || {}, u = t.userAgent, v = t.platform, w = t.appVersion;

	// Retrieve all necessary informations about the platform.
	a = regTest(" AppleWebKit/", u);
	ba = regTest(/bada/gi, u);
	op = regTest(/Opera/gi, u);
		
	if (isSet(v))
	{
		if (regTest(/iphone/i, v))
		{
			c = true;
		}
		if (regTest(/ipod/i, v))
		{
			d = true;
		}
		if (regTest(/ipad/i, v))
		{
			e = true;
		}
		if (regTest(/blackberry/i, v))
		{
			bb = true;
		}
	}

	if (isSet(w))
	{
		if (regTest(/android/i, w))
		{
			f = true;
		}
		if (regTest(/safari/i, w))
		{
			g = true;
			
			var version = _ext(w, "( Version/)([^ ]+)", ".");
			l = version.v;
			m = version.r;
			n = version.u;
		}
	}
	
	if (!g && !a)
	{
		h = regTest(/mozilla/i, u);
	}
	
	b = c || d || f || bb || ba || regTest(" Mobile/", u);
	
	if (a)
	{
		var version = _ext(u, "( AppleWebKit/)([^ ]+)", ".");
		i = version.v;
		j = version.r;
		k = version.u;
	}
	
	if (b && isSet(w))
	{
		var regvOs = f ? [ "( Android )([^ ]+)", "." ] : [ "( OS )([^ ]+)", "_" ];
		if (bb) {
			regvOs = [ "( BlackBerry )([^ ]+)", "." ];
		}
		var vOs = _ext(w, regvOs[0], regvOs[1]);
		p = vOs.v;
		q = vOs.r;
		r = vOs.u;
	}

	// Set User Agent properties
	wink.ua = 
	{
		isWebkit 				: a,
		isMobile 				: b,
		isIPhone 				: c,
		isIPod 					: d,
		isIPad 					: e,
		isIOS                   : (c || d || e),
		isAndroid 				: f,
		isBlackBerry			: bb,
		isBada                  : ba,
		isOpera                 : op,
		isSafari 				: g,
		isMozilla 				: h,
		webkitVersion 			: i,
		webkitMinorVersion 		: j,
		webkitUpdateVersion 	: k,
		browserVersion 			: l,
		browserMinorVersion 	: m,
		browserUpdateVersion 	: n,
		osVersion 				: p,
		osMinorVersion 			: q,
		osUpdateVersion 		: r
	};
	
	return wink.ua;
});