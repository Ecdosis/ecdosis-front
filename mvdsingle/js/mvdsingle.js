/**
 * Ratings: enter/view ratings and reviews of a work
 * @param docid the docid of the work being rated
 * @param userdata encrypted userdata
 */
function ratings(docid,userdata)
{
    this.docid = decodeURI(docid);
    this.key = "I tell a settlers tale of the old times";
    var self = this;
    this.decode = function( enc ) {
        var plain = atob(enc);
        var sb = "";
        for ( var i=0;i<plain.length;i++ )
        {
            var kchar = this.key.charCodeAt(i%this.key.length);
            var pchr = plain.charCodeAt(i)^kchar;
            sb += String.fromCharCode(pchr);
        }
        return sb;
    };
    // save a copy of the old userdata for later verification
    this.encrypted = userdata;
    this.userdata = JSON.parse(this.decode(userdata));
    /**
     * Generate a span of possibly fractional stars
     * @param score the number of stars to display up to 5
     */
    this.writeStars = function( score ) {
        var span = '<span class="stars">';
        var half_scores = Math.round(score*2.0);
        for ( i=0;i+1<half_scores;i+=2 )
            span += '<i class="fa fa-star"></i>';
        if ( half_scores-i==1 )
        {
            i+=2;
            span += '<i class="fa fa-star-half-empty"></i>';
        }
        for ( var j=i;j<10;j+=2 )
            span += '<i class="fa fa-star-o"></i>';
        span += '</span>';
        return span;
    };
    /**
     * Capitalise the first letter of a word
     * @param word the word to capitalise
     * @return the word with first letter in uppercase
     */
    this.capitalise = function( word ) {
        if ( word.length>0 )
            return word.substring(0,1).toUpperCase()+word.substring(1);
        else
            return "";
    };
    /**
     * Build an edit form
     * @param rating the entry in ratings
     * @return a form-element for editng the rating
     */
    this.buildEditForm = function( rating ) {
        var form = '<form id="edit_rating" method="POST" action="/ratings/">';
        var stars = self.writeStars(rating.score);
        var user = self.capitalise(rating.user);
        var score = '<p class="userscore"><span class="username">'
            +user+'</span>'+stars+'</p>';
        form += score;
        form += '<span id="rating_prompt">Rating: </span>';
        form += '<select id="user_rating_select" name="score">';
        for ( var i=1;i<=5;i++ )
        {
            form += '<option';
            if ( rating.score == i )
                form += ' selected';
            form += '>'+i+'</option>';
        }
        form += '</select>';
        form += '<textarea name="review" id="user_review_box">';
        form += rating.review;
        form += '</textarea>';
        form += '<input type="hidden" name="user" value="'+rating.user+'"></input>';
        form += '<input type="button" value="cancel" id="cancel_button"></button>';
        form += '<input type="button" value="save" id="save_button"></button>';
        form += '</form>';
        return form;
    };
    /**
     * Build an ordinary rating (score + review) for display
     * @param rating the entry in the ratings array
     * @return a HTML representation of the rating
     */
    this.buildRating = function( rating ) {
        var stars = self.writeStars(rating.score);
        var user = self.capitalise(rating.user);
        var icon1 = "";
        var icon2 = ""; 
        if ( 'editable' in rating )
        {
            icon1 = '<a title="edit" href="#" id="edit_icon"><i class="fa fa-edit"></i></a>';
            icon2 = '<a title="delete" href="#" id="delete_icon"><i class="fa fa-trash"></i></a>';
        }
        var score = '<p class="userscore"><span class="username">'+user+'</span>'
            +icon1+icon2+stars+'</p>';
        if ( 'review' in rating )
            score += '<p class="review">'+rating.review+'</p>';
        return '<div class="rating">'+score+'</div>';
    };
    /**
     * Get the index of the rating being edited
     * @return an int or -1 if none
     */
    this.getEditedIndex = function() {
        var item = -1;
        for ( var i=0;i<self.ratings.length;i++ )
            if ( 'editable' in this.ratings[i] )
            {
                item = i;
                break;
            }
        return item;
    };
    /**
     * Calculate overall score
     * @return the average score of all reviews
     */
    this.calcScore = function() {
        var total = 0;
        for ( var i=0;i<this.ratings.length;i++ )
            total += this.ratings[i].score;
        return (this.ratings.length!=0)?total/this.ratings.length:0;
    };
    /**
     * Activate the cancel and save buttons
     */
    this.activateEditButtons = function(item) {
        jQuery("#cancel_button").click(function(){
            jQuery("#edit_rating").replaceWith(self.buildRating(self.ratings[item]));
            self.activateEditIcons();
        });
        jQuery("#save_button").click(function(){
            var item = self.getEditedIndex();
            // update local copy so we don't have to download again
            self.ratings[item].score = parseInt(jQuery("#user_rating_select").val());
            self.ratings[item].review = jQuery("#user_review_box").val();
            console.log(jQuery("#user_rating_select").val());
            var url = jQuery("#edit_rating").attr("action");
            var data = new Object();
            data.user = self.ratings[item].user;
            data.review = self.ratings[item].review;
            data.score = self.ratings[item].score;
            data.docid = self.docid;
            var posting = jQuery.post(url,data);
            posting.done( function() {
                jQuery("#ratings .stars:eq(0)").replaceWith(self.writeStars(self.calcScore()));
                jQuery("#edit_rating").replaceWith(self.buildRating(self.ratings[item]));
                self.activateEditIcons();
            });
            posting.fail( function() {
                console.log("posting of review failed");
            });
        });
    };
    /**
     * Turn on the edit button 
     */
    this.activateEditIcons = function() {
        jQuery("#edit_icon").click(function() {
            var item = self.getEditedIndex();
            var form = self.buildEditForm(self.ratings[item]);
            jQuery(".rating:eq("+item+")").replaceWith(form);
            self.activateEditButtons(item);
        });
        jQuery("#delete_icon").click(function() {
            var answer = confirm("Are you sure you want to delete your review?");
            if ( answer )
            {
                // delete locally
                var item = jQuery(this).closest(".rating").index();
                var onServer = self.ratings[item].saved;
                jQuery(".slidingDiv div:eq("+item+")").remove();
                self.ratings.splice(item,1);
                // delete on server
                if ( onServer )
                {
                    var jObj = new Object();
                    jObj.docid = self.docid;
                    jObj.userdata = self.encrypted;
                    var res = jQuery.post("/ratings/delete/", jObj );
                    res.fail(function(){
                        alert("Couldn't delete. Please refresh page");
                    });
                }
                // whether empty or not we deleted OUR review
                // we need to be able to recreate it
                self.addCreateEmptyPlus();
            }
        });
    };
    /**
     * Add an empty review
     */
    this.addEmptyReview = function() {
        var rating = new Object();
        rating.user = self.userdata.name;
        rating.review = "";
        rating.score = 0;
        rating.editable = true;
        rating.saved = false; // if not saved don't delete on server
        self.ratings.push(rating);
        jQuery("#ratings .slidingDiv").append(self.buildEditForm(rating));
        self.activateEditButtons(self.getEditedIndex());
    };
    /**
     * Create a plus sign to create an empty review
     */
    this.addCreateEmptyPlus = function() {
        var plus = '<div id="plus_div" class="rating"><a href="#"'
            +' title="add review" id="plus_empty_review">'
            +'<i class="fa fa-plus"></i></a></div>';
        jQuery("#ratings .slidingDiv").append(plus);
        jQuery("#plus_empty_review").click(function() {
            jQuery("#plus_div").remove();
            self.addEmptyReview();
        });
    };
    /**
     * Is the currently logged-in user an editor
     * @return true if the user is logged in and has a role "editor"
     */
    this.isEditor = function() {
        if ( this.userdata.name.length > 0 && this.userdata.roles.length > 0 )
        {
            for ( var i=0;i<this.userdata.roles.length;i++ )
                if ( this.userdata.roles[i] == "editor" )
                    return true;
        }
        return false;
    };
    // start by fetching the ratings for this document
    var url = 'http://'+window.location.hostname+'/ratings/?docid='+this.docid;
    var jqxhr = jQuery.get(url,function(data) {
        var i = 0;
        self.ratings = data.ratings;
        // mark them as saved so new reviews will not be
        for ( var i=0;i<self.ratings.length;i++ )
            self.ratings.saved = true;
        if ( data.score > 0 || self.isEditor() )
        {
            // add the overall score, which may be a fraction
            var span = self.writeStars( data.score );
            jQuery("#ratings").append(span);
            // write the template for the reviews
            jQuery("#ratings").append(
                '<div><a title="Show/hide reviews" href="#" class="show_hide" '
                +'id="plus"><i class="fa fa-plus"></i></a>'
                +'<div class="slidingDiv"></div></div>');
            // IF the user already has a posted review
            // add the editing icon next to his/her name
            var noReview = true;
            for ( var i=0;i<self.ratings.length;i++ )
            {
                if ( self.ratings[i].user == self.userdata.name )
                {
                    self.ratings[i].editable = true;
                    noReview = false;
                    break;
                }
            }
            // add the ratings - editable one will have icons
            for ( i=0;i<self.ratings.length;i++ )
            {
                var r = self.buildRating(self.ratings[i]);
                jQuery("#ratings .slidingDiv").append(r);
            }
            // add form for creating user's first review
            if ( noReview && self.isEditor() )
                self.addCreateEmptyPlus();
            /**
             * Activate show/hide button
             */
            jQuery('.show_hide').click(function(){
                if ( jQuery("#plus i").hasClass("fa-plus") )
                {
                    jQuery("#plus i").removeClass("fa-plus");
                    jQuery("#plus i").addClass("fa-minus");
                    jQuery(".slidingDiv").slideDown();
                }
                else
                {
                    jQuery("#plus i").removeClass("fa-minus");
                    jQuery("#plus i").addClass("fa-plus");
                    jQuery(".slidingDiv").slideUp();
                }
            });
            if ( jQuery("#edit_icon").length > 0 )
                self.activateEditIcons();
        }
    });
    jqxhr.fail(function() {
        console.log( 'docid '+self.docid
            +' not found or ratings service not running');
    });
}
/**
 * Main object
 * @param target the id of the element we are to insert ourselves in
 * @param docid the docid to retrieve the version from
 * @param version1 the version id to fetch
 * @param selections (optional) mvd-offsets of words to select
 * @param message briefly display on load or null
 * @param userdata encrypted user data
 */
function mvdsingle(target,docid,version1,selections,message,userdata) 
{
    this.docid = docid;
    this.version1 = version1;
    this.selections = selections;
    this.target = target;
    this.message = message;
    this.userdata = userdata;
    this.layers = {base:'original text',del1:'first deletion layer',rdg1:'first alternative layer'};
    var self = this;
    /**
     * Copy the stylesheet in a comment returned by the service to head
     * @param the server response
     */
    this.installCss = function( response ) {
        var start = response.indexOf("<!--styles: ");
        if ( start != -1 )
        {
            var part = response.substr(start+12);
            var end = part.indexOf("-->");
            part = part.substr(0,end);
            var old = jQuery("#mvdcss");
            if ( old.length > 0 )
                old.remove();
            jQuery("head").append('<style id="mvdcss">'+part+"</style>");
        }    
    };
    /**
     * Find the selected version from the HTML of the select element
     * @param response the response return from the server 
     * @return the vid of the selection
     */
    this.getSelectedOption = function( responseText ) {
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
    };
    /**
     * Convert an array of ints to a comma-delimited list
     */
    this.toList = function( array ) {
        var str = "";
        for ( var i=0;i<array.length;i++ )
        {
            str += array[i];
            if ( i < array.length-1 )
                str += ",";
        }
        return str;
    };
    /**
     * Scroll the main window down to the first selection
     */
    this.scrollToSelection = function() {
        var scrollAmt = jQuery(".selected").first().offset().top-(jQuery(window).height()/2)
        if ( scrollAmt < 0 )
            scrollAmt = 0;
        jQuery('html, body').animate({
            scrollTop: scrollAmt
        }, 1000);
    };
    /**
     * Update the source string after the dropdown
     */
    this.updateSource = function() {
        var title = jQuery("#versions option:selected").attr("title");
        jQuery("#source").text(title);
    };
    /**
     * Make the version title of the dropdown menu option
     * @param sources map of version names to sources
     * @param option the option object
     */
    this.setOptionTitle = function(sources,option) {
        var vid = option.val();
        var parts = vid.split("/");
        if ( parts.length>1&&parts[1] in sources )
        {
             var title = sources[parts[1]];
             if ( parts.length > 2 && parts[parts.length-1] in self.layers )
                 title += ": "+self.layers[parts[parts.length-1]];
             option.attr("title",title);
        }
    };
    /**
     * Get version metadata and use it to add sources to each version
     */
    this.getVersionMetadata = function() {
        var url = "http://"+window.location.hostname
            +"/formatter/metadata?docid="+docid;
        jQuery.get(url, function(response) {
            var sources = {};
            for ( var i=0;i<response.length;i++ ) 
            {
                var key = Object.keys(response[i])[0];
                var value = response[i][key];
                sources[key]=value;
            }
            var versions = jQuery("#versions");
            versions.parent().append('<span id="source"></span>');
            versions.find("option").each(function(){
                var option = jQuery(this);
                self.setOptionTitle(sources,option);
            });
            self.updateSource();
            if ( self.voffsets != undefined && self.voffsets.length > 0 )
            {
                self.scrollToSelection();
            }
        });
    };
    /**
     * Get the text body of the current version. Highlight any hits
     * @param version the version to display
     */
    this.getTextBody = function( version ) {
        var url = "http://"+window.location.hostname
            +"/formatter/?docid="+docid+"&version1="+version;
        if ( self.voffsets != undefined && self.voffsets.length > 0 )
            url += '&selections='+self.voffsets;
        jQuery.get(url, function(response) {
            self.installCss(response);
            jQuery("#body").contents().remove();
            if ( self.message != null )
            {
                jQuery("#body").append('<p id="temp-message">'+self.message+'</p>');
                window.setTimeout('jQuery("#temp-message").remove()', 10000);
            }
            jQuery("#body").append(response);
            self.getVersionMetadata();
            if ( jQuery("#ratings").children().length == 0 )
                self.ratings = new ratings(self.docid,self.userdata);
            jQuery("#"+self.target).css("visibility","visible");
        });
    };
    /**
     * Convert the mvd-positions to version-specific positions
     * @param version the version to get voffsets for
     */
    this.getVOffsets = function( first ) {
        if ( self.selections != undefined && self.selections.length > 0 )
        {
            var url = "http://"+window.location.hostname
                +"/search/voffsets?docid="+docid+"&version1="+first;
            url += '&selections='+self.selections;
            jQuery.get(url, function(offsets) {
                self.voffsets = self.toList(offsets);
                self.getTextBody( first );
            });
        }
        else
            self.getTextBody( first );
    };
    /**
     * Install the dropdown version list
     */
    this.installDropdown = function() {
        var url = "http://"+window.location.hostname
            +"/formatter/list?docid="+this.docid+"&listid=versions";
        if ( this.version1 != undefined && this.version1.length>0 )
            url += "&version1="+this.version1;
        jQuery.get(url, function(responseText) {
            var l = jQuery("#list");
            l.append( responseText );
            // install version dropdown handler
            jQuery("#versions").change(function(){
                var val = jQuery("#versions").val();
                self.getVOffsets( val );
            });
            var first = self.getSelectedOption(responseText);
            self.getVOffsets(first);
            self.updateSource();
        });
    };
    // install boilerplate text
    jQuery("#"+this.target).replaceWith('<div id="list">'
        +'<div id="ratings"></div></div>'
        +'<div id="body"></div>');
    // start the ball rolling...
    this.installDropdown();
}
function get_one_param( params, name )
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
function getMVDArgs( scrName )
{
    var params = new Object ();
    var module_params = jQuery("#mvdsingle_params").val();
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
    if ( !('mod-target' in params) )
    {
        if ( 'target' in params )
            params['mod-target'] = params['target'];
        else
            params['mod-target'] = 'content';
    }
    if ( !('udata' in params) )
    {
        var tabs_params = jQuery("#tabs_params").val();
        if ( tabs_params != undefined && tabs_params.length>0 )
            params['udata'] = get_one_param(tabs_params,'udata');
    }
    return params;
}
/* main entry point - gets executed when the page is loaded */
jQuery(function(){
    var params = getMVDArgs('mvdsingle');
    var t = jQuery("#"+params['mod-target']).css("visibility","hidden");
    var viewer = new mvdsingle(params['mod-target'],params['docid'], 
        params['version1'],params['selections'],null,params['udata']);
}); 
