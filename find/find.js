/**
 * Simple GUI to find things in an index
 * @param target the id of the target eleemnt on the page
 */
function find(target)
{
    this.target = target;
    this.set_html = function( html )
    {
        var tgt = jQuery("#"+this.target);
        tgt.append(html);
    };
    this.get_cms_path = function() {
        var parts = window.location.pathname.split("/");
        if ( parts.length > 1 )
        {
            return '/'+parts[1];
        }        
        else
            return '/'+window.location.pathname;
    };
    /**
     * Turn a JSON format hit into a HTML one
     * @param hit the JSON hit, contains digest, title, docid and perhaps vid
     */
    this.make_hit = function( hit ) {
        var html = '<div class="hit">';
        var cms_path = this.get_cms_path();
        html += '<a href="'+cms_path+'/mvdsingle?docid='+hit.docid;
        if ( hit.vids != undefined && hit.vids.length>0 )
            html += '&version1='+hit.vids[0];
        html += '">'+hit.title+'</a> ';
        html += '<span class="digest">'+hit.digest+'</span>';      
        html += '</div>';
        return html;
    };
    var self = this;
    var html = '<div id="finder">';
    html += '<input type="text" id="query"></input>';
    html += '<input type="button" id="search_button" value="&#xf002;"></input>';
    html += '</div>';
    html += '<div id="hits"></div>';
    this.set_html( html );
    jQuery("#search_button").click( function() {
        var query_text = jQuery("#query").val();
        var url = encodeURI("http://"+window.location.hostname
            +"/search/find?query="+query_text);
        jQuery.get(url,function(data) {
            var hits = jQuery("#hits");
            hits.children().remove();
            for ( var i=0;i<data.length;i++ ) {
                var hit = self.make_hit(data[i]);
                hits.append( hit );
            }
        });                
    });
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 * @return a key-value map of the parameters
 */
function get_args( scrName )
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
 * Load the rebuild index dialog with two arguments
 */
jQuery(document).ready( function() { 
    var params = get_args('find');
    new find(params['target']);
}); 
