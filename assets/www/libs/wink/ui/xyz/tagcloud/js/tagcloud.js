/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a Tag Cloud.
 * 
 * The tag cloud is a generic name for a graphical representation of a set of objects defined by user : the tags. 
 * The representation takes the form of a sphere or a circle in 3D. Each tag is an object containing at least one 
 * identifier of a node (the view) and a rating (how can impact be displayed).
 * The user can interact with the tag cloud rotating it around one or more axes, the depth and the rating has an 
 * impact when the size of the tag and makes the visual effect expected.
 * 
 * @properties:
 * 	data =
 * 	{
 * 		tags: 				An array of tags ( tag: { id, rating })
 * 		size: 				The radius size of the TagCloud in pixel
 * 		textColor: 			[optional] The text color value as { r: redValue, g: greenValue, b: blueValue }
 * 		selectedTextColor: 	[optional] The text color value for selected tag as { r: redValue, g: greenValue, b: blueValue }
 * 		scaleFactors : 		[optional] factors (depth and rating) that influence the size of tags { ratioDepth, ratioRating }
 * 		canMove: 			[optional] true if user can move the TagCloud
 * 		canSelect: 			[optional] true if user can select a tag in the TagCloud
 * 		axis:				[optional] Rotation axis (x, y or xy)
 * 		shiftX:				[optional] shifts the tag cloud on x from the given value
 * 		shiftY:				[optional] shifts the tag cloud on y from the given value
 * 		asCircle:			[optional] If specified, displays TagCloud as a Circle around specified axis. Value as: { tilt: tiltValue }
 * 	}
 * 
 * @methods:
 * 	--> getDomNode: 		Returns the TagCloud dom node
 *  --> setTextColor:		Set a new text color
 *
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> tags: the list of tags of the cloud
 *  --> size: the radius size of the TagCloud in pixel
 *  --> textColor: the text color value
 *  --> selectedTextColor: the text color value for selected tag
 *  --> scaleFactors: factors (depth and rating) that influence the size of tags
 *  --> canMove: true if user can move the TagCloud
 *  --> canSelect: true if user can select a tag in the TagCloud
 *  --> axis: rotation axis
 *  --> shiftX: the original X shift
 *  --> shiftY: the original Y shift
 *  --> asCircle: if specified, displays TagCloud as a Circle around specified axis
 *
 * @events
 * 	--> /tagcloud/events/selection: a tag selection
 *
 * @dependencies:
 *  --> wink.ux.MovementTracker
 * 	--> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 * 
 * @compatibility:
 * 	--> Iphone OS2 (slow), Iphone OS3, Iphone OS4, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6 (very slow), Bada 1.0 (slow)
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx', '../../../../ux/movementtracker/js/movementtracker'], function(wink)
{
	wink.ui.xyz.TagCloud = function(properties) 
	{
		this.uId				= wink.getUId();
	
		this.size 				= null;
		this.textColor 		    = null;
		this.selectedTextColor	= null;
		
		this.scaleFactors		= {
			ratioDepth: 0.6,
			ratioRating: 0.8
		};
		
		this.canMove			= false;
		this.canSelect			= false;
		this.axis				= null;
		this.shiftX				= 0;
		this.shiftY				= 0;
		this.asCircle			= null;
		
		this.tags				= null;
		
		this._domNode 			= null;
		this._overNode 			= null;
		this._selectCoords		= null;
		this._selection 		= null;
		this._opacities 		= null;
		this._isCircle			= null;
		
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xyz.TagCloud.prototype = {
		_MAX_RATING: 100,
		_Z_INDEX_BACKGROUND: 5,
		_OPACITY_NOT_VISIBLE_FACE: 0.2,
		_OPACITY_VISIBLE_FACE: 0.98,
		_LIGHT_PI: wink.math.round(Math.PI, 3),
		_FRICTIONAL_FORCES: 0.5,
			
		/**
		 * Returns the TagCloud dom node
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		/**
		 * Set a new text color
		 * 
		 * @parameters:
		 *	--> inColor: the text color
		 *	--> inSelectedColor: the text color for selected tag
		 */
		setTextColor: function(inColor, inSelectedColor)
		{
			if (!wink.isSet(inColor))
			{
				return;
			}
			if (!wink.isSet(inSelectedColor))
			{
				return;
			}
			this.textColor = inColor;
			this.selectedTextColor = inSelectedColor;
			this._updateTextColor();
		},
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function() 
		{
			if (!wink.isSet(this.tags))
			{
				this._raisePropertyError('tags');
				return false;
			}
			if (!wink.isSet(this.size))
			{
				this._raisePropertyError('size');
				return false;
			}
			return true;
		},
		/**
		 * Raise the property error
		 */
		_raisePropertyError: function(property)
		{
			wink.log('[TagCloud] Error: ' + property + ' missing or invalid');
		},
		/**
		 * Initialize datas with given properties
		 */
		_initProperties: function() 
		{
			if (!wink.isSet(this.asCircle) || !wink.isSet(this.asCircle.tilt))
			{
				this._isCircle = false;
			}
			else
			{
				this._isCircle = true;
			}
			
			// Opacity
			this._opacities = [];
	
			var minOpacity = this._OPACITY_NOT_VISIBLE_FACE;
			var opacityInterval = this._OPACITY_VISIBLE_FACE - minOpacity;
	
			var l = (this.size * 2) + 1, incOpacity = opacityInterval / (this.size * 2);
			for (var i = 0, opa = minOpacity; i < l; i++, opa += incOpacity)
			{
				this._opacities[i] = wink.math.round(opa, 2);
			}
			
			// Rating
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				if (tagi.rating < 0) {
					tagi.rating = 0;
				}
				else if (tagi.rating > this._MAX_RATING)
				{
					tagi.rating = this._MAX_RATING;
				}
				tagi.coeffRating = wink.math.round(this.scaleFactors.ratioRating * (tagi.rating / this._MAX_RATING), 2);
			}
		},
		/**
		 * Initialize the DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._overNode = document.createElement('div');
			this._domNode.appendChild(this._overNode);
	
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				var tagNode = document.createElement('div');
				this._domNode.appendChild(tagNode);
				
				tagNode.style.position = "absolute";
				tagNode.appendChild($(tagi.id));
				
				tagi.tagNode = tagNode;
				tagi.colorOpacity = 1.0;
			}
	
			wink.fx.apply(this._domNode, {
				position: "absolute",
				width: "100%",
				height: "100%"
			});
			wink.fx.apply(this._overNode, {
				position: "absolute",
				width: "100%",
				height: "100%",
				"user-select": "none",
				zIndex: this._Z_INDEX_BACKGROUND
			});
	
			this._updateTextColor();
			
			console.log('b4 initTrtans:', wink.fx);
			this._initTransformations();
			this._slide(0.1, 0.1);
		},
		/**
		 * Initialize listeners
		 */
		_initListeners: function() 
		{
			if (this.canMove == true || this.canSelect == true)
			{
				this._movementtracker = new wink.ux.MovementTracker({ target: this._overNode });
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
			
			if (this.canSelect == true)
			{
				var movement = publishedInfos.movement;
				var firstPoint = movement.pointStatement[0];
				var absPos = { x: this._overNode.getLeftPosition(), y: this._overNode.getTopPosition() };
				this._selectCoords = { x: (firstPoint.x - absPos.x), y: (firstPoint.y - absPos.y) };
			}
		},
		/**
		 * Handles the movement updates.
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
			
			if (this.canMove == true)
			{
				var movement = publishedInfos.movement;
				var firstPoint = movement.pointStatement[movement.pointStatement.length - 2];
				var lastPoint = movement.pointStatement[movement.pointStatement.length - 1];
				
				var dx = lastPoint.x - firstPoint.x;
				var dy = lastPoint.y - firstPoint.y;
				
				var angleX = wink.math.getAngle(this.size, dx);
				if (dx < 0) {
					angleX = -angleX;
				}
				var angleY = wink.math.getAngle(this.size, dy);
				if (dy < 0) {
					angleY = -angleY;
				}
				this._dragging = true;
				this._slide(angleX, angleY);
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
			if (this._dragging == false && this.canSelect == true)
			{
				this._handleChoice(this._selectCoords.x, this._selectCoords.y);
			}
		},
		/**
		 * Slide the Tag Cloud - rotate it by the given angles
		 * 
		 * @parameters:
		 * 	--> angleX: angle on x
		 * 	--> angleY: angle on y
		 */
		_slide: function(angleX, angleY)
		{
			this._updateAngles(angleX, angleY);
			this._updateCoords();
			this._updateOpacity();
			this._updateTextSize();
			this._applyTransformations();
		},
		/**
		 * Update the opacity that depends on z-position
		 */
		_updateOpacity: function()
		{
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				var zPosition = wink.math.round(tagi.coords.z + this.size, 0);
				var opacity = this._opacities[zPosition];
				if (!wink.isSet(opacity)) {
					wink.log("[TagCloud] warn: opacity not defined for z-position " + zPosition);
				}
				tagi.colorOpacity = opacity;
			}
		},
		/**
		 * Update the text size that depends on z-position
		 */
		_updateTextSize: function()
		{
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				var zPosition = wink.math.round(tagi.coords.z + this.size, 0);
				tagi.coeffDepth = wink.math.round(this.scaleFactors.ratioDepth * (zPosition / (this.size * 2)), 2);
				tagi.coeffScale = (tagi.coeffDepth + tagi.coeffRating);
			}
		},
		/**
		 * Update the angles on X and Y
		 * 
		 * @parameters:
		 * 	--> angleX: angle on x
		 * 	--> angleY: angle on y
		 */
		_updateAngles: function(angleX, angleY)
		{
			this._angleX = wink.math.round(((angleX * this._FRICTIONAL_FORCES)) % (this._LIGHT_PI * 2), 3);
			this._angleY = wink.math.round(((angleY * this._FRICTIONAL_FORCES)) % (this._LIGHT_PI * 2), 3);
		},
		/**
		 * Update the elements coordinates with the new rotation
		 */
		_updateCoords: function()
		{
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				var pointI = [ tagi.coords.x, tagi.coords.y, tagi.coords.z ];
	
				var matrixRotationX = wink.math.createTransformMatrix();
	
				if (this.axis == "x" || this.axis == "xy")
				{
					matrixRotationX.rotateAxisAngle(1, 0, 0, wink.math.radToDeg(this._angleY));
				}
				
				var matrixRotationY = wink.math.createTransformMatrix();
				if (this.axis == "y" || this.axis == "xy")
				{
					matrixRotationY.rotateAxisAngle(0, 1, 0, wink.math.radToDeg(-this._angleX));
				}
					
				var pointIRotX = wink.math.multiplyMatrixVector(matrixRotationX.getValues(), pointI);
				var pointIRotY = wink.math.multiplyMatrixVector(matrixRotationY.getValues(), pointIRotX);
				var pointIRot = pointIRotY;
	
				var x = pointIRot[0];
				var y = pointIRot[1];
				var z = pointIRot[2];
				
				if (this._isCircle)
				{
					if (this.axis == "x")
					{
						x = pointIRot[2] * -this.asCircle.tilt;
					}
					else
					{
						y = pointIRot[2] * this.asCircle.tilt;
					}
				}
				tagi.coords = { x : x, y : y, z : z };
			}
		},
		/**
		 * Apply transformation to the tags
		 */
		_applyTransformations: function()
		{
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				wink.fx.setTransformPart(tagi.tagNode, 1, { type: "scale", x: tagi.coeffScale, y: tagi.coeffScale, z: 1 });
				wink.fx.setTransformPart(tagi.tagNode, 2, { type: "translate", x: tagi.coords.x, y: tagi.coords.y, z: tagi.coords.z });
				wink.fx.applyComposedTransform(tagi.tagNode);
			}
			this._updateTextColor();
		},
		/**
		 * Handles the user choice from given point coordinates
		 * 
		 * @parameters:
		 * 	--> x: x coordinates
		 * 	--> y: y coordinates
		 */
		_handleChoice: function(x, y)
		{
			this._selection = null;
			var nearestFaceIndex = this._getNearestFaceIndex(x, y);
			if (nearestFaceIndex != null) {
				this._selection = this.tags[nearestFaceIndex].tagNode;
				var tag = this.tags[nearestFaceIndex];
				
				this._updateTextColor();
				wink.publish("/tagcloud/events/selection", {
					tag: tag
				});
			}
		},
		/**
		 * Returns the nearest face index from given point coordinates
		 * 
		 * @parameters:
		 * 	--> x: x coordinates
		 * 	--> y: y coordinates
		 */
		_getNearestFaceIndex: function(x, y)
		{
			var nearestFaceIndex = null;
			var matchFaces = [];
	
			var i, l = this.tags.length;
			for (i = 0; i < l; i++)
			{
				var tagi = this.tags[i];
				var pointSizeX = tagi.tagNode.offsetWidth;
				var pointSizeY = tagi.tagNode.offsetHeight;
				
				var shiftScaleX = (pointSizeX * tagi.coeffScale) - pointSizeX;
				var shiftScaleY = (pointSizeY * tagi.coeffScale) - pointSizeY;
	
				var xCoord = tagi.coords.x;
				var yCoord = tagi.coords.y;
	
				var xmin = xCoord + this.size + this.shiftX - (shiftScaleX / 2);
				var ymin = yCoord + this.size + this.shiftY - (shiftScaleY / 2);
				var xmax = xmin + pointSizeX + shiftScaleX;
				var ymax = ymin + pointSizeY + shiftScaleY;
	
				var xMatch = (x > xmin) && (x < xmax);
				var yMatch = (y > ymin) && (y < ymax);
				if (xMatch && yMatch)
				{
					matchFaces.push(i);
				}
			}
			var nearestZCoord = -this.size;
			for ( var i = 0; i < matchFaces.length; i++) {
				var index = matchFaces[i];
				var zCoord = this.tags[index].coords.z;
				if (zCoord > nearestZCoord) {
					nearestZCoord = zCoord;
					nearestFaceIndex = index;
				}
			}
			return nearestFaceIndex;
		},
		/**
		 * Init elements transformations
		 */
		_initTransformations: function()
		{
			// Evenly distributed tags on sphere
			var radius = this.size;
			var deltaLong = wink.math.round(this._LIGHT_PI * (3 - Math.sqrt(5)), 2);
			var dz = 2 / this.tags.length;
			var dc = 2 * Math.PI / this.tags.length;
			
			var l = this.tags.length;
			for (var i = 0, dist = 0, z = 1 - (dz / 2); i < l; i++, dist += deltaLong, z = z - dz)
			{
				var tagi = this.tags[i];
				if (this._isCircle)
				{
					var phi = 0;
					var theta = 0;
					
					if (this.axis == "x")
					{
						phi = dc * i;
						theta = Math.PI / 2;
					}
					else
					{
						phi = (dc * i) + (Math.PI / 2);
					}
					
					var trX = radius * Math.cos(theta) * Math.cos(phi);
					var trY = radius * Math.cos(phi) * Math.sin(theta);
					var trZ = radius * Math.sin(phi);
					
					tagi.coords = { x : trX, y : trY, z : trZ };
				}
				else
				{
					var r = radius * Math.sqrt(1 - (z * z));
					tagi.coords = { x : Math.cos(dist) * r, y : Math.sin(dist) * r, z : z * radius };
				}
				console.log('tagcld:', wink.fx);
				wink.fx.initComposedTransform(tagi.tagNode);
			}
	
			wink.fx.set3dTransform(this._domNode, { type: "translate", x: this.size + this.shiftX, y: this.size + this.shiftY, z: 0 });
			wink.fx.set3dTransform(this._overNode, { type: "translate", x: -this.size - this.shiftX, y: -this.size - this.shiftY, z: this.size });
		},
		/**
		 * Update the text color
		 */
		_updateTextColor: function()
		{
			if (wink.isSet(this.textColor))
			{
				var c = this.textColor;
				var i, l = this.tags.length;
				for (i = 0; i < l; i++)
				{
					var tagi = this.tags[i];
					tagi.tagNode.style.color = "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + tagi.colorOpacity + ")";
				}
			}
			
			if (this._selection != null && wink.isSet(this.selectedTextColor))
			{
				var sc = this.selectedTextColor;
				this._selection.style.color = "rgba(" + sc.r + ", " + sc.g + ", " + sc.b + ", 1)";
			}
		}
	};
	
	return wink.ui.xyz.TagCloud;
});