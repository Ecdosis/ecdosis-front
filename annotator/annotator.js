(function ($) {
function getAbsoluteOffset( offset, n )
{
    var sibling = n;
    while ( sibling != null )
    {
        if ( sibling.previousSibling != null )
        {
            sibling = sibling.previousSibling;
            if (sibling.nodeType==8 )
            {
                var parts = sibling.data.split(":");
                if ( parts.length==2 && parts[0] == "aese" )
                {
                    var pos = parseInt(parts[1]);
                    offset += pos;
                    break;
                }
            }
            else
                offset += sibling.textContent.length;
        }
        else
        {
            sibling = sibling.parentNode;
        }
    }
    return offset;
}
function reportSelection( r )
{
    var start = getAbsoluteOffset(r.startOffset,r.startContainer);
    var end = getAbsoluteOffset(r.endOffset,r.endContainer);
    alert( "start="+start+" end="+end);
}
$(document).ready(function() {
  $( "#pictann" ).click(function( event ) {
    var txt = window.getSelection();
    if ( txt.rangeCount==0||txt.getRangeAt(0).collapsed )
        alert("select some text first!");
    else
        reportSelection(txt.getRangeAt(0));
  });
  $( "#textann" ).click(function( event ) {
    var txt = window.getSelection();
    if ( txt.rangeCount==0||txt.getRangeAt(0).collapsed )
        alert("select some text first!");
    else
        reportSelection(txt.getRangeAt(0));
  });
});
})(jQuery); // end of dollar namespace

