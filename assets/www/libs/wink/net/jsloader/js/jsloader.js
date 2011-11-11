/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a script loader utility. You can preload scripts using the load method.
 * 
 * @methods:
 *	--> load: Start processing the datas. It can be a single script source or an array of script sources
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 
 * @events
 * 	--> /jsloader/events/loadstart: starts preloading scripts (returns the data object)
 *	--> /jsloader/events/load: a script has been loaded (returns the data object, the progress indicator and the return value of the preloading)
 *	--> /jsloader/events/loadend: all the scripts have been preloaded (returns the data object)
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */
define(['../../../_amd/core'], function(wink)
{
	wink.net.JsLoader = function()
	{
		if (wink.isUndefined(wink.net.JsLoader.singleton)) 
		{
			this.uId           = 1;
			
			this._index        = 0;
			this._currentData  = null;
			this._isProcessing = false;
			this._queue        = [];
	
			wink.net.JsLoader.singleton = this;
			
		} else
		{
			return wink.net.JsLoader.singleton;
		}
	};
	
	wink.net.JsLoader.prototype =
	{
		/**
		 * Start processing the datas
		 * datas can be a single script or a collection of scripts
		 * 
		 * @parameters:
		 *	--> data: the script(s) you want to preload. It must be a string or an array of strings
		 */
		load: function(data)
		{
			this._addToQueue(data);
			this._process();
		},
		
		/**
		 * Add the datas to the processing queue
		 * 
		 * @parameters:
		 *	--> data: the script(s) you want to be added to the queue
		 */
		_addToQueue: function(data)
		{
			if ( wink.isString(data) )
				data = [data];
			
			if ( wink.isArray(data) )
				this._queue.push(data);
		},
		
		/**
		 * Starts processing the eldest element in the queue if no processing is already ongoing
		 */
		_process: function()
		{
			var _this = this;
		
			if ( this._isProcessing === false )
			{
				if ( this._queue.length > 0 )
				{
					this._isProcessing = true;
					
					this._currentData = this._queue[0];
					this._queue.splice(0, 1);
					
					wink.publish('/jsloader/events/loadstart', {'items': this._currentData});
					
					if ( this._currentData instanceof Array)
					{
						var l = this._currentData.length;
						for ( var i=0; i<l; i++)
						{
							var script = document.createElement('script');
							script.type = 'text/javascript';
							script.src = this._currentData[i];
							script.value = i;
							
							script.onload = function ()
							{
								_this._processDownloadedScript(1, this.value);
							};
							
							script.onerror = function ()
							{
								_this._processDownloadedScript(-1, this.value);
							};
							
							document.getElementsByTagName("head")[0].appendChild(script);
						}
					}
				}
			}
		},
		
		/**
		 * Handle the end of a script preloading
		 * Sends a load event containing information about the current processing progress
		 * and the status of the downloaded script
		 * 
		 * @parameters:
		 *	--> returnValue: the progress status of the current script loading
		 */
		_processDownloadedScript: function(returnValue, index)
		{
			this._index++;
		
			if ( this._index == this._currentData.length )
			{
				wink.publish('/jsloader/events/load', {'items': this._currentData, 'currentItem': index, 'progress': 100, 'success': returnValue});
				wink.publish('/jsloader/events/loadend', {'items': this._currentData});
				this._cleanup();
			} else
			{
				var progress = Math.floor((this._index/this._currentData.length)*100);
				wink.publish('/jsloader/events/load', {'items': this._currentData, 'currentItem': index, 'progress': progress, 'success': returnValue});
			}
		},
		
		/**
		 * Cleans the objects variables after an element in the queue has been entirely processed
		 * Start processing the next element in queue
		 */
		_cleanup: function()
		{
			this._index        = 0;
			this._currentData  = null;
			this._isProcessing = false;
			
			this._process();
		}
	};
	
	return wink.net.JsLoader;
});