## Tabs: a container for other modules
Tabs is a lightweight version of the jQuery UI Tabs tool. But unlike that 
tool there are not a myriad of different styles and themes to choose from. 
But it is easy to understand. Tabs displays a simple menubar at the top of 
its diplay area and below it embeds whatever modules are recommended for it. 
The parameters for Tabs are:

* modules -- a comma-separated list of Drupal modules 
* tabs -- a comma-separated list of tab names which must be the same length 
as modules
* module -- the currently selected module (and its tab)
* docid -- the document to display in each of the tabs

### Customising embedded tab-modules
The modules must be written so that they take a 'target' parameter. This 
will be set to 'tab-content' by Tabs, which itself uses the standard Drupal 
'content' element to embed itself. Module-specific parameters are passed in 
the URL and if not recognised as Tabs parameters, will be passed on to the 
module currently being invoked. The tabs parameters and the module 
parameters are stored in browser local storage under the key 'tabs_params', 
and the module parameters under '<module_name>_params'. So for the tree 
module that would be tree_params. The parameters stored in browser local 
memory are read out when clicking on a new tab, and passed in via a URL, so 
allowing the module to function normally. However, the module will have to 
read the values from browser local storage in most cases, since the method 
of invocation forbids passing parameters in the URL (drupal_add_js). The 
read_args function for most Ecdosis modules has been modified to cater for 
this. Examples can be found in tree, compare and mvdsingle.

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
