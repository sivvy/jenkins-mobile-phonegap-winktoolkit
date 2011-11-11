/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a video player
 * 
 * @methods:
 * 	--> play: start playing the current video file
 *  --> pause: stop the current video file play
 *  --> forward: change the current video time
 *  --> changeSource: change the current video file
 * 	--> getDomNode: return the dom node containing the video player 
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> state: the current state of the player (either 'play' or 'pause')
 * 	--> source: the current video source
 * 	--> customControls: whether the player displays the native controls or the custom controls
 * 	--> displayControls: whether the play/pause button is displayed
 * 	--> displayDuration: whether the time left and the duration of the file are displayed
 * 	--> displayCursor: whether the cursor is displayed
 * 	--> silentSeeking: whether the audio is stopped while the cursor is moved
 *
 * @events:
 * 	--> /videoplayer/events/play: when play is fired
 * 	--> /videoplayer/events/pause: when pause is fired
 * 
 * @properties:
 * 	data =
 * 	{
 * 		source = 
 * 		{
 * 			type = either 'file' or 'stream'
 * 			url = the file to be played (absolute or relative path)
 * 			height = the height in pixels of the video to dispaly
 *			width = the width in pixels of the video to dispaly
 *			poster = the url of the image to dispaly before playing the video
 * 		}
 * 		customControls = specify if the player should display the native controls or the custom controls (DEFAULT: 1)
 * 		displayControls = display the play/pause button (DEFAULT: 1)
 * 		displayDuration = dispaly the time left and the duration of the file (DEFAULT: 1)
 * 		displayCursor = display the cursor (DEFAULT: 1)
 * 		silentSeeking = the audio is stopped while the cursor is moved (DEFAULT: 1)
 * 	}
 * 
 * @compatibility:
 * 	--> Ipad
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */

define(['../../../_amd/core'], function(wink)
{
	wink.mm.VideoPlayer = function(properties)
	{
		this.uId                       = wink.getUId();
		
		this.state                     = this._PAUSE;
		
		this.customControls            = 1;
		this.displayControls           = 1;
		this.displayDuration           = 1;
		this.displayCursor             = 1;
		this.silentSeeking             = 1;
		
		this.source                    = {type: undefined, url: undefined, height: undefined, width: undefined, poster: undefined};
		
		this._currentDuration          = null;
		this._currentBuffering         = null;
		this._currentProgress          = null;
		
		this._checkBufferTimeout       = null;
		
		this._fileLoaded               = false;
		
		this._cursorBeginX             = 0;
		this._cursorCurrentX           = 0;
		this._cursorPosition           = 0;
		
		this._cursorDragging           = false;
		
		this._playerNode               = null;
		this._videoNode                = null;
		this._videoContainerNode       = null;
		this._progressNode             = null;
		this._progressBarNode          = null;
		this._progressBar              = null;
		this._bufferingBar             = null;
		this._cursor                   = null;
		this._playPauseButton          = null;
		this._fullScreenButton         = null;
		this._durationNode             = null;
		this._controlsNode             = null;
		this._domNode                  = null;
		
		this._resetHandler             = wink.bind(this._reset, this);
		this._onErrorHandler           = wink.bind(this._onError, this);
		this._updateDurationHandler    = wink.bind(this._updateDuration, this);
		this._updateBufferBarHandler   = wink.bind(this._updateBufferBar, this);
		this._updateProgressBarHandler = wink.bind(this._updateProgressBar, this);
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
		this._initVideoNode();
		this._initListeners();
	};
	
	wink.mm.VideoPlayer.prototype =
	{
		i18n: {},
		_PLAY: 'play',
		_PAUSE: 'pause',
		
		_STREAM: 'stream',
		_FILE: 'file',
		
		/**
		 * start playing the current video file
		 */
		play: function()
		{
			if ( this.source.url == '' ) return;
	
			this.state = this._PLAY;
			
			wink.removeClass(this._playPauseButton, 'w_button_play');
			wink.addClass(this._playPauseButton, 'w_button_pause');
			
			if ( this._cursor.style.display == 'none' && this.displayCursor == 1 && this.source.type != this._STREAM )
			{
				this._cursor.style.display = 'block';
			}
			
			this._videoNode.play();
						
			wink.publish('/videoplayer/events/play', {id: this.uId});
		},
		
		/**
		 * stop the current video file play
		 */
		pause: function()
		{	
			this.state = this._PAUSE;
			
			if ( this.customControls == 1 )
			{
				wink.removeClass(this._playPauseButton, 'w_button_pause');
				wink.addClass(this._playPauseButton, 'w_button_play');
			}
			
			this._videoNode.pause();
						
			wink.publish('/videoplayer/events/pause', {id: this.uId});
		},
		
		/**
		 * change the current video time
		 * 
		 * @parameters
		 * 	--> seconds: the number of seconds to change (+: forward ; -: rewind)
		 */
		forward: function(seconds)
		{
			this._setDuration(this._videoNode.currentTime + seconds);
			
			this._updateDuration();
			this._updateProgressBar();
		},
		
		/**
		 * change the current video source
		 * 
		 * @parameters:
		 * 	--> type: either 'file' or 'stream'
		 * 	--> url: the file to be played (absolute or relative path)
		 * 	--> height: the height of the video
		 * 	--> width: the width of the video
		 * 	--> poster: the image to dispaly before playing the video
		 */
		changeSource: function(type, url, height, width, poster)
		{
			this.source.url = url;
			this.source.type = type;
			
			this.source.height = null;
			this.source.width = null;
			this.source.poster = null;
			
			if ( wink.isSet(height) )
			{
				this.source.height = height;
			}
			
			if ( wink.isSet(width) )
			{
				this.source.width = width;
			}
			
			if ( wink.isSet(poster) )
			{
				this.source.poster = poster;
			}
			
			this._reset();
			this._deleteVideoNode();
			
			this._fileLoaded = false;
			this._currentBuffering = 0;
			
			if ( this.customControls == 1 )
			{
				this._durationNode.innerHTML = '';
				this._progressBar.style.width = '0%';
				this._bufferingBar.style.width = '0%';
				this._cursor.style.display = 'none';
			}
			
			this._initVideoNode();
		},
		
		/**
		 * return the dom node containing the video player
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * reset the video player
		 */
		_reset: function()
		{
			this._setDuration(0);
			
			this.pause();
			
			this._cursorPosition = 0;
			
			if ( this.customControls == 1 )
			{
				this._cursor.translate(this._cursorPosition, 0);
			}
			
			this._updateDuration();
			this._updateProgressBar();
		},
		
		/**
		 * toggle the play/pause button
		 */
		_tooglePlayButton: function()
		{
			if ( this.state == this._PAUSE )
			{
				this.play();
			} else
			{
				this.pause();
			}
		},
		
		/**
		 * Enter the fullscreen mode
		 */
		_enterFullScreen: function()
		{
			try
			{
				this._videoNode.webkitEnterFullScreen();
			} catch(e)
			{
				// The player may have not started
			}
		},
		
		/**
		 * Stops the videoplayer if a second videoplayer starts playing in the page
		 * 
		 * @parameters
		 *  --> params: the parameters of the '/videoplayer/events/play' event
		 */
		_cancel: function(params)
		{
			if ( params.id != this.uId )
			{
				this.pause();
			}
		},
		
		/**
		 * update the width of the buffer bar
		 */
		_updateBufferBar: function()
		{
			if ( wink.isSet(this._checkBufferTimeout))
			{
				clearTimeout(this._checkBufferTimeout);
			}
			
			if ( this.source.type != this._STREAM )
			{
				if ( !wink.isUndefined(this._progressBarNode.clientWidth) && wink.isSet(this._currentDuration) && !this._fileLoaded)
				{
					try
					{
						this._currentBuffering = this._videoNode.buffered.end();
					} catch (e)
					{
					}
					
					this._bufferingBar.style.width = ((this._currentBuffering/this._currentDuration)*100) + '%';
					
					if ( this._currentBuffering == this._currentDuration)
					{
						this._fileLoaded = true;
					} else
					{
						this._checkBufferTimeout = wink.setTimeout(this, '_updateBufferBar', 200);
					}
				} else
				{
					this._checkBufferTimeout = wink.setTimeout(this, '_updateBufferBar', 200);
				}
			}
		},
		
		/**
		 * update the width of the progress bar
		 */
		_updateProgressBar: function()
		{
			if ( this.customControls == 1 )
			{
				this._currentProgress = this._videoNode.currentTime;
				
				if ( this.source.type != this._STREAM )
				{
					if ( !wink.isUndefined(this._progressBarNode.clientWidth) && wink.isSet(this._currentDuration))
					{
						this._progressBar.style.width = ((this._currentProgress/this._currentDuration)*100) + '%';
						
						if ( !this._cursorDragging )
						{
							this._cursor.translate(((this._currentProgress/this._currentDuration)*this._progressBarNode.clientWidth), 0);
							this._cursorCurrentX = (this._currentProgress/this._currentDuration)*this._progressBarNode.clientWidth;
						}
					}
				} 
				
				this._updateDisplay();
			}
		},
		
		/**
		 * set the duration of the video file
		 * 
		 * @parameters:
		 * 	--> seconds: the time in seconds
		 */
		_setDuration: function(seconds)
		{
			try 
			{ 
				this._videoNode.currentTime = seconds;
				this._updateDuration();
			} catch(e)
			{
				// 'play' was never called
			}
		},
		
		/**
		 * retrieve the duration of the video file
		 */
		_updateDuration: function()
		{
			this._currentDuration = this._videoNode.duration;
		},
		
		/**
		 * change the time progress display
		 */
		_updateDisplay: function()
		{
			var currentTime = this._getTranslatedDuration(this._currentProgress);
			
			if ( this.source.type != this._STREAM )
			{
				var totalTime = this._getTranslatedDuration(this._currentDuration);
				this._durationNode.innerHTML = currentTime + ' / ' + totalTime;
			} else
			{
				this._durationNode.innerHTML = currentTime;
			}
		},
		
		/**
		 * return the duration translated in a comprehensive language
		 *  
		 * @parameters:
		 * 	--> duration: a duration in milliseconds
		 */
		_getTranslatedDuration: function(duration)
		{
			var s = Math.floor(duration);
			
			if ( s >= 60 )
			{
				var m = Math.floor(s/60);
				return (m + _('minutes', this) + (s-m*60) + _('seconds', this));
			} else
			{
				return (s + _('seconds', this));
			}
		},
		
		/**
		 * Convert the position of the cursor to its time value
		 * 
		 * @parameters:
		 * 	--> partial: cursor position
		 * 	--> total: progress bar container width 
		 */
		_convert: function(partial, total)
		{
			return ((partial/total) * this._currentDuration);
		},
		
		/**
		 * start dragging the cursor
		 * 
		 * @parameters:
		 * 	--> event: touch start event
		 */
		_touchStart: function(event)
		{
			this._cursorBeginX = event.x;
			this._cursorDragging = true;
			
			if ( this.state == this._PLAY && this.silentSeeking == 1 )
			{
				this._videoNode.pause();
			}
		},
		
		/**
		 * drag the cursor
		 * 
		 * @parameters:
		 * 	--> event: touch move event
		 */
		_touchMove: function(event)
		{
			if ( isNaN(this._videoNode.duration) )
			{
				return;
			}
			
			this._cursorPosition = this._cursorCurrentX + event.x - this._cursorBeginX;
			
			if ( (this._cursorCurrentX + event.x - this._cursorBeginX) >= 0 && (this._cursorCurrentX + event.x - this._cursorBeginX) <= this._progressBarNode.clientWidth)
			{
				this._cursor.translate(this._cursorPosition, 0);
				this._setDuration(this._convert(this._cursorPosition, this._progressBarNode.clientWidth));
				this._updateProgressBar();
			}
		},
		
		/**
		 * stop dragging the cursor
		 * 
		 * @parameters:
		 * 	--> event: touch end event
		 */
		_touchEnd: function(event)
		{
			this._cursorCurrentX = this._cursorPosition;
			this._cursorDragging = false;
			
			if ( this.state == this._PLAY  && this.silentSeeking == 1)
			{
				this._videoNode.play();
			}
		},
		
		/**
		 * validate the VideoPlayer properties
		 */
		_validateProperties: function()
		{
			// Check the url parameter
			if ( wink.isUndefined(this.source.url))
			{
				wink.log('[VideoPlayer] The source.url property must be set');
				return false;
			}
			
			// Check the type parameter
			if ( wink.isUndefined(this.source.type) || ( this.source.type != this._STREAM && this.source.type != this._FILE) )
			{
				wink.log('[VideoPlayer] The source.type property must be set and equal to either "stream" or "file"');
				return false;
			}
			
			// Check the video height parameter
			if ( !wink.isUndefined(this.source.height) )
			{
				if ( !wink.isInteger(this.source.height))
				{
					wink.log('[VideoPlayer] The source.height property must be an integer');
					return false;
				}
			}
			
			// Check the video width parameter
			if ( !wink.isUndefined(this.source.width) )
			{
				if ( !wink.isInteger(this.source.width))
				{
					wink.log('[VideoPlayer] The source.width property must be an integer');
					return false;
				}
			}
			
			// Check poster parameter
			if ( !wink.isUndefined(this.source.poster) )
			{
				if ( !wink.isString(this.source.poster))
				{
					wink.log('[VideoPlayer] The source.poster property must be a string');
					return false;
				}
			}
			
			// Check the controls parameter
			if ( !wink.isInteger(this.displayControls) || (this.displayControls != 0 && this.displayControls != 1) )
			{
				wink.log('[VideoPlayer] The property displayControls must be either 0 or 1');
				return false;
			}
			
			// Check the duration parameter
			if ( !wink.isInteger(this.displayDuration) || (this.displayDuration != 0 && this.displayDuration != 1) )
			{
				wink.log('[VideoPlayer] The property displayDuration must be either 0 or 1');
				return false;
			}
			
			// Check the cursor parameter
			if ( !wink.isInteger(this.displayCursor) || (this.displayCursor != 0 && this.displayCursor != 1) )
			{
				wink.log('[VideoPlayer] The property displayCursor must be either 0 or 1');
				return false;
			}
			
			// Check the silent seeking parameter
			if ( !wink.isInteger(this.silentSeeking) || (this.silentSeeking != 0 && this.silentSeeking != 1) )
			{
				wink.log('[VideoPlayer] The property silentSeeking must be either 0 or 1');
				return false;
			}
			
			// Check the custom controls parameter
			if ( !wink.isInteger(this.customControls) || (this.customControls != 0 && this.customControls != 1) )
			{
				wink.log('[VideoPlayer] The property customControls must be either 0 or 1');
				return false;
			}
		},
		
		/**
		 * Initialize the '/videoplayer/events/play' listeners
		 */
		_initListeners: function()
		{
			wink.subscribe('/videoplayer/events/play', {method: '_cancel', context: this});
		},
		
		/**
		 * Initialze the video tag
		 */
		_initVideoNode: function()
		{
			this._videoNode = document.createElement('video');
			this._videoNode.src = this.source.url;
			this._videoNode.className = 'vp_video';
			
			if ( wink.isSet(this.source.height) )
			{
				this._videoNode.style.height = this.source.height + 'px';
			}
			
			if ( wink.isSet(this.source.width) )
			{
				this._videoNode.style.width = this.source.width + 'px';
			}
			
			if ( wink.isSet(this.source.poster))
			{
				this._videoNode.poster = this.source.poster;
			}
	
			
			if ( this.customControls == 0 )
			{
				this._videoNode.controls = true;
			} else
			{
				this._videoNode.addEventListener('loadedmetadata', this._updateDurationHandler, false);
				this._videoNode.addEventListener('canplay', this._updateDurationHandler, false);
				this._videoNode.addEventListener('durationchange', this._updateBufferBarHandler, false);
				this._videoNode.addEventListener('timeupdate', this._updateProgressBarHandler, false);
				this._videoNode.addEventListener('ended', this._resetHandler, false);
				this._videoNode.addEventListener('error', this._onErrorHandler, false);
			}
			
			this._videoContainerNode.appendChild(this._videoNode);
		},
		
		/**
		 * Removes the video tag from the page
		 */
		_deleteVideoNode: function()
		{
			if ( this.customControls == 1 )
			{
				this._videoNode.removeEventListener('loadedmetadata', this._updateDurationHandler, false);
				this._videoNode.removeEventListener('canplay', this._updateDurationHandler, false);
				this._videoNode.removeEventListener('durationchange', this._updateBufferBarHandler, false);
				this._videoNode.removeEventListener('timeupdate', this._updateProgressBarHandler, false);
				this._videoNode.removeEventListener('ended', this._resetHandler, false);
				this._videoNode.removeEventListener('error', this._onErrorHandler, false);
			}
			
			this._videoContainerNode.removeChild(this._videoNode);
			
			delete this._videoNode;
		},
		
		/**
		 * Initialize the VideoPlayer DOM nodes
		 */
		_initDom: function()
		{
			// DOM Nodes
			this._domNode = document.createElement('div');
			
			this._domNode.className = 'w_box vp_container w_radius w_bg_dark';
			
			this._videoContainerNode = document.createElement('div');
			this._videoContainerNode.className = 'vp_video_container';
			
			if ( this.customControls == 1 )
			{
				this._playerNode = document.createElement('div');
				this._progressNode = document.createElement('div');
				this._progressBarNode = document.createElement('div');
				this._progressBar = document.createElement('div');
				this._bufferingBar = document.createElement('div');
				this._cursor = document.createElement('div');
				
				this._playerNode.className = 'w_layout_box vp_player';
				this._progressNode.className = 'w_box w_expand vp_progress_container';
				this._progressBarNode.className = 'w_bar w_radius w_border vp_progress';
				this._progressBar.className = 'w_bar_progress w_radius';
				this._bufferingBar.className = 'w_bar_progress w_radius vp_buffering_bar';
				this._cursor.className = 'w_icon w_button_handle vp_cursor';
				
				this._cursor.style.display = 'none';
				
				this._controlsNode = document.createElement('div');
				this._extendedControlsNode = document.createElement('div');
				this._durationNode = document.createElement('div');
				this._playPauseButton = document.createElement('input');
				
				if ( wink.ua.isIOS)
				{
					this._playPauseButton.style.position = "relative";
					this._playPauseButton.style.top = "-4px";
				}
				
				this._fullScreenButton = document.createElement('input');
				
				if ( wink.ua.isIOS)
				{
					this._fullScreenButton.style.position = "relative";
					this._fullScreenButton.style.top = "-4px";
				}
				
				this._durationNode.className = 'vp_duration';
				
				this._playPauseButton.className = 'w_icon w_button_play';
				this._fullScreenButton.className = 'w_icon w_button_zoom';
		
				this._playPauseButton.type = "button";
				this._fullScreenButton.type = "button";
				
				this._playPauseButton.onclick = wink.bind(this._tooglePlayButton, this);
				this._fullScreenButton.onclick = wink.bind(this._enterFullScreen, this);
				
				this._progressBarNode.appendChild(this._progressBar);
				this._progressBarNode.appendChild(this._bufferingBar);
				this._progressBarNode.appendChild(this._cursor);
				
				this._progressNode.appendChild(this._progressBarNode);
				
				this._controlsNode.appendChild(this._playPauseButton);
				this._extendedControlsNode.appendChild(this._fullScreenButton);
	
				this._playerNode.appendChild(this._controlsNode);
				this._playerNode.appendChild(this._progressNode);
				this._playerNode.appendChild(this._durationNode);
				this._playerNode.appendChild(this._extendedControlsNode);
				
				this._domNode.appendChild(this._videoContainerNode);
				this._domNode.appendChild(this._playerNode);
			
				if ( this.displayDuration == 0 )
				{
					this._durationNode.style.display = 'none';
				}
				
				if ( this.displayControls == 0 )
				{
					this._controlsNode.style.display = 'none';
				}
		
				// Cursor
				if ( this.displayCursor == 1 )
				{	
					wink.ux.touch.addListener(this._cursor, "start", { context: this, method: "_touchStart", arguments: null }, { preventDefault: true });
					wink.ux.touch.addListener(this._cursor, "move", { context: this, method: "_touchMove", arguments: null }, { preventDefault: true });
					wink.ux.touch.addListener(this._cursor, "end", { context: this, method: "_touchEnd", arguments: null }, { preventDefault: true });
				}
				
				window.addEventListener("orientationchange", wink.bind(this._updateProgressBar, this), false);
			} else
			{
				this._domNode.appendChild(this._videoContainerNode);
			}
		},
		
		/**
		 * In case of loading error
		 */
		_onError: function()
		{
			wink.log('[VideoPlayer] An error occured while loading the audio feed');
		}
	};
	
	return wink.mm.VideoPlayer;
});