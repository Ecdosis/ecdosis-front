## Tabs: a container for other modules
Tabs is a lightweight version of the jQuery UI Tabs tool. But unlike 
that tool there is not a bewildering array of different styles and 
themes to choose from. Instead it is lean, mean and easy to understand. 
Tabs displays a simple menubar at the top of its display area and below 
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
Druapl settings. .htaccess can also be set to translate direct calls to 
the module and docid (without an invocation of tabs) into a call to 
tabs. An example for mvdsingle is:

    RewriteRule ^mvdsingle?(.*)$ /harpur/tabs?$1module=mvdsingle&tabset=view [R=301,L,QSA]
 

### Customising embedded tab-modules
The modules must be written so that they take a 'target' parameter. 
This will be set to 'tab-content' by Tabs, which itself uses the 
standard Drupal 'content' element to embed itself. The url parameters 
used to invoke tabs are divided into two sets: those specific to the 
currently selected module and those specific to the tabs module. Both 
sets of parameters are stored in hidden input elements with the ids 
'tabs_params', and '&lt;module_name&gt;_params'. So the tree module 
specific params would be stored under tree_params.

If the user clicks on a new tab, these parameters are used to compose a 
url, updated with the new module's name.

If the same module is resubmitted due to a change in its settings, the 
module-specific parameters are retrieved, updated with new values, and 
a new url is composed that will pass through the tabs module back to 
the same module.

### Order of execution
The usual read_args function, which used to read "arguments" to 
javascript invocations by scanning the HTML doesn't work with tabs, 
since the tabs module must already be installed when the module 
embedded in it is installed. Using a script-tag with arguments only 
works for one level, not two. And arguments to scripts can't be used if 
scripts are installed via drupal_add_js. So the solution adopted here is
to use hiddeninput elements to store the parameters
for each embedded module and also for tabs itself.

The Tabs module first saves its own parameters by adding a script to 
the head section of the page before it is fully loaded (via 
tabs_preprocess_page). It then embeds itself, then the parameters for 
the current module and finally the embedded module's script. This 
ensures the correct order of execution. It does, however, mean that the 
entire page will reload every time the user clicks on a new tab, 
although the delay is imperceptible.

### Docid

The docid is saved separetly, and must be read in by each module (if 
not provided via the url) and added to its own parameters. This is 
because it is shared and would otherwise get out of sync between tab 
modules.

### Tabsets

The tabs and modules for a particular instance of tabs can be set by 
configuring the tabs module in Drupal. The key is the name of the 
tabset and the specified parameters will be added to a url invocation 
of tabs with the parameter tabset=&lt;key&gt;. If a module belonging to 
a particular tabset is invoked without its corresponding tabset 
parameter, this will be added automatically by the tabs module. This 
allows modules to have no knowledge of which tabset they belong to.

The Drupal settings for each tabset are in the form of a list of URL 
arguments, each separated by &amp;. Three keys are recognised as follows:

1. tabs: a comma-separated list of tab-names, with spaces encoded as %20. 
The first word will be capitalised.
2. modules: a comma-separated list of module names, which must be installed
in Drupal, and which must have a js directory containing a script called 
[module-name].js. Modules may take an argument, which will be passed to the
module when it is invoked. The argument is introduced by %3F (?) and the 
equals sign must be encoded as %3D.
3. tabopt: a boolean that if false indicates that it should not enable an 
optional main menu item with the id optional-tab. If true it will make that 
item visible. The item must already be defined in the Drupal menu.
