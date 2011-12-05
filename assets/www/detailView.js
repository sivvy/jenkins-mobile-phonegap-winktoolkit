(function() {
var detailsTemplate = '<div class="row">' +
	'<div class="row-image"><img src="%status%"/></div>' +
	'<div class="row-name">%name%</div>' +
	'<div class="row-number">%number%</div>' +
	'<div class="row-datetime"><img src="images/icon-time.png"/><span>%datetime%</span></div>' +
'</div>';

renderDetails = function( currentServer, url ) {
    var ajax = new XMLHttpRequest(),
    	tmpfunction = function( xhr ) {
        if ( ajax.readyState === 4 && ajax.status === 200 ) {
            //for ( var i = 0; i < 5; i++ )
            jQuery( jQuery.parseXML( ajax.responseText ) ).find( "entry" ).each( function() {
                var line = jQuery( this ).find( "title" ).text(),
                    buildNameEnd = line.indexOf(" #"),
                    buildNumberEnd = line.indexOf( "(" ),
                    title = line.slice(0, buildNameEnd),
                    number = line.slice(buildNameEnd, buildNumberEnd),
                    datetime = jQuery( this ).find( "updated" ).text().replace(/T|Z/g, " ");
                    
                var statusIcon, serverStatus = line.substr( buildNumberEnd );
                /* determine icon here */
                if (serverStatus.indexOf("(stable)") >= 0 || serverStatus.indexOf("normal") >= 0) {
                    statusIcon = "images/icon-stable.png";
                } else if (serverStatus.indexOf("?") >= 0) {
                    statusIcon = "images/icon-building.png";
                } else{
                    statusIcon = "images/icon-fail.png";
                };
                var tmp = detailsTemplate.replace( "%status%", statusIcon )
                                         .replace( "%name%", title )
                                         .replace( "%number%", number )
                                         .replace( "%datetime%", datetime );
                jQuery( "div#details" ).append( tmp );
            } );
            
            detailHelper.initializeScollerDetails();
            jQuery( "div#wrapperDetails" ).hide().slideDown();
        } else if ( ajax.readyState == 4 && ajax.status != 200 ) {
            alert("Url seems to be invalid. Change your settings");
            jQuery( "div#wrapper" ).slideDown();
            return false;
            }
        };
        ajax.onreadystatechange = tmpfunction;
        ajax.open( "GET", url );
        ajax.send();
};

var detailHelper = {
    nbItem: 140,
    items: [],
    scrolling: false,
    sliding: false,
    currentStage: null,
    selectTimer: null,
    nodePreselected: null,
    nodeSelected: null,

    preselect: function(node) {
        clearTimeout( this.selectTimer );
        this.selectTimer = null;
        
        if ( this.scrolling === false && this.sliding === false ) 
        {
            var cn = node.className;
            if ( cn.indexOf( "selected" ) === -1 ) 
            {
                this.resetItemStatus();
                wink.addClass( node, "preselected" );
                this.nodePreselected = node;
            }
        }
    },
    select: function( node ) {
        this.resetItemStatus();
        wink.addClass( node, "selected" );
        this.nodeSelected = node;
    },
    resetItemStatus: function() {
        if ( this.nodePreselected != null ) {
            wink.removeClass( this.nodePreselected, "preselected" );
            this.nodePreselected = null;
        }
        
        if ( this.nodeSelected != null ) {
            wink.removeClass( this.nodeSelected, "selected" );
            this.nodeSelected = null;
        }
    },
    stageChanged: function( params, stage ) {
        this.currentStage = stage;

        if ( wink.isSet( params.uxEvent ) ) {
            var target = params.uxEvent.target;
            var target = ( target.nodeType == 3 ? target.parentNode : target );
        }
        
        if ( stage === "scrollerTouched" ) {
            if (this.sliding === false) {
                this.selectTimer = wink.setTimeout( this, "preselect", 200, target );
            }
        } else if ( stage === "startScrolling" ) {
            this.resetItemStatus();
            this.scrolling = true;
        } else if ( stage === "endScrolling" ) {
            if ( this.selectTimer != null ) {
                clearTimeout( this.selectTimer );
                this.selectTimer = null;
            }
            
            this.scrolling = false;
        } else if ( stage === "startSliding" ) {
            this.sliding = true;
        } else if ( stage === "stopSliding" ) {
            this.sliding = false;
        } else if (stage === "scrollerClicked" ) {
            this.select( target );
        }
    },
    initializeHeight : function() {
    	window.scrollTo( 0, 0 );
        var headerHeight = 70;
        var heightRemains = wink.ux.window.height - headerHeight;
        jQuery( "div#wrapperDetails" ).show().css( "height", heightRemains + "px");
    },
    initializeScollerDetails: function() {
    	if ( this.scrollerDetails && this.scrollerDetails._target !== null ) {
           this.scrollerDetails.destroy();
        }
        var propertiesDetails = {
	        target: "scrollDetails",
	        direction: "y",
	        callbacks: {
	            scrollerTouched:    { context: this, method: "stageChanged", arguments: "scrollerTouched" },
	            scrollerClicked:    { context: this, method: "stageChanged", arguments: "scrollerClicked" },
	            startScrolling:     { context: this, method: "stageChanged", arguments: "startScrolling" },
	            scrolling:          { context: this, method: "stageChanged", arguments: "scrolling" },
	            endScrolling:       { context: this, method: "stageChanged", arguments: "endScrolling" },
	            startSliding:       { context: this, method: "stageChanged", arguments: "startSliding" },
	            stopSliding:        { context: this, method: "stageChanged", arguments: "stopSliding" }
	        }
        };
        
        this.scrollerDetails = new wink.ui.layout.Scroller(propertiesDetails);
    },
    buildContent : function( current ) {
    	renderDetails( current.currentServer, current.url );
    }
};

jenkins.detailHelper = detailHelper;
})();
        
