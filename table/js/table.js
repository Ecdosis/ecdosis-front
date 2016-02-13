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
     * Get the left character offset of the table in the base version
     * @return an int
     */
    this.getLeftOffset = function() {
        return this.offsets[this.left];
    };
    /**
     * Get the right character position in the base version
     * @return one after the right side char position
     */
    this.getRightOffset = function() {
        return this.offsets[this.offsets.length-1];
    };
    /**
     * Extract the sigla from the first column of each row
     * @param rows a JSON array of rows
     * @return an array of sigla
     */
    this.extractSigla = function(rows) {
        var sigla = Array();
        for ( var j=0;j<rows.length;j++ )
        {
            var siglum = rows[j].cells[0].segments[0].text;
            sigla[siglum] = j;
        }
        return sigla;
    };
    /**
     * Compare sigla with up to 2 parts
     * @param s1 the first siglum
     * @param s2 the second siglum
     */
    this.cmpSigla = function(s1,s2) {
        var p1 = s1.split("/");
        var p2 = s2.split("/");
        if ( p1.length>0 && p2.length>0 )
        {
            if ( p1[0] > p2[0] )
                return 1;
            else if ( p1[0] < p2[0] )
                return -1;
            else if ( p1.length>1 && p1.length == p2.length )
                return  p1[1].localeCompare(p2[1]);
            else if ( p1.length != p2.length )
            {
                if ( p1.length < p2.length )
                    return -1;
                else
                    return 1;
            }
        }
        else
        {
             if ( p1.length < p2.length )
                return -1;
             else 
                return 1;
        }
    };
    /**
     * Sort an array of rows by their sigla
     */
    this.sortBySigla = function(rows) {
        var sigla = this.extractSigla(rows);
        var keys = [];
        for (var k in sigla) 
            keys.push(k);
        for ( var h = keys.length; h = parseInt(h/2); ) 
        {
            for (var i=h; i< keys.length; i++) 
            {
                var k = keys[i];
                for (var j=i; j>=h && self.cmpSigla(k,keys[j-h])<0; j-=h)
                {
                    keys[j] = keys[j-h];
                }
                keys[j] = k;
            }
        }
        var newrows = Array();
        for ( var i=0;i<keys.length;i++ )
            newrows.push( rows[sigla[keys[i]]] );
        return newrows;
    };
    /**
     * Sort the rows by the order given in the project version list
     * @param list the project versions
     * @param rows the rows returned by the table function
     */
    this.sortByList = function(list,rows) {
        var newrows = Array();
        var sigla = this.extractSigla(rows);
        var m = 0;
        for ( var i=0;i<list.length;i++ )
        {
            var vObj = list[i];
            for ( var k in vObj )
            {
                if ( k in sigla )
                {
                    newrows[m++] = rows[sigla[k]];
                    rows[sigla[k]] = null;
                }
            }
        }
        // make sure all original rows are copied over
        for ( var i=0;i<rows.length;i++ )
            if ( rows[i] != null )
                newrows.push(rows[i]);
        return newrows;
    };
    /**
     * Clear out the old bring in the new table
     * @param rows the rows from the compare service
     */
    this.installRows = function( rows ) {
        var t = jQuery("#"+self.target);
        t.contents().remove();
        t.prepend(self.tableToHtml(rows));
        var sWidth = jQuery("#sigla").width();
        jQuery(".siglumleft").css("width",sWidth+"px");
        jQuery(".siglumleft").css("max-width",sWidth+"px");
        jQuery(".siglumleft").each(function(){
            var t = jQuery(this);
            t.attr("title",t.text());
            t.click(function(){
                if ( jQuery(this).find("div").length == 0 )
                {
                    var inputs = '';
                    if ( !jQuery(this).parent().is(":last-child") )
                        inputs += '<input type="button" class="down" value="▼"></input>';
                    if ( !jQuery(this).parent().is(":first-child") )
                        inputs += '<input type="button" class="up" value="▲"></input>';
                    jQuery(this).append('<div>'+inputs+'</div>');
                    jQuery(this).find(".up").click(function() {
                        var tr = jQuery(this).closest("tr");
                        if ( !tr.is(":first-child") )
                        {
                            var ind = tr.index();
                            var mtr = jQuery("#table-wrapper tr").get(ind);
                            var mprev = jQuery(mtr).prev().detach();
                            var prev = tr.prev().detach();
                            prev.insertAfter(tr);
                            mprev.insertAfter(jQuery(mtr));
                        }
                    });
                    jQuery(this).find(".down").click(function() {
                        var tr = jQuery(this).closest("tr");
                        if ( !tr.is(":last-child") )
                        {
                            var ind = tr.index();
                            var mtr = jQuery("#table-wrapper tr").get(ind);
                            var mnext = jQuery(mtr).next().detach();
                            var next = tr.next().detach();
                            mnext.insertBefore(jQuery(mtr));
                            next.insertBefore(tr);
                        }
                    });
                    var inst = jQuery(this).find("div");
                    var trw = jQuery("#sigla").width();
                    var sdw = inst.width();
                    var loff = Math.round((trw-sdw)/2)+"px";
                    inst.css("left",loff);
                    setTimeout(function(){
                        inst.remove();
                    },5000);
                }
            });
        });
        var tWidth = jQuery("#table-wrapper table").width();
        var vWidth = jQuery("#table-wrapper").width();
        if ( self.positions == undefined )
        {
           self.positions = [];
           self.positions[0] = 0;
        }
        self.positions[self.right] = tWidth+self.positions[self.left]-vWidth;
    };
    /** 
     * Is a string purely alphabetic?
     * @param str the string to test
     * @return true if it is else false
     */
    this.isalpha = function(str) {
        return /^[a-zA-Z()]+$/.test(str);
    };
    /**
     * Get the projectid from the docid - a bit iffy
     * return the project id
     */
    this.projid = function() {
        var parts = this.docid.split("/");
        if ( parts.length == 5 || (parts.length>3&&this.isalpha(parts[2])) )
            return parts[0]+"/"+parts[1]+"/"+parts[2];
        else if ( parts.length > 1 )
            return parts[0]+"/"+parts[1];
        else
            return this.docid;
    };
    /**
     * Sort the rows based on the first cell and install it
     * @param rows the rows as returned by the server
     */
    this.sortAndInstall = function( rows ) {
        var url = "http://"+window.location.hostname+"/project/metadata?docid=";
        url += self.projid();
        jQuery.get(url,function(metadata){
            if ( 'versions' in metadata )
                rows = self.sortByList(metadata.versions,rows);
            else
                rows = self.sortBySigla(rows);
            self.installRows(rows);
        }).fail(function(){self.installRows(rows)});
    };
    /**
     * Set the title of the page
     */
    this.setTitle = function() {
        var url = "http://"+window.location.hostname+"/compare/title";
        url += "?docid="+this.docid;
        jQuery.get(url,function(data){
            jQuery("#"+self.target).prepend('<div id="work_title">'+data+'</div>');
        });
    };
    /**
     * Get the selected set of versions
     * @return "all" or a comma-separated list of versions
     */
    this.getSelected = function() {
         if ( jQuery("#some_versions").prop('disabled') == true )
             return "all";
         else
         {
             var selected = "";
             jQuery("#dropdown option").each(function(i){
                var pos = jQuery(this).text().lastIndexOf(" ✓");
                 if ( pos != -1 )
                 {
                     if ( selected.length>0 )
                         selected += ",";
                     selected += jQuery(this).val();
                 }
             });
             return selected;   
         } 
    };
    /**
     * in keyword doesn't work with lists
     * @param item the item to lookup
     * @param list an array of strings
     * @return true if it is in the list
     */
    this.inList = function(item,list){
        for ( var i=0;i<list.length;i++ )
            if ( item == list[i] )
                return true;
        return false;
    };
    /**
     * Add the toolbar below the table
     * @param options the options currently in effect
     */
    this.addToolbar = function(options){
        var url = "http://"+window.location.hostname+"/compare/list";
        url += "?docid="+this.docid+"&name=dropdown";
        jQuery.get(url,function(data){
            jQuery("#"+self.target).append('<div id="table_toolbar"></div>');
            var t = jQuery("#table_toolbar")
            t.append("<span>some versions</span>");
            t.append('<input id="some_versions" type="checkbox"></input>');
            t.append(data);
            t.append('<input id="rebuild" type="submit" value="rebuild"></input>');
            jQuery("#some_versions").click(function(){
               jQuery("#dropdown").prop( "disabled", !jQuery(this).is(':checked') );
            });
            if ( 'selected' in options && options.selected != 'all' )
            {
                var parts = options.selected.split(",");
                jQuery("#dropdown option").each(function(i){
                    if ( self.inList(jQuery(this).val(),parts) )
                        jQuery(this).text(jQuery(this).text()+" ✓");
                });
                jQuery("#dropdown").prop('disabled',false);
                jQuery("#some_versions").prop('checked',true);
            }
            else
            {
                // initial selection: tick all
                jQuery("#dropdown option").each(function(i){
                    jQuery(this).text(jQuery(this).text()+" ✓");
                });
                jQuery("#dropdown").prop('disabled',true);
                jQuery("#some_versions").prop('checked',false);
            }
            jQuery("#dropdown").change(function(){
                var pos = this.options[this.selectedIndex].text.lastIndexOf(" ✓");
                if ( pos != -1 )
                {
                    var len = this.options[this.selectedIndex].text.length;
                    var copy = this.options[this.selectedIndex].text;
                    this.options[this.selectedIndex].text = copy.substring(0,pos);
                }
                else
                    this.options[this.selectedIndex].text += " ✓";
            });
            jQuery("#rebuild").click(function(){
                self.setupAndFetch();
            });
            self.setTitle();
        }); 
    };
    /**
     * Fetch a section of the table and install it
     * @param left the left offset in base version
     * @param right the rightmost offset in base or the right hand edge
     */
    this.fetchTable = function(left,right) {
        var url = "http://"+window.location.hostname+"/compare/table/json"
        var length = right-left;
        url += "?docid="+self.docid+"&offset="+left+"&length="+length;
        if ( jQuery("#some_versions").prop('disabled') == false )
            url += "&selected="+this.getSelected();
        if ( self.version1 != undefined )
            url += "&version1="+self.version1;
        jQuery.get(url,function(data) {
            self.sortAndInstall(data.rows);
            self.addToolbar(data.options);
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
            cell.segments[0].class="siglum";
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
        this.right = this.offsets.length-1;
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
        this.right = this.offsets.length-1;
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


