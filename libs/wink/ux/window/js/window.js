/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements the window component that captures resize and scroll events and warns listeners of changes.
 * It Handles these properties: screenWidth, screenHeight, fullWidth, fullHeight, width, height, orientation
 *
 * @attributes:
 * 	--> height: the height of the visible area
 * 	--> width: the width of the visible area
 * 	--> fullHeight: the height of the content
 * 	--> fullWidth: the width of the content
 *	--> screenHeight: the height of the screen
 *	--> screenWidth: the width of the screen
 *	--> orientation: the orientation of the window ("horizontal" or "vertical")
 * 
 * @events
 * 	--> /window/events/resize				: when the window is resized
 * 	--> /window/events/orientationchange	: when the orientation changes
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_amd/core'], function(wink)
{
	wink.ux.window =
	{
		height: null,
		width: null,
		
		fullHeight: null,
		fullWidth: null,
		
		screenHeight: screen.height,
		screenWidth: screen.width,
		
		orientation: null,
		
		_i: null,
		
		_V: "vertical",
		_H: "horizontal",
			
		/**
		 * Initialize the component
		 */
		_init: function()
		{
			var h = wink.bind(this._updateData, this);
			
			if ( "onorientationchange" in window )
			{
				window.addEventListener("orientationchange", h, true);
			} else
			{
				window.addEventListener("resize", h, true);
			}
			
			if ( wink.ua.isAndroid )
			{
				scrollTo(0, 1, 0);
				this._i = setInterval(h, 1000);
			} else
			{
				window.addEventListener("scroll", h, true);
			}
			
			h();
		},
		
		/**
		 * Watch for changes
		 */
		_updateData: function()
		{
			var w = window.innerWidth;
			var h = window.innerHeight;
			
			var b = false;
	
			if ( (this.width+2 < w || this.width-2 > w) || (this.height+2 < h || this.height-2 > h ) )
			{
				b = true;
			}
			
			this._updateSize();
			this._updateOrientation();
			
			if ( b )
			{
				wink.publish("/window/events/resize", {height: h, width: w, orientation: this.orientation});
			}
		},
		
		/**
		 * Update the window size
		 */
		_updateSize: function()
		{
			this.height = window.innerHeight;
			this.width 	= window.innerWidth;
			
			try
			{
				this.fullHeight = document.body.scrollHeight;
				this.fullWidth = document.body.scrollWidth;
			} catch(e)
			{
				// document.body does not exist
			}
		},
		
		/**
		 * Update the orientation
		 */
		_updateOrientation: function()
		{
			var o;
	
			if ( wink.isSet(window.orientation) && wink.ua.isIOS )
			{
				if ( Math.abs(window.orientation) == 90 )
				{
					o = this._H;
				} else
				{
					o = this._V;
				}
			} else
			{
				if ( this.width > this.height )
				{
					o = this._H;
				} else
				{
					o = this._V;
				}
			}
	
			if ( o != this.orientation )
			{
				this.orientation = o;
				wink.publish("/window/events/orientationchange", {height: this.height, width: this.width, orientation: this.o});
			}
		}
	};
	
	window.addEventListener("DOMContentLoaded", function(){wink.ux.window._init();});
	
	/**
	 * DEPRECATED
	 */
	wink.ux.Window = function()
	{
		wink.log('[Deprecated] use wink.ux.window instead');
		
		this.getProperties = function()
		{
			wink.log('[Deprecated] use wink.ux.window properties instead');
			
			var p =
			{
				screenWidth: wink.ux.window.screenWidth,
				screenHeight: wink.ux.window.screenHeight,
				width: wink.ux.window.width,
				height:  wink.ux.window.height,
				orientation:  wink.ux.window.orientation
			};
			
			return p;
		};
	};
	
	return wink.ux.window;
});