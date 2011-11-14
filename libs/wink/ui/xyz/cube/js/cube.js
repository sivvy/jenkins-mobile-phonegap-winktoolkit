/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a Cube. The Cube allows to display a cube shape and to interact with it. The cube faces are nodes builded and managed by the user,
 * so the user can integrate various contents. The size, the position and the rotation axis are parameters that make the cube to be configurable.
 * 
 * @properties:
 * 	data =
 * 	{
 * 		faces: 				An array of faces ( face: { id: position of the face (1 to 6), faceId: the node id, callback: the click callback })
 * 		size:				the size of the Cube
 * 		shiftX:				[optional] the shift of the Cube on x-axis
 * 		shiftY:				[optional] the shift of the Cube on y-axis
 * 		shiftZ:				[optional] the shift of the Cube on z-axis
 * 		observerX:			[optional] the x position of the observer, relative to the Cube node, that influence the perspective view
 * 		observerY:			[optional] the y position of the observer, relative to the Cube node, that influence the perspective view
 * 		axis:				[optional] Rotation axis (x, y or xy)
 * 		focus:				[optional] Indicates whether a focus on a face must be performed after a rotation
 * 		focusDuration:		[optional] The duration of the auto focus
 * 		dispatch:			[optional] Indicates whether the face callback must be invoked when a face is selected
 * 		rotationCallback:	[optional] The callback to invoke when a rotation is performed
 * 		rotationEndCallback:[optional] The callback to invoke when a rotation end occurs
 *  }
 * 	
 * @methods:
 * 	--> getDomNode: 			Returns the Cube dom node
 * 	--> rotate: 				Rotates the Cube by the given angles
 * 	--> faceFocus: 				Focus on the main visible face
 * 	--> setFace: 				Sets the given faceObject
 *
 * @attributes:
 *  --> uId: unique identifier of the component
 *
 * @dependencies:
 * 	--> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 *  --> wink.ux.MovementTracker
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx', '../../../../ux/movementtracker/js/movementtracker'], function(wink)
{
	wink.ui.xyz.Cube = function(properties) 
	{
		this.uId				= wink.getUId();
		this._properties 		= properties;
		
		this._faces				= null;
		this._axis				= null;
		this._view				= {
			size: 0,
			shiftX: 0,
			shiftY: 0,
			shiftZ: 0,
			observerX: 0,
			observerY: 0,
			rotationX: 0,
			rotationY: 0,
			externalRotationX: 0,
			externalRotationY: 0
		};
		this._focus				= null;
		this._focusDuration		= null;
		this._dispatch			= null;
		this._rotationCallback	= null;
		this._rotationEndCallback = null;
		
		this._domNode			= null;
		this._movementtracker	= null;
		this._radius			= null;
		this._selectionEvent	= null;
		this._dragging			= false;
		this._rotations			= null;
		this._nearestFace		= null;
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xyz.Cube.prototype = {
		/**
		 * Returns the Cube dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Rotates the cube by the given angles
		 * 
		 * @parameters:
		 * 	--> angleX: angle done by a movement on x-axis, so around y-axis
		 * 	--> angleY: angle done by a movement on y-axis, so around x-axis
		 *  --> duration : duration of the rotation
		 */
		rotate: function(angleX, angleY, duration)
		{
			this._view.externalRotationX = wink.math.round((this._view.externalRotationX + angleX) % 360, 3);
			this._view.externalRotationY = wink.math.round((this._view.externalRotationY + angleY) % 360, 3);
			
			this._rotateWithDuration(angleX, angleY, duration);
		},
		/**
		 * Focus on the main visible face
		 * 
		 * @parameters:
		 * 	--> duration: duration of the focus
		 */
		faceFocus: function(duration)
		{
			this._faceFocus(duration);
		},
		/**
		 * Sets the given faceObject
		 * 
		 * @parameters:
		 * 	--> faceObject: the new face object that will replace the previous
		 */
		setFace: function(faceObject)
		{
			var index = faceObject.id - 1;
			this._faces[index].faceNode.removeChild(this._faces[index].innerNode);
			for (var prop in faceObject) {
				this._faces[index][prop] = faceObject[prop];
			}
			this._faces[index].innerNode = $(this._faces[index].faceId);
			this._faces[index].faceNode.appendChild(this._faces[index].innerNode);
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			if (!wink.isSet(this._properties.faces) || this._properties.faces.length != 6)
			{
				this._raisePropertyError('faces');
				return false;
			}
			for ( var i = 0; i < this._properties.faces.length; i++)
			{
				if (!this._isValidFace(this._properties.faces[i]))
				{
					this._raisePropertyError('faces');
					return false;
				}
			}
			if (!wink.isSet(this._properties.size))
			{
				this._raisePropertyError('size');
				return false;
			}
			if (wink.isSet(this._properties.rotationCallback) && !wink.isCallback(this._properties.rotationCallback))
			{
				this._raisePropertyError('rotationCallback');
				return false;
			}
			if (wink.isSet(this._properties.rotationEndCallback) && !wink.isCallback(this._properties.rotationEndCallback))
			{
				this._raisePropertyError('rotationEndCallback');
				return false;
			}
			return true;
		},
		/**
		 * Raise the property error
		 */
		_raisePropertyError: function(property)
		{
			wink.log('[Cube] Error: ' + property + ' missing or invalid');
		},
		/**
		 * Check if the given cover is valid.
		 * 
		 * @parameters:
		 * 	--> face: the face to check
		 */
		_isValidFace: function(face)
		{
			var isValid = true;
			isValid = isValid && wink.isSet(face);
			isValid = isValid && wink.isSet(face.id);
			isValid = isValid && wink.isSet(face.faceId);
			isValid = isValid && (face.id > 0 && face.id < 7);
			return isValid;
		},
		/**
		 * Initialize datas with given properties
		 */
		_initProperties: function() 
		{
			this._faces				= new Array().concat(this._properties.faces);
			this._view.size			= this._properties.size;
			this._radius			= this._view.size / 2;
			
			this._axis				= null;
			if (wink.isSet(this._properties.axis) && (this._properties.axis == "x" || this._properties.axis == "y" || this._properties.axis == "xy"))
			{
				this._axis			= this._properties.axis;
			}
			if (wink.isSet(this._view.shiftX))
			{
				this._view.shiftX 	= this._properties.shiftX;
			}
			if (wink.isSet(this._view.shiftY))
			{
				this._view.shiftY 	= this._properties.shiftY;
			}
			if (wink.isSet(this._properties.shiftZ))
			{
				this._view.shiftZ 	= this._properties.shiftZ;
			}
			this._view.observerX	= this._radius;
			if (wink.isSet(this._properties.observerX))
			{
				this._view.observerX = this._properties.observerX;
			}
			this._view.observerY	= this._radius;
			if (wink.isSet(this._properties.observerY))
			{
				this._view.observerY = this._properties.observerY;
			}
	
			this._focus				= false;
			if (this._properties.focus === true)
			{
				this._focus 		= true;
			}
			
			this._focusDuration		= 0;
			if (wink.isSet(this._properties.focusDuration) && this._properties.focusDuration > 0)
			{
				this._focusDuration = this._properties.focusDuration;
			}
			
			this._dispatch			= false;
			if (this._properties.dispatch === true)
			{
				this._dispatch 		= true;
			}
			this._rotationCallback	= null;
			if (wink.isSet(this._properties.rotationCallback))
			{
				this._rotationCallback = this._properties.rotationCallback;
			}
			this._rotationEndCallback = null;
			if (wink.isSet(this._properties.rotationEndCallback))
			{
				this._rotationEndCallback = this._properties.rotationEndCallback;
			}
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			wink.fx.apply(this._domNode, {
				position: "absolute",
				"user-select": "none",
				perspective: 800,
				"perspective-origin": this._view.observerX + "px " + this._view.observerY + "px",
				width: this._view.size + "px",
				height: this._view.size + "px",
				left: this._view.shiftX + "px",
				top: this._view.shiftY + "px"
			});
			
			this._cubeNode = document.createElement('div');
			wink.fx.apply(this._cubeNode, {
				"transform-style": "preserve-3d",
				width: this._view.size + "px",
				height: this._view.size + "px"
			});
			
			this._domNode.appendChild(this._cubeNode);
			
			for (var i = 0; i < this._faces.length; i++)
			{
				var index = this._faces[i].id - 1;
				var face = this._faces[index];
				face.faceNode = document.createElement('div');
				wink.fx.apply(face.faceNode, {
					position: "absolute",
					width: this._view.size + "px",
					height: this._view.size + "px"
				});
				
				face.innerNode = $(face.faceId);
				this._cubeNode.appendChild(face.faceNode);
				face.faceNode.appendChild(face.innerNode);
			}
			
			this._initTransformations();
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			if (this._axis != null || this._rotationCallback != null || this._rotationEndCallback != null)
			{
				this._movementtracker = new wink.ux.MovementTracker({ target: this._domNode });
				wink.subscribe('/movementtracker/events/mvtbegin', { context: this, method: '_handleMovementBegin' });
				wink.subscribe('/movementtracker/events/mvtchanged', { context: this, method: '_handleMovementChanged' });
				wink.subscribe('/movementtracker/events/mvtstored', { context: this, method: '_handleMovementStored' });
			}
		},
		/**
		 * Handles the movement start
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementBegin: function(publishedInfos) 
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			
			this._dragging = false;
			this._selectionEvent = publishedInfos.uxEvent;
			wink.fx.applyTransformTransition(
				this._cubeNode,
				"0ms",
				"0ms",
				"linear"
			);
		},
		/**
		 * Handles the movement updates
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementChanged: function(publishedInfos) 
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			
			if (this._axis != null || this._rotationCallback != null || this._rotationEndCallback != null)
			{
				var movement = publishedInfos.movement;
				var firstPoint = movement.pointStatement[movement.pointStatement.length - 2];
				var lastPoint = movement.pointStatement[movement.pointStatement.length - 1];
				
				var dx = lastPoint.x - firstPoint.x;
				var dy = lastPoint.y - firstPoint.y;
				
				var angleX = wink.math.getAngle(this._view.size, dx);
				if (dx < 0) {
					angleX = -angleX;
				}
				var angleY = wink.math.getAngle(this._view.size, dy);
				if (dy < 0) {
					angleY = -angleY;
				}
				this._dragging = true;
				var angleDegX = wink.math.round(wink.math.radToDeg(angleX), 3);
				var angleDegY = wink.math.round(wink.math.radToDeg(angleY), 3);
				this._rotate(angleDegX, angleDegY);
				
				this._view.externalRotationX = wink.math.round((this._view.externalRotationX + angleDegX) % 360, 3);
				this._view.externalRotationY = wink.math.round((this._view.externalRotationY + angleDegY) % 360, 3);
				
				this._notifyRotation({ x: angleDegX, y: angleDegY });
			}
		},
		/**
		 * Handles the movement end
		 * 
		 * @parameters:
		 * 	--> publishedInfos: see wink.ux.MovementTracker Events
		 */
		_handleMovementStored: function(publishedInfos)
		{
			var publisher = publishedInfos.publisher;
			if (publisher.uId != this._movementtracker.uId)
			{
				return;
			}
			if (this._dragging == false)
			{
				if (this._dispatch && wink.isSet(this._selectionEvent))
				{
					this._selectionEvent.dispatch(this._selectionEvent.target, "click");
					this._selectionEvent = null;
				}
			}
			else
			{
				this._storeRotation();
				this._notifyRotationEnd({ x: this._view.externalRotationX, y: this._view.externalRotationY });
				this._view.externalRotationX = 0;
				this._view.externalRotationY = 0;
				
				if (this._focus == true)
				{
					this._faceFocus(this._focusDuration);
				}
			}
		},
		/**
		 * Notify listener of the current rotation
		 * 
		 * @parameters:
		 * 	--> rotationInfos: the rotation angles : { x, y }
		 */
		_notifyRotation: function(rotationInfos) {
			if (this._rotationCallback != null)
			{
				wink.call(this._rotationCallback, rotationInfos);
			}
		},
		/**
		 * Notify listener of the rotation end
		 * 
		 * @parameters:
		 * 	--> rotationInfos: the rotation angles : { x, y }
		 */
		_notifyRotationEnd: function(rotationInfos) {
			if (this._rotationEndCallback != null)
			{
				wink.call(this._rotationEndCallback, rotationInfos);
			}
		},
		/**
		 * Rotates the cube by the given angles
		 * 
		 * @parameters:
		 * 	--> angleX: angle done by a movement on x-axis, so around y-axis
		 * 	--> angleY: angle done by a movement on y-axis, so around x-axis
		 *  --> duration : duration of the rotation
		 */
		_rotateWithDuration: function(angleX, angleY, duration)
		{
			wink.fx.applyTransformTransition(
				this._cubeNode,
				duration + "ms",
				"0ms",
				"linear"
			);
			this._rotate(angleX, angleY, true);
			this._storeRotation();
		},
		/**
		 * Focus on the main visible face
		 * 
		 * @parameters:
		 * 	--> duration: duration of the focus
		 */
		_faceFocus: function(duration)
		{
			this._updateNearestFace();
			
			wink.fx.removeComposedTransform(this._cubeNode);
			wink.fx.initComposedTransform(this._cubeNode);
			this._view.rotationX = 0;
			this._view.rotationY = 0;
			this._storeRotation();
			this._initNormalVectors();
			
			var rotationNearestFace = this._rotations[this._nearestFace.index];
			var angleX = rotationNearestFace.y * -rotationNearestFace.angle;
			var angleY = rotationNearestFace.x * rotationNearestFace.angle;
			this.rotate(angleX, angleY, duration);
		},
		/**
		 * Updates the nearest face
		 */
		_updateNearestFace: function()
		{
			this._nearestFace = { index: 0, angle: 0 };
			
			for (var i = 0; i < 6; i++)
			{
				if (this._faces[i].angle > this._nearestFace.angle)
				{
					this._nearestFace.index = i;
					this._nearestFace.angle = this._faces[i].angle;
				}
			}
		},
		/**
		 * Init nodes transformations
		 */
		_initTransformations: function()
		{
			this._rotations = [];
			this._rotations[0] = { type: "rotate", x: 1, y: 0, z: 0, angle: 0 };
			this._rotations[1] = { type: "rotate", x: 0, y: 1, z: 0, angle: 90 };
			this._rotations[2] = { type: "rotate", x: 0, y: 1, z: 0, angle: 180 };
			this._rotations[3] = { type: "rotate", x: 0, y: 1, z: 0, angle: -90 };
			this._rotations[4] = { type: "rotate", x: 1, y: 0, z: 0, angle: 90 };
			this._rotations[5] = { type: "rotate", x: 1, y: 0, z: 0, angle: -90 };
			
			this._initNormalVectors();
			
			for (var i = 0; i < this._faces.length; i++)
			{
				wink.fx.initComposedTransform(this._faces[i].faceNode);
				wink.fx.setTransformPart(this._faces[i].faceNode, 1, { type: "translate", x: 0, y: 0, z: this._radius });
				wink.fx.setTransformPart(this._faces[i].faceNode, 2, this._rotations[i]);
				wink.fx.applyComposedTransform(this._faces[i].faceNode);
			}
			
			wink.fx.initComposedTransform(this._cubeNode);
			wink.fx.setTransformPart(this._cubeNode, 3, { type: "translate", x: 0, y: 0, z: this._view.shiftZ });
			wink.fx.applyComposedTransform(this._cubeNode);
		},
		/**
		 * Rotate the cube by the given angles
		 * 
		 * @parameters:
		 * 	--> angleX: angle done by a movement on x-axis, so around y-axis
		 * 	--> angleY: angle done by a movement on y-axis, so around x-axis
		 *  --> force : indicates whether the rotate must occur even if the cube has no axis of rotation
		 */
		_rotate: function(angleX, angleY, force)
		{
			if (this._axis == "y" || this._axis == "xy" || force)
			{
				this._view.rotationX = wink.math.round((this._view.rotationX + angleX) % 360, 3);
				wink.fx.setTransformPart(this._cubeNode, 1, { type: "rotate", x: 0, y: 1, z: 0, angle: this._view.rotationX });
			}
			if (this._axis == "x" || this._axis == "xy" || force)
			{
				this._view.rotationY = wink.math.round((this._view.rotationY - angleY) % 360, 3);
				wink.fx.setTransformPart(this._cubeNode, 2, { type: "rotate", x: 1, y: 0, z: 0, angle: this._view.rotationY });
			}
			wink.fx.applyComposedTransform(this._cubeNode);
		},
		/**
		 * Stores the current rotation as a new reference position
		 */
		_storeRotation: function()
		{
			wink.fx.setTransformPart(this._cubeNode, 1, { type: "rotate", x: 0, y: 1, z: 0, angle: this._view.rotationX });
			wink.fx.setTransformPart(this._cubeNode, 2, { type: "rotate", x: 1, y: 0, z: 0, angle: this._view.rotationY });
			wink.fx.setTransformPart(this._cubeNode, 3, null);
			wink.fx.storeComposedTransform(this._cubeNode);
			
			wink.fx.setTransformPart(this._cubeNode, 3, { type: "translate", x: 0, y: 0, z: this._view.shiftZ });
			wink.fx.applyComposedTransform(this._cubeNode);
			
			this._updateNormalVectors();
			
			this._view.rotationX = 0;
			this._view.rotationY = 0;
		},
		/**
		 * Initialize the normal vectors of the faces
		 */
		_initNormalVectors: function()
		{
			var faceOneVector = [ 0, 0, 1 ];
			for (var i = 0; i < 6; i++)
			{
				var matrixRotation = wink.math.createTransformMatrix();
				matrixRotation.rotateAxisAngle(this._rotations[i].x, this._rotations[i].y, this._rotations[i].z, -this._rotations[i].angle);
				this._faces[i].normalVector = wink.math.multiplyMatrixVector(matrixRotation.getValues(), faceOneVector);
			}
		},
		/**
		 * Updates the normal vectors of the faces
		 */
		_updateNormalVectors: function()
		{
			var obsVector = [ 0, 0, -1 ];
			for (var i = 0; i < 6; i++)
			{
				var matrixRotation = wink.math.createTransformMatrix();
				matrixRotation.rotateAxisAngle(0, 1, 0, -this._view.rotationX);
				matrixRotation.rotateAxisAngle(1, 0, 0, -this._view.rotationY);
				this._faces[i].normalVector = wink.math.multiplyMatrixVector(matrixRotation.getValues(), this._faces[i].normalVector);
				
				var angleRad = wink.math.getAngleBetweenVectors(obsVector, this._faces[i].normalVector);
				this._faces[i].angle = wink.math.radToDeg(angleRad);
			}
		}
	};
	
	return wink.ui.xyz.Cube;
});