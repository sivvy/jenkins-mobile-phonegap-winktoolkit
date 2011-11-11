/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a smart loader utility. You can preload scripts, styles and images using the load method. The smart loader uses a progress bar to give the user a feedback on the current load
 * 
 * @methods:
 *	--> load: Start processing the datas. It can be a single script source or an array of script sources. Idem for images and styles
 *	--> getDomNode: return the dom node containing the progressbar
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 
 * @events
 * 	--> /smartloader/events/loadend: all the datas have been preloaded 
 *
 * @properties:
 * 	data = 
 * 	{
 * 		height = the height in pixels of the progress bar (default value is 5px)	
 * 		width = the width in pixels of the progress bar (default value is 200px)
 * 		borderColor = the border color of the progress bar (default value is #ff0000)
 * 		progressBarColor = the color of the progress bar background (default value is #ff5500)
 * 		progressBarImage = 
 * 		{
 * 			image = the background image of the progress bar encoded in base64 (default value is null)
 * 			type = type of the image (e.g.: gif, png)
 * 		}
 *	}
 *
 * @dependencies:
 * 	--> wink.ui.xy.ProgressBar
 * 	--> wink.net.CssLoader
 * 	--> wink.net.JsLoader
 * 	--> wink.net.ImagesLoader
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_amd/core', '../../imagesloader/js/imagesloader', '../../cssloader/js/cssloader', '../../jsloader/js/jsloader', '../../../ui/xy/progressbar/js/progressbar'], function(wink)
{
	wink.net.SmartLoader = function(properties)
	{
		if (wink.isUndefined(wink.net.SmartLoader.singleton)) 
		{
			this.uId                    = 1;
			
			this._imagesQueue           = [];
			this._cssQueue              = [];
			this._jsQueue               = [];
			
			this._progressBar           = null;
			this._progressBarProperties = properties;
			
			this._imagesLoader          = new wink.net.ImagesLoader();
			this._cssLoader             = new wink.net.CssLoader();
			this._jsLoader              = new wink.net.JsLoader();
			
			this._progressTimer         = null;
			
			this._domNode               = null;
			
			
			this._subscribeToEvents();
			this._initDom();
			
			wink.net.SmartLoader.singleton = this;
		} else
		{
			return wink.net.SmartLoader.singleton;
		}
	};
	
	wink.net.SmartLoader.prototype = 
	{	
		/**
		 * Start processing the datas
		 * datas can be a single script or a collection of scripts. Idem for images and styles
		 * 
		 * @parameters:
		 *	--> data =
		 *		{
		 *			scripts = the script(s) you want to preload. It must be a string or an array of strings
		 *			styles = the stylesheet(s) you want to preload. It must be a string or an array of strings
		 *			images = the image(s) you want to preload. It must be a string or an array of strings
		 *		}
		 */
		load: function(data)
		{
			this._addToQueue(data);
			this._process();
		},
		
		/**
		 * return the dom node containing the progressbar
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Add the datas to the processing queues
		 * 
		 * @parameters:
		 *	--> data =
		 *		{
		 *			scripts = the script(s) you want to preload. It must be a string or an array of strings
		 *			styles = the stylesheet(s) you want to preload. It must be a string or an array of strings
		 *			images = the image(s) you want to preload. It must be a string or an array of strings
		 *		}
		 */
		_addToQueue: function(data)
		{
			if ( wink.isSet(data.images) )
			{
				if ( wink.isString(data.images) )
					data.images = [data.images];
		
				this._imagesQueue = data.images;
			}
			
			if ( wink.isSet(data.scripts) )
			{
				if ( wink.isString(data.scripts) )
					data.scripts = [data.scripts];
		
				this._jsQueue = data.scripts;
			}
			
			if ( wink.isSet(data.styles) )
			{
				if ( wink.isString(data.styles) )
					data.styles = [data.styles];
		
				this._cssQueue = data.styles;
			}
		},
		
		/**
		 * Start processing all the contents
		 */
		_process: function()
		{
			this._progressBar.setValue(0);
			
			if ( this._jsQueue.length > 0 )
			{
				this._jsLoader.load(this._jsQueue);
			} else
			{
				this._jsLoaded({'progress': 100});
			}
		},
		
		/**
		 * callback method called when a script has been loaded or when there is no script to load
		 * 
		 * @parameters: 
		 * 	--> params = the return value of a '/jsloader/events/load' event
		 */
		_jsLoaded: function(params)
		{
			var progress = params.progress;
			
			if ( progress == 100 )
			{
				this._progressBar.setValue(33);
				
				if ( this._cssQueue.length > 0 )
				{
					this._cssLoader.load(this._cssQueue);
				} else
				{
					this._cssLoaded({'progress': 100});
				}
			} else
			{
				progress = Math.floor(0.33*progress);
				this._progressBar.setValue(progress);
			}
		},
		
		/**
		 * callback method called when a stylesheet has been loaded or when there is no stylesheet to load
		 * 
		 * @parameters: 
		 * 	--> params = the return value of a '/cssloader/events/load' event
		 */
		_cssLoaded: function(params)
		{
			var progress = params.progress;
			
			if ( progress == 100 )
			{
				this._progressBar.setValue(66);
				
				if ( this._imagesQueue.length > 0 )
				{
					this._imagesLoader.load(this._imagesQueue);
				} else
				{
					this._imagesLoaded({'progress': 100});
				}
			} else
			{
				progress = Math.floor(0.33*progress);
				this._progressBar.setValue((33+progress));
			}
		},
		
		/**
		 * callback method called when an image has been loaded or when there is no image to load
		 * 
		 * @parameters: 
		 * 	--> params = the return value of a '/imageloader/events/load' event
		 */
		_imagesLoaded: function(params)
		{
			var progress = params.progress;
			
			if ( progress == 100 )
			{
				this._progressBar.setValue(100);
				this._progressTimer = wink.setTimeout(this, '_cleanup', 800);
			} else
			{
				progress = Math.floor(0.33*progress);
				this._progressBar.setValue((66+progress));
			}
		},
		
		/**
		 * Initialize the progress bar DOM nodes
		 */
		_initDom: function()
		{
			this._progressBar = new wink.ui.xy.ProgressBar(this._progressBarProperties);
			
			this._domNode = document.createElement('div');
			this._domNode.className = 'sld_container';
			
			var container = document.createElement('div');
			container.style.width = this._progressBar._width + 'px';
			container.appendChild(this._progressBar.getDomNode());
			
			this._domNode.appendChild(container);
		},
		
		/**
		 * Subscribe to the CSSLoader, JSLoader and ImagesLoader 'load' events
		 */
		_subscribeToEvents: function()
		{
			wink.subscribe('/imagesloader/events/load', {context: this, method: '_imagesLoaded'});
			wink.subscribe('/cssloader/events/load', {context: this, method: '_cssLoaded'});
			wink.subscribe('/jsloader/events/load', {context: this, method: '_jsLoaded'});
		},
		
		/**
		 * Cleans the objects variables after the contents have been entirely processed
		 * Warn the user the the progress bar got to 100%
		 */
		_cleanup: function()
		{
			this._imagesQueue  = [];
			this._cssQueue     = [];
			this._jsQueue      = [];
			
			clearTimeout(this._progressTimer);
			
			wink.publish('/smartloader/events/loadend', null);
		}
	};
	
	return wink.net.SmartLoader;
});