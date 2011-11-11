/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a Google Analytics statistic tracker object
 *
 * @properties:
 * 	data = {
 * 		gaUrchinAccount = The account from Google Analytics.
 * 	}
 *
 * @methods:
 *	--> send: send a statistic track
 *	--> start: start the statistic tracker
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Patrick BOSSE
 */
define(['../../../_amd/core', './tracking'], function(wink)
{
	wink.net.tracking.GaTracker = function(properties)
	{
		this.uId              = wink.getUId();
		
		this._properties      = properties;
		this._gaTracker       = null;
		this._gaUrchinAccount = null;
		
		this._initProperties();	
	};
	
	wink.net.tracking.GaTracker.prototype =
	{
		/**
		 * Send a track
		 * 
		 * @parameters:
		 * 	--> msg: the message to track
		 */
		send : function(msg)
		{
			this._gaTracker._trackPageview(msg);
		},
	
		/**
		 * Start the statistic tracker
		 */
		start : function()
		{
			this._loadJS((("https:" == document.location.protocol) ? "https://ssl." : "http://www.") + "google-analytics.com/ga.js", this, this._init);
		},
	
		/**
		 * Initialize the statistic tracker
		 */
		_init : function()
		{
			this._gaTracker = _gat._getTracker(this._gaUrchinAccount);
		},
	
		/**
		 * Initialize datas with given properties
		 */
		_initProperties : function()
		{
			this._gaUrchinAccount = this._properties.gaUrchinAccount;
		},
	
		/**
		 * Load a JS script
		 */
		_loadJS : function(url, ctx, cb)
		{
			var script = document.createElement("script");
			script.src = url;
			script.onload = script.onreadystatechange = function()
			{
				if ( !this.readyState || (this.readyState == "loaded") || (this.readyState == "complete") )
				{
					cb.apply(ctx, []);
				}
			};
			document.body.appendChild(script);
			script = null;
		}
	};
	
	return wink.net.tracking.GaTracker;
});