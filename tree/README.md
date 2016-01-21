## Tree
Visualise an MVD using a phylogenetic tree. Several options are available:

* treegrows: horizonal or vertical
* treestyle: one of phenogram (angular branches), cladogram (square 
branches), curvogram (curved branches), eurogram (straight then 
angular), swoopogram (curved more at each end otherwise curved), circular 
(displays a circular tree with straight or circular branches).
* usebranchlengths: true or false. This adjusts branch lengths based on 
edit distance. Not very useful unless all versions are substantially 
different. Closely related versions tend to collide.
* ancnodes: controls how branches are anchored to their parents. May be: 
weighted, centered, inner or vshaped (crashes). Inner is interesting but 
weighted is probably more useful.
