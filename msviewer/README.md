## ms-viewer

The idea for MS-viewer is to view manuscripts in a book-like two-page 
spread, even though the images are only page-by page. In manuscripts you 
also often have some kind of page-numbering that is full of errors, so 
you need some way to overcome that and work out which images are recto 
and which are verso. Also, sometimes, you find full-page spreads, so you 
have three page orientation types.

The /pages/anthology service provides the page metadata in the following 
format:

{
	"docid": "english/harpur/B78",
	"specials": [
        "alternating": true,
	{"src":"00000001.jpg","n":"front cover"},
	{"src":"00000002.jpg","n":"inside front cover"},
	{"src":"00000003.jpg","n":"1a"},
	{"src":"00000142.jpg","o":"c","n":"138a-139a"},
	{"src":"00000143.jpg","n":"138aa","o":"v"},
	{"src":"00000145.jpg","n":"140a","o":"v"},
	{"src":"00000168.jpg","n":"162aa","o":"r"},
	{"src":"00000169.jpg","n":"i","o":"v"},
	{"src":"00000174.jpg","n":"1b","o":"r"}
]}

## Explanation of the format
The docid is the identifier that is passed to the pages/anthology service.

If the alternating property is true this means that recto and verso 
alternate. If false, the previous side is copied into subsequent pages 
not otherwise sepcified. The false value is useful when only recto pages 
are used.

The specials array lists overrides to the default behaviour, which is to 
consider all odd-numbered pages as rectos and even numbered ones as 
versos. If an override specifies an even-numbered page as a recto and 
alternating is true then the next page will be verso, even though it is 
odd.

The src attribute specifies the actual name of the image file in the 
directory /corpix/english/harpur/B78, for the docid english/harpur/B78.

The n-attribute specifies the page's name, which will be displayed in 
the ms-viewer. For subsequent pages names ending in letters will have 
their numbers incremented, not the alphabetic suffix. e.g. the next page 
after 12a is 13a.

The o-attribute can take the values 'r', 'v' or 'c' (full-page spreads).

For each override subsequent pages are numbered according to the rules 
described above, until another override overrides it.

In this way all the pages can be compactly specified by only listing 
exceptions.
