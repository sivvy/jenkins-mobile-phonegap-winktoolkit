/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an Inertia component which provides, through collaboration with a Movement Tracker, 
 * datas calculated from the inertia of a movement.
 * 
 * @properties:
 * 	data =
 * 	{
 * 		movement: the movement tracker that provides datas to interpret
 * 	}
 *
 * @methods:
 *  --> destroy: Destroys the component
 *
 * @dependencies:
 * 	--> wink.ux.MovementTracker
 * 
 * @events
 * 	--> /inertia/events/inertiacomputed: inertia is computed { publisher, movement }
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../_amd/core', '../../movementtracker/js/movementtracker'], function(wink)
{
	wink.ux.Inertia = function(properties) 
	{
		this.uId				= wink.getUId();
		this._properties 		= properties;
		
		this._movementtracker 	= null;
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();	
		this._initListeners();
	};
	
	wink.ux.Inertia.prototype = {
		_DIRECTION_X: "x",
		_DIRECTION_Y: "y",
			
		_INTERRUPTION_THRESHOLD: 150,
		_EVENT_INERTIA_COMPUTED: '/inertia/events/inertiacomputed',
		
		/**
		 * Destroys the component
		 */
		destroy: function()
		{
			this._removeListeners();
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties : function()
		{
			if (wink.isUndefined(this._properties.movementtracker)) {
				wink.log('[Inertia] Error: movement property must be specified');
				return false;
			}
			if (!(this._properties.movementtracker instanceof wink.ux.MovementTracker)) {
				wink.log('[Inertia] Error: movementtracker must be a valid wink.ux.MovementTracker Object');
				return false;
			}
			return true;
		},
		/**
		 * Initialize datas with given properties
		 */
		_initProperties : function()
		{
			this._movementtracker = this._properties.movementtracker;
			delete this._properties;
		},
		/**
		 * Initialize listeners
		 */
		_initListeners : function()
		{
			wink.subscribe('/movementtracker/events/mvtstored', { context: this, method: '_computeInertia' });
		},
		/**
		 * Removes listeners
		 */
		_removeListeners: function()
		{
			wink.unsubscribe('/movementtracker/events/mvtstored', { context: this, method: '_computeInertia' });
		},
		/**
		 * Compute inertia datas which are based on an interpretation of the given raw movement.
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_computeInertia: function(publishedInfos) 
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId) {
				return;
			}
			var rawMovement = publishedInfos.movement;
			
			var movement = {
				pointStatement: rawMovement.pointStatement
			};
				
			var significantMovementX = this._getSignificantMovement(rawMovement, this._DIRECTION_X);
			var significantMovementY = this._getSignificantMovement(rawMovement, this._DIRECTION_Y);
				
			var firstPointX = significantMovementX.pointStatement[0];
			var firstPointY = significantMovementY.pointStatement[0];
			var lastPointX = significantMovementX.pointStatement[significantMovementX.pointStatement.length - 1];
			var lastPointY = significantMovementY.pointStatement[significantMovementY.pointStatement.length - 1];
				
			movement.dx = Math.abs(lastPointX.x - firstPointX.x);
			movement.dy = Math.abs(lastPointY.y - firstPointY.y);
			movement.dtx = lastPointX.globalDuration - firstPointX.globalDuration;
			if (movement.dtx == 0) {
				movement.dtx = 1;
			}
			movement.dty = lastPointY.globalDuration - firstPointY.globalDuration;
			if (movement.dty == 0) {
				movement.dty = 1;
			}
			movement.directionX = significantMovementX.direction;
			movement.directionY = significantMovementY.direction;
			
			movement.speedX = movement.dx / movement.dtx;
			movement.speedY = movement.dy / movement.dty;
			
			wink.publish(this._EVENT_INERTIA_COMPUTED, {
				publisher: this,
				movement: movement,
				uxEvent: publishedInfos.uxEvent,
				target: publishedInfos.target
			});
		},
		/**
		 * Retrieve a significant partial movement with the given raw movement
		 * 
		 * @parameters:
		 * 	--> rawMovement: the input movement
		 * 	--> direction: the direction filter
		 */
		_getSignificantMovement: function(rawMovement, direction) 
		{
			var directedMovements = this._extractDirectedMovement(rawMovement, direction);
			var lastDirectedMovement = directedMovements[directedMovements.length - 1];
				
			var interruptedMovements = this._extractInterruptedMovement(lastDirectedMovement);
			var lastInterruptedMovement = interruptedMovements[interruptedMovements.length - 1];
				
			return lastInterruptedMovement;
		},
		/**
		 * Retrieve all directed partial movements with the given movement
		 * 
		 * @parameters:
		 * 	--> movement: the input movement
		 * 	--> direction: the direction filter
		 */
		_extractDirectedMovement: function(movement, direction) 
		{
			var directedMovements = [];
				
			var pts = movement.pointStatement;
			var begin = 0;
			var localDirection = pts[0].directionX;
			if (direction == this._DIRECTION_Y) {
				localDirection = pts[0].directionY;
			}
				
			for (var i = 0; i < pts.length; i++) {
				var pI = pts[i];
					
				var pointDirection = pI.directionX;
				if (direction == this._DIRECTION_Y) {
					pointDirection = pI.directionY;
				}
				var directionChanged = (localDirection != pointDirection);
				
				if (directionChanged || (i == (pts.length - 1))) {
					var end = i;
					if (i == (pts.length - 1)) {
						end = pts.length;
					}
					
					var localPts = pts.slice(begin, end);
					var movementI = {
						pointStatement: localPts,
						direction: localDirection
					};
					directedMovements.push(movementI);
					begin = i;
					localDirection = pointDirection;
				}
			}
			return directedMovements;
		},
		/**
		 * Retrieve all interrupted partial movements with the given movement
		 * 
		 * @parameters:
		 * 	--> movement: the input movement
		 */
		_extractInterruptedMovement: function(movement) 
		{
			var interruptedMovements = [];
				
			var pts = movement.pointStatement;
			var begin = 0;
			var duration = 0;
				
			for (var i = 0; i < pts.length; i++) {
				var pI = pts[i];
				duration += pI.duration;
					
				var end = i;
					
				if ((duration > this._INTERRUPTION_THRESHOLD) || (i == (pts.length - 1))) {
					if ((i == (pts.length - 1)) && (duration <= this._INTERRUPTION_THRESHOLD)) {
						end = pts.length;
					}
					duration = 0;
					
					var localPts = pts.slice(begin, end);
					var movementI = {
						pointStatement: localPts,
						direction: movement.direction
					};
					interruptedMovements.push(movementI);
					begin = i;
						
					if ((i == (pts.length - 1)) && (duration > this._INTERRUPTION_THRESHOLD)) {
						var localPts = pts.slice(end, end + 1);
						
						var movementI = {
							pointStatement: localPts,
							direction: movement.direction
						};
						interruptedMovements.push(movementI);
					}
				}
			}
			return interruptedMovements;
		}		
	};
	
	return wink.ux.Inertia;
});
