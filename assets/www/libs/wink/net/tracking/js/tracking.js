/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a tracking object
 *
 * @properties:
 * 	data = {
 * 		statTracker = The statistic tracker plugin (Google Analytics, Webtrends, etc).
 *                    If null value, the WINK statistic tracker plugin is used instead.
 *                    Authorized plugins defined below are : WINKStatTracker, GAStatTracker.
 * 		intervalFlush = The automatic and regular flush interval (in seconds).
 *                      Value "0" means no automatic flush.
 * 	}
 * 
 * @methods:
 *	--> flush: flush all pushed statistic tracks
 *	--> push: Push a statistic track
 *	--> reset: Reset all pushed statistic tracks
 *	--> setIntervalFlush: Set the flush interval
 *	--> setStatTracker: Set the statistic tracker plugin
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Patrick BOSSE
 */

define(['../../../_amd/core'], function(wink)
{
	wink.net.Tracking = function(properties)
	{
		this.uId            = wink.getUId();
		
		this._properties    = properties;
		this._tracks        = [];
		this._timerFlush    =  null;
		this._statTracker   = null;
		this._intervalFlush = 0;
	
		if ( this._validateProperties() === false ) return;
		
		this._initProperties();	
	
		this._start();
	};
	
	wink.net.Tracking.prototype =
	{
		/**
		 * flush all pushed statistic tracks
		 */
		flush : function()
		{
			for ( var i = 0; i < this._tracks.length; i++ )
			{
				var msg = this._tracks[i];
				this._statTracker.send(msg);
			}
	
			this.reset();
		},
	
		/**
		 * Push a statistic track
		 * 
		 * @parameters:
		 * 	--> msg: the message to track
		 */
		push : function(msg)
		{
			this._tracks.push(msg);
		},
	
		/**
		 * Reset all pushed statistic tracks
		 */
		reset : function()
		{
			this._tracks = [];
		},
	
		/**
		 * Set the flush interval 
		 * 
		 * @parameters:
		 * 	--> interval: the flush interval
		 */
		setIntervalFlush : function(interval)
		{
			this._intervalFlush = interval;
			this._setTimerFlush();
		},
	
		/**
		 * Set the statistic tracker plugin 
		 * 
		 * @parameters:
		 * 	--> statTracker: the statistic tracker plugin
		 */
		setStatTracker : function(statTracker)
		{
			this._statTracker = statTracker;
			this._statTracker.start();
		},
	
		/**
		 * Initialize datas with given properties
		 */
		_initProperties : function()
		{
			this._statTracker = this._properties.statTracker;
			this._intervalFlush = this._properties.intervalFlush;
	
			if ( !wink.isSet(this._statTracker) )
			{
				this._statTracker = new wink.net.tracking.defaulttracker({ cbAfterSend : null });
			}
		},
	
		/**
		 * Set the flush timer
		 */
		_setTimerFlush : function()
		{
			if ( this._timerFlush )
			{
				clearInterval(this._timerFlush);
			}
	
			this._timerFlush = null;
	
			if ( this._intervalFlush > 0 )
			{
				this._timerFlush = wink.setInterval(this, 'flush', this._intervalFlush * 1000);
			}
		},
	
		/**
		 * Start the statistic
		 */
		_start : function()
		{
			this._statTracker.start();
			this._setTimerFlush();
		},
	
		/**
		 * Check if the properties are correct
		 */
		_validateProperties : function()
		{
			if ( !wink.isSet(this._properties.statTracker))
			{
				wink.log("[Tracking] the statistic tracker must be a valid Statistic Tracker Object");
				return false;
			}
	
			if ( this._properties.intervalFlush < 0 )
			{
				wink.log("[Tracking] the flush interval must be greater or equal to 0");
				return false;
			}
	
			return true;
		}
	};
	
	//Bindings
	wink.net.tracking = wink.net.Tracking;
	
	/**
	 * Implement a default statistic tracker object
	 *
	 * @properties:
	 * 	data = {
	 * 		cbAfterSend = The callback method called after sending the track.
	 *                    Signature: function(response)
	 * 	}
	 *
	 * @methods:
	 *	--> send: Send a statistic track
	 *	--> start: Start the statistic tracker
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 
	 * @author:
	 * 	--> Patrick BOSSE
	 */
	wink.net.tracking.DefaultTracker = function(properties)
	{
		this.uId          = wink.getUId();
		
		this._properties  = properties;
		this._cbAfterSend = null;
	
		if ( this._validateProperties() === false ) return;
		
		this._initProperties();	
	};
	
	wink.net.tracking.DefaultTracker.prototype =
	{
		/**
		 * Send a track
		 * 
		 * @parameters:
		 * 	--> msg: the message to track
		 */
		send : function(msg)
		{
			var xhr = new wink.Xhr();
			xhr.sendData("defaulttracker.html", null, "GET", {context: this, method: "_onSuccess"}, {context: this, method: "_onFailure"});
		},
	
		/**
		 * Start the statistic tracker
		 */
		start : function()
		{
			this._init();
		},
	
	
		/**
		 * Initialize the statistic tracker
		 */
		_init : function()
		{
		},
	
		/**
		 * Initialize datas with given properties
		 */
		_initProperties : function()
		{
			this._cbAfterSend = this._properties.cbAfterSend;
		},
	
		/**
		 * Check if the properties are correct
		 */
		_validateProperties : function()
		{
			return true;
		},
		
		/**
		 * on success callback
		 * 
		 * @parameters:
		 *  -->result: the result of the xhr
		 */
		_onSuccess: function(result)
		{
			if ( result.xhrObject.responseText != "" )
			{
				if ( this._cbAfterSend )
				{
					this._cbAfterSend(result.xhrObject.responseText);
				}
			}
		},
		
		/**
		 * on failure callback
		 * 
		 * @parameters:
		 *  -->result: the result of the xhr
		 */
		_onfailure: function(result)
		{
			alert("Unable to load the page");
		}
	};
	
	return wink.net.Tracking;
});