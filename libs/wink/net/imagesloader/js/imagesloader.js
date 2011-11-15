/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement an image loader utility. You can preload images using the load method.
 * 
 * @methods:
 *	--> load: Start processing the datas. It can be a single image or an array of images
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 *
 * @events
 * 	--> /imagesloader/events/loadstart: starts preloading images (returns the data object)
 *	--> /imagesloader/events/load: an image has been loaded (returns the data object, the progress indicator and the return value of the preloading)
 *	--> /imagesloader/events/loadend: all the images have been preloaded (returns the data object)
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */
define(['../../../_amd/core'], function(wink)
{
	wink.net.ImagesLoader = function()
	{
		if (wink.isUndefined(wink.net.ImagesLoader.singleton)) 
		{
			this.uId           = 1;
			
			this._index        = 0;
			this._currentData  = null;
			this._isProcessing = false;
			this._queue        = [];
			this._images       = [];
			
			
			wink.net.ImagesLoader.singleton = this;
		} else 
		{
			return wink.net.ImagesLoader.singleton;
		}
	};
	
	wink.net.ImagesLoader.prototype =
	{
		/**
		 * Start processing the datas
		 * datas can be a single image or a collection of images
		 * 
		 * @parameters:
		 *	--> data: the image(s) you want to preload. It must be a string or an array of strings
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
		 *	--> data: the image(s) you want to be added to the queue
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
					
					wink.publish('/imagesloader/events/loadstart', {'items': this._currentData});
					
					if ( this._currentData instanceof Array)
					{
						var l = this._currentData.length;
						for ( var i=0; i<l; i++)
						{
							var image = new Image();
							
							image.src = this._currentData[i];
							image.value = i;
							image.onload = function(e)
							{
								if ( this.complete === true )
								{
									_this._processDownloadedImage(1, this.value);
								} else
								{
									_this._processDownloadedImage(-1, this.value);
								}
							};
							
							image.onerror = function(e)
							{
								_this._processDownloadedImage(-1, this.value);
							};
							
							this._images.push(image);
						}
					}
				}
			}
		},
		
		/**
		 * Handle the end of an image preloading
		 * Sends a load event containing information about the current processing progress
		 * and the status of the downloaded image
		 * 
		 * @parameters:
		 *	--> returnValue: the progress status of the current image loading
		 */
		_processDownloadedImage: function(returnValue, index)
		{
			this._index++;
		
			if ( this._index == this._currentData.length )
			{
				wink.publish('/imagesloader/events/load', {'items': this._currentData, 'currentItem': index, 'progress': 100, 'success': returnValue});
				wink.publish('/imagesloader/events/loadend', {'items': this._currentData});
				this._cleanup();
			} else
			{
				var progress = Math.floor((this._index/this._currentData.length)*100);
				wink.publish('/imagesloader/events/load', {'items': this._currentData, 'currentItem': index, 'progress': progress, 'success': returnValue});
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
			this._images       = [];
			
			this._process();
		}
	};
	
	return wink.net.ImagesLoader;
});