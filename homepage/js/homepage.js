(function ($) {
$(document).ready(function() {
    $('#left-home').cycle({
		fx: 'fade',
        timeout: 24000,
        random: 1
	});
    $('#right-home').cycle({
		fx: 'fade',
        timeout: 16000,
        random: 1 
	});
});
})(jQuery); // end of dollar namespace
