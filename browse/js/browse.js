(function ($) {
function prepareList(listid) {
    $('#'+listid).find('li:has(ul)')
    .click( function(event) {
        if (this == event.target) {
            $(this).toggleClass('expanded');
            $(this).children('ul').toggle('medium');
        }
        return true;
    })
    .addClass('collapsed')
    .children('ul').hide();
};
function preparePartialList( listId )
{
    $('#'+listId).find('li:has(a)')
    .click( function(event) {
        if (this.children[0] == event.target
            || this == event.target ) {
            var subList = $(this).find('ul');
            if ( subList != undefined && subList.length==0 )
            {
                var ul = httpGet(this.children[0].getAttribute("href"));
                $(this).append(ul);
                $(this).toggleClass('expanded');
            }
            else
            {
                $(this).toggleClass('expanded');
                $(this).children('ul').toggle('fast');
            }
            return false;
        }
        else
            return true;
    })
    .addClass('collapsed')
    .children('ul').hide();
}
function httpGet(theUrl)
{
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    if ( xmlHttp.readyState==1 )
        xmlHttp.send( null );
    return xmlHttp.responseText;
}
function panelIdFromUrl( url )
{
    var li = url.lastIndexOf("/");
    if ( li != -1 )
        return url.substring(li+1,url.length-1)+"Index";
    else
	return "titleIndex";
}
$(function(){
    var tabs = $("#tabs li a");
    var id0 = tabs.attr("href");
    var url0 = $(id0).attr("title");
    var tab0text = httpGet(url0);
    $(id0).append( tab0text );
    $("#tabs").tabs({
        active: 0
    });
    $("#tabs").tabs({
        activate: function(event,ui) {
            var url = ui.newPanel.attr("title");
            var panelId = panelIdFromUrl(url);
            var idi = ui.newPanel.selector;
            var tabitext = httpGet(url);
            var key = idi+" div.listContainer";
            if ( $(key).length==0 )
            {
                $(idi).append(tabitext);
                if ( $('#'+panelId).length > 0 )
                    prepareList(panelId);
                else
                {
                    var div = $(idi).children().first();
                    var listId = div.attr("id");
                    if ( undefined != listId )
                        preparePartialList( listId );
                }
            }
        }
    });
    prepareList("titleIndex")
});
})(jQuery); // end of dollar namespace


