/**
 * Tabbed container
 */
function tabbed(target,module,tabs,modules)
{
    this.target = target;
    this.module = module;
    this.tabs = tabs.split(",");
    this.modules = modules.split(",");
    var self = this;
    /**
     * Capitalise the first letter of a string
     * @param str the string
     * @return the capitalised string
     */
    this.capitalise = function(str) {
        var first = str.substring(0,1);
        var last = str.substring(1);
        return first.toUpperCase()+last;
    };
    this.hasAttr = function( jobj, name ) {
        var attr = jobj.attr(name);
        return (typeof attr !== typeof undefined && attr !== false);
    };
    this.getParam = function( param, url ) {
        if ( url.contains(param) )
        {
            var pos1 = url.indexOf(param);
            var rhs = url.substr(pos1);
            var pos2 = rhs.indexOf("=");
            if ( pos2 != -1 )
            {
                var value = rhs.substr(pos2+1);
                var pos3 = value.indexOf("&");
                if ( pos3 == -1 )
                    return value;
                else
                    return value.substr(0,pos3); 
            }
        }
        return "";
    };
    // now build the page
    var html = '<table id="tab-head">';
    html += '<tr>';
    for ( var i=0;i<this.tabs.length;i++ )
    {
        html += '<td';
        if ( this.modules != undefined && i<this.modules.length 
            && this.modules[i]==this.module )
            html += ' id="tab-selected"';
        html += ' title="'+this.modules[i]+'"';
        html += ' class="tab">'+this.capitalise(unescape(this.tabs[i]))+'</td>\n';
    }
    html += '<td class="tab" id="tab-final"></td></tr></table>';
    html += '<div id="tabs-content"></div>';
    var t = jQuery("#"+target);
    t.contents().remove();
    t.append(html);
    // activate tabs
    jQuery(".tab").each(function(){
        var tab = jQuery(this);
        if ( !self.hasAttr(tab,"id") || tab.attr("id") != "tab-final" )
        {
            tab.click(function(event) {
                var module = tab.attr("title");
                var other_params = localStorage.getItem(module+'_params');
                var docid = self.getParam('docid',location.href);
                if ( other_params == null )
                    other_params = 'docid='+docid;
                else if ( !other_params.contains("docid") )
                    other_params += 'docid='+docid;
                localStorage.removeItem(module+'_params');
                localStorage.setItem(module+'_params',other_params);
                var new_url = "http://"+window.location.hostname+window.location.pathname;
                new_url += '?module='+module;
                // add tabs and modules
                if ( other_params != undefined && other_params.length>0 )
                    new_url += '&'+other_params;
                location.assign(new_url);
            });
        }
    });
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 */
function getTabsArgs( scrName )
{
    var params = new Object ();
    var module_params = localStorage.getItem('tabs_params');
    if ( module_params != undefined && module_params.length>0 )
    {
        var parts = module_params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 )
                params[halves[0]] = halves[1];
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
    }
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    // DOM Ready - do your stuff 
    var params = getTabsArgs('tabs');
    var tabs = new tabbed(params['target'],params['module'],params['tabs'],params['modules']);
}); 

