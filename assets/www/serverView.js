(function() {
var serverTemplate = '<div class="row" url="%url%">' +
        '<div class="row-image"><img src="%status%"/></div>' +
        '<div class="row-name">%name%</div>' +
    '</div>';
var loadURL = function( i ) {
    config = jenkins.Config.configArray;
    if ( !config[i] ) {
    	if ( !scrollerHelper.scroller )
    	   scrollerHelper.initializeScoller();
        return false;
    }
    if ( config[i].visible === false ) {
        loadURL( ++i );
        return false;
    }
    var ajax = new XMLHttpRequest();
        ajax.open( "GET", config[i].url );
        var tmpfunction = function( xhr ) {
            var statusIcon = "images/icon-server-error.png";
            if ( ajax.readyState == 4 && ajax.status == 200 ) {
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
                tmp = tmp.replace( "%url%", config[i].url );
                tmp = tmp.replace( "%name%", config[i].title );
                jQuery( "#main" ).append( tmp );
                loadURL( ++i );
            }  else if ( ajax.readyState == 4 && ajax.status != 200 ) {
                var tmp = serverTemplate.replace( "%status%", statusIcon );
                tmp = tmp.replace( "%url%", config[i].url );
                tmp = tmp.replace( "%name%", config[i].title + "~" + ajax.status + "~"  + ajax.readyState );
                jQuery( "#main" ).append( tmp );
                loadURL( ++i );
            }
        };
        ajax.onreadystatechange = tmpfunction;
        ajax.send();
};

var detailsTemplate = '<div class="row">' +
	'<div class="row-image"><img src="%status%"/></div>' +
	'<div class="row-name">%name%</div>' +
	'<div class="row-number">%number%</div>' +
	'<div class="row-datetime"><img src="images/icon-time.png"/><span>%datetime%</span></div>' +
'</div>';

renderDetails = function( currentServer, url ) {
    var ajax = new XMLHttpRequest();
        ajax.open( "GET", url );
    var tmpfunction = function( xhr ) {
        if ( ajax.readyState == 4 && ajax.status == 200 ) {
            for ( var i=0; i<5; i++ )
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
            
            if ( !scrollerHelper2.scrollerDetails || scrollerHelper2.scrollerDetails._target === null )
                scrollerHelper2.initializeScollerDetails();
//            jQuery( "div#wrapperDetails" ).hide().slideDown();
        }  else if ( ajax.readyState == 4 && ajax.status != 200 ) {
            alert("Url seems to be invalid. Change your settings");
            jQuery( "div#wrapper" ).slideDown();
            return false;
            }
        };
        ajax.onreadystatechange = tmpfunction;
        ajax.send();
};

var settingsTemplate = '<div class="server-row active" rid="%id%" url="%url%">' + 
        '<div class="server-name">%name%</div>' +
        '<span class="remove w_bg_light w_radius" ><input type="image" src="images/icon-delete.png" style="width:30px;height:30px;"/></span>' +
        '</div>';

var scrollerHelper = 
{
    nbItem: 140,
    items: [],
    scrolling: false,
    sliding: false,
    currentStage: null,
    selectTimer: null,
    nodePreselected: null,
    nodeSelected: null,
        
    preselect: function(node) 
    {
        clearTimeout(this.selectTimer);
        this.selectTimer = null;
        
        if (this.scrolling == false && this.sliding == false) 
        {
            var cn = node.className;
            if (cn.indexOf('selected') == -1) 
            {
                this.resetItemStatus();
                wink.addClass(node, "preselected");
                this.nodePreselected = node;
            }
        }
    },

    select: function(node) 
    {
        this.resetItemStatus();
        wink.addClass(node, "selected");
        this.nodeSelected = node;
    },

    resetItemStatus: function() 
    {
        if (this.nodePreselected != null) 
        {
            wink.removeClass(this.nodePreselected, "preselected");
            this.nodePreselected = null;
        }
        
        if (this.nodeSelected != null) 
        {
            wink.removeClass(this.nodeSelected, "selected");
            this.nodeSelected = null;
        }
    },

    stageChanged: function(params, stage) 
    {
    	console.log('i am this:', this);
        this.currentStage = stage;

        if (wink.isSet(params.uxEvent)) 
        {
            var target = params.uxEvent.target;
            var target = (target.nodeType == 3 ? target.parentNode : target);
        }
        
        if (stage == 'scrollerTouched') 
        {
            if (this.sliding == false) 
            {
                this.selectTimer = wink.setTimeout(this, 'preselect', 200, target);
            }
        } else if (stage == 'startScrolling') 
        {
            this.resetItemStatus();
            this.scrolling = true;
        } else if (stage == 'endScrolling') 
        {
            if (this.selectTimer != null) 
            {
                clearTimeout(this.selectTimer);
                this.selectTimer = null;
            }
            
            this.scrolling = false;
        } else if (stage == 'startSliding') 
        {
            this.sliding = true;
        } else if (stage == 'stopSliding') 
        {
            this.sliding = false;
        } else if (stage == 'scrollerClicked') 
        {
            this.select(target);
        }
    },

    buildContent: function(scrollContent) 
    {
        loadURL( 0 );
    },
    initializeScoller: function() {
    	window.scrollTo(0,0);
//        var headerHeight = 55;
        var headerHeight = 115;
		var heightRemains = wink.ux.window.height - headerHeight;
		$('wrapper').style.height = heightRemains + "px";
//		$('wrapperDetails').style.height = heightRemains + "px";
        var properties = 
        {
        target: "scrollContent",
        direction: "y",
        callbacks: {
            scrollerTouched:    { context: scrollerHelper, method: 'stageChanged', arguments: 'scrollerTouched' },
            scrollerClicked:    { context: scrollerHelper, method: 'stageChanged', arguments: 'scrollerClicked' },
            startScrolling:     { context: scrollerHelper, method: 'stageChanged', arguments: 'startScrolling' },
            scrolling:          { context: scrollerHelper, method: 'stageChanged', arguments: 'scrolling' },
            endScrolling:       { context: scrollerHelper, method: 'stageChanged', arguments: 'endScrolling' },
            startSliding:       { context: scrollerHelper, method: 'stageChanged', arguments: 'startSliding' },
            stopSliding:        { context: scrollerHelper, method: 'stageChanged', arguments: 'stopSliding' }
        }
        };
        
        this.scroller = new wink.ui.layout.Scroller(properties);
        console.log("main",this.scroller);
    }
    
};
scrollerHelper2 = 
{
    nbItem: 140,
    items: [],
    scrolling: false,
    sliding: false,
    currentStage: null,
    selectTimer: null,
    nodePreselected: null,
    nodeSelected: null,
        
    preselect: function(node) 
    {
        clearTimeout(this.selectTimer);
        this.selectTimer = null;
        
        if (this.scrolling == false && this.sliding == false) 
        {
            var cn = node.className;
            if (cn.indexOf('selected') == -1) 
            {
                this.resetItemStatus();
                wink.addClass(node, "preselected");
                this.nodePreselected = node;
            }
        }
    },

    select: function(node) 
    {
        this.resetItemStatus();
        wink.addClass(node, "selected");
        this.nodeSelected = node;
    },

    resetItemStatus: function() 
    {
        if (this.nodePreselected != null) 
        {
            wink.removeClass(this.nodePreselected, "preselected");
            this.nodePreselected = null;
        }
        
        if (this.nodeSelected != null) 
        {
            wink.removeClass(this.nodeSelected, "selected");
            this.nodeSelected = null;
        }
    },

    stageChanged: function(params, stage) 
    {
    	console.log('i am this02:', this);
        this.currentStage = stage;

        if (wink.isSet(params.uxEvent)) 
        {
            var target = params.uxEvent.target;
            var target = (target.nodeType == 3 ? target.parentNode : target);
        }
        
        if (stage == 'scrollerTouched') 
        {
            if (this.sliding == false) 
            {
                this.selectTimer = wink.setTimeout(this, 'preselect', 200, target);
            }
        } else if (stage == 'startScrolling') 
        {
            this.resetItemStatus();
            this.scrolling = true;
        } else if (stage == 'endScrolling') 
        {
            if (this.selectTimer != null) 
            {
                clearTimeout(this.selectTimer);
                this.selectTimer = null;
            }
            
            this.scrolling = false;
        } else if (stage == 'startSliding') 
        {
            this.sliding = true;
        } else if (stage == 'stopSliding') 
        {
            this.sliding = false;
        } else if (stage == 'scrollerClicked') 
        {
            this.select(target);
        }
    },
    initializeScollerDetails: function() {
    	window.scrollTo(0,0);
//        var headerHeight = 55;
        var headerHeight = 115;
        var heightRemains = wink.ux.window.height - headerHeight;
        console.log('height details ->', heightRemains);
        $('wrapperDetails').style.height = heightRemains + "px";
        console.log($('wrapperDetails').style.height);
        var propertiesDetails = 
        {
        target: "scrollDetails",
        direction: "y",
        callbacks: {
            scrollerTouched:    { context: this, method: 'stageChanged', arguments: 'scrollerTouched' },
            scrollerClicked:    { context: this, method: 'stageChanged', arguments: 'scrollerClicked' },
            startScrolling:     { context: this, method: 'stageChanged', arguments: 'startScrolling' },
            scrolling:          { context: this, method: 'stageChanged', arguments: 'scrolling' },
            endScrolling:       { context: this, method: 'stageChanged', arguments: 'endScrolling' },
            startSliding:       { context: this, method: 'stageChanged', arguments: 'startSliding' },
            stopSliding:        { context: this, method: 'stageChanged', arguments: 'stopSliding' }
        }
        };
        
        this.scrollerDetails = new wink.ui.layout.Scroller(propertiesDetails);
        console.log("details",this.scrollerDetails);
    }
    
};

scrollerHelper3 = 
{
    nbItem: 140,
    items: [],
    scrolling: false,
    sliding: false,
    currentStage: null,
    selectTimer: null,
    nodePreselected: null,
    nodeSelected: null,
        
    preselect: function(node) 
    {
        clearTimeout(this.selectTimer);
        this.selectTimer = null;
        
        if (this.scrolling == false && this.sliding == false) 
        {
            var cn = node.className;
            if (cn.indexOf('selected') == -1) 
            {
                this.resetItemStatus();
                wink.addClass(node, "preselected");
                this.nodePreselected = node;
            }
        }
    },

    select: function(node) 
    {
        this.resetItemStatus();
        wink.addClass(node, "selected");
        this.nodeSelected = node;
    },

    resetItemStatus: function() 
    {
        if (this.nodePreselected != null) 
        {
            wink.removeClass(this.nodePreselected, "preselected");
            this.nodePreselected = null;
        }
        
        if (this.nodeSelected != null) 
        {
            wink.removeClass(this.nodeSelected, "selected");
            this.nodeSelected = null;
        }
    },

    stageChanged: function(params, stage) 
    {
        console.log('i am this 03:', this);
        this.currentStage = stage;

        if (wink.isSet(params.uxEvent)) 
        {
            var target = params.uxEvent.target;
            var target = (target.nodeType == 3 ? target.parentNode : target);
        }
        
        if (stage == 'scrollerTouched') 
        {
            if (this.sliding == false) 
            {
                this.selectTimer = wink.setTimeout(this, 'preselect', 200, target);
            }
        } else if (stage == 'startScrolling') 
        {
            this.resetItemStatus();
            this.scrolling = true;
        } else if (stage == 'endScrolling') 
        {
            if (this.selectTimer != null) 
            {
                clearTimeout(this.selectTimer);
                this.selectTimer = null;
            }
            
            this.scrolling = false;
        } else if (stage == 'startSliding') 
        {
            this.sliding = true;
        } else if (stage == 'stopSliding') 
        {
            this.sliding = false;
        } else if (stage == 'scrollerClicked') 
        {
            this.select(target);
        }
    },
    initializeScollerSettings: function() {
        window.scrollTo(0,0);
//        var headerHeight = 55;
        var headerHeight = 175;
        var heightRemains = wink.ux.window.height - headerHeight;
        console.log('height details ->', heightRemains);
        $('settingsDetails').style.height = heightRemains + "px";
        console.log($('settingsDetails').style.height);
//        $('wrapperSettings').style.height = heightRemains + "px";
//        console.log($('wrapperSettings').style.height);
        var propertiesDetails = 
        {
        target: "scrollSettings",
        direction: "y",
        callbacks: {
            scrollerTouched:    { context: this, method: 'stageChanged', arguments: 'scrollerTouched' },
            scrollerClicked:    { context: this, method: 'stageChanged', arguments: 'scrollerClicked' },
            startScrolling:     { context: this, method: 'stageChanged', arguments: 'startScrolling' },
            scrolling:          { context: this, method: 'stageChanged', arguments: 'scrolling' },
            endScrolling:       { context: this, method: 'stageChanged', arguments: 'endScrolling' },
            startSliding:       { context: this, method: 'stageChanged', arguments: 'startSliding' },
            stopSliding:        { context: this, method: 'stageChanged', arguments: 'stopSliding' }
        }
        };
        
        this.scrollerSettings = new wink.ui.layout.Scroller(propertiesDetails);
        console.log("settings",this.scrollerSettings);
    }
    
};

confirmCancel = function() {
    //do nothing
};

confirmOk = function() {
    var config = jQuery.parseJSON(window.localStorage.getItem("config")),
        serverName = jQuery( "input#popup-name" ).val(),
        serverId = jQuery( "input#popup-id" ).val(),
        serverUrl = jQuery( "input#popup-url" ).val();
    var key = jenkins.Config.set(serverId, {title: serverName, url: serverUrl, visible: true});
    jenkins.Config.save();
    
    if ( serverId === "" ) {
        var tmp = settingsTemplate.replace( "%name%", serverName )
                                .replace( "%url%", serverUrl )
                                .replace( "%id%", key );
        jQuery( "div#server-list" ).append( tmp );
    } else {
        var row = jQuery( "div#server-list .server-row[rid=" + key + "]" );
        row.attr( "url", serverUrl );
        row.children( ".server-name" ).html( serverName );
    }
    jQuery( "input#popup-name" ).val( "Name" );
    jQuery( "input#popup-url" ).val( "Url" );
    jQuery( "input#popup-id" ).val( "" );
};

jQuery( document ).ready( function() {
    wink.error.logLevel = 1;
    
    //jQuery( "div#wrapperDetails" ).hide();
    scrollerHelper.buildContent($('scrollContent'));

    jQuery( "div#main div.row" ).live('click', function() {
        jQuery( "div#wrapper" ).hide();

        var url = jQuery(this).attr( "url" ),
            currentServer = jQuery(this).find( ".row-name" ).text();
        
        jenkins.current = {currentServer: currentServer, url: url};
        renderDetails( currentServer, url );
        
        jQuery( "div#wrapperDetails" ).slideDown();
    } );
    
    jQuery( "div#homeButton" ).click(function() {
    	jQuery( "div#wrapperDetails" ).hide();
    	if ( scrollerHelper2.scrollerDetails && scrollerHelper2.scrollerDetails._target !== null ) {
    		console.log('destroy helper 2');
//    	if ( scrollerHelper2.scrollerDetails._target !== null ) {
    	   scrollerHelper2.scrollerDetails.destroy();
    	}
    	jQuery( "div#wrapper" ).slideDown();
    	jQuery( "div#details" ).children().remove();
    });
    
    jQuery( "div#refreshButton" ).click( function() {
    	var serverList = jQuery( "div#main:visible" );
         if ( serverList.length > 0 ) {
            serverList.hide();
            serverList.children().remove();
            i = 0;
            loadURL( i );
            serverList.slideDown( 1000 );
         } else {
            //jQuery( "div#details" ).hide();
            jQuery( "div#details" ).children().remove();
            if ( scrollerHelper2.scrollerDetails && scrollerHelper2.scrollerDetails._target !== null ) {
                console.log('destroy helper 2');
	           scrollerHelper2.scrollerDetails.destroy();
	        }
            renderDetails( jenkins.current.currentServer, jenkins.current.url );
            jQuery( "div#details" ).slideDown();
         }
    } );
    
    
    jQuery( "div#settingsButton" ).click( function() {
    	jQuery( "div#header #title" ).text( "Settings" );
    	jQuery( "div#menu div#default" ).hide();
    	jQuery( "div#wrapper" ).hide();
    	jQuery( "div#wrapperDetails" ).hide();
    	jQuery( "div#menu div#settings" ).show();
    	jQuery( "div#settingDescription" ).show();
    	jQuery( "div#settingsDetails" ).show();
    	var config = jenkins.Config.config;
        for ( var i in config ) {
            var tmp = settingsTemplate.replace( "%name%", config[i].title )
                                        .replace( "%url%", config[i].url )
                                        .replace( "%id%", config[i].id );
            if ( config[i].visible === false ) {
                tmp = tmp.replace( "active", "" );
            }
            jQuery( "div#server-list" ).append( tmp );
        }
        scrollerHelper3.initializeScollerSettings();
        jQuery( "div#settingsDetails" ).slideDown();
    	
    } );
    
    jQuery( "div#server-list span.remove" ).live('click', function() {
        jQuery(this).parent().hide( 500 ).remove();
        jenkins.Config.remove( jQuery(this).parent().attr( "rid" ) );
        jenkins.Config.save();
    } );
    
    jQuery( "div#server-list div.server-row" ).live( "click", function() {
        var current = jQuery(this),
           rid = current.attr( "rid" );
        if ( current.hasClass("active") ) {
            current.removeClass( "active" );
            jenkins.Config.setActive( rid, false );
        } else {
            current.addClass( "active" );
            jenkins.Config.setActive( rid, true );          
        }
        jenkins.Config.save();
    } );
    
    jQuery( "div#doneButton" ).click( function() {
    	jQuery( "div#header #title" ).text( "Servers" );
    	jQuery( "div#menu div#settings" ).hide();
        jQuery( "div#settingDescription" ).hide();
        jQuery( "div#settingsDetails" ).hide();
        jQuery( "div#server-list" ).children().remove();
        jQuery( "div#menu div#default" ).show();
        jQuery( "div#wrapper" ).show();
        jQuery( "div#refreshButton" ).click();
    } );
    
    jQuery( "div#addButton" ).click( function() {
    	var popup;
    	popup = new wink.ui.xy.Popup();
        document.body.appendChild(popup.getDomNode());
//    	var showConfirm = function() {
        popup.confirm({
//        	msg: 'lala',
            msg: '<div class="popup-title">New Server</div>'+
				'<div><input type="hidden" id="popup-id" class="input-box" value="" /></div>'+
				'<div><input type="text" id="popup-name" class="input-box" value="Name" /></div>'+
				'<div><input type="text" id="popup-url" class="input-box" value="URL" /></div>',
            callbackOk: { context: window, method: 'confirmOk' },
            callbackCancel: { context: window, method: 'confirmCancel' },
            followScrollY: true
        });
        
//            };
    } );
    
     jQuery( "div#quitButton" ).click( function() {
        navigator.app.exitApp();
    } );
});

})();
        
