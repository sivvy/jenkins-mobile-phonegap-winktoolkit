(function() {
var settingsTemplate = '<div class="server-row active" rid="%id%" url="%url%">' + 
        '<div class="server-name">%name%</div>' +
        '<div class="remove w_bg_light w_radius" ></div>' +
        '</div>';

var settingHelper = {
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
        if ( jQuery( node ).hasClass( "remove" ) ) {
        	this.removeHandler( node );
        } if ( jQuery( node ).hasClass( "server-row" ) ||  jQuery( node ).hasClass( "server-name" ) ) {
        	this.hideServer( node );
        }
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
    initializeHeight: function() {
    	window.scrollTo( 0, 0 );
        var headerHeight = 70;
        var heightRemains = wink.ux.window.height - headerHeight;
        jQuery( "div#settingsDetails" ).show().css( "height", heightRemains + "px");
    },
    initializeScollerSettings: function() {
    	if ( this.scrollerSettings && this.scrollerSettings._target !== null ) {
    	   this.scrollerSettings.destroy();
    	}
        var propertiesDetails = {
	        target: "scrollSettings",
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
        
        this.scrollerSettings = new wink.ui.layout.Scroller(propertiesDetails);
    },
    hideServer: function( node ) {
    	var current = jQuery( node ).parents( ".server-row:first" );
    	if ( current.length === 0 ) {
    		current = jQuery( node );
    		if ( current.length === 0 ) return false;
    	}
        if ( current.hasClass("active") ) {
            current.removeClass( "active" );
            jenkins.Config.setActive( current.attr( "rid" ), false );
        } else {
            current.addClass( "active" );
            jenkins.Config.setActive( current.attr( "rid" ), true );          
        }
        jenkins.Config.save();
    },
    removeHandler: function( node ) {
    	var current = jQuery( node );
        current.parent().hide( 500 ).remove();
        jenkins.Config.remove( current.parent().attr( "rid" ) );
        jenkins.Config.save();
        jenkins.settingHelper.initializeScollerSettings();
    },
    createServerRow : function( server ) {
    	var tmp = settingsTemplate.replace( "%name%", server.title )
                                    .replace( "%url%", server.url )
                                    .replace( "%id%", server.id );
        if ( server.visible === false ) {
            tmp = tmp.replace( "active", "" );
        }
        return tmp;
    },
    buildContent : function() {
    	var config = jenkins.Config.config;
        for ( var i in config ) {
            jQuery( "div#server-list" ).prepend( this.createServerRow(config[i]) );
            //var current = jQuery( "div#server-list div.remove:first" ).get( 0 );
            //wink.ux.touch.addListener( current, "end", { context: this, method: "removeHandler", arguments: [ current ] });
            //jQuery( "div#server-list div.remove:first" ).click( this.removeHandler );
        }

	    jQuery( "div#server-list div.server-row" ).each(function(i) {
	    	var current = jQuery(this);
	    	current.attr("id", "select" + i);
	    	wink.ux.touch.addListener(current.get(0), "start", { method: "selectHanlder", arguments: [current ]  });
	    	wink.ux.touch.addListener(current.get(0), "end", { method: "selectHanlder", arguments: [current ]  });
	        selectHanlder = function(ev, current) {
		        var rid = current.attr( "rid" );
		        if ( current.hasClass("active") ) {
		            current.removeClass( "active" );
		            jenkins.Config.setActive( rid, false );
		        } else {
		            current.addClass( "active" );
		            jenkins.Config.setActive( rid, true );          
		        }
		        jenkins.Config.save();
	        }
	    } );
	    
	   settingHelper.confirmOk = function() {
		    var config = jQuery.parseJSON( window.localStorage.getItem( "config" ) ),
		    	server = {
		    		title: jQuery( "input#popup-name" ).val(),
		    		url: jQuery( "input#popup-url" ).val(),
		    		visible: true
		    	};
		    var key = jenkins.Config.set( jQuery( "input#popup-id" ).val(), server );
		    server.id = key;
		    jenkins.Config.save();
		    
		    if ( jQuery( "input#popup-id" ).val() === "" ) {
		        jQuery( "div#server-list" ).prepend( this.createServerRow( server ) );
		         //var current = jQuery( "div#server-list div.remove:first" ).get( 0 );
           		 //wink.ux.touch.addListener( current, "end", { context: this, method: "removeHandler", arguments: [ current ] });
            	//jQuery( "div#server-list div.remove:first" ).click( this.removeHandler );
		    } else {
		        var row = jQuery( "div#server-list .server-row[rid=" + key + "]" );
		        row.attr( "url", server.url );
		        row.children( ".server-name" ).html( server.title );
		    }
		    jQuery( "input#popup-name" ).val( "Name" );
		    jQuery( "input#popup-url" ).val( "Url" );
		    jQuery( "input#popup-id" ).val( "" );
		    
		    
		    this.initializeScollerSettings();
		};
	    wink.ux.touch.addListener($("addButton"), "start", { context: jenkins, method: "changeActiveImage" });
	    wink.ux.touch.addListener($("addButton"), "end", { method: "addHandler" });
		addHandler = function( ev ) {
			jenkins.changeInactiveImage( ev );
			event.stopPropagation();
	    	var popup;
	    	popup = new wink.ui.xy.Popup();
	        document.body.appendChild(popup.getDomNode());
	        popup.confirm({
	            msg: '<div class="popup-title">New Server</div>'+
					'<div><input type="hidden" id="popup-id" class="input-box" value="" /></div>' +
					'<div><input type="text" id="popup-name" class="input-box" value="Name" /></div>' +
					'<div><input type="text" id="popup-url" class="input-box" value="URL" /></div>',
	            callbackOk: { context: settingHelper, method: 'confirmOk' },
	            callbackCancel: { context: settingHelper, method: 'confirmCancel' },
	            followScrollY: true
	        });
		};
    }
};

jenkins.settingHelper = settingHelper;
})();
        
