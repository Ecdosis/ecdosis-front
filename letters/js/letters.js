/**
 * Letter-viewer
 */
var params;
function letterviewer(target,docid)
{
    this.target = target;
    this.docid = docid;
    var self = this;
    this.shortenDocid = function(docid) {
        var index = docid.lastIndexOf("/");
        if ( index != -1 )
            return docid.substring(0,index);
        else
            return docid;
    };
    /**
     * Get a description of the letter
     * @param docid the letter's docid (minus page-number)
     * @return human-readable desc of letter
     */
    this.getLetterDescription = function(docid) {
        var url = "http://"+window.location.hostname+"/pages/letter?docid="+docid;
        jQuery.get(url,function(data) {
            var html = '<h3 class="description"><span>';
            html += data;
            html += "</span></h3>";
            jQuery("#"+self.target).empty();
            jQuery("#"+self.target).append(html);
            self.getMetadata(docid);
        });
    };
    /**
     * Get the metadata and add it to the content
     * @param docid
     */
    this.getMetadata = function(docid)
    {
        var shortId = this.shortenDocid(docid);
        var url = "http://"+window.location.hostname+"/mml/metadata?docid="+shortId;
        jQuery.get(url,function(data) {
            var html = '<div id="metadata"><ul>';
            if ( 'title' in data )
            {
                html += '<li>';
                if ( 'link' in data )
                    html += '<a href="'+data.link+'">';
                html += data.title;
                if ( 'link' in data )
                   html += '</a>';
                html += '</li>';
            }
            if ( 'collection' in data )
                html += '<li><span class="prompt">Collection:</span> '+data.collection+'</li>';
            if ( 'callNumber' in data )
                html += '<li><span class="prompt">Call-number:</span> '+data.callNumber+'</li>';
            html += '</ul></div>';
            jQuery("#"+self.target).append(html);
            jQuery("#"+self.target).css("visibility","visible");
            self.getPages(docid);
        });
    };
    this.getParamValue = function(param) {
        var index = param.lastIndexOf("px");
        if ( index != -1 )
            return parseInt(param.substring(0,index));
        else
            return parseInt(param);
    };
    /**
     * Fetch the images corresponding to the page numbers in the text
     * @param docid the document identifier with the pages in it
     */
    this.getPages = function(docid)
    {
        var url = "http://"+window.location.hostname+"/pages/list?docid="+docid;
        jQuery("#"+self.target).append('<div id="loading"><p>Loading <span class="blinking">...</span></p></div>');
        jQuery.get(url,function(data) {
            var html = '<div id="images">';
            var maxW = jQuery("#"+self.target).width();
            var lSkip = jQuery("#metadata ul").css("padding-left");
            var lSkipAmt = self.getParamValue(lSkip);
            maxW -= lSkipAmt*2;
            for ( var i=0;i<data.length;i++ )
            {
                var p = data[i];
                var ratio = maxW/p.width;
                var w = Math.round(p.width*ratio);
                var h = Math.round(p.height*ratio);
                html += '<img src="'+p.src+'" width="'+w
                    +'" height="'+h+'" title="'+p.n+'" data-n="'+p.n+'">\n';
            }
            html += '</div>';
            jQuery("#loading").remove();
            jQuery("#"+self.target).append(html);
            jQuery("#images").css("width",maxW+"px");
        });
    }
    self.getLetterDescription(docid);
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
function getLettersArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#letters_params").val();
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
    if ( !('mod-target' in params) )
        params['mod-target'] = params['target'];
    else if ( !('target' in params) )
        params['target'] = params['mod-target'];
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    var params = getLettersArgs('letters');
    jQuery("#"+params['mod-target']).css("visibility","hidden");
    var viewer = new letterviewer(params['mod-target'],params['docid']);
}); 

