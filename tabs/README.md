## Tabs: a container for other modules
Tabs is a lightweight version of the jQuery UI Tabs tool. But unlike 
that tool there is not a bewildering array of different styles and 
themes to choose from. Instead it is lean, mean and easy to understand. 
Tabs displays a simple menubar at the top of its diplay area and below 
that it embeds whatever modules are recommended for it. The parameters for 
Tabs are:

* tabset -- the name of the set of modules to embed. This key is stored as a 
setting in Drupal, and provides url parameters specific to that tabset. 
* module -- the currently selected module (and hence the corresponding tab)
* docid -- the document to display in each of the tabs
* modules -- a comma-separated list of Drupal modules 
* tabs -- a comma-separated list of tab names, the same length as modules 

Usually only the first three parameters are needed, or just module and 
docid, since the other parameters are supplied automatically from the 
Druapl settings.

### Customising embedded tab-modules
The modules must be written so that they take a 'target' parameter. This 
will be set to 'tab-content' by Tabs, which itself uses the standard 
Drupal 'content' element to embed itself. The url parameters used to 
invoke tabs are divided into two sets: those specific to the currently 
selected module and those specific to the tabs module. Both sets of 
parameters are stored in browser local storage under the key 
'tabs_params', and '<module_name>_params'. So the tree module specific 
params would be stored under tree_params. 

If the user clicks on a new 
tab, these parameters are used to compose a url, updated with the new 
module's name.

If the same module is resubmitted due to a change in its settings, the 
module-specific parameterts are retrieved, updated with new values, and 
a new url composed that will pass through the tabs module back to the 
same module.

The usual read_args function, which used to read "arguments" to 
javascript invocations by scanning the HTML doesn't work since the 
scripts must be run before the page in ready. Since drupal_add_js does 
not pass parameters in this way another mechanism had to be devised, 
which is the use of local storage described above. The mvdsingle, tree 
and compare modules have been adjusted to use this form of parameter 
storage.

### Order of execution
The Tabs module first saves its own parameters to browser memory by adding a 
script to the head section of the page before it is fully loaded (via 
tabs_preprocess_page). It then embeds itself, then the parameters for the 
current module and finally the embedded module's script. This ensures the 
correct order of execution. It does, however, mean that the entire page will 
reload every time the user clicks on a new tab. But the delay is 
imperceptible.

### Docid
The docid is saved with the tabs_params, and must be read in separately by 
each module and added to its own parameters. This is because it is shared and
would otherwise get out of sync between tab modules.

### Tabsets
The tabs and modules for a particular instance of tabs can be set by 
configuring the tabs module in Drupal. The key is the name of the tabset 
and the specified parametes will be added to a url invocation of tabs 
with the parameter tabset=<key>. If a module belonging to a particular 
tabset is provided, but not the tabset parameter, this is added 
automatically. This allows modules to have no knowledge of which tabset 
they belong to.
