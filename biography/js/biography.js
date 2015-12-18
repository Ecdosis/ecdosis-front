/**
 * Create an instance of a readable biography
 * @param target the id of the element to replace with the biography
 * @param docid the id of the events to fetch
 * @param modpath the path to this module
 */
function biography(target,docid,modpath) {
    /**
     * Remove any &lt;p&gt; and &lt;br&gt; codes at start and end
     * And wrap the text in a single &lt;p&gt; and &lt;/p&gt; pair
     * @param text the raw HTML fragment
     * @return kosher HTML wrapped in a single &lt;p&gt;
     */
    this.normaliseParagraph = function( text ) {
        var re = new RegExp("^ | $|^<br>|^<p>|<\/p>$|<br>$","g");
        var rep = text;
        text = "";
        while ( rep != text )
        {
            text = rep;
            rep = text.replace(re,"");
        }
        rep = "<p>"+rep+"</p>";
        return jQuery.htmlClean(rep, {format:true});
    }
    /**
     * Reliably parse some JSON and return a plain JS object
     * @param json the json text
     * @return a plain JS object
     */
    this.parseJSON = function ( json ) {
        return JSON && JSON.parse(json) || jQuery.parseJSON(json);
    }
    /**
     * Create a year entry in the biography
     * @param curr_year the current year as a number
     * @param body the body of the biography, minus refs
     * @param refs the references for the body
     */
    this.pasteYear = function( curr_year, body, refs )
    {
        var html = '<div class="year"><h3>'+curr_year.toString()+'</h3>';
        html += '<div class="bio">';
        html += body;
        html += "</div>\n";
        if ( refs.length>0 )
        {
            html += '<div class="references">';
            html += refs;
            html += '</div>';
        }
        html += "</div>\n";
        return html;
    }
    /**
     * Synchronous get of events
     * @param theUrl the url to get events from
     * @return the JSON response text
     */
    this.httpGet = function(theUrl)
    {
        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        if ( xmlHttp.readyState==1 )
            xmlHttp.send( null );
        return xmlHttp.responseText;
    }
    var url = "http://"+window.location.hostname+"/project/biography/";
    url += "?docid="+docid;
    var dataObject = this.httpGet(url);
    if ( dataObject != null )
    {
        var jsonObject = this.parseJSON(dataObject);
        var events = jsonObject.biography;
        var prev_year = 0;
        var curr_year = 0;
        var body = "";                      
        var html = "";
        var refs = "";
        for ( var i=0;i<events.length;i++ )
        {
            var obj = events[i];
            curr_year = events[i].date.year;
            if ( curr_year != prev_year && prev_year != 0 )
            {
                html += this.pasteYear( prev_year, body, refs );
                body = refs = "";
            }
            if ( body.length>0 )
                body += " ";
            body += this.normaliseParagraph(obj.description);
            if ( refs.length>0 )
                refs += " ";
            refs += this.normaliseParagraph(obj.references);
            prev_year = curr_year;
        }
        if ( body.length>0 )
            html += this.pasteYear(curr_year,body,refs);
        jQuery("#"+target).children().remove();
        jQuery("#"+target).append(html);  
    }
    // animate pictures
    jQuery("a.corpix").click(function(e){
        var parent = jQuery(this).parent();
        if ( parent.prev().is("img") )
            parent.prev().remove();
        else
        {
            var url = jQuery(this).attr("title");
            var alt = jQuery(this).data("alt");
            if ( alt == undefined )
                alt="click to remove";
            parent.before("<img title=\""+alt+"\" src=\""+url+"\">");
            parent.prev().click(function(){
                jQuery(this).remove();
            });
         }
         e.preventDefault();
    });
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
    var params = getArgs('biography.js');
    var instance = new biography(params['target'],params['docid'],
        params['modpath']);
});

