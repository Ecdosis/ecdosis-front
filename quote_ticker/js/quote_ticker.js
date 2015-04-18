(function ($) {
$(document).ready(function() {
var element = $('div.item-list li'),
    length = element.length,
    current = Math.floor(Math.random()*(length)),
    timeout = 10000,
    timer=undefined;
function changeSlide() {
    element.eq(current).fadeOut(300, function(){
    current++;
    if (current == length){
            current = 0;
        }
        element.eq(current).fadeIn(300);
    });
    timer = setTimeout(changeSlide, timeout);
}
element.hide();
element.eq(current).show();
timer = setTimeout(changeSlide, timeout);
$('#tick-left').click( function(e) {
    clearTimeout( timer );
    element.eq(current).hide();
    if ( current == 0 )
        current = length-1;
    else
        current--;
    element.eq(current).fadeIn(300);
    timer = setTimeout(changeSlide, 10000);
});
$('#tick-right').click( function(e) {
    clearTimeout( timer );
    element.eq(current).hide();
	if ( current < length-1 )
	    current++;
	else
	    current = 0;
    element.eq(current).fadeIn(300);
    timer = setTimeout(changeSlide, 10000);
});
$('#block-quote-ticker-quote-ticker').load( function() {
    $this.fadeout("slow");
}); // end of block-ticker load
}); // end of jquery ready function
})(jQuery); // end of dollar namespace
