function comparer( target, docid, modpath )
{
    this.target = target;
    this.modpath = modpath;
    this.docid = docid;
    this.title = "Untitled";
    // don't link with these ids
    this.banned = {};
    /** timeoutId for clearning scrolling flag */
    this.timeoutId = 0;
    var self = this;
    this.setSelectLabel = function(select) {
        var parts = select.val().split("/");
        if ( parts.length > 1 )
            select.prev().text(parts[1]);
    };
    /**
     * Strip the leading slash IF present
     */
    this.stripSlash= function(str) {
        if ( str.length>0 && str[0]=='/' )
            return str.substring(1);
        else
            return str;
    };
    /**
     * Update the source string after the dropdown
     * id the id of the version list to update the source of
     */
    this.updateSource = function(id) {
        var title = jQuery("#version"+id+" option:selected").attr("title");
        jQuery("#source"+id).text(title);
    };
    /**
     * Format theJSON version list into HTML. 
     * @param jObj the JSON short version table
     * @param selV the selected version
     * @param idthe suffix id of the list
     * @return the html of the list
     */
    this.formatVersionList = function(jObj,selV,id) {
        var groups = {};
        var versions = jObj.versions;
        var html = '<span class="description">';
        html += jObj.description;
        html += '</span>';
        html +='<select id="version'+id+'" class="list" name="version'+id+'">';
        for ( var i=0;i<versions.length;i++ )
        {
            var list = groups[versions[i].groupPath];
            if ( list == undefined )
            {
                list = Array();
                groups[versions[i].groupPath] = list;
            }
            list.push(versions[i]);
        }
        for (var g in groups )
        {
            if ( g != "/" && g.length!=0 )
                html += '<optgroup class="group" label="'+this.stripSlash(g)+'">';
            list = groups[g];
            for ( var i=0;i<list.length;i++ )
            {
                var v = list[i];
                var version = v.groupPath;
                version += "/";
                version += v.shortName;
                version = version.replace("//","/");
                var selected = "";
                if ( version == selV )
                    selected = ' selected="selected"';
                html += '<option class="version-short" value="'+version
                    +'" title="'+v.longName+'"'+selected+'>';
                html += v.shortName;
                html += '</option>';
            }
            if ( g != "/" && g.length!=0 )
                html += '</optgroup>';
        }
        html += '</select><span id="source'+id+'"></span>';
        return html;
    };
    /**
     * Get a list menu
     * @param parent the id of the enclosing div to add it to
     * @param version the version selected in this list
     * @param idsuffixid of the version list to build
     */
    this.getList = function( parentId,version,id )
    {
        var url = "http://"+window.location.host+"/compare/list";
        url += "?docid="+this.docid;
        jQuery.get( url, function(data) 
        {    
            if ( data != undefined )
            {
                jQuery("#"+parentId).append( self.formatVersionList(data,version,id) );
                self.setSelectLabel(jQuery("#"+parentId+" select"));
                jQuery("#version"+id).change( function(){
                    self.setSelectLabel(jQuery("#version"+id));
                    // reload the versions
                    var idStr = "#version"+id;
                    self.updateSource(id);
                    if ( idStr == "#version1" )
                        self.version1 = jQuery("#version1").val();
                    else
                        self.version2 = jQuery("#version2").val();
                    // set content for left hand side
                    self.getTextVersion(self.version1,
                        self.version2,"deleted","leftColumn");
                });
                self.updateSource(id);
            }
        })
        .fail(function() {
            console.log("failed to load version list");
        });
    }
    /**
     * Get a text version
     * @param v1 the first version
     * @param v2 the second version
     * @param diffKind "deleted" or ChunkState.ADDED
     * @param parentId the id of the enclosing parent element
     */ 
    this.getTextVersion = function( v1, v2, diffKind, parentId )
    {
        var url = "http://"
            +window.location.hostname
            +"/compare/"
        url +="?docid="+this.docid;
        url += "&version1="+v1;
        url += "&version2="+v2;
        url += "&diff_kind="+diffKind;
        jQuery.get( url, function(data) 
        {    
            if ( data != undefined && data.length > 0 )
            {

                jQuery("#"+parentId).empty();
                jQuery("#"+parentId).prepend(self.extractCSSFromBody(data) );
                if ( parentId == "rightColumn" )
                {
                    self.fitWithinParent("leftColumn");
                    self.fitWithinParent("rightColumn");
                    self.fitWithinParent("twinCentreColumn");
                    this.banned = {};
                    self.buildLeftScrollTables();
                    self.buildRightScrollTables();
                }
                else
                    self.getTextVersion(self.version2,
                        self.version1,"added","rightColumn");
                if ( parentId == "leftColumn" && self.version1.indexOf("layer-final")==-1 )
                    jQuery("#leftColumn .merged").css("color","dimgrey");
                else if ( parentId == "rightColumn" && self.version2.indexOf("layer-final")==-1 )
                    jQuery("#rightColumn .merged").css("color","dimgrey"); 
            }
        })
        .fail(function() {
            console.log("failed to load text version");
        });
    }
    /**
     * Get the next version based on version1
     * @param version1 the first version to get the next of
     */
    this.getNextVersion = function( version1 ) {
        var url = "http://"
            +window.location.hostname
            +"/compare/version2";
        url += "?docid="+this.docid;
        url += "&version1="+version1;
        jQuery.get( url, function(data) 
        {    
            if ( data != undefined && data.length > 0 )
            {
                self.version2 = data;
                self.getList( "rightWrapper",self.version2.trim(),2 );
                // set content for left hand side
                self.getTextVersion(self.version1,
                    self.version2,"deleted","leftColumn");
            }
        })
        .fail(function() {
            console.log("failed to get next version");
        });
    }
    /**
     * Get the first version of the cortex
     */
    this.getVersion1 = function() {
        jQuery.get( "/compare/version1?docid="+docid, 
            function( data ) {
                self.version1 = data;
                self.getDocTitle();
         })
        .fail( function() {
            alert("failed to get version 1");
        });
    };
    /**
     * Get the document's metadata title
     * @return a string being the MVD's description
     */
    this.getDocTitle = function() {
        jQuery.get( "/compare/title?docid="+docid, 
            function( data ) {
                self.title = data;
                jQuery("#top").prepend( data );
                self.getList( "leftWrapper",self.version1,1 );
                self.getNextVersion( self.version1 );
         })
        .fail( function() {
            alert("failed to get version 1");
        });
    }
    /**
     * Get the numeric value of a css dimension
     * @param dimen a dimension like "30px"
     * @return its numeric value
     */
    this.valueOf = function(dimen) {
        var value = 0;
        for ( var i=0;i<dimen.length;i++ )
        {
            var token = dimen[i];
            if ( token >= '0' && token <= '9' )
            {
                value *= 10;
                value += token - '0';
            }
            else
                break;
        }
        return value;
    };
    /**
     * Scan the body returned by the formatter for the relevant CSS
     * @param body the body returned by a call to formatter
     * @return the doctored body
     */
    this.extractCSSFromBody = function( body ) {
        var css = null;
        var pos1 = body.indexOf("<!--styles: ");
        var pos2 = body.indexOf("-->",pos1+12);
        while ( pos1 >= 0 && pos2 > 0 && pos1 < pos2 )
        {
            if ( !this.cssAlreadyAdded )
            {
                // skip "<!--styles: "
                css = body.substring( 12+pos1, pos2 );
                // add extracted CSS to head
                jQuery("head style").last().after(
                    '<style type="text/css">'
                    +css+'</style>');
            }
            var p1 = body.substring( 0, pos1 );
            var p2 = body.substring( pos2+3 );
            body = p1+p2;
            pos1 = body.indexOf("<!--styles: ");
            pos2 = body.indexOf("-->",pos1+12);
            this.cssAlreadyAdded = true;
        }
        return body;
    };
    /**
     * Scale a div to its parent's size (or just use 100%?)
     */
    this.fitWithinParent = function( id ) {
	    var elem = jQuery("#"+id);
        var topOffset = elem.offset().top;
	    var windowHeight = jQuery(window).height();
	    // compute the height, set it
	    var vPadding = this.valueOf(elem.css("padding-top"))
		    +this.valueOf(elem.css("padding-bottom"));
	    var vBorder = this.valueOf(elem.css("border-top-width"))
		    +this.valueOf(elem.css("border-bottom-width"));
	    var tempHeight = windowHeight-(topOffset+vPadding+vBorder);
	    elem.height(tempHeight);
    };
    /**
     * Set a timeout for when we reset the this.scroller field
     */
    this.setScrollTimeout = function() {
        if ( this.timeoutId == 0 )
            this.timeoutId = window.setTimeout(function(){
                self.scroller=undefined;
                self.timeoutId = 0;
                self.leftScrollTop = jQuery("#leftColumn").scrollTop();
                self.rightScrollTop = jQuery("#rightColumn").scrollTop();
            // this should be fairly coarse-grained
            // the shortest time for switching between scroll-sides
            }, 300);
    };
    /**
     * Coordinate the scrolling of the two panels
     */
    this.synchroScroll = function()
    {
        var leftDiv = jQuery("#leftColumn");
        var leftTop = leftDiv.scrollTop();
        var rightDiv = jQuery("#rightColumn");
        var rightTop = rightDiv.scrollTop();
        if ( rightTop != self.rightScrollTop )
        {
            if (self.scroller==undefined||self.scroller=="right")
            {
                var leftOffset = 0;
                self.scroller = "right";
                var rIndex = self.findHighestIndex(self.rightOffsetsToIds,
                    rightTop+rightDiv.height()/2);
                if ( rIndex == -1 )
                    leftOffset = 0;
                else
                {
                    var rightId = self.rightOffsetsToIds[rIndex].id;
                    var leftId = "d"+rightId.substr(1);
                    // find offset of left id
                    leftOffset = Math.round(self.leftIdsToOffsets[leftId]
                        -leftDiv.height()/2);
                    if ( leftOffset < 0 )
                        leftOffset = 0;
                }
                self.leftScrollTop = leftOffset;
                self.rightScrollTop = rightTop;
                leftDiv.scrollTop(leftOffset);  
                self.setScrollTimeout();  
            }
            else
                console.log("ignoring left scroll")
        }
        if ( leftTop != self.leftScrollTop )
        {
            if (self.scroller==undefined||self.scroller=="left")
            {
                var rightOffset = 0;
                self.scroller = "left";
                var lIndex = self.findHighestIndex(self.leftOffsetsToIds,
                    leftTop+leftDiv.height()/2);
                if ( lIndex == -1 )
                    rightOffset = 0;
                else
                {
                    var leftId = self.leftOffsetsToIds[lIndex].id;
                    var rightId = "a"+leftId.substr(1);
                    // find offset of right id
                    rightOffset = Math.round(self.rightIdsToOffsets[rightId]
                        -rightDiv.height()/2);
                    if ( rightOffset < 0 )
                        rightOffset = 0;
                }
                self.rightScrollTop = rightOffset;
                self.leftScrollTop = leftTop;
                rightDiv.scrollTop(rightOffset); 
                self.setScrollTimeout(); 
            }
            else
                console.log("ignoring right scroll");
        }
        // wait until one side stabilises
    }
    /**
     * Look for spans with an id attribute set
     * @param elem the element to search from
     * @param hash the hashtable to store the id->offset key-value
     * @param index the sorted offset array giving us the id
     */
    this.findIds = function( elem, hash, index ) {
        if ( elem.length>0&& elem[0].nodeName == "SPAN"
	        && elem.attr('id') != undefined )
        {
	        var idAttr = elem.attr('id');
            var spanOffset;
            if ( elem.css("display")=="none" ||elem.parent().css("display")=="none" )
            {
                var topOff = elem.offset().top;
                this.banned[idAttr] = topOff;
                if ( idAttr.charAt(0)=='a' )
                    this.banned['d'+idAttr.substr(1)] = topOff;
                else
                    this.banned['a'+idAttr.substr(1)] = topOff;
            }
            else if ( this.banned[idAttr] == undefined )
                spanOffset = elem.offset().top;
	        hash[idAttr] = spanOffset;
            index.push( {offset: spanOffset, id: idAttr} );
        }
        else if ( elem.children().length > 0 )
	        this.findIds( elem.children().first(), hash, index );
        if ( elem.next().length > 0 )
	        this.findIds( elem.next(), hash, index );
    };
    /**
     * Find the highest offset in a sorted list of {offset, id} objects
     * @param list the list of objects
     * @param value the value which should be just a bit less or equal
     * @return the index of the item just a bit bigger than value
     */
    this.findHighestIndex = function( list, value )
    {
        var top = 0;
        var bot = list.length-1;
        var mid=0;
        while ( top <= bot )
        {
            mid = Math.floor((top+bot)/2);
            if ( value < list[mid].offset )
            {
                if ( mid == 0 )
                {
                    // value < than first item
                    return -1;
                }
                else
                    bot = mid-1;
            }
            else    // value >= list[mid].loc
            {
                if ( mid == list.length-1 )
                    // value is >= last item
                    break;
                else if ( value >= list[mid+1].offset )
                    top = mid+1;
                else // list[mid] must be biggest <= value
                    break;
            }
        }
        return mid;
    }
    /**
     * Sort a list of {offset,id} objects by offset
     * @param a the array
     */
    this.sortOffsets = function(a) {
        for (var h = a.length; h = parseInt(h/2);) {
            for (var i = h; i < a.length; i++) {
                var k = a[i];
                for (var j = i; j >= h && k.offset < a[j-h].offset; j -= h)
                    a[j] = a[j-h];
                a[j] = k;
            }
        };
        return a;
    }
    this.buildLeftScrollTables=function(){
        var lhs = jQuery("#leftColumn");
        lhs.scrollTop(0);
        this.leftScrollTop = 0;
        this.leftIdsToOffsets = {};
        this.leftOffsetsToIds = new Array();
        this.findIds( lhs.children().first(), this.leftIdsToOffsets, this.leftOffsetsToIds );
        this.sortOffsets( this.leftOffsetsToIds );
/*        for ( var i=0;i<50;i++ )
            console.log("left:"+this.leftOffsetsToIds[i].offset+" "+this.leftOffsetsToIds[i].id);*/
    };
    this.buildRightScrollTables=function(){
        var rhs = jQuery("#rightColumn");
        rhs.scrollTop(0);
        this.rightScrollTop = 0;
        this.rightIdsToOffsets = {};
        this.rightOffsetsToIds = new Array();
        this.findIds( rhs.children().first(), this.rightIdsToOffsets, this.rightOffsetsToIds );
        this.sortOffsets( this.rightOffsetsToIds );
/*        for ( var i=0;i<50;i++ )
            console.log("right:"+this.rightOffsetsToIds[i].offset+" "+this.rightOffsetsToIds[i].id);*/
        // wait unti both lists are loaded 
        // this should be fairly fine-grained
        setInterval(this.synchroScroll,70);
    };
    /**
     * Build the content of this view
     */
    this.build = function()
    {
        // first build the framework
        var form = jQuery('<form id="default" action="/compare"></form>').prependTo("#"+this.target);
        form.attr("name", "default" );
        form.attr( "method", "post" );
        var divCentre = jQuery('<div id="twinCentreColumn"></div>').prependTo(form);
        var hidden = jQuery('<input id="docid" type="hidden"></input>').insertBefore("#twinCentreColumn");
        hidden.attr("name","docid");
        hidden.attr("value",this.docid);
        jQuery('<div id="rightColumn"></div>').prependTo(divCentre);
        jQuery('<div id="leftColumn"></div>').prependTo(divCentre);
        // top div contains title and two drop-downs
        var divTop = jQuery('<div id="top"></div>').prependTo(divCentre);
        // add a row containing the two dropdowns
        var right = jQuery('<div><div id="leftWrapper"></div></div>').prependTo(divTop);
        right.append('<div id="rightWrapper"></div>');
        // now fill it - sets off cascade of functions
        this.getVersion1();
    };
    this.build();
    jQuery("#"+self.target).css("visibility","visible");
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
function getCompareArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#compare_params").val();
    if ( module_params != undefined && module_params.length>0 )
    {
        var parts = module_params.split("&");
        for ( var i=0;i<parts.length;i++ )
        {
            var halves = parts[i].split("=");
            if ( halves.length==2 )
                params[halves[0]] = unescape(halves[1]);
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
    return params;
}
/**
 * Load the compare tool with three arguments
 */
jQuery(document).ready(function(){
    var params = getCompareArgs('compare');
    jQuery("#"+params['mod-target']).css("visibility","hidden");
    new comparer(params['mod-target'],
        params['docid'],params['modpath']);
});

