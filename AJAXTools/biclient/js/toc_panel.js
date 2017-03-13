
/// <summary>
/// TableOfContent (TOC) panel on the left side of main page
/// </summary>
function TocPanel() {
  this.frame = top.frames.toc;
}

/// <summary>
/// The method is called when a node in the panel is selected
/// </summary>
TocPanel.prototype.onSelect = function(tname) {
  var grid = ic().grid;
  if (grid && grid.tname == tname) {
    return;
  }
  ic().details.clear();
  ic().grid = new GridPanel(tname);
}

