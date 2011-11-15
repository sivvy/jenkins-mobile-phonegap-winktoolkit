/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The Fixed layout implements a layout with "fixed" header and/or footer. 
 * There are two implementations depending on whether the fixed position is supported.
 * If it is supported, then it is a native behavior that does not include public property.
 * 
 * @properties: 
 *  data = 
 *  { 
 *  	target: 			page target id 
 *  	header: 			[optional] header DOM id
 *  	footer: 			[optional] footer DOM id
 *  	nativeFixed:		[optional] false to enable the default implementation even if the fixed positioning is supported
 *  	displayDuration: 	[optional] the duration of the opacity transition when bars appear (default: 0)
 *  	moveDuration: 		[optional] the duration of the top transition when bars are partially visible (cut) (default: 0)
 *  	preventTouchBar: 	[optional] prevents from moving the bars with touch (default: true)
 *  	activated: 			[optional] indicates if the layout is activated (default: true)
 *  	showHideOnClick:	[optional] allows to show / hide the bars on click (default: false)
 *  	urlBarShorcutHeight:[optional] used when a shortcut is displayed for the url bar (default: 0)
 *  	scrollAtStart:		[optional] Indicates if the component needs to listen the start event in order to hide bars properly (default: false)
 *  }
 * 
 * @methods: 
 * 	--> enable: Enables the bars position updates
 * 	--> disable: Disables the bars position updates
 * 	--> scrollTo: Scroll explicitly to the given position
 * 	--> getPosition: Returns the current y position
 * 	--> refreshView: Refresh the view. This can be useful after a change of view
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> displayDuration: see instanciation properties
 * 	--> moveDuration: see instanciation properties
 * 	--> preventTouchBar: see instanciation properties
 * 	--> activated: see instanciation properties
 *  
 * @dependencies:
 *  --> wink.ux.window
 * 
 * @compatibility
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6
 * 
 * @author: 
 * 	--> Donatien LEBARBIER, Sylvain LALANDE
 */
define(['../../../../_amd/core', '../../../../ux/window/js/window'], function(wink)
{
	wink.ui.layout.FixedLayout = function(properties) 
	{
		/**
		 * ---------------------------------------------------------------------------------------------------------
		 * shared objects and methods
		 * ---------------------------------------------------------------------------------------------------------
		 */
		
		var _window = window,
			_undef = wink.isUndefined,
			_isset = wink.isSet,
			_isnull = wink.isNull,
			_isint = wink.isInteger,
			_isbool = wink.isBoolean,
			_addclass = wink.addClass,
			_hasHeader = false,
			_hasFooter = false,
			_header = null,
			_footer = null,
			_target = null,
			_headerStyle = null,
			_footerStyle = null,
			_paddingTop = null,
			_paddingBottom = null;
		
		/**
		 * Scroll explicitly to the given position
		 * 
		 * @parameters: 
		 * 	--> y: y targeted coordinates
		 */
		var _scrollTo = function(y) 
		{
			_window.scrollTo(0, y);
		};
		
		/**
		 * Check if the properties are correct
		 */
		var _validateProperties = function() 
		{
			var _p = this,
				_target = _p.target,
				_header = _p.header,
				_footer = _p.footer,
				_displayDuration = _p.displayDuration,
				_moveDuration = _p.moveDuration,
				_activated = _p.activated,
				_raisePropertyError = function(property) {
					wink.log('[FixedLayout] Error: ' + property + ' missing or invalid');
				};
			
			if (_undef(_target) || _isnull($(_target)))
			{
				_raisePropertyError('target');
				return false;
			}
			if (_isset(_header) && _isnull($(_header))) 
			{
				_raisePropertyError('header');
				return false;
			}
			if (_isset(_footer) && _isnull($(_footer))) 
			{
				_raisePropertyError('footer');
				return false;
			}
			if (_isset(_displayDuration) && !_isint(_displayDuration)) 
			{
				_raisePropertyError('displayDuration');
				return false;
			}
			if (_isset(_moveDuration) && !_isint(_moveDuration)) 
			{
				_raisePropertyError('moveDuration');
				return false;
			}
			if (_isset(_activated) && !_isbool(_activated)) 
			{
				_raisePropertyError('activated');
				return false;
			}
			return true;
		};
		
		/**
		 * Shared init properties
		 */
		var _sharedInitProperties = function()
		{
			_hasHeader = _isset(this.header);
			_hasFooter = _isset(this.footer);
			
			_target = $(this.target);
			_addclass(_target, 'fl_target');
			
			if (_hasHeader) 
			{
				_header = $(this.header);
				_addclass(_header, 'fl_bar');
				_headerStyle = _header.style;
			}
			if (_hasFooter) 
			{
				_footer = $(this.footer);
				_addclass(_footer, 'fl_bar');
				_footerStyle = _footer.style;
			}
			_updatePaddings.call(this);
		};

		/**
		 * Updates the target paddings
		 */
		var _updatePaddings = function()
		{
			var _ts = _target.style;
			_paddingTop = this.paddingTop;
			_paddingBottom = this.paddingBottom;

			if (_hasHeader)
			{
				_ts.paddingTop = (_isset(_paddingTop) ? _paddingTop : _header.offsetHeight) + 'px';
			}
			if (_hasFooter)
			{
				_ts.paddingBottom = (_isset(_paddingBottom) ? _paddingBottom : _footer.offsetHeight) + 'px';
			}
		};
	
		/**
		 * ---------------------------------------------------------------------------------------------------------
		 * position-fixed supported implementation
		 * ---------------------------------------------------------------------------------------------------------
		 */
		var FixedLayoutPF = (function(properties) {
			var _instance = null;
			
			var impl = function(properties) 
			{
				_instance = this;
				_instance.uId = wink.getUId();
				wink.mixin(_instance, properties);

				if (_validateProperties.call(_instance) === false) 
				{
					return;
				}
				
				_initProperties();
			};
			impl.prototype = 
			{
				/**
				 * Enables the bars position updates
				 */
				enable: function() {},
				
				/**
				 * Disables the bars position updates
				 */
				disable: function() {},
				
				/**
				 * Returns the current y position
				 */
				getPosition: function() 
				{
					return _window.pageYOffset;
				},
				
				/**
				 * Refresh the view. This can be useful after a change of view.
				 */
				refreshView: function() 
				{
					_updatePaddings.call(this);
				},
				
				/**
				 * Scroll explicitly to the given position
				 */
				scrollTo: _scrollTo
			};
			/**
			 * Initialize datas with given properties
			 */
			var _initProperties = function() 
			{
				_sharedInitProperties.call(_instance);
				if (_hasHeader) 
				{
					_addclass(_header, 'fl_header fixed');
				}
				if (_hasFooter) 
				{
					_addclass(_footer, 'fl_footer fixed');
				}
			};
			return impl;
		})();
		
		/**
		 * ---------------------------------------------------------------------------------------------------------
		 * position-fixed not supported implementation
		 * ---------------------------------------------------------------------------------------------------------
		 */
		var FixedLayoutDefault = (function(properties) {
			var _instance = null;
			
			var impl = function(properties) 
			{
				_instance = this;
				_instance.uId = wink.getUId();
		
				_instance.displayDuration = 0;
				_instance.moveDuration = 0;
				_instance.preventTouchBar = true;
				_instance.activated = true;
				_instance.showHideOnClick = false;
				_instance.urlBarShorcutHeight = 0;
				_instance.scrollAtStart = false;
				
				wink.mixin(_instance, properties);
				
				_scrollAtStart = _instance.scrollAtStart;
				
				if (_validateProperties.call(_instance) === false) 
				{
					return;
				}
				
				_initProperties();
				_initListeners();
				
				if (_instance.activated)
				{
					_handleScroll();
				}
			};
		
			impl.prototype = 
			{
				/**
				 * Enables the bars position updates
				 */
				enable: function() 
				{
					_instance.activated = true;
				},
		
				/**
				 * Disables the bars position updates
				 */
				disable: function() 
				{
					_instance.activated = false;
					_stopScrolling();
				},
		
				/**
				 * Returns the current y position
				 */
				getPosition: function() 
				{
					return _scrollY;
				},
		
				/**
				 * Refresh the view. This can be useful after a change of view.
				 */
				refreshView: function() 
				{
					_updatePaddings.call(this);
					_handleScroll();
				},
				
				/**
				 * Scroll explicitly to the given position
				 */
				scrollTo: _scrollTo
			};
			
			var _addlistener = wink.ux.touch.addListener,
				_isAndroid = wink.ua.isAndroid,
				
				_scrollY = null,
				_isScrolling = false,
				_startBarEvent = null,
				_endBarEvent = null,
				_stateHidden = false,
				_scrollTestInterval = null,
				_testInterval = 300,
				_headerTop = null,
				_footerTop = null,
				
				_scrollAtStart = false, // Needs to listen start event to hide bars properly
				_moveStarted = true,
				_scrollDuration = 0,
				_clickPhase = false,
				
				_hasTouchStart = wink.has('touchstart'),
				_hasTouchMove = wink.has('touchmove'),
				_prefixStyle = "Webkit", // TODO adds properties in feature detection
				_transitionStyle = _prefixStyle + 'Transition',
				_animationStyle = _prefixStyle + 'Animation';
			
			/**
			 * Handles the scroll
			 * 
			 * @parameters:
			 * 	--> event: the event
			 * 	--> noreset: whether a position reset is needed
			 */
			var _handleScroll = function(event, noreset) 
			{
				if (!_instance.activated) 
				{
					return;
				}
				if (!noreset)
				{
					// Reset Bars Position - importance in the order of lines of code:
					// priority should be given to visibility job in order to hide the bars ASAP and prevent bar glued
					if (!_stateHidden && !_isScrolling)
					{
						if (_hasHeader) 
						{
							_headerStyle.visibility = 'hidden';
						}
						if (_hasFooter) 
						{
							_footerStyle.visibility = 'hidden';
						}
						if (_hasHeader) 
						{
							var _pos = 0;
							if (_headerTop != _pos)
							{
								_headerStyle.top = _pos + 'px';
								_headerStyle[_transitionStyle] = '';
								_headerStyle[_animationStyle] = '';
								_headerTop = _pos;
							}
							_headerStyle.visibility = '';
						}
						if (_hasFooter) 
						{
							var _pos = (_target.offsetHeight - _footer.offsetHeight);
							if (_footerTop != _pos)
							{
								_footerStyle.top = _pos + 'px';
								_footerStyle[_transitionStyle] = '';
								_footerStyle[_animationStyle] = '';
								_footerTop = _pos;
							}
							_footerStyle.visibility = '';
						}
					}
				}
				
				if (_scrollAtStart && event && event.type && event.type != "start") {
					_moveStarted = true;
				}
				
				_startScrolling();
			};
	
			/**
			 * Starts scrolling
			 */
			var _startScrolling = function() 
			{
				if (_isScrolling)
				{
					return;
				}
				_isScrolling = true;
				_scrollDuration = 0;
				_scrollTestInterval = wink.setInterval(_delegate, '_scrollTest', _testInterval);
			};
			
			/**
			 * Stops scrolling
			 */
			var _stopScrolling = function()
			{
				if (_scrollTestInterval) {
					clearInterval(_scrollTestInterval);
					_scrollTestInterval = null;
				}
				_isScrolling = false;
				if (_scrollAtStart)
				{
					_moveStarted = false;
				}
			};
	
			/**
			 * Test if still scrolling
			 */
			var _scrollTest = function() 
			{
				if (_scrollAtStart && !_stateHidden)
				{
					// As long as no event occurs indicating a scroll, we dont act on bars.
					// Beyond a certain period, it is no longer justified if we consider the following:
					// - there is no scroll / move
					// - there is a scroll with no associated events (android issue)
					_scrollDuration += _testInterval;
					if (!_moveStarted && (_scrollDuration < 500))
					{
						return;
					}
				}
				
				var _wy = _window.pageYOffset;
				if (_scrollY != _wy) 
				{
					_scrollY = _wy;
				}
				else 
				{
					_stopScrolling();
					if (_scrollAtStart && _clickPhase) {
						_clickPhase = false;
						return;
					}
					_positionBars();
				}
			};
	
			/**
			 * Position the bars at the current position
			 */
			var _positionBars = function() 
			{
				var windowHeight = _window.innerHeight,
					_by = _scrollY + windowHeight;
				
				if (_hasHeader) 
				{
					var _withMove = false,
						_pos = _scrollY,
						_shorcutHeight = _instance.urlBarShorcutHeight;
					
					if (_shorcutHeight > 0 && _scrollY > 0)
					{
						_pos += _shorcutHeight;
					}
					
					if (_pos != _headerTop)
					{
						if (!_stateHidden && _instance.moveDuration > 0)
						{
							var _hot = _header.offsetTop,
								_hoh = _header.offsetHeight, 
								_hUnderTop = ((_hot + _hoh) > _scrollY), 
								_hAboveBottom = (_hot <= _scrollY); // (_hot < _by)
							_withMove = (_hUnderTop && _hAboveBottom); // consider visible as cut by window top line;
						}
						_headerTop = _pos;
						_positionBar(_header, _pos, _withMove);
					}
				}
	
				if (_hasFooter) 
				{
					var _withMove = false,
						_foh = _footer.offsetHeight,
						_pos = (_by - _foh);
					
					if (_pos != _footerTop)
					{
						if (!_stateHidden && _instance.moveDuration > 0)
						{
							var _fot = _footer.offsetTop,
								_fUnderTop = ((_fot + _foh) >= _by), // ((_fot + _foh) > _scrollY)
								_fAboveBottom = (_fot < _by); 
							_withMove = (_fUnderTop && _fAboveBottom); // consider visible as cut by window bottom line;
						}
						_footerTop = _pos;
						_positionBar(_footer, _pos, _withMove);
					}
				}
			};
			
			/**
			 * Position a bar at the computed position with the good effect
			 * 
			 * @parameters:
			 *  --> node: the node to position
			 * 	--> y: the y position
			 * 	--> withMove: indicates the preference to have a move animation instead of a fade animation
			 */
			var _positionBar = function(node, y, withMove) {
				var _nstyle = node.style;
				if (!_stateHidden)
				{
					if (withMove)
					{
						wink.fx.applyTransition(node, 'top', _instance.moveDuration + 'ms', '0ms', 'ease-in');
					}
					else
					{
						if (_instance.displayDuration > 0)
						{
							_applyAnim(_nstyle);
						}
					}
				}
				_nstyle.top = y + 'px';
			};
			
			/**
			 * @parameters:
			 *  --> reverse: Determines whether the animation should play in reverse
			 */
			var _applyAnim = function(style, reverse)
			{
				style[_animationStyle] = (reverse ? 'opacity-inv' : 'opacity') + ' ' + _instance.displayDuration + 'ms';
				style['opacity'] = reverse ? 0 : 1;
			};
			
			/**
			 * Prevents touch on bars and manages the click dispatch.
			 * 
			 * @parameters:
			 * 	--> uxEvent: the uxEvent associated
			 */
			var _onTouchBar = function(uxEvent) 
			{
				if (uxEvent.type == 'start') 
				{
					_startBarEvent = uxEvent;
					uxEvent.preventDefault();
				}
				else 
				{
					_endBarEvent = uxEvent;
	
					if (((_endBarEvent.timestamp - _startBarEvent.timestamp) < 250) && (Math.abs(_endBarEvent.x - _startBarEvent.x) < 20)) 
					{
						_endBarEvent.dispatch(_endBarEvent.target, 'click');
					}
				}
			};
			
			/**
			 * Handles the click on the target
			 */
			var _onClick = function()
			{
				if (_isScrolling && _moveStarted)
				{
					return;
				}
				
				_clickPhase = true;
				
				_stateHidden = !_stateHidden;
				if (_hasHeader) 
				{
					_applyAnim(_headerStyle, _stateHidden);
				}
				if (_hasFooter) 
				{
					_applyAnim(_footerStyle, _stateHidden);
				}
			};
			
			/**
			 * Initialize datas with given properties
			 */
			var _initProperties = function() 
			{
				_sharedInitProperties.call(_instance);
			};
			
			/**
			 * Initialize listeners
			 */
			var _initListeners = function() 
			{
				if (_hasTouchMove)
				{
					if (_scrollAtStart) 
					{
						_moveStarted = false;
						_addlistener(_target, 'start', {
							context: _exclusiveTask,
							method: 'perform',
							arguments: _handleScroll
						}, { captureFlow: true });
					}
					_addlistener(_target, 'move', {
						context: _exclusiveTask,
						method: 'perform',
						arguments: _handleScroll
					}, { captureFlow: true });
				}
				
				_window.addEventListener('scroll', function(event) {
					_handleScroll(event, true);
				}, false);
				
				wink.subscribe("/window/events/orientationchange", { context: _delegate, method: "_handleScroll" });
				
				if (_instance.showHideOnClick)
				{
					_target.addEventListener('click', _onClick, false);
				}
				
				if (_hasTouchStart && _instance.preventTouchBar)
				{
					var _listenTo = function(node, event, method) {
						_addlistener(node, event, {
							context : _delegate,
							method : method
						});
					};
					if (_hasHeader) 
					{
						_listenTo(_header, 'start', '_onTouchBar');
						_listenTo(_header, 'end', '_onTouchBar');
					}
					if (_hasFooter) 
					{
						_listenTo(_footer, 'start', '_onTouchBar');
						_listenTo(_footer, 'end', '_onTouchBar');
					}
				}
			};
			
			/**
			 * Handler that allows to perform a task only once when repeated calls are made
			 */
			var _exclusiveTask = (function() {
				var _t, _lock;

				var handler = {};
				var _unlock = function() {
					if (_t) {
						return;
					}
					_t = setInterval(function() {
						clearInterval(_t);
						_t = null;
						_lock = false;
					}, 100);
				};
				handler.perform = function(uxEvent, task) {
					if (_lock) {
						_unlock();
						return;
					}
					_lock = true;
					task(uxEvent);
					_unlock();
				};
				return handler;
			})();
			
			var _delegate = {
				_onTouchBar: _onTouchBar,
				_handleScroll: _handleScroll,
				_scrollTest: _scrollTest
			};
			
			return impl;
		})();
	
		if ((properties.nativeFixed !== false) && wink.has('css-position-fixed')) 
		{
			return new FixedLayoutPF(properties);
		}
		else
		{
			return new FixedLayoutDefault(properties);
		}
	};
	
	return wink.ui.layout.FixedLayout;
});