/**
 * Main object
 * @param target the id of the element we are to insert ourselves in
 * @param docid the docid to retrieve the version from
 * @param version1 the version id to fetch
 * @param selections (optional) mvd-offsets of words to select
 */
function mvdsingle(target,docid,version1,selections) 
{
    this.docid = docid;
    this.version1 = version1;
    this.selections = selections;
    this.target = target;
    var self = this;
    /**
     * Copy the stylesheet in a comment returned by the service to head
     * @param the server response
     */
    this.installCss = function( response ) {
        var start = response.indexOf("<!--styles: ");
        if ( start != -1 )
        {
            var part = response.substr(start+12);
            var end = part.indexOf("-->");
            part = part.substr(0,end);
            var old = jQuery("#mvdcss");
            if ( old.length > 0 )
                old.remove();
            jQuery("head").append('<style id="mvdcss">'+part+"</style>");
        }    
    };
    /**
     * Find the selected version from the HTML of the select element
     * @param response the response return from the server 
     * @return the vid of the selection
     */
    this.getSelectedOption = function( responseText ) {
        var opt = "";
        var selPos1 = responseText.indexOf("selected");
        if ( selPos1 == -1 )
        {
            var pos1 = responseText.indexOf("<option");
            pos1 += responseText.substr(pos1).indexOf("value=\"")+7;
            var rest = responseText.substr(pos1);
            var pos2 = pos1+rest.indexOf("\"");
            opt = responseText.substring(pos1,pos2);
        }
        else
        {
            var after = responseText.substr(selPos1);
            selPos1 += after.indexOf("value=\"")+7;
            after = responseText.substr(selPos1);
            var selPos2 = selPos1 + after.indexOf("\"");
            opt = responseText.substring(selPos1,selPos2);
        }
        return opt;
    };
    /**
     * Convert an array of ints to a comma-delimited list
     */
    this.toList = function( array ) {
        var str = "";
        for ( var i=0;i<array.length;i++ )
        {
            str += array[i];
            if ( i < array.length-1 )
                str += ",";
        }
        return str;
    };
    /**
     * Scroll the main window down to the first selection
     */
    this.scrollToSelection = function() {
        var scrollAmt = jQuery(".selected").first().offset().top-(jQuery(window).height()/2)
        if ( scrollAmt < 0 )
            scrollAmt = 0;
        jQuery('html, body').animate({
            scrollTop: scrollAmt
        }, 1000);
    };
    /**
     * Get the text body of the current version. Highlight any hits
     * @param version the version to display
     */
    this.getTextBody = function( version ) {
        var url = "http://"+window.location.hostname
            +"/formatter/?docid="+docid+"&version1="+version;
        if ( self.voffsets != undefined && self.voffsets.length > 0 )
            url += '&selections='+self.voffsets;
        jQuery.get(url, function(response) {
            self.installCss(response);
            jQuery("#body").children().remove();
            jQuery("#body").append(response);
            if ( self.voffsets != undefined && self.voffsets.length > 0 )
            {
                self.scrollToSelection();
            }
        });
    };
    /**
     * Convert the mvd-positions to version-specific positions
     * @param version the version to get voffsets for
     */
    this.getVOffsets = function( first ) {
        if ( self.selections != undefined && self.selections.length > 0 )
        {
            var url = "http://"+window.location.hostname
                +"/search/voffsets?docid="+docid+"&version1="+first;
            url += '&selections='+self.selections;
            jQuery.get(url, function(offsets) {
                self.voffsets = self.toList(offsets);
                self.getTextBody( first );
            });
        }
        else
            self.getTextBody( first );
    };
    /**
     * Install the dropdown version list
     */
    this.installDropdown = function() {
        var url = "http://"+window.location.hostname
            +"/formatter/list?docid="+this.docid+"&list_id=versions";
        if ( this.version1 != undefined && this.version1.length>0 )
            url += "&version1="+this.version1;
        jQuery.get(url, function(responseText) {
            jQuery("#list").append( responseText );
            // install version dropdown handler
            jQuery("#versions").change(function(){
                var val = jQuery("#versions").val();
                self.getVOffsets( val );
            });
            var first = self.getSelectedOption(responseText);
            self.getVOffsets(first);
        });
    };
    // install boilerplate text
    jQuery("#"+this.target).replaceWith('<div id="list"></div><div id="body"></div>');
    // start the ball rolling...
    this.installDropdown();    
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 */
function getArgs( scrName )
{
    var scripts = jQuery("script");
    var params = new Object ();
    scripts.each( function(i) {
        var src = jQuery(this).attr("src");
        if ( src != undefined && src.indexOf(scrName) != -1 )
        {
            var qStr = src.replace(/^[^\?]+\??/,'');
            if ( qStr )
            {
                var pairs = qStr.split(/[;&]/);
                for ( var i = 0; i < pairs.length; i++ )
                {
                    var keyVal = pairs[i].split('=');
                    if ( ! keyVal || keyVal.length != 2 )
                        continue;
                    var key = unescape( keyVal[0] );
                    var val = unescape( keyVal[1] );
                    val = val.replace(/\+/g, ' ');
                    params[key] = val;
                }
            }
            return params;
        }
    });
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    // DOM Ready - do your stuff 
    var params = getArgs('mvdsingle');
    var viewer = new mvdsingle(params['target'],params['docid'], 
    params['version1'],params['selections']);
}); 
