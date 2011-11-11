/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a news-ticker container
 * 
 * @methods:
 *	--> addNews: add a news to the NewsTicker
 *	--> removeNews: removes a news from the NewsTicker
 *	--> getNewsList: returns the list of BreakingNews currently in the NewsTicker
 *	--> getDomNode: returns the DOM node containing the NewsTicker
 *
 * @attributes:
 *	--> uId: unique identifier of the component
 *	--> news: an array containing the news (a type and a content)
 * 
 * @properties:
 * 	data =
 * 	{
 * 		news =
 * 		{
 * 			type = type of the news
 * 			content = the content of the news (must be a string)
 * 		}		
 * 	}
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.NewsTicker = function(properties)
	{
		this.uId               = wink.getUId();
		
		this.news              = [];
		
		this._currentNews      = 0;
		this._currentNewsId    = 0;
		
		this._breakingNewsList = [];
		
		this._domNode          = null;
		this._titleNode        = null;
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDomNode();
		this._subscribeToEvents();
		this._initProperties();
		this._initisteners();
		
		this._timer = wink.setTimeout(this, '_animate', 1);
	};
	
	wink.ui.xy.NewsTicker.prototype =
	{
		/**
		 * add a news to the NewsTicker
		 * 
		 * @parameters: 
		 * 	--> type: type of the news (user should implement a CSS class named .nt_title.nt_title_'type')
		 *	--> content: the content of the news (must be a string)
		 */
		addNews: function(type, content)
		{
			var breakingNews = new wink.ui.xy.NewsTicker.BreakingNews({'type': type, 'content': content});
			
			this._domNode.appendChild(breakingNews.getDomNode());
			this._breakingNewsList.push(breakingNews);
		},
		
		/**
		 * removes a news from the NewsTicker
		 * 
		 * @parameters:
		 * 	--> index: index of the news in the 'breakingNewsList' array
		 */
		removeNews: function(index)
		{
			if ( this._breakingNewsList[index] && this._breakingNewsList.length > 1 )
			{	
				this._breakingNewsList.splice(index, 1);
				
				if ( this._currentNews >= index )
				{
					this._currentNews--;
				}
			}
		},
		
		/**
		 * returns the list of BreakingNews currently in the NewsTicker
		 */
		getNewsList: function()
		{
			return this._breakingNewsList;
		},
		
		/**
		 * returns the DOM node containing the NewsTicker
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Change the current title of the NewsTicker and animate the next news in the BreakingNews list
		 */
		_animate: function()
		{
			var breakingNews = this._breakingNewsList[this._currentNews];
			
			this._currentNewsId = breakingNews.uId;
			this._titleNode.className = 'nt_title nt_title_' + breakingNews.type;
			
			breakingNews._animate();
		},
		
		/**
		 * Launch the animation of a new item after another just finished 'sliding'
		 * 
		 * @parameters:
		 * 	--> params: the return value of the '/breakingnews/events/animationend' event
		 */
		_handleAnimationEnd: function(params)
		{
			if ( params.breakingNewsId == this._currentNewsId )
			{
				if ( this._currentNews == (this._breakingNewsList.length-1) )
				{
					this._currentNews = 0;
				} else
				{
					this._currentNews++;
				}
				this._timer = wink.setTimeout(this, '_animate', 1);
			}
		},
		
		/**
		 * Update all the items positions
		 */
		_updateNewsPosition: function()
		{
			var l = this._breakingNewsList.length;
			
			for ( var i=0; i<l; i++)
			{
				if ( this._breakingNewsList[i].uId != this._currentNewsId )
				{
					this._breakingNewsList[i]._position();
				}
			}
		},
		
		/**
		 * Subscribe to the '/breakingnews/events/animationend' event
		 */
		_subscribeToEvents: function()
		{
			wink.subscribe('/breakingnews/events/animationend', {context: this, method: '_handleAnimationEnd'});
		},
		
		/**
		 * Validate the NewsTicker properties
		 */
		_validateProperties: function()
		{
			// Check news list
			if ( !wink.isArray(this.news))
			{
				wink.log('[NewsTicker] The news must be contained in an array');
				return false;
			}
		},
		
		/**
		 * Listen to the orientation change events
		 */
		_initisteners: function()
		{
			window.addEventListener("orientationchange", wink.bind(function(){this._updateNewsPosition();}, this), false);
		},
		
		/**
		 * Initialize the NewsTicker properties
		 */
		_initProperties: function()
		{
			var l = this.news.length;
			
			for ( var i=0; i<l; i++)
			{
				this.addNews(this.news[i].type, this.news[i].content);
			}
		},
		
		/**
		 * Initialize the NewsTicker DOM nodes
		 */
		_initDomNode: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'w_bg_light w_panel nt_container';
			
			this._titleNode = document.createElement('div');
			this._titleNode.className = 'nt_title';
			
			this._domNode.appendChild(this._titleNode);
		}
	};
	
	/**
	 * Implement a BreakingNews to be used in the NewsTicker
	 * 
	 * @methods:
	 * 	--> getDomNode: returns the DOM node containing the BreakingNews
	 * 
	 * @attributes:
	 *	--> uId: unique identifier of the component
	 *	--> type: the category of the news (related to a CSS classname)
	 *	--> content: the content of the news
	 * 
	 * @events:
	 * 	--> /breakingnews/events/animationend: the event is fired when a news finishes to slide (return the BreakingNews uId)
	 * 
	 * @parameters:
	 * 	data =
	 * 	{
	 * 		type = type of the news
	 * 		content = the content of the news (must be a string)		
	 * 	}
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ui.xy.NewsTicker.BreakingNews = function(properties)
	{
		this.uId               = wink.getUId();
		
		this.type              = properties.type;
		this.content           = properties.content;
		
		this._animationHandler = wink.bind(this._handleAnimationEnd, this);
		
		this._domNode          = null;
		
		this._initDomNode();
	};
	
	wink.ui.xy.NewsTicker.BreakingNews.prototype =
	{
		/**
		 * returns the DOM node containing the BreakingNews
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Initialize the BreakingNews DOM node
		 */
		_initDomNode: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'nt_news';
			this._domNode.innerHTML = this.content;
			
			wink.fx.apply(this._domNode, {
				"transition-timing-function": 'linear'
			});
			
			this._position();
		},
		
		/**
		 * slide the BreakingNews
		 */
		_animate: function()
		{
			var animationDuration = (document.documentElement.offsetWidth+this._domNode.clientWidth)*10;
			
			wink.fx.apply(this._domNode, {
				"transition-duration": animationDuration + 'ms'
			});
			this._domNode.translate(-this._domNode.clientWidth, 0);
			
			wink.fx.onTransitionEnd(this._domNode, this._animationHandler);
		},
		
		/**
		 * Handle the end of the slide of the BreakingNews
		 */
		_handleAnimationEnd: function()
		{
			wink.setTimeout(this, '_position', 1);
			wink.publish('/breakingnews/events/animationend', {'breakingNewsId': this.uId});
		},
		
		/**
		 * Position the BreakingNews on the right part of the screen
		 */
		_position: function()
		{
			wink.fx.apply(this._domNode, {
				"transition-duration": ''
			});
			this._domNode.translate(document.documentElement.offsetWidth, 0);
		}
	};
	
	return wink.ui.xy.NewsTicker;
});