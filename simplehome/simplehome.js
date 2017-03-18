function simplehome(target,modpath,docid)
{
    var self = this;
    var html = '<img id="harpur-home" src="/corpix/english/harpur/home/harpur-1874.jpg">';
    html +='<div id="home-div"></div>';
    jQuery("#"+target).append(html); 
    var url = "http://"+window.location.hostname+"/misc/html?docid="+docid;
    jQuery.get(url, function(data) {
        jQuery('#home-div').append(data);
    });
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 * @return a key-value map of the parameters
 */
function get_simplehome_args( scrName )
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
/**
 * Load the home page
 */
jQuery(document).ready( function() { 
    var params = get_simplehome_args('simplehome');
    new simplehome(params['target'],params['modpath'],params['docid']);
}); 
