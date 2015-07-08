/**
 * Simple GUI to find things in an index
 * @param target the id of the target eleemnt on the page
 */
function works(target,title)
{
    this.target = target;
    this.tableTitle = title;
    this.sortStates = ["ascending","unsorted","unsorted"];
    this.cellTitles = ["Id","Title","First Year"];
    this.cellIds = ["hnumber","normtitle","firstyear"];
    var self = this;
    this.set_html = function( html )
    {
        var tgt = jQuery("#"+this.target);
        jQuery("#"+this.target).empty();
        tgt.append(html);
    };
    this.get_cms_path = function() {
        var parts = window.location.pathname.split("/");
        if ( parts.length > 1 )
        {
            return '/'+parts[1];
        }        
        else
            return '/'+window.location.pathname;
    };
    /**
     * Find the lowest year in all the versions of a work
     */
    this.getLeastYear = function( work ) {
        var year = 1000000;
        for ( var i=0;i<work.versions.length;i++ )
        {
            if ( work.versions[i].year != undefined 
                && parseInt(work.versions[i].year)<year )
                year = parseInt(work.versions[i].year);
        }
        if ( year == 1000000 )
            return 0;
        else
            return year;
    };
    /**
     * Build one cell in the table header based on the sort state
     * @param state the sort state from this.sortStates
     * @param title the cell title
     * @param id the id of the cell
     * @return the finished th cell
     */
    this.getSortCell = function( state, title, id ) {
        var cell = '<th ';
        if ( id.length>0 )
        cell += 'id="'+id+'" ';
        if ( state == "descending" || state == "unsorted" )
            cell += 'title="sort ascending"';
        else 
            cell += 'title="sort descending"';
        cell += ' class="';
        if ( state == "descending" || state == "ascending" )
            cell += "sorted";
        else
            cell += "unsorted";
        cell += '"><i class="fa ';
        if ( state == "unsorted" || state == "descending" )
            cell += "fa-sort-asc";
        else
            cell += "fa-sort-desc";
        cell += '"></i>';
        if ( title.length>0 )
            cell += '<span class="celltitle">'+title+'</span>';
        cell += '</th>';
        return cell;
    };
    /**
     * Make the header based on the sort states
     * @return the complete header row
     */
    this.makeHeader = function() {
        var header = '<tr><th></th>';
        for ( var i=0;i<this.sortStates.length;i++ )
        {
            header += this.getSortCell(this.sortStates[i],
                this.cellTitles[i],
                this.cellIds[i]);
        }
        header += '</tr>';
        return header;
    };
    /**
     * Compare two items by a field
     * @param a the first item
     * @param b the 2nd item
     * @param field the field to compare by
     * @param ascending true if ascending else descending
     * @return true if a < b and ascending else true if a > b
     */
    this.compareField = function( a, b, field, ascending ) {
        if ( ascending )
            return a[field] < b[field];
        else
            return a[field] > b[field];
    };
    /**
     * Sort the jsonTable by the named field
     * @param field the name of the field in the records of jsonTable
     * @param direction either "ascending" (normal) or "descending" (reversed)
     */
    this.sortByField = function(field,direction) {
        var a = this.jsonTable;
        for (var h = a.length; h = parseInt(h / 2);) {
            for (var i = h; i < a.length; i++) {
                var k = a[i];
                for (var j = i; j >= h && this.compareField(k,a[j-h],
                    field,direction=="ascending"); j -= h)
                    a[j] = a[j - h];
                a[j] = k;
            }
        }
    };
    /**
     * Toggle the sort state of a column and perform a resort
     * @param index the index of the sortState
     * @param field the name of the field in this.jsonTable to sort on
     */
    this.toggleState = function(index,field) {
        if ( this.sortStates[index]=="ascending" )
        {
            this.sortStates[index] = "descending";
            this.sortByField(field,"descending");
        }
        else
        {
            this.sortStates[index] = "ascending";
            this.sortByField(field,"ascending");
        }
        for ( var i=0;i<this.sortStates.length;i++ )
        {
            if ( i != index )
                this.sortStates[i] = "unsorted";
        }
        this.rebuild();
    };
    /**
     * Rebuild the works table using the existing downloaded data, perhaps resorted
     */
    this.rebuild = function() {
        var html = '<div id="works">';
        html += '</div>';
        this.set_html( html );
        var main = jQuery("#works");
        main.prepend('<table id="versions"></table>');
        main.prepend('<h3 class="tabletitle">'+this.tableTitle+'</h3>');
        var table = jQuery("#versions");
        table.append(this.makeHeader());
        for ( var i=0;i<this.jsonTable.length;i++ )
        {
            this.jsonTable[i].leastYear = self.getLeastYear(this.jsonTable[i]);
            var row = '<tr><td class="initial" title="show versions">';
            row += '<i class="fa fa-plus"></i></td>';
            row += '<td>'+this.jsonTable[i].id+'</td>';
            row += '<td>'+this.jsonTable[i].title+'</td>';
            row += '<td class="leastyear">'+this.jsonTable[i].leastYear+'</td>';
            table.append(row);
        }
        jQuery("#hnumber").click(function() {
            self.toggleState(0,"id");
        });
        jQuery("#normtitle").click(function() {
            self.toggleState(1,"normalised-title");
        });
        jQuery("#firstyear").click(function() {
            self.toggleState(2,"leastYear");
        });
    };
    var url = "http://"+window.location.hostname+"/project/works";
    jQuery.get(url,function(data) {
        self.jsonTable = data;
        self.rebuild();
    });
}
/**
 * This reads the "arguments" to the javascript file
 * @param scrName the name of the script file minus ".js"
 * @return a key-value map of the parameters
 */
function get_args( scrName )
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
/**
 * Load the rebuild index dialog with two arguments
 */
jQuery(document).ready( function() { 
    var params = get_args('works');
    new works(params['target'],params['title']);
}); 
