/**
 * Tree-viewer
 */
var params;
function treeviewer(target,docid)
{
    this.target = target;
    this.docid = docid;
    var self = this;
    /**
     * Convert a list of http params to a map
     * @return an associative array with keys, values
     */
    this.paramsToMap = function(params) {
        var items = params.split("&");
        var map = new Object();
        for ( var i=0;i<items.length;i++ )
        {
            var halves = items[i].split("=");
            if ( halves.length==2 )
                map[halves[0]] = halves[1];
        }
        return map;
    };
    /**
     * Convert a map of key value pairs to a list of http params
     * @param map an associative array
     * @return a string
     */
    this.mapToParams = function(map) {
        var str = "";
        for (var key in map) 
        {
            var value = map[key];
            if ( str.length>0 )
                str += "&";
            str += key+"="+value;
        }
        return str;
    };
    if ( this.docid == undefined || this.docid.length==0 )
    {
        var tabs_params = jQuery("#tabs_params").val();
        this.docid = get_one_param(tabs_params,'docid');
    }
    var url = "http://"+window.location.hostname+'/tree/title?docid='+this.docid;
    jQuery.get(url,function(data) {
        var src = "http://"+window.location.hostname+"/tree/";
        var tree_params = jQuery("#tree_params").val();
        var tree_map = self.paramsToMap(tree_params);
        var treetype = tree_map['treestyle'];
        var treegrows = tree_map['treegrows'];
        var usebranchlengths = tree_map['usebranchlengths'];
        var ancnodes = tree_map['ancnodes'];
        src += '?docid='+docid;
        if ( treetype != undefined )
            src += '&treestyle='+treetype;
        if ( treegrows != undefined )
            src+='&treegrows='+treegrows;
        if ( usebranchlengths != undefined )
            src+='&usebranchlengths='+usebranchlengths;
        if ( ancnodes != undefined )
            src += '&ancnodes='+ancnodes;
        var t = jQuery("#"+target);
        t.contents().remove();
        t.append('<h3 id="tree-title">'+data+'</h3>');
        t.append('<img id="tree" src="'+src+'">');
        t.append('<form id="treeform" name="treeform" method="get"'
            +'action="http://'+window.location.hostname+window.location.pathname+'"></form>');
        var content = '<table id="tree-footer"><tr>'
            +'<td>tree grows</td><td>tree style</td>'
            +'<td>use branch lengths</td><td>ancestral nodes</td><td></td></tr>'
            +'<tr><td><select name="treegrows" id="treegrows">'
            +'<option selected>horizontal</option><option>vertical</option></select></td>'
            +'<td><select name="treestyle" id="treestyle">'
            +'<option>cladogram</option><option>phenogram</option>'
            +'<option>curvogram</option><option>eurogram</option>'
            +'<option value="circular">circular</option><option selected>swoopogram</option></select></td>'
            +'<td><select name="usebranchlengths" id="usebranchlengths">'
            +'<option>yes</option><option selected>no</option></select></td>'
            +'<td><select name="ancnodes" id="ancnodes">'
            +'<option selected>weighted</option><option>intermediate</option>'
            +'<option>centered</option><option>inner</option></select></td>'
            +'<td><input type="submit" value="redraw"></input>'
            +'<input type="hidden" name="docid" id="docid" value="'+docid+'"></input>'
            +'<input type="hidden" name="module" value="tree"></input>'
            +'</td></tr></table>';
        jQuery("#treeform").append(content);
        if ( treetype != undefined )
        {
            jQuery("#treestyle option").each(function(){
            if ( jQuery(this).text() == treetype )
                jQuery(this).attr("selected","selected");
            });
        }
        if ( treegrows != undefined )
        {
            jQuery("#treegrows option").each(function(){
                if ( jQuery(this).text() == treegrows )
                    jQuery(this).attr("selected","selected");
            });
        }
        if ( usebranchlengths != undefined )
        {
            jQuery("#usebranchlengths option").each(function(){
                if ( jQuery(this).text() == usebranchlengths )
                    jQuery(this).attr("selected","selected");
            });
        }
        if ( ancnodes != undefined )
        {
            jQuery("#ancnodes option").each(function(){
                if ( jQuery(this).text() == ancnodes )
                jQuery(this).attr("selected","selected");
            });
        }
        jQuery("#"+self.target).css("visibility","visible");
        jQuery('#treeform').submit(function() {
            var treetype=jQuery("#treestyle").val();
            var treegrows=jQuery("#treegrows").val();
            var usebranchlengths=jQuery("#usebranchlengths").val();
            var ancnodes=jQuery("#ancnodes").val();
            var tree_params = jQuery("#tree_params").val();
            var map = self.paramsToMap(tree_params);
            map['treetype']= treetype;
            map['treegrows'] = treegrows;
            map['usebranchlengths'] = usebranchlengths;
            map['ancnodes'] = ancnodes;
            if ( jQuery("#tree_params").length==0 )
                jQuery(document).append('<input type="hidden" id="tree_params"></input>');
            jQuery("#tree_params").val(self.mapToParams(map));
            // add in the docid
            var tabs_params = self.paramsToMap(jQUery("#tabs_params").val());
            jQuery('#docid').val(unescape(tabs_params['docid']));
            return true;
        });        
    });
}
function get_one_param( params, name )
{
    var parts = params.split("&");
    for ( var i=0;i<parts.length;i++ )
    {
        var halves = parts[i].split("=");
        if ( halves.length==2 && halves[0]==name )
            return unescape(halves[1]);
    }
    return "";
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 */
function getTreeArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#tree_params").val();
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
    if ( !('docid' in params) )
    {
        var tabs_params = jQuery("#tabs_params").val();
        if ( tabs_params != undefined && tabs_params.length>0 )
            params['docid'] = get_one_param(tabs_params,'docid');
    }
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    var params = getTreeArgs('tree');
    jQuery("#"+params['mod-target']).css("visibility","hidden");
    var viewer = new treeviewer(params['mod-target'],params['docid']);
}); 

