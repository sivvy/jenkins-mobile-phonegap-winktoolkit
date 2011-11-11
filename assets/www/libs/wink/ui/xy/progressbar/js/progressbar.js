/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a progress bar
 * 
 * @methods:
 *	--> setValue: set the current value of the progress bar (between 0 and 100)
 *	--> setBorderColor: change the border color of the progress bar
 *	--> setProgressBarColor: change the color of the progress bar background
 *	--> setProgressBarImage: change the background image of the progress bar
 *	--> getDomNode: returns the DOM node containing the progress bar
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> value: the current value of the progress bar
 * 	--> height: the height in pixels of the progress bar	
 * 	--> width: the width in pixels of the progress bar
 * 	--> borderColor: the border color of the progress bar
 * 	--> progressBarColor: the color of the progress bar background
 * 	--> progressBarImage: the progress bar background image
 *
 * @events
 * 	--> /progressbar/events/end: the progress bar is to 100%
 *	
 * @properties:
 * 	data = 
 * 	{
 * 		value = the initial value of the progress bar
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
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.ProgressBar = function(properties)
	{
		this.uId              = wink.getUId();
		
		this.value            = 0;
		
		this.borderColor      = null;
		this.progressBarColor = null;
		this.progressBarImage = {type: undefined, image: undefined};
		
		this.height           = 15;
		this.width            = 200;
		
		this._pBNode          = null;
		this._pBContentNode   = null;
		
		wink.mixin(this, properties);
	
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
	};
	
	wink.ui.xy.ProgressBar.prototype = 
	{
		/**
		 * update the progress bar display
		 * 
		 * @parameters:
		 * 	--> value: the value in percentage (between 0 and 100) of the progress bar
		 */
		setValue: function(value)
		{
			if ( value >= 0 && value <= 100 )
			{
				this.value = value;
				this._updateProgressView();
			}
		},
		
		/**
		 * change the border color of the progress bar
		 * 
		 * @parameters:
		 * 	--> color: the color of the border
		 */
		setBorderColor: function(color)
		{
			this.borderColor = color;
			this._pBNode.style.borderColor = this.borderColor;
		},
		
		/**
		 * change the color of the progress bar background
		 * 
		 * @parameters:
		 * 	--> color: the color of the background
		 */
		setProgressBarColor: function(color)
		{
			this.progressBarColor = color;
			this._pBContentNode.style.backgroundColor = this.progressBarColor;
		},
		
		/**
		 * change the background image of the progress bar
		 * 
		 * @parameters:
		 * 	--> image =
		 * 	{
		 * 		image = the background image of the progress bar encoded in base64 (default value is null)
		 * 		type = type of the image (e.g.: gif, png)
		 * 	}
		 */
		setProgressBarImage: function(image)
		{
			this.progressBarImage = image;
			wink.fx.apply(this._pBContentNode, {
				backgroundImage: 'url(data:image/' + this.progressBarImage.type + ';base64,' + this.progressBarImage.image + ')',
				backgroundRepeat: 'repeat-x'
			});
		},
		
		/**
		 * Returns the DOM node containing the accordion
		 */
		getDomNode: function()
		{
			return this._pBNode;
		},
		
		/**
		 * Update the width value of the progress bar
		 */
		_updateProgressView: function()
		{
			this._pBContentNode.style.width = this.value + '%';
		},
		
		/**
		 * Validates the properties
		 */
		_validateProperties: function()
		{
			if ( !wink.isNumber(this.height) || this.height < 0 )
			{
				wink.log('[ProgressBar] height must be a positive value');
				return false;
			}
				
			if ( !wink.isNumber(this.width) || this.width < 0 )
			{
				wink.log('[ProgressBar] width must be a positive value');
				return false;
			}
				
			if ( !wink.isNumber(this.value) || (this.value < 0 && this.value > 100) )
			{
				wink.log('[ProgressBar] initValue must be a value between 0 and 100');
				return false;
			}
		},
		
		/**
		 * Fire an end event when the progress bar get to 100%
		 */
		_handleTransitionEnd: function()
		{
			if ( this._pBContentNode.style.width == '100%' )
			{
				wink.publish('/progressbar/events/end', null);
			}
		},
		
		/**
		 * Initialize the progress bar DOM nodes
		 */
		_initDom: function()
		{
			var pb = this._pBNode = document.createElement('div');
			var pbc = this._pBContentNode = document.createElement('div');
			
			var pBNodeSt = {
				height: this.height + 'px',
				width: this.width + 'px'
			};
			
			var pBContentNodeSt = {
				'height': this.height + 'px',
				'width': '0%',
				'transition-property': 'width',
				'transition-duration': '800ms',
				'transition-timing-function': 'linear'
			};
			
			if ( wink.isSet(this.borderColor) )
			{
				pBNodeSt.borderColor = this.borderColor;
			}
			
			if ( wink.isSet(this.progressBarColor) )
			{
				pBContentNodeSt.background = this.progressBarColor;
			}
			
			if ( wink.isSet(this.progressBarImage.type) && wink.isSet(this.progressBarImage.image) )
			{
				pBContentNodeSt.backgroundImage = 'url(data:image/' + this.progressBarImage.type + ';base64,' + this.progressBarImage.image + ')';
				pBContentNodeSt.backgroundRepeat = 'repeat-x';
			}
	
			wink.addClass(pb, 'w_bar w_radius w_border');
			wink.addClass(pbc, 'w_bar_progress w_radius');
			
			wink.fx.apply(pb, pBNodeSt);
			wink.fx.apply(pbc, pBContentNodeSt);
			
			pb.appendChild(pbc);
			
			wink.fx.onTransitionEnd(pbc, wink.bind(this._handleTransitionEnd, this));
		}
	};
	
	return wink.ui.xy.ProgressBar;
});