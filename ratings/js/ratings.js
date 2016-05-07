/**
 * Ratings formatter
 */
function ratings_viewer(target,docid)
{
    this.target = target;
    this.docid = decodeURIComponent(docid);
    var self = this;
    /**
     * Prepare the list for expansion
     */
    this.prepareList = function() {
        jQuery('#'+self.target).find('li:has(ul)')
        .click( function(event) {
            if (this == event.target) {
                jQuery(this).toggleClass('expanded');
                jQuery(this).children('ul').toggle('medium');
            }
            return true;
        })
        .addClass('collapsed')
        .children('ul').hide();
    };
    this.httpGet = function(theUrl)
    {
        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        if ( xmlHttp.readyState==1 )
            xmlHttp.send( null );
        return xmlHttp.responseText;
    };
    /**
     * Prepare an incomplete list for expansion
     */
    this.preparePartialList = function()
    {
        jQuery('#'+self.target).find('li:has(a)')
        .click( function(event) {
            var t = jQuery(this);
            if ( this == event.target
                || (this.children.length>0
                && this.children[0] == event.target) ) {
                var subList = t.find('ul');
                if ( subList != undefined && subList.length==0 )
                {
                    var ul = self.httpGet(this.children[0].getAttribute("href"));
                    t.append(ul);
                    t.toggleClass('expanded');
                }
                else
                {
                    t.toggleClass('expanded');
                    t.children('ul').toggle('fast');
                }
                return false;
            }
            else
                return true;
        })
        .addClass('collapsed')
        .children('ul').hide();
    };
    /**
     * Generate a span of possibly fractional stars
     * @param score the number of stars to display up to 5
     */
    this.writeStars = function( score ) {
        var span = '<span class="stars">';
        var half_scores = Math.round(score*2.0);
        for ( i=0;i+1<half_scores;i+=2 )
            span += '<i class="fa fa-star"></i>';
        if ( half_scores-i==1 )
        {
            i+=2;
            span += '<i class="fa fa-star-half-empty"></i>';
        }
        for ( var j=i;j<10;j+=2 )
            span += '<i class="fa fa-star-o"></i>';
        if ( score == 0 )
            span += " (unrated)";
        span += '</span>';
        return span;
    };
    /**
     * Create a document link to the mvd
     * @param docid teh document's id
     * @return a url to get to mvdsingle on this site
     */
    this.composeDocLink = function( docid ) {
        var url = "http://"+window.location.hostname;
        var parts = window.location.pathname.split("/");
        for ( var i=0;i<parts.length;i++ )
        {
            if ( parts[i].length>0 )
            {
                url += "/"+parts[i];
                break;
            }
        }
        url += '/mvdsingle?docid='+docid;
        return url;
    };
    this.writeSegment = function( list ) {
        var html = "<ul>"
        for ( var i=0;i<list.length;i++ )
        {
            html += '<li><a href="'+this.composeDocLink(list[i].docid)
                +'">'+list[i].title+'</a></li>';
        }
        html += "</ul>";
        return html;
    };
    if ( this.docid == undefined || this.docid.length==0 )
    {
        var tabs_params = jQuery("#tabs_params").val();
        this.docid = get_one_param(tabs_params,'docid');
    }
    var url = "http://"+window.location.hostname+'/ratings/list?docid='
        +this.docid;
    jQuery.get(url,function(data) {
        var t = jQuery("#"+self.target);
        t.contents().remove();
        var html = '<div class="listContainer">'
            +'<ul id="ratingsList" class="expList">';
        var current = 6.0;
        var segment = Array();
        for ( var i=0;i<data.length;i++ )
        {
            var entry = data[i];
            if ( entry.score < current )
            {
                if ( segment.length > 0 )
                {
                    html += '<li>'+self.writeStars( current );
                    html += self.writeSegment( segment );
                    segment = Array();
                    html += '</li>';
                }
                current = entry.score;
            }
            segment.push(entry);
        }
        if ( segment.length > 0 )
        {
            html += '<li>'+self.writeStars( current );
            html += self.writeSegment( segment );
            segment = Array();
            html += '</li>';
        }
        html += '</ul></div>';
        t.append(html);
        var firstUl = t.find("div ul");
        var idAttr = firstUl.attr('id');
        if (typeof idAttr !== typeof undefined && idAttr !== false)
            self.prepareList();
        else
            self.preparePartialList();
        // open the top three lists
        jQuery("#ratingsList>li:lt(3)").each(function(){
            var t = jQuery(this);
            var subList = t.find('ul');
            t.toggleClass('expanded');
            t.children('ul').toggle('fast');
        });
        t.css("visibility","visible");
    });
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
    var module_params = jQuery("#ratings_params").val();
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
    if ( !('mod-target' in params) && ('target' in params) )
        params['mod-target'] = params['target'];
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    var params = getParaArgs('para');
    jQuery("#"+params['mod-target']).css("visibility","hidden");
    var viewer = new ratings_viewer(params['mod-target'],params['docid']);
}); 

