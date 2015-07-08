function timeline(target,docid,modpath,title,subtitle,event_type) {
    this.target = target;
    this.docid = docid;
    this.title = title;
    this.subtitle = subtitle;
    self = this;
    this.options = ['biography','composition','letter','other','all'];
    /**
     * Get data from the server
     * @param theUrl the url to query
     */
    this.httpGet = function httpGet(theUrl)
    {
        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        if ( xmlHttp.readyState==1 )
            xmlHttp.send( null );
        return xmlHttp.responseText;
    };
    /**
     * Add the years to the year dropdown, based on the events
     * @param jsObject the plain js object form of the events list
     */
    this.buildYearDropdown = function( jsObject ) {
        var dates = jsObject.timeline.date;
        var dropdown = jQuery("#year_dropdown");
        dropdown.unbind();
        dropdown.children().remove();
        var years = new Array();
        var i = 0;
        for ( i=0;i<dates.length;i++ )
        {
            var year = dates[i].startDate.split(",");
            if ( years.length==0 || (year.length==3 && years[years.length-1]!=year[0]) )
                years.push(year[0]);
        }
        for ( i=0;i<years.length;i++ )
        {
            var otext = (i==0)?"<option selected>":"<option>";
            otext += years[i];
            otext += "</option>";
            var option = jQuery(otext);
            dropdown.append(option);
        }
    };
    /**
     * Add the toolbar before the timeline with search and year dropdown
     * @param target the id of the element where the timeline will appear
     */
    this.addToolbar = function( target ) {
        if ( jQuery("#timeline-toolbar").length>0 )
            jQuery("#timeline-toolbar").remove();
        
        var html = '<div id="timeline-toolbar">';
        html += '<select id="event_type">';
        for ( var i=0;i<this.options.length;i++ )
        {
            var selected = "";
            if ( this.options[i] == this.event_type )
                selected = ' selected';
            html += '<option'+selected+'>'+this.options[i]+'</option>';
        }
        html += '</select>';
        html += '<div id="years">go to year: ';
        html += '<select id="year_dropdown"></select></div>';
        html += '<div id="search_box"><input id="search_button" ';
        html += 'value="search" type="button"> <input id="search_expr" ';
        html += 'type="text"></div>';
        html += '</div>';
        jQuery("#"+target).before(html);
    };
    /**
     * Update the timeline with a fresh selection of events
     * @param new_type the new event_type
     */
    this.changeType = function( new_type ) {
        var url = "http://"+window.location.hostname+
        "/json/timelinenew/?docid="+this.docid
        +"&title="+this.title
        +"&subtitle="+this.subtitle
        +"&event_type="+new_type;
        this.event_type = new_type;
        var dataObject = this.httpGet(url);
        if ( dataObject != null )
        {
            var jsObject = eval("("+dataObject+")");
            var pWidth = jQuery("#"+target).width();
            var parent_config = { type: 'timeline',
                width: pWidth, height: 500,
                source: jsObject, embed_id: target };
            this.addToolbar(target);
            this.buildYearDropdown(jsObject);
            jQuery("#"+this.target).children().remove();
            if ( window.VMM !== undefined )
            {
                 window.VMM.config = undefined;
                 window.VMM.slider = undefined;
                 window.VMM = undefined;
            }
            createStoryJS( parent_config );
        }
        var eventType = jQuery("#event_type");
        eventType.change(function(event) {
            if ( eventType.val() != self.event_type )
                self.changeType(eventType.val());
        });
    };
    this.changeType(event_type);
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
function safe_param( params, key, def )
{
    var value = params[key];
    if ( value != null && value != undefined )
        return value;
    else
        return def;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    // DOM Ready - do your stuff
    var params = getArgs('ecdosis-timeline.js');
    var event_type = safe_param(params,'event_type','all');
    var subtitle = safe_param(params,'subtitle','Biographical events');
    var title = safe_param(params,'title','Project timeline');
    var instance = new timeline(params['target'],params['docid'],
        params['modpath'],title,subtitle,event_type);
});
