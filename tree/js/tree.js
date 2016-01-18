/**
 * Tree-viewer
 */
var params;
function treeviewer(target,docid)
{
    this.target = target;
    this.docid = docid;
    var self = this;
    if ( docid == undefined || docid.length==0 )
    {
        docid = localStorage.getItem('docid');
    }
    var url = "http://"+window.location.hostname+'/tree/title?docid='+docid;
    jQuery.get(url,function(data) {
        var src = "http://"+window.location.hostname+"/tree/";
        var treetype = localStorage.getItem('treetype');
        var treegrows = localStorage.getItem('treegrows');
        var usebranchlengths = localStorage.getItem('usebranchlengths');
        var ancnodes = localStorage.getItem('ancnodes');
        src += '?docid='+docid;
        if ( treetype != undefined )
            src += '&treestyle='+treetype;
        if ( treegrows != undefined )
            src+='&treegrows='+treegrows;
        if ( usebranchlengths != undefined )
            src+='&usebranchlengths='+usebranchlengths;
        if ( ancnodes != undefined )
            src += '&ancnodes='+ancnodes;
        var t = jQuery("#"+target);
        t.contents().remove();
        t.append('<h3 id="tree-title">'+data+'</h3>');
        t.append('<img id="tree" src="'+src+'">');
        t.append('<form id="treeform" name="treeform" method="get"'
            +'action="http://'+window.location.hostname+window.location.pathname+'"></form>');
        var content = '<table id="tree-footer"><tr>'
            +'<td>tree grows</td><td>tree style</td>'
            +'<td>use branch lengths</td><td>ancestral nodes</td><td></td></tr>'
            +'<tr><td><select name="treegrows" id="treegrows">'
            +'<option>horizontal</option><option>vertical</option></select></td>'
            +'<td><select name="treestyle" id="treestyle">'
            +'<option>cladogram</option><option>phenogram</option>'
            +'<option>curvogram</option><option>eurogram</option>'
            +'<option value="circular">circular</option><option>swoopogram</option></select></td>'
            +'<td><select name="usebranchlengths" id="usebranchlengths">'
            +'<option>yes</option><option>no</option></select></td>'
            +'<td><select name="ancnodes" id="ancnodes">'
            +'<option>weighted</option><option>intermediate</option>'
            +'<option>centered</option><option>inner</option></select></td>'
            +'<td><input type="submit" value="redraw"></input>'
            +'<input type="hidden" name="docid" value="'+docid+'"></input>'
            +'</td></tr></table>';
        jQuery("#treeform").append(content);
        if ( treetype != undefined )
        {
            jQuery("#treestyle option").each(function(){
            if ( jQuery(this).text() == treetype )
                jQuery(this).attr("selected","selected");
            });
        }
        if ( treegrows != undefined )
        {
            jQuery("#treegrows option").each(function(){
                if ( jQuery(this).text() == treegrows )
                    jQuery(this).attr("selected","selected");
            });
        }
        if ( usebranchlengths != undefined )
        {
            jQuery("#usebranchlengths option").each(function(){
                if ( jQuery(this).text() == usebranchlengths )
                    jQuery(this).attr("selected","selected");
            });
        }
        if ( ancnodes != undefined )
        {
            jQuery("#ancnodes option").each(function(){
                if ( jQuery(this).text() == ancnodes )
                jQuery(this).attr("selected","selected");
            });
        }
        // adjust height of tree
        var wHeight = jQuery(window).height();
        var titleTop = jQuery("#tree-title").offset().top;
        var titleHeight = jQuery("#tree-title").height();
        var footerHeight = jQuery("#tree-footer").height();
        jQuery("#tree").height(Math.round(wHeight-(20+titleTop+titleHeight+footerHeight)));
        jQuery('#treeform').submit(function() {
            var treetype=jQuery("#treestyle").val();
            var treegrows=jQuery("#treegrows").val();
            var usebranchlengths=jQuery("#usebranchlengths").val();
            var ancnodes=jQuery("#ancnodes").val();
            var localdocid = jQuery('[name="docid"]').val();
            localStorage.setItem('treetype', treetype);
            localStorage.setItem('treegrows', treegrows);
            localStorage.setItem('usebranchlengths', usebranchlengths);
            localStorage.setItem('ancnodes', ancnodes);
            localStorage.setItem('docid',localdocid);
            return true;
        });        
    });
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 */
function getArgs( scrName )
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
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    // DOM Ready - do your stuff 
    var params = getArgs('tree');
    var viewer = new treeviewer(params['target'],params['docid']);
}); 

