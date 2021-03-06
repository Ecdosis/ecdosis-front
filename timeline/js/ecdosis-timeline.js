function timeline(target,docid,modpath,title,subtitle,event_type,language) {
    this.target = target;
    this.docid = docid;
    this.title = unescape(title).replace(/\+/g,' ');
    this.subtitle = unescape(subtitle).replace(/\+/g,' ');
    this.language = language;
    this.event_type = event_type;
    this.modpath=modpath;
    self = this;
    this.options = ['biography','composition','letter','location','other','all'];
    /**
     * Add the years to the year dropdown, based on the events
     * @param jsObject the plain js object form of the events list
     */
    this.buildYearDropdown = function( jsObject ) {
        var dates = jsObject.events;
        var dropdown = jQuery("#year_dropdown");
        dropdown.unbind();
        dropdown.children().remove();
        var years = new Array();
        var i = 0;
        for ( i=0;i<dates.length;i++ )
        {
            var year = dates[i].start_date.year;
            if ( years.length==0 || years[years.length-1]!=year )
                years.push(year);
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
                selected = ' selected="selected"';
            html += '<option'+selected+' value="'+this.options[i]+'">'
                +self.strs.event_types[this.options[i]]+'</option>';
        }
        html += '</select>';
        html += '<div id="years">'+self.strs.go_to_year+': ';
        html += '<select id="year_dropdown"></select></div>';
        html += '<div id="search_box"><input id="search_button" ';
        html += 'value="'+self.strs.search+'" type="button"> <input id="search_expr" ';
        html += 'type="text"></div>';
        html += '</div>';
        jQuery("#"+target).before(html);
        jQuery("#search_button").click( function() {
            var expr = $("#search_expr").val();
            var n = 0;
            if ( expr != null && expr.length>0 ) { 
                var dates = timeline.config.events;
                for ( var index=n+1;index<dates.length;index++ ) 
                {
                    var text = dates[index].text.headline;
                    var desc = dates[index].text.text;
                    if (text != null && desc != null && (text.length>0||desc.length>0) ) {
                        var res1 = text.search(new RegExp(expr, "i"));
                        var res2 = desc.search(new RegExp(expr, "i"));
                        if ( (res1!=-1)||(res2!=-1) ) {
                            n = index+1;
                            break;
                        }
                    }
                }
                if ( 0 != n )
                    timeline.goTo(n);
                else 
                {
                    var elem = jQuery("#search_expr");
                    elem.val("not found");
                }
            }
        });
    };
    this.replaceGetParam = function( url, key, value )
    {
        var parts = url.split("&");
        var newUrl = "";
        for ( var i=0;i<parts.length;i++ )
        {
            if ( parts[i].indexOf("=")!= -1 )
            {
                var halves = parts[i].split("=");
                if ( halves[0] == key )
                    newUrl += key+"="+value;
                else
                    newUrl += halves[0]+"="+halves[1];
            }
            else
            {
                newUrl += parts[i];
            }
            if ( i < parts.length-1 )
                newUrl += "&";
        }
        return newUrl;
    };
    /**
     * Update the timeline with a fresh selection of events
     * @param new_type the new event_type
     */
    this.changeType = function( new_type ) {
        var url = "http://"+window.location.hostname+
        "/project/timeline/?docid="+this.docid
        +"&title="+encodeURIComponent(this.title)
        +"&subtitle="+encodeURIComponent(this.subtitle)
        +"&event_type="+new_type;
        this.event_type = new_type;
        jQuery.get(url, function(data) {
            var dataObj = data;
            if ( dataObj != null )
            {
                var pWidth = jQuery("#"+target).width();
                var config = { width: pWidth, height: 500, 
                    language: self.language };
                jQuery("#"+self.target).empty();
                jQuery("#"+self.target).append('<div id="timeline-embed"></div>');
                self.addToolbar('timeline-embed');
                self.buildYearDropdown(dataObj);
                config.source = dataObj;
                config.embed_id = 'timeline-embed';
                createStoryJS(config);
                jQuery("#year_dropdown").change( function(e) {
                    var dates = timeline.config.events;
                    var year = $("#year_dropdown").val();
                    var top = 0;
                    var mid = 0;
                    var bot = dates.length-1;
                    while ( top <= bot )
                    {
                        mid = Math.floor((top+bot)/2);
                        var midYear = dates[mid].start_date.data.year;
                        var res = year.localeCompare(midYear);
                        if ( res==0 )
                        {
                            timeline.goTo(mid+1);
                            return;
                        }
                        else if ( res < 0 )
                            bot = mid-1;
                        else
                            top = mid+1;
                    }
                    timeline.goTo(mid+1);
                });
            }
            var eventType = jQuery("#event_type");
            eventType.change(function(event) {
                if ( eventType.val() != self.event_type )
                {
                    var href = location.href+"&event_type="+jQuery("#event_type").val();
                    location.assign(href);
                }
            });
        });
    };
    /* define all language-related strings for later */
    var script_name = window.location.pathname;
    var lastIndex = script_name.lastIndexOf("/");
    if ( lastIndex !=-1 )
       script_name = script_name.substr(0,lastIndex);
    script_name += '/'+this.modpath+'/js/strings.'+this.language+'.js';
    jQuery.getScript(script_name,function(data, textStatus, jqxhr) {
        self.strs = load_strings();
        console.log(self.strs);
        console.log("loaded "+script_name+" successfully");
        self.changeType(self.event_type);
    });
}
/**
 * Read the input params
 */
function getTimelineArgs( scrName )
{
    var params = new Object();
    var module_params = jQuery("#timeline_params").val();
    var tabs_params = jQuery("#tabs_params").val();
    if ( tabs_params != undefined && tabs_params.length>0 )
    {
        var parts = tabs_params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 )
            {
                if ( halves[0]=='modpath' )
                {
                    var path = unescape(halves[1]);
                    var index = path.lastIndexOf("/");
                    if ( index != -1 )
                    {
                        path = path.substring(0,index);
                        path += "/timeline";
                        params['modpath'] = path;
                    }
                }
                else
                    params[halves[0]] = unescape(halves[1]);
            }
        }
    }
    if ( module_params != undefined && module_params.length>0 )
    {
        var parts = module_params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 )
            {
                if ( halves[0] != 'event_type' || !('event_type' in params) )
                    params[halves[0]] = halves[1];
            }
        }
    }
    else
    {
        var scripts = jQuery("script");
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
                        var index = pairs[i].indexOf("=");
                        if ( index != -1 )
                        {
                            var keyVal = pairs[i].substring(0,index);
                            var key = unescape( keyVal );
                            var value = pairs[i].substring(index+1);
                            var val = unescape( value );
                            val = val.replace(/\+/g, ' ');
                            params[key] = val;
                        }
                    }
                }
            }
            return params;
        });
    }
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
    var params = getTimelineArgs("timeline");
    var event_type = safe_param(params,'event_type','all');
    var subtitle = safe_param(params,'subtitle','Biographical events');
    var title = safe_param(params,'title','Project timeline');
    var language = safe_param(params,"language","en");
    var instance = new timeline(params['mod-target'],params['docid'],
        params['modpath'],title,subtitle,event_type,language);
});
