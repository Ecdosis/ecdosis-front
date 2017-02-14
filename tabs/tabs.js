/**
 * Tabbed container
 */
function tabbed(target,module,tabset,tabs,modules,menuopt)
{
    this.target = target;
    this.module = module;
    this.tabset = tabset;
    this.menuopt = menuopt;
    this.tabs = tabs.replace(/\+/g," ").split(",");
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
    this.getOneParam = function( params, name )
    {
        var parts = params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 && halves[0]==name )
                return halves[1];
        }
        return "";
    }
    this.paramsToObj = function(params,obj) {
        if ( params != null )
        {
            var args = params.split("&");
            for ( var i=0;i<args.length;i++ )
            {
                var halves = args[i].split("=");
                if ( halves.length==2 )
                    obj[halves[0]] = halves[1];
            }
        }
        return obj;
    };
    this.objToParams = function(obj) {
        var keys = Object.keys(obj);
        var str = "";
        for ( var i=0;i<keys.length;i++ )
        {
            if ( str.length>0 )
                str += "&";
            str += keys[i];
            str += "=";
            str += escape(obj[keys[i]]);
        }
        return str;
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
                var mod_spec = jQuery(this).attr("title");
                var mod_name = "";
                var obj = new Object();
                // get stale params from local storage
                var other_params = jQuery("#"+mod_name+"_params").val();
                obj = self.paramsToObj(other_params,obj);
                // refresh with curently seleted params in mod_spec if present
                var extra_params="";
                var extra_index = mod_spec.indexOf("?");
                if ( extra_index!=-1 )
                {
                    extra_params = mod_spec.substring(extra_index+1);
                    obj = self.paramsToObj(extra_params,obj);
                    mod_name = mod_spec.substring(0,extra_index);
                }
                var tabs_params = jQuery("#tabs_params").val();
                var docid = self.getOneParam(tabs_params,'docid');
                var new_url = "http://"+window.location.hostname+window.location.pathname;
                obj['module'] = mod_spec;
                obj['tabset'] = self.tabset;
                if ( jQuery("#versions").length > 0 )
                    obj['version1'] = jQuery("#versions").val();
                if ( docid.length>0 )
                    obj['docid'] = unescape(docid);
                new_url += "?"+self.objToParams(obj);
                location.assign(new_url);
            });
        }
    });
    t.css("visibility","visible");
    if ( this.menuopt == "true" )
    {
        jQuery("#optional-tab").css("display","inline");
        var a = jQuery("#optional-tab").find("a");
        a.addClass("nolink");
    }
    else
        jQuery("#optional-tab").css("display","none");
    // disable nolinks
    jQuery('.nolink').click(function(e) {
        e.preventDefault();
    });
    // activate main menu item corresponding to this tabset
    var menuItem = this.capitalise(this.tabset);
    jQuery(".menu .leaf").each(function(){
        if ( jQuery(this).text() == menuItem )
        {
            jQuery(this).attr("class","first leaf");
            jQuery(this).find("a").addClass("active");
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
    var module_params = jQuery("#tabs_params").val();
    if ( module_params != undefined && module_params.length>0 )
    {
        var parts = module_params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 )
                params[halves[0]] = unescape(halves[1]);
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
    var params = getTabsArgs('tabs');
    var t = jQuery("#"+params['target']);
    if ( t != undefined )
        t.css("visibility","hidden");
    var tabs = new tabbed(params['target'],params['module'],params['tabset'],
        params['tabs'],params['modules'],params['menuopt']);
}); 

