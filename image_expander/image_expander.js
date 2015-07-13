jQuery( document ).ready(function() {
    jQuery('img[alt="expandable"]').click(function(e){
        var old_src = jQuery(e.target).attr("src");
        var bare_file = old_src.substr(0,old_src.indexOf("."));
        var suffix = old_src.substr(old_src.indexOf("."));
        var large_file = bare_file+"-large"+suffix;
        jQuery("body").append('<div id="enlarged"><img src="'+large_file+'"></div>');
        jQuery("#enlarged").click(function(evt){
            if ( evt.target.tagName == 'IMG' )
                jQuery(evt.target).parent().remove();
            else
                jQuery(evt.target).remove();
        });
    });
});

