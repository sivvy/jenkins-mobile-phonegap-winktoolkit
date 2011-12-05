(function() {
var serverTemplate = '<div class="row" url="%url%" id="%rowid%">' +
        '<div class="row-image"><img src="%status%"/></div>' +
        '<div class="row-name">%name%</div>' +
    '</div>';
var loadURL = function( i ) {
    var config = jenkins.Config.configArray;
    if ( !config[i] ) {
    	serverHelper.initializeScoller();
        return false;
    }
    if ( config[i].visible === false ) {
        loadURL( ++i );
        return false;
    }
    var ajax = new XMLHttpRequest(),
    	tmpfunction = function( xhr ) {
	        var statusIcon = "images/icon-server-error.png";
	        if ( ajax.readyState === 4 && ajax.status === 200 ) {
	            statusIcon = "images/icon-server-stable.png";
	            jQuery( jQuery.parseXML( ajax.responseText ) ).find( "entry" ).each( function() {
	                var title = jQuery( this ).find( "title" ).text(),
	                dateTime = jQuery( this ).find( "updated" ).text(),
	                buildNumberEnd = title.indexOf( "(" );
	                var serverStatus = title.substr( buildNumberEnd );
	                if ( serverStatus.indexOf( "(stable)" ) < 0 && serverStatus.indexOf( "normal" ) < 0 && serverStatus.indexOf( "?" ) < 0 ) {
	                    statusIcon = "images/icon-server-fail.png";
	                }
	            } );
	            var tmp = serverTemplate.replace( "%status%", statusIcon );
	            tmp = tmp.replace( "%rowid%", "row" + i );
	            tmp = tmp.replace( "%url%", config[i].url );
	            tmp = tmp.replace( "%name%", config[i].title );
	            jQuery( "#main" ).append( tmp );
	            loadURL( ++i );
	        }  else if ( ajax.readyState == 4 && ajax.status != 200 ) {
	            var tmp = serverTemplate.replace( "%status%", statusIcon );
	            tmp = tmp.replace( "%rowid%", "row" + i );
	            tmp = tmp.replace( "%url%", config[i].url );
	            tmp = tmp.replace( "%name%", config[i].title + "~" + ajax.status + "~"  + ajax.readyState );
	            jQuery( "#main" ).append( tmp );
	            loadURL( ++i );
	        }
	    };
    ajax.onreadystatechange = tmpfunction;
    ajax.open( "GET", config[i].url );
    ajax.send();
};

var serverHelper = {
    nbItem: 140,
    items: [],
    scrolling: false,
    sliding: false,
    currentStage: null,
    selectTimer: null,
    nodePreselected: null,
    nodeSelected: null,
    highlightFlag: false,
    callback: null,

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
        if ( this.callback ) {
        	this.callback(node);
        }
    },
    highlight: function( node ) {
    	jQuery(node).parents( ".row" ).addClass( "active" );
    },
    unHighlight: function( node ) {
    	jQuery(node).parents( ".row" ).removeClass( "active" );
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
        if ( this.highlightFlag === false && this.scrolling === false && this.sliding === false ) {
        	this.highlight( target );
        	this.highlightFlag = true;
        } else {
        	this.unHighlight( target );
        	this.highlightFlag = false;
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
    initializeHeight: function() {
    	window.scrollTo( 0, 0 );
        var headerHeight = 70;
		var heightRemains = wink.ux.window.height - headerHeight;
        jQuery( "div#wrapper" ).show().css( "height", heightRemains + "px");
    },
    initializeScoller: function() {
    	if ( this.scroller && this.scroller._target !== null ) {
        	this.scroller.destroy();
        }
        var properties = {
	        target: "scrollContent",
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
        
        this.scroller = new wink.ui.layout.Scroller(properties);
    },
    buildContent: function( scrollContent ) {
        loadURL( 0 );
    }
};

jenkins.serverHelper = serverHelper;

})();
        
