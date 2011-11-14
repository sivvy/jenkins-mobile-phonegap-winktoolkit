/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Popup is a singleton that allows to open a popup window with one (alert) or two buttons (confirm) or with a fully customizable content
 * Options are available for each type of popup style
 * 
 * @methods:
 * 	--> getDomNode: Returns the Popup dom node
 *  --> hide:		Hides the Popup
 * 	--> alert: 		opens a 1-button popup with a message. calls a callback function if asked when the button is clicked
 *  --> confirm: 	opens a 2-buttons popup with a message. calls a callback function if asked, depending on the clicked button
 *  --> popup: 		opens a fully customizable popup
 *
 * @attributes:
 *  --> uId : 		unique identifier of the component
 *  --> displayed:	indicates whether the Popup is displayed
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Frédéric MOULIS, JF CUNAT, Sylvain LALANDE
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.Popup = function(properties)
	{
		if (wink.isUndefined(wink.ui.xy.Popup.singleton))
		{
			this._properties 	= properties;
			this.uId 			= 1;
			this.displayed		= false;
			
			this._domNode		= null;
			this._contentNode 	= null;
			this._btnsNode 		= null;
			this._arrowNode		= null;
			this._absolutePos	= false;
			this._followScrollY = false;
			this._scrollHandler = null;
			this._popupClasses	= "";
			this._inTransition	= false;
			this._transitions	= {};
	
			this._initDom();
			this._initListeners();
			
			wink.ui.xy.Popup.singleton = this;
		} 
		else 
		{
			return wink.ui.xy.Popup.singleton;
		}
	};
	
	wink.ui.xy.Popup.prototype = 
	{
		i18n: {},
		_DEFAULT_ARROW: "none",
		
		/**
		 * Returns the Popup dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Hides the Popup
		 */
		hide: function()
		{
			this._hide();
		},
		/**
		 * @deprecated this method is no longer needed
		 */
		preloadContent: function()
		{
			wink.log('[Popup] preloadContent is deprecated : this method is no longer needed');
			return;
		},
		/**
		 * Opens a 1-button popup with a message. calls a callback function if asked when the button is clicked
		 * 
		 * @parameters:
		 * 	--> the popup options: {
		 * 			msg: 			the message to display,
		 * 			btn: 			the text to display in the button. If nothing specified, "ok" is used,
		 * 			callback:		the callback to invoke when the user clicks on the button { context, method },
		 * 			borderRadius:	indicates whether the popup must be displayed with border-radius style,
		 * 			duration:		the duration of the display transition,
		 * 			followScrollY:	allows to follow the scroll on y-axis
		 * 		}
		 */
		alert: function(options)
		{
			if (this.displayed == true) {
				return;
			}
			var opt = options || {};
			this._initTemplate(this._DEFAULT_ARROW, opt.msg);
	
			var btnNode = document.createElement('div');
			wink.addClass(btnNode, "w_button w_radius pp_popup_btn pp_popup_alert w_bg_light");
			var btnNodeValue = _('alertOk', this);
			if (wink.isSet(opt.btn))
			{
				btnNodeValue = opt.btn;
			}
			btnNode.innerHTML = btnNodeValue;
	
			if (wink.isSet(opt.callback)) {
				btnNode.onclick = wink.bind(function(e) {
					this._invokeCallback(opt.callback);
				}, this);
			}
			this._btnsNode.appendChild(btnNode);
			
			this._setPopupStyle("pp_type_alert", opt);
			this._show();
		},
		/**
		 * Opens a 2-buttons popup with a message. calls a callback function if asked, depending on the clicked button
		 * 
		 * @parameters:
		 * 	--> the popup options: {
		 * 			msg: 			the message to display,
		 * 			btnCancel: 		the text to display in the "cancel" button. If nothing specified, "cancel" is used,
		 * 			callbackCancel: the callback to invoke when the user clicks on the 'cancel' button { context, method },
		 * 			btnOk: 			the text to display in the "ok" button. If nothing specified, "ok" is used,
		 * 			callbackOk:		the callback to invoke when the user clicks on the 'ok' button { context, method },
		 * 			borderRadius:	indicates whether the popup must be displayed with border-radius style,
		 * 			duration:		the duration of the display transition,
		 * 			followScrollY:	allows to follow the scroll on y-axis
		 * 		}
		 */
		confirm: function(options)
		{
			if (this.displayed == true) {
				return;
			}
			var opt = options || {};
			this._initTemplate(this._DEFAULT_ARROW, opt.msg);
			
			var btnCancelNode = document.createElement('div');
			var btnOkNode = document.createElement('div');
			wink.addClass(btnCancelNode, "w_button w_radius pp_popup_btn pp_popup_confirm w_bg_light");
			wink.addClass(btnOkNode, "w_button w_radius pp_popup_btn pp_popup_confirm w_bg_light");
			
			var btnCancelValue = _('confirmCancel', this);
			if (wink.isSet(opt.btnCancel))
			{
				btnCancelValue = opt.btnCancel;
			}
			var btnOkValue = _('confirmOk', this);
			if (wink.isSet(opt.btnOk))
			{
				btnOkValue = opt.btnOk;
			}
			
			btnCancelNode.innerHTML = btnCancelValue;
			btnOkNode.innerHTML = btnOkValue;
			
			if (wink.isSet(opt.callbackCancel)) {
				btnCancelNode.onclick = wink.bind(function(e) {
					this._invokeCallback(opt.callbackCancel);
				}, this);
			}
			if (wink.isSet(opt.callbackOk)) {
				btnOkNode.onclick = wink.bind(function(e) {
					this._invokeCallback(opt.callbackOk);
				}, this);
			}
			this._btnsNode.appendChild(btnCancelNode);
			this._btnsNode.appendChild(btnOkNode);
			
			this._setPopupStyle("pp_type_confirm", opt);
			this._show();
		},
		/**
		 * Opens a fully customizable popup
		 * 
		 * @parameters:
		 * 	--> the popup options: {
		 *			content: 		HTML code of the content,
		 *			arrow: 			position of the arrow, if needed, values: "top", "bottom", "none" (default value),
		 *			top: 			top position of the window,
		 *			targetNode:		node pointed by the arrow (top is then ignored),
		 *			arrowLeftPos:	left-position of the arrow,
		 * 			borderRadius:	indicates whether the popup must be displayed with border-radius style,
		 * 			duration:		the duration of the display transition,
		 * 			followScrollY:	allows to follow the scroll on y-axis,
		 * 			layerCallback:	the callback invoked when the user click on the layer, if not specified the default action is the popup hiding
		 * 		}
		 */
		popup: function(options)
		{
			if (this.displayed == true) {
				return;
			}
			var opt = options || {};
			var arrowValue = this._DEFAULT_ARROW;
			var arrowLeftPos = "50px";
			
			if (wink.isSet(opt.arrowLeftPos)) {
				if (wink.isInteger(opt.arrowLeftPos)) {
					arrowLeftPos = opt.arrowLeftPos + "px";
				} else {
					arrowLeftPos = opt.arrowLeftPos;
				}
			}
			
			if (wink.isSet(opt.arrow)) {
				arrowValue 	= opt.arrow;
			}
			if (arrowValue != 'top' && arrowValue != 'bottom' && arrowValue != this._DEFAULT_ARROW) {
				wink.log('[Popup] popup() : bad arrow value (expected "top", "bottom" or "none")');
				return;
			}
			
			this._initTemplate(arrowValue, opt.content, arrowLeftPos);
			
			var topValue = "0px";
			if (wink.isSet(opt.targetNode)) {
				this._absolutePos = true;			
				if (arrowValue == "bottom") {
					topValue = opt.targetNode.getTopPosition() - this._domNode.offsetHeight - 10 + "px";
				} else if (arrowValue == "top") {
					topValue = opt.targetNode.getTopPosition() + opt.targetNode.offsetHeight + 10 + "px";
				}
			} else if (wink.isSet(opt.top)) {
				this._absolutePos = true;
				if (wink.isInteger(opt.top)) {
					topValue = opt.top + "px";
				} else {
					topValue = opt.top;
				}
			}
			this._domNode.style.top = topValue;
			
			this._setPopupStyle("pp_type_popup", opt);
			this._show();
			
			if (wink.isSet(opt.layerCallback)) {
				wink.layer.onclick = function() {
					if (!this._inTransition) {
						wink.call(opt.layerCallback);
					}
				};
			} else {
				wink.layer.onclick = this._layerHandler;
			}
		},
		/**
		 * Initialize the popup template
		 * 
		 * @parameters:
		 * 	--> arrowType: the arrow type ("top", "bottom" or "none")
		 * 	--> content: the content
		 * 	--> arrowLeftPos: left-position of the arrow
		 */
		_initTemplate: function(arrowType, content, arrowLeftPos)
		{
			this._absolutePos = false;
			this._followScrollY = false;
			this._popupClasses = "w_box w_window pp_popup pp_hidden w_bg_dark";
			this._contentNode.innerHTML = content;
			this._btnsNode.innerHTML = "";
			this._arrowNode.className = "pp_popup_arrow pp_" + arrowType;
			this._arrowNode.style.left = arrowLeftPos;
			this._domNode.style.top = "0px";
		},
		/**
		 * Set the popup style
		 * 
		 * @parameters:
		 * 	--> style: the css class of the popup
		 * 	--> opt: display options
		 */
		_setPopupStyle: function(style, opt)
		{
			this._popupClasses += " " + style;
			if (opt.borderRadius !== false) {
				this._popupClasses += " w_radius";
			}
			this._domNode.className = this._popupClasses;
	
			if (wink.isSet(opt.followScrollY) && opt.followScrollY === true) {
				this._followScrollY = true;
			}
			
			this._updatePosition();
			
			var newOpDur = (opt.duration >= 0) ? opt.duration : 400;
			this._updateTransition(newOpDur, 0);
		},
		/**
		 * Updates the popup transitions
		 * 
		 * @parameters:
		 * 	--> opacityDuration: the opacity duration
		 * 	--> topDuration: the top duration
		 */
		_updateTransition: function(opacityDuration, topDuration)
		{
			var trsChanged = false;
			if (wink.isInteger(opacityDuration) && this._transitions.opacity != opacityDuration) {
				this._transitions.opacity = opacityDuration;
				trsChanged = true;
			}
			if (wink.isInteger(topDuration) && this._transitions.top != topDuration) {
				this._transitions.top = topDuration;
				trsChanged = true;
			}
			
			if (trsChanged) {
				var dr = this._transitions.opacity + "ms," + this._transitions.top + 'ms';
				wink.fx.applyTransition(this._domNode, 'opacity, transform', dr, '1ms,1ms', 'default,default');
				// WORKAROUND : the second delay must be 1ms instead of 0ms for iOS2
			}
		},
		/**
		 * Updates the popup position
		 */
		_updatePosition: function()
		{
			var y = 0;
			if (this._absolutePos == false) {
				y += ((window.innerHeight - this._domNode.offsetHeight) / 2) + window.pageYOffset;
			} else if (this._followScrollY) {
				y += window.pageYOffset;
			}
			this._domNode.translate(0, y);
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._contentNode = document.createElement('div');
			this._btnsNode = document.createElement('div');
			this._arrowNode	= document.createElement('div');
	
			wink.addClass(this._domNode, "pp_popup pp_hidden");
			wink.addClass(this._contentNode, "w_bloc");
			wink.addClass(this._arrowNode, "pp_popup_arrow none");
			
			this._domNode.appendChild(this._contentNode);
			this._domNode.appendChild(this._btnsNode);
			this._domNode.appendChild(this._arrowNode);
			
			this._domNode.style.opacity = 0;
			this._transitions.opacity = 0;
			this._transitions.top = 0;
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			this._scrollHandler = wink.bind(this._updatePosition, this);
			this._postShowHandler = wink.bind(this._postShow, this);
			this._postHideHandler = wink.bind(this._postHide, this);
			this._layerHandler = wink.bind(this._hide, this);
		},
		/**
		 * Shows the popup
		 */
		_show: function()
		{
			if (this.displayed == true || this._inTransition == true) {
				return;
			}
			this._inTransition = true;
			
			if (this._followScrollY == true) {
				window.addEventListener("scroll", this._scrollHandler, false);
			}
			wink.removeClass(this._domNode, "pp_hidden");
			
			wink.layer.update();
			wink.layer.show();
			
			wink.fx.onTransitionEnd(this._domNode, this._postShowHandler);
			this._domNode.style.opacity = 1;
		},
		/**
		 * Post show management
		 */
		_postShow: function()
		{
			if (this._followScrollY == true) {
				this._updateTransition(this._transitions.opacity, 200);
			}
			this.displayed = true;
			this._inTransition = false;
		},
		/**
		 * Hides the popup
		 */
		_hide: function()
		{
			if (this.displayed == false || this._inTransition == true) {
				return;
			}
			this._inTransition = true;
			
			if (this._followScrollY == true) {
				window.removeEventListener("scroll", this._scrollHandler, false);
			}
			
			wink.layer.hide();
			wink.layer.onclick = null;
			
			wink.fx.onTransitionEnd(this._domNode, this._postHideHandler);
			this._domNode.style.opacity = 0;
		},
		/**
		 * Post hide management
		 */
		_postHide: function()
		{
			wink.addClass(this._domNode, "pp_hidden");
			
			this._contentNode.innerHTML = "";
			
			this.displayed = false;
			this._inTransition = false;
		},
		/**
		 * Invokes the given callback
		 * 
		 * @parameters:
		 *	--> cb: the callback to invoke
		 */
		_invokeCallback: function(cb)
		{
			if (this._inTransition == true || !wink.isSet(cb)) {
				return;
			}
			this._hide();
			wink.call(cb);
		}
	};
	
	return wink.ui.xy.Popup;
});
