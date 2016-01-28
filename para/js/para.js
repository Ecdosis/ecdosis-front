/**
 * Para-viewer (paratextual)
 */
var params;
function paraviewer(target,format,docid)
{
    this.target = target;
    this.docid = decodeURI(docid);
    this.format = (format==undefined)?"text/x-markdown":format;
    var self = this;
    if (typeof(Storage) !== "undefined") {
        if ( docid == undefined || docid.length==0 )
        {
            docid = localStorage.getItem('docid');
        }
        var url = "http://"+window.location.hostname+'/misc/html?docid='
            +this.docid+'&format='+this.format;
        jQuery.get(url,function(data) {
            var t = jQuery("#"+self.target);
            t.contents().remove();
            t.append(data);
        // copied from iage_expander which won't work otherwise
        jQuery('img[alt="expandable"]').click(function(e){
            var old_src = jQuery(e.target).attr("src");
            var bare_file = old_src.substr(0,old_src.indexOf("."));
            var suffix = old_src.substr(old_src.indexOf("."));
            var large_file = bare_file+"-large"+suffix;
            var max_height = Math.round((jQuery(window).height()*9)/10);
            jQuery("body").append('<div id="enlarged"><img src="'+large_file+'"></div>');
            jQuery("#enlarged img").css("max-height",max_height+"px");
            console.log("max_height="+max_height);
            jQuery("#enlarged").click(function(evt){
                if ( evt.target.tagName == 'IMG' )
                    jQuery(evt.target).parent().remove();
                else
                    jQuery(evt.target).remove();
            });
        });
        });
    } else {
        alert("Sorry! No Web Storage support for para");
    }
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
function getParaArgs( scrName )
{
    var params = new Object ();
    var module_params = localStorage.getItem('para_params');
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
        var tabs_params = localStorage.getItem('tabs_params');
        if ( tabs_params != undefined && tabs_params.length>0 )
            params['docid'] = get_one_param(tabs_params,'docid');
    }
    if ( !('format' in params) )
        params['format'] = 'text/x-markdown';
    if ( !('target' in params) )
        params['target'] = 'tabs-content';
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    // DOM Ready - do your stuff 
    var params = getParaArgs('para');
    var viewer = new paraviewer(params['target'],params['format'],params['docid']);
}); 

