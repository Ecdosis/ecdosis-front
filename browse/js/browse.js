/**
 * A browsable list with expansion/contraction
 */
function browse( target, listid ) 
{
    this.listid = listid;
    this.target = target;
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
    var url = "http://"+window.location.hostname
        +"/misc/html?docid="+this.listid;
    jQuery.get(url,function(data) {
        var t = jQuery("#"+self.target);
        t.contents().remove();
        t.append( data );
        var firstUl = t.find("div ul");
        var idAttr = firstUl.attr('id');
        if (typeof idAttr !== typeof undefined && idAttr !== false)
            self.prepareList();
        else
            self.preparePartialList();
    }).fail(function(){
       console.log("Failed to fetch "+url);
    });
}
function getBrowseArgs()
{
    var params = new Object ();
    var module_params = jQuery("#browse_params").val();
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
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    var params = getBrowseArgs();
    if ( params['listid'] != undefined )
        var viewer = new browse(params['mod-target'],params['listid']);
});



