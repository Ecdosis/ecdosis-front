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
    /**
     * Install a dropdown list of available projects
     */
    this.makeIndexDropdown = function() {
        var url = "http://"+window.location.hostname+"/search/list";
        jQuery.get( url, function(data) 
        {   
            var indices = data;
            if ( indices != undefined )
            {
                //console.log("received "+indices.length+" indices");
                var html = '<select id="indices">';
                for ( var i=0;i<indices.length;i++ )
                {
                    html += '<option value="'+indices[i].docid
                    +'">'+indices[i].author+": "+indices[i].work
                    +'</option>\n';
                }
                html += '</select>';
                jQuery("#indices").replaceWith(html);
            }
        })
        .fail(function() {
            console.log("failed to load indices");
        });
    };
    /**
     * Get the CMS path component
     * @return the path from web root to CMS root
     */
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
     * Convert an array of ints to a comma-delimited list
     */
    this.toList = function( array ) {
        var str = "";
        for ( var i=0;i<array.length;i++ )
        {
            str += array[i];
            if ( i < array.length-1 )
                str += ",";
        }
        return str;
    };
    /**
     * Turn a JSON format hit into a HTML one
     * @param hit the JSON hit, contains digest, title, docid and positions
     */
    this.make_hit = function( hit ) {
        var html = '<div class="hit">';
        var cms_path = this.get_cms_path();
        html += '<a href="'+cms_path+'/mvdsingle?docid='
            +hit.docid;
        if ( hit.positions != undefined && hit.positions.length>0 )           
            html += "&selections="+this.toList(hit.positions);
        if ( hit.version1 != undefined && hit.version1.length>0 )
            html += '&version1='+hit.version1;
        html += '">'+hit.title+'</a> ';
        html += '<span class="digest">'+hit.body+'</span>';      
        html += '</div>';
        return html;
    };
    var self = this;
    var html = '<div id="finder">';
    html += '<p><span id="proj_title">Project:</span> <select id="indices"></select></p>';
    html += '<input type="text" id="query"></input>';
    html += '<input type="button" id="search_button" value="&#xf002;"></input><br>';
    html += '<label><input type="checkbox" id="literal_check"></input> Literal match</label>';
    html += '</div>';
    html += '<div id="hits"></div>';
    this.set_html( html );
    this.makeIndexDropdown();
    jQuery("#search_button").click( function() {
        var query_text = jQuery("#query").val();
        if ( jQuery('#literal_check').is(':checked') ) 
            query_text = '"'+query_text+'"';
        var url = encodeURI("http://"+window.location.hostname
            +"/search/find?query="+query_text+"&docid="
            +jQuery("#indices").val());
        jQuery.get(url,function(data) {
            self.numHits = data.numHits;
            self.totalHits = data.totalHits;
            self.firstHit = data.firstHit;
            self.hitsPerPage = data.hitsPerPage;
            console.log(self.firstHit+" "+self.numHits+" "+self.totalHits);
            var hitList = data.hits;
            var hits = jQuery("#hits");
            hits.children().remove();
            if ( self.numHits==0 )
            {
                hits.append('<p>No results found</p>');
            }
            for ( var i=0;i<hitList.length;i++ ) {
                var hit = self.make_hit(hitList[i]);
                hits.append( hit );
            }
            if ( self.firstHit != 0 || self.totalHits>self.numHits+self.firstHit )
            {
                hits.append('<p id="hits_footer"><span id="page_previous">'
                +'</span><span id="page_next"></span></p>');
                if ( self.firstHit != 0 )
                {
                    var prevUrl = computeUrl(self.firstHit-self.hitsPerPage, 
                        query_text);
                    jQuery("#page_previous").append('<a href="'+prevUrl
                        +'">Previous</a>');
                }
                if ( self.totalHits>self.numHits+self.firstHit )
                {
                    var nextUrl = computeUrl(self.firstHit+self.hitsPerPage, 
                        query_text);
                    jQuery("#page_next").append('<a href="'+nextUrl
                        +'">Next</a>');
                }       
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
