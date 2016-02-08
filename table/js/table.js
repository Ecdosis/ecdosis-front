/**
 * Create a table view
 * @param target the id of the element we are to replace
 * @param docid the docid of the work to fetch and view
 * @param selected a comma-separate list of full version paths
 * @param version1 the full version path of the base version
 * @param pos the index of the leftmost segment in the display
 */ 
function table(target,docid,selected,version1,pos)
{
    /** the docid of the cortex to fetch */
    this.docid = unescape(docid);
    /** the id of the element to attach the table to */
    this.target = target;
    /** the base version */
    this.version1 = version1;
    /** set this for later */
    var self = this;
    /**
     * Find the min of 2 values
     */
    this.min = function(a,b) {
        return (a<b)?a:b;
    };
    /**
     * Find the max of 2 values
     */
    this.max = function(a,b) {
        return (a>b)?a:b;
    };
    /**
     * Test if a variable is undefined, null or an empty string
     * @return true if it is completely epty
     */
    this.isEmpty = function(item) {
        return item==undefined||item==null
            ||((typeof item==='string')&&item.length==0);
    };
    /**
     * Generate the html for a table cell based on its json defn
     * @return html for the cell
     */
    this.addCell = function(cell) {
        var html = '<td';
        if ( 'class' in cell )
            html += ' class="'+cell.class+'"';
        html += '>';
        for ( var k=0;k<cell.segments.length;k++ )
        {
            var seg = cell.segments[k];
            if ( 'class' in seg )
                html += '<span class="'+seg.class+'">';
            html += seg.text;
            if ( 'class' in seg )
                html += '</span>';
        }
        return html;
    };
    /**
     * Get an estimate of the table's width for the slider's max value
     * @return the precise width if all of it is visible else an estimate
     */
    this.totalPixelWidth = function() {
        var cRight = this.getRightOffset();
        var cLeft = this.getLeftOffset();
        var vWidth = jQuery("#table-wrapper").width();
        var tWidth = jQuery("#table-wrapper table").width();
        if ( this.offsets.length==2 )
            return Math.round(tWidth-vWidth);
        else
        {
            var baselen = this.offsets[this.offsets.length-1];
            return Math.round(tWidth*(baselen/(cRight-cLeft))-vWidth);
        }
    };
    /**
     * Get the greatest value in a list less than a value
     * @param list a sorted json array of integers
     * @param value the value less than the biggest value
     * @return the index of the least value in list greater than value
     */
    this.getNearestValue = function( list, value ) {
        var top = 0;
        var bot = list.length-1;
        var mid=0;
        while ( top <= bot )
        {
            mid = Math.floor((top+bot)/2); 
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
                else if  ( value >= list[mid+1] )
                    top = mid+1;
                else // list[mid] must be biggest <= value
                    break;
            }
        }
        return mid;
    };
    /**
     * Compute the total width of a range of table cells
     * @param from the index (starting at 1) of the first cell
     * @param to the index of the final cell
     * @return the total width of the cells in pixels
     */
    this.measureCells = function(from,to) {
        var row1 = jQuery( "#table-wrapper tr").first();
        var total = 0;
        row1.children("td").each(function(i){
            if ( i >= from && i <= to )
                total += jQuery(this).width();
        });
        return total;
    };
    /**
     * Set left and right indices in the offsets array from the slider
     */
    this.setLeftAndRight = function() {
        var value = jQuery("#slider").slider("value");
        this.left = this.getNearestValue(this.positions,value);
        this.right = this.left+1;
    };
    this.getLeftOffset = function() {
        return this.offsets[this.left];
    };
    this.getRightOffset = function() {
        return this.offsets[this.offsets.length-1];
    };
    /**
     * Install the slider once the table has initially loaded
     */
    this.installSlider = function() {
        jQuery("#"+this.target).append('<div id="slider"></div>');
        var maxLength = this.totalPixelWidth();
        jQuery("#slider").slider({
            min:0,
            max:maxLength,
            /* called when we slide but don't release */
            slide:function(){
                var value = jQuery("#slider").slider("value");
                value -= self.positions[self.left];
                jQuery("#table-wrapper table").css("margin-left",-value+"px");
            },
            /* called when we release the mouse */
            stop: function() {
                var value = jQuery("#slider").slider("value");
                var tWidth = jQuery("#table-wrapper table").width();
                var vWidth = jQuery("#table-wrapper").width();
                if ( value > tWidth )
                {
                    self.setLeftAndRight();
                    self.fetchTable(self.getLeftOffset(),self.getRightOffset());
                    value -= self.positions[self.left];
                }
                else if ( value > tWidth-vWidth )
                {
                    
                }
                jQuery("#table-wrapper table").css("margin-left",-value+"px");
            }
        });
    };
    /**
     * Fetch a section of the table and install it
     * @param left the left offset in base version
     * @param right the rightmost offset in base or Java Integer.MAX_VALUE
     */
    this.fetchTable = function(left,right) {
        console.log("left="+left+" right="+right);
        var url = "http://"+window.location.hostname+"/compare/table/json"
        var length = right-left;
        url += "?docid="+self.docid+"&offset="+left+"&length="+length;
        if ( self.version1 != undefined )
            url += "&version1="+self.version1;
        jQuery.get(url,function(data) {
            var t = jQuery("#"+self.target);
            t.find("table").remove();
            t.prepend(self.tableToHtml(data.rows));
            var sWidth = jQuery("#sigla").width();
            jQuery(".siglumleft").css("width",sWidth+"px");
            jQuery(".siglumleft").css("max-width",sWidth+"px");
            jQuery(".siglumleft").each(function(){
                var t = jQuery(this);
                t.attr("title",t.text());
            });
            var tWidth = jQuery("#table-wrapper table").width();
            if ( self.positions == undefined )
            {
               self.positions = [];
               self.positions[0] = 0;
            }
            self.positions[self.right] = tWidth+self.positions[self.left];
            if ( jQuery("#slider").length==0 )
                self.installSlider();
            if ( self.right == self.offsets.length-1 )
                jQuery("#slider").slider({max:self.positions[self.right]});
        }).fail(function(jqXHR, textStatus, err){alert(err)});
    };
    /**
     * Convert a table-section from json to HTML
     * @param jArray an array of segments
     * @return a html representation of the table
     */
    this.tableToHtml = function(jArray) {
        // left fixed column first
        // for each row add the first cell
        var html = '<div id="sigla"><table>';
        for ( var i=0;i<jArray.length;i++ )
        {
            var cell = jArray[i].cells[0];
            html += '<tr>';
            html += self.addCell(cell);
            html += '</tr>';
        }
        html += '</table></div>';
        // main scrolling table
        html += '<div id="table-wrapper"><table>';
        for ( var i=0;i<jArray.length;i++ )
        {
            html += '<tr>';
            var row = jArray[i];
            // skip first cell
            for ( var j=1;j<row.cells.length;j++ )
                html += self.addCell(row.cells[j]);
            html += '</tr>';
        } 
        html += '</table></div>';
        return html;
    };
    /**
     * Set up left and right initially and fetch first copy of the table
     */
    this.setupAndFetch = function(){
        this.left = 0;
        this.right = 1;
        this.fetchTable(this.getLeftOffset(),this.getRightOffset());
    };
    // now set everything up
    var pe = jQuery("#positions");
    var de = jQuery("#docid");
    var positions;
    var local_docid;
    if ( de.length == 0 )
    {
        jQuery(document.body).append('<input type="hidden" id="docid"></input>');
        de = jQuery("#docid");
    }
    else
        local_docid = de.val();
    if ( pe.length == 0 )
    {
        jQuery(document.body).append('<input type="hidden" id="positions"></input>');
        pe = jQuery("#positions");
    }
    else
        positions = pe.val();
    if ( positions != undefined )
    {
        self.offsets = JSON.parse(positions);
    }
    if ( !this.isEmpty(local_docid) && this.isEmpty(docid) )
        this.docid = local_docid;
    else
        de.val(this.docid);
    if ( this.isEmpty(this.offsets) )
    {
        var url = "http://"+window.location.hostname+"/compare/table/info";
        url += "?docid="+this.docid;
        if ( selected != undefined )
            url += "&selected="+selected;
        if ( version1 != undefined )
            url += "&version1="+version1;
        jQuery.get( url, function(data) {
            self.offsets = data;
            pe.val(JSON.stringify(data));
            self.setupAndFetch();
        });
    }
    else
    {
        this.left = 0;
        this.right = 1;
        this.fetchTable(this.getLeftOffset(),this.getRightOffset());
    }
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
function getTableArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#table_params").val();
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
        if ( tabs_params != null && tabs_params.length>0 )
            params['docid'] = get_one_param(tabs_params,'docid');
    }
    if ( !('target' in params) && 'mod-target' in params )
        params['target'] = params['mod-target'];
    return params;
}
/**
 * Load the compare tool with three arguments
 */
jQuery(document).ready(
    function(){
        var params = getTableArgs('table');
        new table(params['target'],params['docid'],params['selected'],
            params['version1'],params['pos']);
    }
);


