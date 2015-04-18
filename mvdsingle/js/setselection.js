var tags = {"a":true,"abbr":true,"acronym":true,"address":true,"article":true,"b":true,"bdi":true,"bdo":true,"big":true,"blockquote":true,"body":true,
"caption":true,"center":true,"cite":true,"code":true,"datalist":true,"dd":true,"del":true,"details":true,"dfn":true,"dir":true,"div":true,
"dl":true,"dt":true,"em":true,"fieldset":true,"figcaption":true,"font":true,"footer":true,"form":true,"frame":true,"frameset":true,
"h1":true,"h2":true,"h3":true,"h4":true,"h5":true,"h6":true,"header":true,"hgroup":true,"i":true,"iframe":true,"ins":true,"kbd":true,
"label":true,"legend":true,"li":true,"main":true,"mark":true,"meter":true,"ol":true,"p":true,"pre":true,"q":true,"s":true,"samp":true,"section":true,
"small":true,"span":true,"strike":true,"strong":true,"sub":true,"summary":true,"sup":true,"table":true,"tbody":true,"td":true,
"textarea":true,"tfoot":true,"th":true,"thead":true,"time":true,"tr":true,"tt":true,"u":true,"ul":true,"var":true,"wbr":true};

function scrollToSelection( sel )
{
    var node = document.createElement("span");
    sel.surroundContents(node);
    var scrollDist = node.offsetTop - (window.innerHeight+node.offsetHeight)/2;
    if ( scrollDist > 0 )
        window.scrollBy(0,scrollDist);
}
function setSelection(elem,at,len)
{
    var selection = new Object();
    selection.at = at;
    selection.len = len;
    selection.pos = 0;
    selection.r = null;
    selection.last = null;
    selection.traverse = function(elem)
    {
        if (elem.hasChildNodes()) 
        {      
          var child = elem.firstChild;      
          while ( child != undefined && child != null && this.len > 0 )
          {
              if ( child.nodeType == 8 && child.textContent != undefined )
              {
                  var parts = child.textContent.split(":");
                  if ( parts.length == 2 && parts[0] == "aese" )
                      this.pos = parseInt(parts[1]);
                    // else this file has not been marked up with aese markers
              }
              else if ( child.nodeType == 1 )
              {
                  if ( tags[child.tagName.toLowerCase()]==true )
                      this.traverse(child);
              }
              else if ( child.nodeType == 3 || child.nodeType == 6 )
              {
                  if ( this.pos+child.textContent.length > this.at )
                  {
                      this.last = child;
                      if ( this.r == null )
                      {
                          this.r = rangy.createRange();
                          this.r.setStart(child,this.at-this.pos);
                          if ( this.pos+child.textContent.length > this.at+this.len )
                          {
                              this.r.setEnd(child,(this.at+this.len)-this.pos);
                              this.len = 0;
                          }
                          else
                          {
                              var rest = child.textContent.length-(this.at-this.pos);
                              this.len -= rest;
                              this.at += rest;
                              this.pos += child.textContent.length;
                          }
                      }
                      else if ( child.textContent.length >= this.len )
                      {
                          this.r.setEnd(child,this.len);
                          this.len = 0;
                      }
                      else
                      {
                          this.at += child.textContent.length;
                          this.len -= child.textContent.length;
                          this.pos += child.textContent.length;
                      }
                  }
                  else
                      this.pos += child.textContent.length;
              }
              child = child.nextSibling; 
          }
          // check for overrun
          if ( this.len > 0 && this.r != null && this.last != null )
              this.r.setEnd(this.last,this.last.textContent.length);
        }
    };
    selection.traverse(elem);
    rangy.getSelection().removeAllRanges();
    rangy.getSelection().addRange(selection.r);
    scrollToSelection(selection.r);
}
