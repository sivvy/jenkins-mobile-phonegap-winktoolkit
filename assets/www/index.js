(function() {
init =  function() {
	//add server button event
    jenkins.changeActiveImage = function(ev) {
    	var current = jQuery( ev.target );
    	current.css( "background-image", current.css( "background-image" ).replace( "active", "inactive" ) );
    };
    jenkins.changeInactiveImage = function(ev) {
    	var current = jQuery( ev.target );
    	current.css( "background-image", current.css( "background-image" ).replace( "inactive", "active" ) );
    };
    
    wink.error.logLevel = 1;
	jenkins.serverHelper.initializeHeight();
    jenkins.serverHelper.buildContent( $( "scrollContent" ) );
	jenkins.serverHelper.callback = function( node ) {
		var current = jQuery(node).parents( ".row" );
		if ( current.length === 0 ) {
			return false;
		}
        jQuery( "div#wrapper" ).hide();
        jQuery( "div#details" ).children().remove();
        jQuery( "div#wrapperDetails" ).show();
        jenkins.current = { currentServer: current.find( ".row-name" ).text(), url: current.attr( "url" ) };
        jenkins.detailHelper.initializeHeight();
        jenkins.detailHelper.buildContent( jenkins.current );
    } ;

	//home button event
	wink.ux.touch.addListener($("homeButton"), "start", { context: jenkins, method: "changeActiveImage" });
	wink.ux.touch.addListener($("homeButton"), "end", { method: "homeHandler" });
	homeHandler = function( ev ) {
		jenkins.changeInactiveImage( ev );
		if ( jenkins.serverChanged ) {
			var serverList = jQuery( "div#main" );
			serverList.children().remove();
            jenkins.serverHelper.initializeHeight();
            jenkins.serverHelper.buildContent();
            serverList.slideDown();
		}
		jQuery( "div#title .text" ).text( "Servers" );
        jQuery( "div#doneButton" ).click();
    	jQuery( "div#wrapperDetails" ).hide();
    	jQuery( "div#settingsDetails" ).hide();
    	jQuery( "div#settings" ).hide();
    	jQuery( "div#default" ).show();
    	jQuery( "div#server-list" ).children().remove();
    	jQuery( "div#wrapper" ).slideDown();
    	jQuery( "div#details" ).children().remove();
	};

	//refresh button event
	wink.ux.touch.addListener($("refreshButton"), "start", { context: jenkins, method: "changeActiveImage" });
	wink.ux.touch.addListener($("refreshButton"), "end", { method: "refreshHandler" });
	refreshHandler = function( ev ) {
		jenkins.changeInactiveImage( ev );
    	var serverList = jQuery( "div#main:visible" );
         if ( serverList.length > 0 ) {
            serverList.children().remove();
            jenkins.serverHelper.initializeHeight();
            jenkins.serverHelper.buildContent();
            serverList.slideDown();
         } else {
            jQuery( "div#details" ).children().remove();
	        jenkins.detailHelper.initializeHeight();
            jenkins.detailHelper.buildContent( jenkins.current );
            jQuery( "div#details" ).slideDown();
         }
	};
    
    //setting button event
    wink.ux.touch.addListener($("settingsButton"), "start", { context: jenkins, method: "changeActiveImage" });
	wink.ux.touch.addListener($("settingsButton"), "end", { method: "settingHandler" });
	settingHandler = function( ev ) {
		jenkins.serverChanged = true;
		jenkins.changeInactiveImage( ev );
    	jQuery( "div#title .text" ).text( "Settings" );
    	jQuery( "div#default" ).hide();
    	jQuery( "div#wrapper" ).hide();
    	jQuery( "div#wrapperDetails" ).hide();
    	jQuery( "div#settings" ).show();
    	jenkins.settingHelper.initializeHeight();
    	jenkins.settingHelper.buildContent();
        jQuery( "div#settingsDetails" ).slideDown();
        jenkins.settingHelper.initializeScollerSettings();
	};
};

})();
        
