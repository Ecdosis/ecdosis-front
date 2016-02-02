/**
 * Create a table view
 * @param target the id of the element we are to replace
 * @param docid the docid of the work to fetch and view
 * @param selected a comma-separate list of full version paths
 * @param version1 the full version path of the base version
 * @param pos the index of the leftmost segment in the display
 */ 
function table(target,docid,selected,version1,pos)
{
    this.docid = docid;
    this.target = target;
    this.pos = parseInt((pos==undefined)?0:pos);
    this.version1 = version1;
    var self = this;
    var t = jQuery("#"+target);
    t.contents().remove();
    var url = "http://"+window.location.hostname+"/compare/table/info";
    url += "?docid="+docid;
    if ( selected != undefined )
        url += "&selected="+selected;
    if ( version1 != undefined )
        url += "&version1="+version1;
    if ( self.offsets != undefined )
    {
        var positions = localStorage.getItem('table_offsets');        
        if ( positions != null )
        {
            if ( positions['docid'] != self.docid )
                positions['offsets'] = undefined;
            else
                self.offsets = positions['offsets'];                
        }
    }
    else
    {
        jQuery.get( url, function(data) {
            if ( self.pos == 0 )
            {
                self.left = 0;
                self.right = self.min(self.pos+150,data.length-1);
            }
            else
            {
                self.left = self.max(self.pos-50,0);
                self.right = self.min(self.pos+150,data.length-1);
            }
            self.offsets = data;
            var end = (self.right < data.length)?data[self.right+1]:2147483647;
            self.fetchTable(data[self.left],end);
        });
    }
    this.min = function(a,b) {
        return (a<b)?a:b;
    };
    this.max = function(a,b) {
        return (a>b)?a:b;
    };
    /**
     * Fetch a section of the table and install it
     * @param left the left offset in base version
     * @param right the rightmost offset in base or Java Integer.MAX_VALUE
     */
    this.fetchTable = function(left,right) {
        var url = "http://"+window.location.hostname+"/compare/table/json"
        var length = right-left;
        url2 += "?docid="+self.docid+"&offset="+left+"&length="+length;
        if ( self.version1 != undefined )
            url2 += "&version1="+self.version1;
        jQuery.get(url2,function(data) {
            jQuery("#"+self.target).append(self.tableToHtml(data));
        });
    };
}
function get_one_param( params, name )
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
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 */
function getTableArgs( scrName )
{
    var params = new Object ();
    var module_params = localStorage.getItem('table_params');
    if ( module_params != null && module_params.length>0 )
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
        var tabs_params = localStorage.getItem('tabs_params');
        if ( tabs_params != null && tabs_params.length>0 )
            params['docid'] = get_one_param(tabs_params,'docid');
    }
    return params;
}
/**
 * Load the compare tool with three arguments
 */
jQuery(document).ready(
    function(){
        var params = getTableArgs('table');
        new table(params['mod-target'],params['docid'],params['selected'],
            params['version1'],params['pos']);
    }
);


