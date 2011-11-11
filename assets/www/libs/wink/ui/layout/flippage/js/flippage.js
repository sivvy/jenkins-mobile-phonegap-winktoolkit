/**
 * Implements a flippage layout
 * 
 * @methods:
 * 	--> getDomNode: return the dom node containing the page
 * 	--> flipTo: flip to the specified page
 * 	--> flipForward: flips one page forward
 * 	--> flipBack: flips one page backward
 * 	--> updateContent: Update the content of a page
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> pages: the list of pages id of the flippage
 * 	--> duration: the transition duration between each page flip
 * 	--> shadow: whether the shadow is displayed or not
 * 
 * @properties:
 * 	data = 
 * 	{
 * 		duration = the transition duration in ms
 * 		pages = the list of pages to add to the flippage (must be an array of strings representing actual dom nodes ids)
 * 		shadow = should we display the page shadow
 * 	}
 * 
 * @dependencies:
 *  --> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 *  --> wink.fx._animation
 * 
 * @compatibility:
 * 	--> Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */
define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx', '../../../../fx/_animation/js/animation'], function(wink)
{
	wink.ui.layout.FlipPage = function(properties)
	{
		this.uId                 = wink.getUId();
		
		this.Z_INDEX             = 999;
		
		this.pages               = [];
		this.duration            = 1500;
		this.shadow              = false;
		
		this._pagesList          = [];
		
		this._flipTimeout        = null;
		
		this._currentPage        = null;
		this._currentPageIndex   = 0;
		
		this._startX             = 0;
		this._startY             = 0;
		
		this._endX               = 0;
		this._endY               = 0;
		
		this._startTime          = 0;
		this._endTime            = 0;
		
		this._domNode            = null;
		
		this._leftShadowNode     = null;
		this._rightShadowNode    = null;
		this._shadeState         = false;
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
		this._initProperties();
		this._initListeners();
	};
	
	wink.ui.layout.FlipPage.prototype =
	{
		wkArMove: ( (wink.ua.isIOS && wink.ua.osVersion == 4) || wink.ua.isIPad ),	
		
		/**
		 * Returns the DOM node containing the slidingpanels
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Flip to the specified page
		 * 
		 * @parameters:
		 *  --> id: the id of the page 
		 */
		flipTo: function(id)
		{	
			clearTimeout(this._flipTimeout);
			
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++ )
			{
				if ( id == this.pages[i] )
				{
					if ( this._currentPageIndex < i )
					{
						this.flipForward();
						this._flipTimeout = wink.setTimeout(this, 'flipTo', 300, id);
					} else if ( this._currentPageIndex > i )
					{
						this.flipBack();
						this._flipTimeout = wink.setTimeout(this, 'flipTo', 300, id);
					} else
					{
						return;
					}
				}
			}
		},
		
		/**
		 * Flips one page forward
		 */
		flipForward: function()
		{
			if ( this._currentPageIndex < (this._pagesList.length-2))
			{
				this._currentPageIndex++;
				this._pagesList[this._currentPageIndex].setPosition(0);
				this._currentPage = this._pagesList[this._currentPageIndex];
	
				wink.publish('/flippage/events/flipstart', {'id': this.pages[this._currentPageIndex], 'direction': 1});
				
				if (this.shadow)
				{
					this._shade(this._rightShadowNode, this._leftShadowNode);
				}
			}
		},
		
		/**
		 * Flips one page backward
		 */
		flipBack: function()
		{
			if ( this._currentPageIndex != 0 )
			{			
				this._pagesList[this._currentPageIndex].setPosition(1);
				this._currentPageIndex--;
				this._currentPage = this._pagesList[this._currentPageIndex];
	
				wink.publish('/flippage/events/flipstart', {'id': this.pages[this._currentPageIndex], 'direction': -1});
				
				if (this.shadow)
				{
					this._shade(this._leftShadowNode, this._rightShadowNode);
				}
			}
		},
		
		/**
		 * Update the content of a page
		 * 
		 * @parameters:
		 * 	--> id: the id of the page
		 * 	--> content: a string containg the page content
		 */
		updateContent: function(id, content)
		{
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++ )
			{
				if ( id == this.pages[i] )
				{
					this._pagesList[i].setBackContent(content);
					this._pagesList[i+1].setFrontContent(content);
				}
			}
		},
		
		/**
		 * Listen to the start events
		 * 
		 * @parameters
		 * 	--> e: the wink.ux.Event
		 */
		_touchStart: function(e)
		{
			this._startX = e.x;
			this._startY = e.y;
			
			this._startTime = e.timestamp;
		},
		
		/**
		 * Listen to the move events
		 * 
		 * @parameters
		 * 	--> e: the wink.ux.Event
		 */
		_touchMove: function(e)
		{
			if ( Math.abs(e.y - this._startY) < 30 )
			{
				e.preventDefault();
			}
		},
		
		/**
		 * Listen to the end events
		 * 
		 * @parameters
		 * 	--> e: the wink.ux.Event
		 */
		_touchEnd: function(e)
		{
			this._endX = e.x;
			this._endY = e.y;
			
			this._endTime = e.timestamp;
			
			if ( this._endTime - this._startTime > 400 )
			{
				return
			}
			
			if ( Math.abs(this._endY - this._startY) > 30 || Math.abs(this._endX - this._startX) < 30 )
			{
				return;
			}
			
			if ( (this._endX - this._startX) > 0 )
			{
				this.flipBack();
			} else
			{
				this.flipForward();
			}
		},
		
		/**
		 * Simulates the shadow of pages
		 * 
		 * @parameters
		 * 	--> node1: the node that will shade
		 * 	--> node2: the node that will brighten
		 */
		_shade: function(node1, node2) {
			if (this._shadeState == true) {
				return;
			}
			
			var trd = this.duration;
			var d1 = wink.math.round(0.43 * trd, 0);
			var d2 = wink.math.round(0.60 * trd, 0);
			var dl2 = wink.math.round(0.2 * trd, 0);
			
			var anim = wink.fx.animate(null, { 
				property: 'background-color', 
				value: 'rgba(0, 0, 0, 0.9)', 
				duration: 0,
				delay: 0
			}, { start: false }).chain(wink.fx.animate(null, {
				property: 'background-color', 
				value: 'rgba(0, 0, 0, 0.0)', 
				duration: d1,
				delay: 1,
				func: 'default'
			}, { start: false }));
			
			var anim2 = wink.fx.animate(null, { 
				property: 'background-color', 
				value: 'rgba(0, 0, 0, 0.01)', 
				duration: 0,
				delay: 0
			}, { start: false }).chain(wink.fx.animate(null, {
				property: 'background-color', 
				value: 'rgba(0, 0, 0, 0.8)', 
				duration: d2,
				delay: dl2,
				func: 'ease-in-out'
			}, { start: false })).chain(wink.fx.animate(null, {
				property: 'background-color', 
				value: 'rgba(0, 0, 0, 0.0)', 
				duration: 0,
				delay: 0,
				func: 'ease-in-out'
			}, { start: false }));
			
			this._shadeState = true;
			var group = new wink.fx.animation.AnimationGroup();
			group.addAnimation(node1, anim);
			group.addAnimation(node2, anim2);
			group.start({ onEnd: { context: this, method: '_onShadeEnd' } });
		},
		
		/**
		 * Updates shade status
		 */
		_onShadeEnd: function() {
			this._shadeState = false;
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
	
			if ( !wink.isInteger(this.duration))
			{
				wink.log('[FlipPage] the duration parameter must be an integer');
				return false;
			}
			
			if ( !wink.isArray(this.pages) )
			{
				wink.log('[FlipPage] pages parameters must be an array');
				return false;
			}
			
			if ( !wink.isBoolean(this.shadow) )
			{
				wink.log('[FlipPage] shadow parameter must be a boolean');
				return false;
			}
				
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++)
			{
				if ( $(this.pages[i]) == this.pages[i])
				{
					wink.log('[FlipPage] all the parameters should be dom nodes ids');
					return false;
				}
			}
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			var l = this.pages.length;
			
			for ( var i=0; i<=l; i++)
			{
				if ( i==0 )
				{
					var page = new wink.ui.layout.FlipPage.Page({'frontNode': null, 'backNode': $(this.pages[i]), index: i, zIndex: this.Z_INDEX-i, duration: this.duration});
					page.setPosition(0);
					this._currentPage = page;
				} else if ( i == l )
				{
					var page = new wink.ui.layout.FlipPage.Page({'frontNode': $(this.pages[i-1]), 'backNode': null, index: i, zIndex: this.Z_INDEX-i, duration: this.duration});
					page.setPosition(1);
				} else
				{
					var page = new wink.ui.layout.FlipPage.Page({'frontNode': $(this.pages[i-1]), 'backNode': $(this.pages[i]), index: i, zIndex: this.Z_INDEX-i});
					page.setPosition(1);
				}
				
				this._domNode.appendChild(page.getDomNode());
	
				wink.fx.applyTransformTransition(page.getDomNode(), this.duration + 'ms', '0ms', 'ease-in-out');
				
				this._pagesList.push(page);
			}
			
			for ( var i=0; i<l; i++)
			{
				$(this.pages[i]).parentNode.removeChild($(this.pages[i]));
			}
		
			if (this.shadow)
			{
				this._leftShadowNode = document.createElement('div');
				this._rightShadowNode = document.createElement('div');
				wink.addClass(this._leftShadowNode, 'fb_page');
				wink.addClass(this._rightShadowNode, 'fb_page');
				
				this._leftShadowNode.translate('-100%', 0);
				this._rightShadowNode.translate(0, 0);
				this._leftShadowNode.style.backgroundColor = 'rgba(0, 0, 0, 0.0)';
				this._rightShadowNode.style.backgroundColor = 'rgba(0, 0, 0, 0.0)';
				
				this._domNode.appendChild(this._leftShadowNode);
				this._domNode.appendChild(this._rightShadowNode);
			}
		},
		
		/**
		 * Initialize the 'touch' listeners
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(this._domNode, 'start', { context: this, method: '_touchStart' });
			if (!this.wkArMove) {
				wink.ux.touch.addListener(this._domNode, 'move', { context: this, method: '_touchMove' });
			}
			wink.ux.touch.addListener(this._domNode, 'end', { context: this, method: '_touchEnd' });
		},
		
		/**
		 * Initialize the flippage node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'fb_container';
		}
	};
	
	/**
	 * Implements a flippage page
	 * 
	 * @methods:
	 * 	--> getDomNode: return the dom node containing the page
	 * 	--> setFrontContent: update the content of the front cover
	 * 	--> setBackContent: update the content of the back cover
	 * 	--> setPosition: set the current position of the page
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> index: the rank of the page in the pages list
	 * 	--> position: the position of the page (0: flipped ; 1: not flipped)
	 * 	--> zIndex: the current depth of the page
	 * 
	 * @events:
	 * 	--> /flippage/events/flipstart: the event is fired when we start flipping a page (return the page index and the flipping direction (1: forward ; -1: backward))
	 * 	--> /flippage/events/flipend: the event is fired when the flipping ends (return the page index)
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		frontNode = the node corresponding to the page's front cover
	 * 		backNode = the node corresponding to the page's back cover
	 * 		index = the rank of the page in the pages list
	 * 		zIndex = the depth of the page
	 * 	}
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 * 
	 */
	wink.ui.layout.FlipPage.Page = function(properties)
	{
		this.uId           = wink.getUId();
	
		this.index         = properties.index;
		this.position      = 0;
		this.zIndex        = properties.zIndex;
		
		this._frontId      = null;
		this._backId       = null;
		
		this._frontContent = properties.frontNode;
		this._backContent  = properties.backNode;
		
		this._frontNode    = null;
		this._backNode     = null;
		this._domNode      = null;
		
		this._initDom();
	};
	
	wink.ui.layout.FlipPage.Page.prototype =
	{
		/**
		 * returns the DOM node containing the Page
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * update the content of the front cover
		 * 
		 * @parameters:
		 * 	--> content: a string containg the page content
		 */
		setFrontContent: function(content)
		{
			this._frontNode.innerHTML = '<div class="fb_content_right">' + content + '</div>';
		},
		
		/**
		 * update the content of the back cover
		 * 
		 * @parameters:
		 * 	--> content: a string containg the page content
		 */
		setBackContent: function(content)
		{
			this._backNode.innerHTML = '<div class="fb_content_left">' + content + '</div>';
		},
		
		/**
		 * set the current position of the page
		 * 
		 * @parameters:
		 * 	--> position: 0: page is flipped ; 1: page is not flipped
		 */
		setPosition: function(position)
		{
			this.position = position;
			
			wink.fx.initComposedTransform(this._domNode, false);
			
			if ( this.position == 0 )
			{
				wink.fx.setTransformPart(this._domNode, 1, { type: 'rotate', x: 0, y: 1, z: 0, angle: 180 });
				this._domNode.style.zIndex = 1000 - this.zIndex;
			} else
			{
				wink.fx.setTransformPart(this._domNode, 1, { type: 'rotate', x: 0, y: 1, z: 0, angle: 0 });
				this._domNode.style.zIndex = this.zIndex;
			}
			
			wink.fx.applyComposedTransform(this._domNode);
		},
		
		/**
		 * Initialize the Page node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			wink.addClass(this._domNode, 'fb_page');
			
			wink.fx.apply(this._domNode, {'transform-origin': '0 0', 'transform-style': 'preserve-3d'});
			
			this._domNode.style.zIndex = this.zIndex;
	
			this._frontNode = document.createElement('div');
			wink.isNull(this._frontContent)?this._frontNode.innerHTML = '<div class="fb_content_right"></div>':this._frontNode.innerHTML = '<div class="fb_content_right">' + this._frontContent.innerHTML + '</div>';
			this._frontNode.className= 'fb_content_front';
	
			this._backNode = document.createElement('div');
			wink.isNull(this._backContent)?this._backNode.innerHTML = '<div class="fb_content_left"></div>':this._backNode.innerHTML = '<div class="fb_content_left">' + this._backContent.innerHTML + '</div>';
			this._backNode.className= 'fb_content_back';
			
			this._domNode.appendChild(this._frontNode);
			this._domNode.appendChild(this._backNode);
			
			var onFlipEnd = wink.bind(function()
			{
				if ( this.position == 0 )
				{
					wink.publish('/flippage/events/flipend', {'id': this._backId});
				} else
				{
					wink.publish('/flippage/events/flipend', {'id': this._frontId});
				}
			}, this);
			wink.fx.onTransitionEnd(this._domNode, onFlipEnd, true);
			
			wink.isNull(this._frontContent)?this._frontId = '':this._frontId = this._frontContent.id;
			wink.isNull(this._backContent)?this._backId = '':this._backId = this._backContent.id;
		}
	};
	
	return wink.ui.layout.FlipPage;
});