/**
 * global document object
 */
function twinview( docid, version1, target )
{
    this.docid = docid;
    this.target = target;
    /** version to view */
    this.version1 = version1;
    var self = this;
    /**
     * Get the jQuery object of the current textarea
     * @return a jQuery object textarea
     */
    this.getlayer = function(){
        return jQuery("#"+this.current);
    };
    /**
     * Extract the numerical value of a css property terminated by "px"
     * @param id the element to get the property off
     * @param param the name of the css property
     * @return its integer value
     */
    this.getCssParam = function(id,param)
    {
        var l = jQuery("#"+id);
        var value = l.css(param);
        if ( value == undefined )
        {
            console.log("element #"+id+" missing property "+param);
            return 0;
        }
        else if ( value.lastIndexOf('px') != -1 )
        {
            value = value.substring(0,value.length-2);
            if ( value.length== 0 )
                return 0;
            else
                return parseInt(value);
        }
    };
    /**
     * Re-calculate the page-centres after initialisation
     */
    this.recalcPageCentres = function(){
        this.getPageCentres();
        this.getlayer().scrollTop(0);
        jQuery("#lhs").css('top',"0px"); 
    };
    /**
     * Set widths on lhs and rhs
     */
    this.setWidths = function() {
        var wWidth = jQuery("#wrapper").width();
        var lhsWidth = Math.floor(wWidth/2);
        var rhsWidth = wWidth-lhsWidth;
        jQuery("#sides").width(wWidth);
        jQuery("#lhs").width(lhsWidth);
        jQuery("#rhs").width(rhsWidth);
    };
    /**
     * Ensure page centres on each side are increasing. Drop overlapping ones.
     */
    this.checkCentres = function()
    {
        if ( this.rCentres.length > 1 )
        {
            var lCopy = Array();
            var rCopy = Array();
            var prev = 0;
            var rLast = this.rCentres[this.rCentres.length-1];
            var lLast = this.lCentres[this.lCentres.length-1];
            for ( var i=1;i<this.rCentres.length-1;i++ )
            {
                if ( this.rCentres[i] > this.rCentres[i-1]
                    && this.lCentres[i] > this.lCentres[i-1]
                    && this.lCentres[i] < lLast
                    && this.rCentres[i] < rLast )
                {
                    rCopy.push(this.rCentres[i]);
                    lCopy.push(this.lCentres[i]);
                }
            }
            rCopy.unshift(this.rCentres[0]);
            lCopy.unshift(this.lCentres[0]);
            rCopy.push(rLast);
            lCopy.push(lLast);
            if ( rCopy.length < this.rCentres.length )
            {
                 this.lCentres = lCopy;
                 this.rCentres = rCopy;
            }
        }
    };
    /**
     * Debug: print an array of ints
     * @param prompt the prompt to precede the earray
     * @param arr the array to print
     */
    this.printArray = function( prompt, arr )
    {
        var str = prompt+"=(";
        for ( var i=0;i<arr.length;i++ )
        {
            str += arr[i];
            if ( i < arr.length-1 )
                str += " ";
        }
        console.log(str+")");
    };
    /**
     * Compute the centre-points of the images
     */
    this.getImageCentres = function()
    {
        var lTops = Array();
        var imgs = jQuery("#lhs img");
        var top = 0;
        imgs.each(function(){
            top = Math.round(top);
            lTops.push(top);
            top += parseInt(jQuery(this).attr("height"));
        });
        lTops.push(top);
        this.lCentres = Array();
        for ( var i=1;i<lTops.length;i++ )
        {
            var diff = lTops[i]-lTops[i-1];
            this.lCentres.push( Math.round(lTops[i-1]+diff/2) );
        }
        this.imageEnd = lTops[lTops.length-1];
        // add pseudo-page centres for start and end
        var wHalfHt = Math.round(jQuery("#wrapper").height()/2);
        this.lCentres.unshift( wHalfHt );
        this.lCentres.push( this.imageEnd - wHalfHt );
    };
    /**
     * Compute the horizontal slop on a layer (margins+borders)
     */
    this.layerSlop = function() {
        var slop = this.getCssParam(this.current,'padding-left');
        slop += this.getCssParam(this.current,'padding-right');
        return slop;
    };
    /**
     * Scale the text size to fit the available space
     */
    this.fitText = function()
    {
        var lay = this.getlayer();
        // set wrapper height
        var wHeight = jQuery(window).height()-jQuery("#wrapper").offset().top;
        jQuery("#wrapper").height(wHeight);
        // compute text size
        jQuery("#sides").append('<span id="measure-text">'
            +this.lines[this.longest]+'</span>');
        var font = lay.css("font-family");
        jQuery("#measure-text").css("font-family",font);
        jQuery("#measure-text").css("font-size","12px");
        var maxWidth = jQuery("#measure-text").width();
        var layWidth = lay.width();
        layWidth = Math.round(layWidth*3/4);
        var magnifiedSize = Math.floor(12*layWidth/maxWidth);
        if ( magnifiedSize < 12 )
        {
            layWidth = Math.round(lay.width()*19/20);
            magnifiedSize = Math.floor(12*layWidth/maxWidth);
        }
        var newSize = magnifiedSize+"px";
        jQuery("#measure-text").remove();
        lay.css("font-size",newSize);
        lay.width(jQuery("#scrollframe").width()-this.layerSlop());
        //console.log("newSize="+newSize);
        var sfh = Math.round(jQuery("#wrapper").height()-jQuery("#tabs").height());
        jQuery("#scrollframe").css("height",sfh+"px");
        //this.getlayer().css("height",this.getlayer().height()+"px");
        this.setStanzaWidth();
        this.setHnoteWidth();

    };
    /**
     * Correlate the returned list of pages with those required by the text
     * @param list the list of pages returned by /pages/list
     * @return an array of page-objects corresponding to those in the text
     */
    this.filterPages = function( list ) {
        this.rTops = Array();
        this.findPage(this.getlayer());
        this.sort(this.rTops);
        var found = Array(); 
        for ( var i=0;i<this.rTops.length;i++ )
        {
            var j;
            for ( j=0;j<list.length;j++ )
            {
                if ( this.rTops[i].name == list[j].n )
                    break;
            }
            if ( j == list.length )
            {
                var page = {};
                page.n = this.rTops[i].name;
                page.src = "/corpix/blank.jpg";
                page.width = 2921;
                page.height = 3796;
                found.push(page);
            }
            else
            {
                found.push(list[j]);
            }
        }       
        return found;
    };
    /**
     * Fetch the images corresponding to the page numbers in the text
     * @param docid the document identifier with the pages in it
     */
    this.getPageImages = function(docid)
    {
        var url = "http://"+window.location.hostname+"/pages/list?docid="+docid+'&version1='+this.version1;
        jQuery.get(url,function(data) {
            var html = "";
            self.setWidths();
            var maxW = jQuery("#lhs").width();
            var pages = self.filterPages(data);
            for ( var i=0;i<pages.length;i++ )
            {
                var p = pages[i];
                var ratio = maxW/p.width;
                var w = Math.round(p.width*ratio);
                var h = Math.round(p.height*ratio);
                html += '<a class="swinxyzoom swinxyzoom-window" '
                    +'href="'+p.src+'"><img src="'
                    +p.src+'" width="'+w+'" height="'+h+'" title="'
                    +p.n+'" data-n="'+p.n+'"></a>\n';
            }
            jQuery("#lhs").append(html);
            self.fitText();
            self.getImageCentres();
            jQuery("#lhs").height(jQuery("#rhs").height());
            //self.fitText();
            jQuery("#"+self.target).css("visibility","visible");
            self.recalcPageCentres();
            jQuery('a.swinxyzoom-window').swinxyzoom({mode:'window',size:'src',zoom:10});
            jQuery('.sxy-zoom-slider a').click(function(e)
	    {
		e.preventDefault();
		  var
		  $this = jQuery(this);
		  // picId = parseInt($this.attr('href')),
		  // path  = '../../../_assets/images/zoom/' + $this.attr('href');
		  // jQuery('.swinxyzoom').swinxyzoom('load', path + '-small.jpg',  path + '-large.jpg');
		  jQuery('.sxy-zoom-slider a.active').removeClass('active');
		  jQuerythis.toggleClass('active');
		  jQuery('.sxy-zoom-slider .viewer').animate({ left: ($this.offset().left - jQuery('.sxy-zoom-slider').offset().left) });
	    });
            /* check if images are higher than screen and text is NOT */
            var sidesHt = jQuery("#sides").height();
            if ( self.textEnd < sidesHt && self.imageEnd > sidesHt )
            {
                var children = jQuery("#lhs").children().detach();
                jQuery("#lhs").append('<div id="scrollframe-lhs"></div>');
                jQuery("#scrollframe-lhs").append(children);
            }
        });
    };
    /**
     * Check if this element contains a page no; recurse down
     * @param elem the element to test
     */
    this.testElem = function(elem){
         if ( elem.is("span") && elem.attr("class")=="page" )
        {
            var old = elem.css("display");
            elem.css("display","inline");
            // console.log(elem.position().top);
            var page = {};
            page.top = elem.position().top;
            page.name = elem.text().trim();
            this.rTops.push(page);
            elem.css("display",old);
        }
        else
        {
            elem.children().each(function(){
                self.findPage(jQuery(this));
            });
        }
    };
    /**
     * Look for elements that might contain pages; recurse across
     * @param elem the element to look at
     */
    this.findPage = function(elem) {
        self.testElem(elem);
    };
    /**
     * Sort an array of ints in ascending order
     * @param a the array to sort
     */
    this.sort = function(a) {
        // shellsort
        for (var h = a.length; h = Math.floor(h/2);) {
            for (var i = h; i < a.length; i++) {
                var k = a[i];
                for (var j=i;j>=h && k.top<a[j-h].top; j-=h)
                    a[j] = a[j-h];
                a[j] = k;
            }
        }
    };
    /**
     * Get the centre points of the pages
     */
    this.getPageCentres = function()
    {
        this.rCentres = Array();
        this.rTops = Array();
        this.findPage(this.getlayer());
        // add extra page-break at end
        var last = {};
        last.name = "final";
        last.top = this.getlayer()[0].scrollHeight;
        console.log("scrollHeight="+last.top);
        this.rTops.push(last);
        this.sort(this.rTops);
        for ( var i=1;i<this.rTops.length;i++ )
        {
            var diff = this.rTops[i].top-this.rTops[i-1].top;
            this.rCentres.push( Math.round(this.rTops[i-1].top+diff/2) );
        }
        this.textEnd = Math.round(this.rTops[this.rTops.length-1].top);
        this.printArray("raw lCentres", this.lCentres);
        this.printArray("raw rCentres",this.rCentres);
        // fudge first and last pages which aren't centred
        var wHalfHt = Math.round(jQuery("#scrollframe").height()/2);
        this.rCentres.unshift( wHalfHt );
        this.rCentres.push( this.textEnd-wHalfHt);
        this.printArray("lCentres before check", this.lCentres);
        this.printArray("rCentres before check",this.rCentres);
        //this.printArray("rTops",this.rTops);
        this.checkCentres();
        this.printArray("lCentres", this.lCentres);
        this.printArray("rCentres", this.rCentres);
        //console.log("textEnd="+this.textEnd);
        //console.log("nlines ="+this.lines.length);
    };
    /**
     * Get the index of the closest value in a list
     * @param list the sorted list of ints to search
     * @param value the value to look for
     * @return the biggest value in the list less than value
     */
    this.getIndex = function( list, value )
    {
        var top = 0;
        var bot = list.length-1;
        var mid=0;
        while ( top <= bot )
        {
            mid = Math.floor((top+bot)/2); // NB integer arithmetic
            if ( value < list[mid] )
            {
                if ( mid == 0 )
                    // value < than first item
                    return -1;  
                else
                    bot = mid-1;
            }
            else    // value >= list[mid]
            {
                if ( mid == list.length-1 )
                    // value is >= last item
                    break;
                else if ( value >= list[mid+1] )
                    top = mid+1;
                else // list[mid] must be biggest <= value
                    break;
            }
        }
        return mid;
    };
    /**
     * Get the interpolated LHS scroll position corresponding to the RHS
     * @param rVal the RHS value
     * @return the corresponding lValue
     */
    this.interpolate = function( rVal )
    {
        var index = this.getIndex( this.rCentres, rVal );
        //console.log("index="+index+"("+this.rCentres.length+")");
        var prev = this.rCentres[index];
        var next = this.rCentres[index+1];
        var fromPrev = (rVal-prev)/(next-prev);
        var lPrev = this.lCentres[index];
        var lNext = this.lCentres[index+1];
        return Math.round(lPrev+(lNext-lPrev)*fromPrev);
    };
    /**
     * Get the value of the tab
     * @param text the text content of the tab
     * @return its numeric value
     */
    this.tabValue = function(text) {
        var parts = text.split("-");
        if ( parts[parts.length-1] == "final" )
            return Number.MAX_VALUE;
        return parseInt(parts[parts.length-1]);
    };
    /**
     * Add a reactivation handler to the active tab just before it deactivates
     */
    this.addClickToActiveTab = function() {
        jQuery(".active-tab").click(function(){
            jQuery(this).unbind("click");
            self.addClickToActiveTab();
            jQuery(".active-tab").attr("class","inactive-tab");
            jQuery(this).attr("class","active-tab");
            self.switchLayer(jQuery(this).text());
        });
    };
    /**
     * Switch tabs to the one named
     * @param the text label of the tab
     */
    this.switchLayer = function( tab ) {
        this.current = tab;
        jQuery(".text-active").attr("class","text-inactive");
        this.getlayer().attr("class","text-active");
        this.fitText();
        this.recalcPageCentres();
        this.getlayer().scrollTop(0);
        jQuery("#lhs").css('top',"0px");
    };
    /**
     * Find the longest line in the textarea
     */
    this.recalcText = function()
    {
        var lay = this.getlayer();
        var text = lay.text();
        this.lines = text.split("\n");
        this.longest = 0;
        this.longestLen = 0;
        for ( var i=0;i<this.lines.length;i++ )
        {
            if ( this.lines[i].length > this.longestLen )
            {
                this.longest = i;
                this.longestLen = this.lines[i].length;
            }
        }
    };
    this.setHnoteWidth= function() {
        var maxHnoteWidth = 0;
        jQuery("div.hnote, div.stage, p.trailer").each(function(){
            var text = jQuery(this).text();
            var lines = text.split("\n");
            for ( var i=0;i<lines.length;i++ )
            {
                jQuery(this).append('<span id="testit" style="visibility:hidden">'+lines[i]+'</span>');
                var w = jQuery("#testit").width();
                if ( w > maxHnoteWidth )
                    maxHnoteWidth = w;
                jQuery("#testit").remove();
            }
        });
        var rhsWidth = jQuery("#rhs").width();
        if ( maxHnoteWidth > rhsWidth )
            maxHnoteWidth = rhsWidth;
        jQuery("div.hnote, div.stage, p.trailer").width(Math.round(maxHnoteWidth+10));
    };
    this.setStanzaWidth = function() {
        var maxWidth = 0;
        jQuery("span[class^='line']").each(function(){
            var w = jQuery(this).width();
            if ( w > maxWidth )
                maxWidth = w;
        });
        var stanzaWidth = Math.round(maxWidth + 10);
        jQuery("div.stanza").width(stanzaWidth);
    };
    /**
     * Fetch the text from the server via its docid
     */
    this.getText = function(docid)
    {
        var url = "http://"+window.location.hostname+"/compare/layers?docid="+docid;
        url += "&version1="+this.version1;
        jQuery.get(url,function(data) {
            jQuery('head').append('<style type="text/css">'+data.css+'</style>\n');
            var html = '<table><tr><td class="empty-tab">empty</td>';
            for ( var i=0;i<data.layers.length;i++ )
            {
                jQuery("#scrollframe").append('<div class="text-inactive" id="layer-'
                    +data.layers[i].name+'"></div>');
                jQuery("#layer-"+data.layers[i].name).append(data.layers[i].body);
                var tabName = data.layers[i].name=="final"
                    ?"layer-final":"layer-"+data.layers[i].name;
                html += '<td class="inactive-tab">'+tabName+'</td>';
            }
            html += '</tr></table>';
            jQuery("#tabs").append(html);
            jQuery("#tabs td").last().removeClass("inactive-tab");
            jQuery("#tabs td").last().addClass("active-tab");
            self.current = "layer-final";
            jQuery("#layer-final").attr("class","text-active");
            jQuery(".inactive-tab").click(function(){
                jQuery(this).unbind("click");
                self.addClickToActiveTab();
                jQuery(".active-tab").attr("class","inactive-tab");
                jQuery(this).attr("class","active-tab");
                self.switchLayer(jQuery(this).text());
            });
            self.recalcText();
            self.getPageImages(docid);
            jQuery("#scrollframe").scroll(function(e){
                var sp = e.target;
                var top = jQuery(sp).scrollTop();
                // console.log("top="+top);
                var bot = top+jQuery("#scrollframe").height();
                var lCentre = self.interpolate( (top+bot)/2 );
                //console.log("top="+top+" bot="+bot+" lCentre="+lCentre+" rVal="+(top+bot)/2);
                lCentre -= jQuery("#lhs").height()/2;
                if ( top == 0 )
                    jQuery("#lhs").css('top',"0px");
                else
                    jQuery("#lhs").css('top',-Math.round(lCentre)+"px");
                if ( jQuery(sp).scrollTop() >= self.textEnd-jQuery(sp).height() )
                {
                    var finalImageOffset = self.imageEnd-jQuery("#lhs").height();
                    jQuery("#lhs").css('top',-finalImageOffset+"px");
                }
            });
            self.getlayer().keydown(function(){
                self.dirty = true;
                //console.log("Set dirty to true");
            });
        });
    };
    var html = '<div id="wrapper"><div id="sides"><div id="lhs"></div>'
    html += '<div id="rhs"><div id="tabs"></div><div id="scrollframe">'
    html += '</div></div></div></div>';
    jQuery("#"+this.target).empty();
    jQuery("#"+this.target).append( html );
    var tWidth = jQuery("#toolbar").width();
    var wWidth = jQuery(window).width();
    jQuery("#sides").width(wWidth-tWidth);
    this.getText(this.docid);
}
function get_one_tw_param( params, name )
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
function getTwinviewArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#twinview_params").val();
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
            params['docid'] = get_one_tw_param(tabs_params,'docid');
    }
    if ( !('version1' in params) )
        params['version1'] = "/base/layer-final";
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(document).ready(function($){
    var params = getTwinviewArgs('twinview');
    jQuery("#"+params['mod-target']).css("visibility","hidden");
    var tv = new twinview(params['docid'],params['version1'],params['mod-target']);
}); 


