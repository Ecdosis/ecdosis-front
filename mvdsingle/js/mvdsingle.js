(function ($) {
function installCss( response )
{
    var start = response.indexOf("<!--styles: ");
    if ( start != -1 )
    {
        var part = response.substr(start+12);
        var end = part.indexOf("-->");
        part = part.substr(0,end);
        $("head").append("<style>"+part+"</style>");
    }    
}
function getValById( id, dflt )
{
    var elem = $(id);
    if ( elem != undefined && elem.val() != undefined )
        return elem.val();
    else
	return dflt;
}
function getSelectedOption( responseText )
{
    var opt = "";
    var selPos1 = responseText.indexOf("selected");
    if ( selPos1 == -1 )
    {
        var pos1 = responseText.indexOf("<option");
        pos1 += responseText.substr(pos1).indexOf("value=\"")+7;
        var rest = responseText.substr(pos1);
        var pos2 = pos1+rest.indexOf("\"");
        opt = responseText.substring(pos1,pos2);
    }
    else
    {
        var after = responseText.substr(selPos1);
        selPos1 += after.indexOf("value=\"")+7;
        after = responseText.substr(selPos1);
        var selPos2 = selPos1 + after.indexOf("\"");
        opt = responseText.substring(selPos1,selPos2);
    }
    return opt;
}
$(function(e){
    var docID = getValById("#DOC_ID","english/shakespeare/kinglear/act1/scene1");
    var version1 = getValById("#version1","");
    var selection = getValById("#selection","");
    var service = getValById("#MVD_SERVICE","http://localhost");
    var url = service+"/html/list/"+docID;
    if ( version1.length>0 )
        url += "?version1="+version1;
    $.get(url, function(responseText) {
        $("#list").append( responseText );
        var first = getSelectedOption(responseText);
        var url = service+"/html/"+docID+"?version1="+first;
        $.get(url, function(response) {
            installCss(response);
            $("#body").append(response);
            if ( selection.length > 0 )
            {
                var parts = selection.split(",");
                if ( parts.length == 2 )
                    setSelection($("#body").get(0),parseInt(parts[0]),parseInt(parts[1]));
            }
        });
        $("#versions").live("change",function(){
            $("#body").children().remove();
            var val = $("#versions").val();
            var url = service+"/html/"+docID+"?version1="+val;
            $.get(url, function(response) {
                $("#body").append( response );
            });
        });
    });
});
})(jQuery); // end of dollar namespace
