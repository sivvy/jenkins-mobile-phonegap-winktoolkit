/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an event management system based on a publish/subscribe mechanism
 * 
 * @methods:
 *	--> subscribe: attach to the given topic, pass a context and a callback method. If the context is null, it is considered as global
 *	--> unsubscribe: detach from the given topic
 *	--> publish: publish a topic to all the subscribers, pass the given parameters to the subscribers
 *
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_base/_base/js/base', '../../error/js/error'], function(wink)
{
	var _subscribed_topics = [];
	
	/**
	 * Attach to the given topic
	 * 
	 * @parameters:
	 *	--> topic: the name of the topic we want to be notified from
	 *	--> callback: the callback method called when the event related to the topic is triggered. It should contain a 'method' and a 'context'.
	 */
	var subscribe = function(topic, callback)
	{	
		if (!wink.isCallback(callback))
		{
			wink.log('[topics] invalid callback argument');
			return;
		}
		var subscription = [topic.toLowerCase(), callback];
		_subscribed_topics.push(subscription);
	};
	
	/**
	 * Detach from the given topic
	 * 
	 * @parameters:
	 *	--> topic: the name of the topic we don't want to be notified from anymore.
	 *	--> callback: This parameter should be the same as the one passed through the subscribe method
	 */
	var unsubscribe = function(topic, callback)
	{
		var topicLower = topic.toLowerCase();
		var i, l = _subscribed_topics.length;
		for (i = 0; i < l; i++) 
		{
			var sti = _subscribed_topics[i];
			if (sti[0] == topicLower && sti[1].method == callback.method && sti[1].context == callback.context) 
			{
				_subscribed_topics.splice(i, 1);
				break;
			}
		}
	};
	
	/**
	 * Publish an event to all the subscribers
	 * 
	 * @parameters:
	 *	--> topic: the name of the topic we are triggering
	 *	--> value: the value to pass to the subscribers' callback methods
	 */
	var publish = function(topic, value)
	{
		_dispatch(topic.toLowerCase(), value);
	};
	
	/**
	 * Triggers all the events which are in the queue
	 * 
	 * @parameters:
	 *	--> topic: the name of the topic we are triggering
	 *	--> parameters: the value to pass to the subscribers' callback methods
	 */
	var _dispatch = function(topic, parameters)
	{
		var i, l = _subscribed_topics.length;
		for (i = 0; i < l; i++) 
		{
			var sti = _subscribed_topics[i];
			if (sti && sti[0] == topic) 
			{
				if ( wink.isSet(sti[1])) 
				{
					wink.call(sti[1], parameters);
				}
			}
		}
	};
	
	wink.topics = {
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		publish: publish,
		_getTopics: function() {
			return _subscribed_topics;
		}
	};
	
	// Bindings
	wink.publish = publish;
	wink.subscribe =  subscribe;
	wink.unsubscribe = unsubscribe;
	
	return wink.topics;
});
