
var GridColors =
{
  SEARCH_BG: "#a0ddfe",
  SEARCH_FOCUS_BG: "#ffffff",
  EVEN_ROW_BG: "#eeeeee",
  ODD_ROW_BG: "#ffffff",
  SELECTED_ROW_BG: "#ffff82"
}

var LockCellWidth = 1;

/// <summary>
/// Defines a column in the grid shown in the grid panel
/// </summary>
function GridColumn(pname, title, width, sort_order) {
  this.property = pname;
  this.title = title;
  this.width = width;
  this.sort_order = ( sort_order == undefined || sort_order == null ) ? 999999 : sort_order;
}

/// <summary>
/// Grid panel that shows items of the specified type. The class could be used either in the
/// main grid panel or in, let's say, search dialog.
/// </summary>
function GridPanel(tname, window, table, selectCallback) {
  this.tname = tname;

  this.frame = (window ? window : top.frames.grid);
  this.table = (table ? table : this.frame.document.getElementById("table_items"));
  this.selectCallback = selectCallback;

  this.columns = new Array();
  if (tname) {
    this.removeTable();
    this.createTable();

    // Now asynchronously load the corresponding form in anticipation
    // of rendering 'details' form
    this.loadDefaultForm_private();
  }
  this.selected_row = null;
}

/// <summary>
/// Removes grid rows starting with the specified row.
/// </summary>
/// <param name="start_row">Delete from this row till the end. If undefined then all rows are deleted.</param>
GridPanel.prototype.removeTable = function(start_row) {
  if (!start_row)
    start_row = 0;
  var rcount = this.table.rows.length;
  for (var i = start_row; i < rcount; i++) {
    this.table.deleteRow(-1);
  }
}

/// <summary>
/// Create the table and populates it with items found in the database.
/// NOTE: alternative implementation could be - just create header and search
///       row and populate only on "Run Search" button click. Another option (probably the
///       best one): automatically populated only when the corresponding flag on the item type
///       is set; otherwise populate only on "Run Search" click.
/// </summary>
GridPanel.prototype.createTable = function() {
  this.createTableHeaders_private();
  this.createTableSearch_private();
  this.createTableRows_private();

  // Append new and dirty items to the end of the search result
  this.appendNewAndDirtyItems_private();
}

/// <summary>
/// Populate table based on the search criteria set in the search row.
/// </summary>
GridPanel.prototype.refreshTable = function() {
  if (!this.tname)
    return;

  // Clear details panel only if it's main grid.
  if (!this.selectCallback) {
    ic().details.clear();
  }
  
  this.selected_row = null;
  this.removeTable(2);
  this.createTableRows_private();

  // Append new and dirty items to the end of the search result
  this.appendNewAndDirtyItems_private();
}

/// <summary>
/// Create new item, add it to the grid and show it in the 'details' panel.
/// </summary>
GridPanel.prototype.newItem = function() {
  if (!this.tname)
    return;

  var d = new Date();
  var id = this.tname + "_" + d.toString();

  var aml = "<Item type='" + this.tname + "' id='" + id + "' action='add' isNew='1'>";
  aml += "<" + this.columns[1].property + ">[New " + this.tname + "]</" + this.columns[1].property + ">";
  aml += "<locked_by_id>" + ic().HttpConnector.userId + "</locked_by_id>";
  aml += "</Item>";

  var item = IomFactory().createItem(aml);
  var row_indx = this.table.rows.length;
  this.createTableRow_private(item, row_indx - 2);
  ic().itemCache.insert(item);
  this.showItem_private(id, row_indx);
}

/// <summary>
/// Called when a search cell got focus.
/// </summary>
GridPanel.prototype.onSelectGetFocus = function(input) {
  input.style.backgroundColor = GridColors.SEARCH_FOCUS_BG;
}

/// <summary>
/// Called when a search cell lost focus.
/// </summary>
GridPanel.prototype.onSelectLoseFocus = function(input) {
  input.style.backgroundColor = GridColors.SEARCH_BG;
}

/// <summary>
/// Update lock status column
/// </summary>
/// <param name="status">0 - not locked; 1 - locked by me; 2 - locked by someone; 3 - new item</param>
GridPanel.prototype.updateLockStatus = function(status, rindx) {
  if (rindx == undefined) {
    rindx = (this.selected_row) ? this.selected_row : this.table.rows.length - 1;
  }
  var lcell = this.table.rows[rindx].cells[0];
  if (status == 2)
    lcell.style.color = "red";
  lcell.style.width = this.columns[0].width;
  lcell.style.textAlign = "center";
  lcell.style.fontWeight = "bold";
  lcell.innerHTML = (status == 0) ? "" : ((status == 3) ? "N" : "L");
}

/// <summary>
/// Update the specified column of the currently selected row in the grid.
/// </summary>
/// <param name="item_id">ID of the item being updated</param>
/// <param name="pname">Name of the property that was changed</param>
/// <param name="val">New property value</param>
GridPanel.prototype.updateColumn = function(item_id, pname, val) {
  if (!this.selected_row)
    return;

  for (var i = 1; i < this.columns.length; i++) {
    var column = this.columns[i];
    if (column.property == pname) {
      var cell = this.table.rows[this.selected_row].cells[i];
      this.setColumnValue_private(item_id, cell, i, this.selected_row, val)
      return;
    }
  }
}

/// <summary>
/// Update the link for item details.
/// </summary>
/// <param name="item_id">ID of the item that will be shown in the details panel when the link is clicked.</param>
GridPanel.prototype.updateLink = function(item_id) {
  if (!this.selected_row)
    return;

  var cell = this.table.rows[this.selected_row].cells[1];
  var val = (_is_IE_) ? cell.innerText : cell.textContent;
  this.setColumnValue_private(item_id, cell, 1, this.selected_row, val);
}


/// <summary>
/// Update the all columns of the currently selected row in the grid with values from the passed item.
/// </summary>
/// <param name="item">Updated item.</param>
GridPanel.prototype.updateRow = function(item) {
  var item_id = item.getId();
  for (var i = 1; i < this.columns.length; i++) {
    var pname = this.columns[i].property;
    this.updateColumn(item_id, pname, item.getProperty(pname, ""));
  }
}

/// <summary>
/// Remove the currently selected row in the grid.
/// </summary>
GridPanel.prototype.removeRow = function() {
  if (!this.selected_row)
    return;

  this.table.deleteRow(this.selected_row);

  // Fix links and row background below the deleted row
  for (var i = this.selected_row; i < this.table.rows.length; i++) {
    var row = this.table.rows[i];
    
    // Fix background
    if (i % 2 == 1)
      row.style.backgroundColor = GridColors.EVEN_ROW_BG;
    else
      row.style.backgroundColor = GridColors.ODD_ROW_BG;

    // Fix link
    var lcell = row.cells[1];
    var str = lcell.innerHTML;
    var start = str.indexOf(",");
    var end = str.indexOf(")", start);
    var new_str = str.substring(0, start + 1) + i + str.substr(end);
    lcell.innerHTML = new_str;
  }

  this.selected_row = null;
}

// ============== Private methods that are NOT supposed to be called outside of the class =========================

GridPanel.prototype.appendNewAndDirtyItems_private = function() {
  var all_items = ic().itemCache.getAllItems();
  for (var i in all_items) {
    var item = all_items[i];
    if (item.getType() == this.tname && (item.getAttribute("isNew") == 1 || item.getAttribute("isDirty") == 1)) {
      this.createTableRow_private(item, this.table.rows.length - 2);
    }
  }
}

GridPanel.prototype.createTableHeaders_private = function() {
  function sort_columns(a, b) {
    return a.sort_order - b.sort_order;
  }

  var new_row = this.table.insertRow(-1);
  new_row.className = "header_row";

  var itype = ic().metaCache.getItemType(this.tname);
  if (itype.isError()) {
    ic().errorDialog(itype.getErrorString(), itype.getErrorDetails());
  }
  else {
    var props = itype.getRelationships("Property");
    var pcount = props.getItemCount();
    var showProps = new Array();
    // Reserve for 'locked_by_id'
    showProps[0] = new Object;
    for (var j = 0; j < pcount; j++) {
      var prop = props.getItemByIndex(j);
      if (prop.getProperty("name") == "locked_by_id") {
        showProps[0] = prop;
      }
      else if (prop.getProperty("is_hidden") == 0)
        showProps[showProps.length] = prop;
    }

    this.columns[0] = new GridColumn("locked_by_id", "", LockCellWidth + "%", 0);
    var width = (100-LockCellWidth) / (showProps.length - 1);
    for (var i = 1; i < showProps.length; i++) {
      var prop = showProps[i];
      this.columns[this.columns.length] = new GridColumn(prop.getProperty("name"), prop.getProperty("label"), width + "%", prop.getProperty("sort_order"));
    }
    this.columns.sort(sort_columns);
    for (var k = 0; k < this.columns.length; k++) {
      var column = this.columns[k];
      var new_cell = new_row.insertCell(k);
      new_cell.style.width = column.width;
      new_cell.innerHTML = column.title;
    }
  }
}

GridPanel.prototype.createTableSearch_private = function() {
  var new_row = this.table.insertRow(-1);

  // First column is lock status
  var new_cell = new_row.insertCell(0);
  new_cell.style.width = this.columns[0].width;
  new_cell.className = "search_row";
  new_cell.innerHTML = "&nbsp;";

  // The rest of columns
  for (var k = 1; k < this.columns.length; k++) {
    var column = this.columns[k];
    new_cell = new_row.insertCell(k);
    new_cell.style.width = column.width;
    new_cell.innerHTML = "<input class='search_row' style='width: 100%;' type='text' id='search_" + column.property + "' onfocus='javascript:ic().grid.onSelectGetFocus(this)' onblur='javascript:ic().grid.onSelectLoseFocus(this)'/>";
  }
}

GridPanel.prototype.createTableRows_private = function() {
  var sel = "locked_by_id";
  for (var i = 0; i < this.columns.length; i++) {
    sel += ", " + this.columns[i].property;
  }

  var search_criteria = this.buildSearchCriteria_private();
  var aml = "<Item type='" + this.tname + "' action='get' select='" + sel;
  if (search_criteria)
    aml += "'>" + search_criteria + "</Item>";
  else
    aml += "'/>";
  var req = IomFactory().createItem(aml);
  var response = req.apply(ic().HttpConnector);
  if (response.isError()) {
    if (response.getErrorCode() == 0)
      return;
    else {
      ic().errorDialog(response.getErrorString(), response.getErrorDetails());
      return;
    }
  }

  for (var j = 0; j < response.getItemCount(); j++) {
    var item = response.getItemByIndex(j);
    this.createTableRow_private(item, j);
  }
}

GridPanel.prototype.createTableRow_private = function(item, j) {
  var new_row = this.table.insertRow(-1);
  new_row.className = "item_row";
  if (j % 2 == 1)
    new_row.style.backgroundColor = GridColors.EVEN_ROW_BG;
  else
    new_row.style.backgroundColor = GridColors.ODD_ROW_BG;

  // First 2 rows are header and search, so pass j+2 as row index
  var row_indx = j + 2;
  
  // First column - lock status
  var new_cell = new_row.insertCell(0);
  var lock_status;
  if (item.getAttribute("isNew") == 1) {
    lock_status = 3;
  }
  else {
    lock_status = item.getLockStatus();
  }
  this.updateLockStatus(lock_status, row_indx);

  // Then the rest of properties
  for (var k = 1; k < this.columns.length; k++) {
    var column = this.columns[k];
    new_cell = new_row.insertCell(k);
    new_cell.style.width = column.width;
    this.setColumnValue_private(item.getId(), new_cell, k, row_indx, item.getProperty(column.property, ""));
  }
}

GridPanel.prototype.setColumnValue_private = function(item_id, cell, col_indx, row_indx, val) {
  if (col_indx == 1) {
    if (this.selectCallback) {
      cell.innerHTML = "<a href='javascript:" + this.selectCallback + "(\"" + item_id + "\", \"" + val + "\")'>" + val + "</a>";
    }
    else {
      cell.innerHTML = "<a href='javascript:ic().grid.showItem_private(\"" + item_id + "\", " + row_indx + ")'>" + val + "</a>";
    }
  }
  else {
    cell.innerHTML = val;
  }
}

GridPanel.prototype.showItem_private = function(id, row) {
  if (this.selected_row == row)
    return;

  if (this.selected_row != null) {
    var prev_row = this.table.rows[this.selected_row];
    if (this.selected_row % 2 == 1)
      prev_row.style.backgroundColor = GridColors.EVEN_ROW_BG;
    else
      prev_row.style.backgroundColor = GridColors.ODD_ROW_BG;
  }

  this.selected_row = row;
  var srow = this.table.rows[this.selected_row];
  srow.style.backgroundColor = GridColors.SELECTED_ROW_BG;

  ic().details.showItem(id);
}

GridPanel.prototype.buildSearchCriteria_private = function() {
  var search_row = this.table.rows[1];
  var search_criteria = "";
  for (var i = 1; i < this.columns.length; i++) {
    var cell = search_row.cells[i];
    var cval = cell.firstChild.value;
    if (cval.length > 0) {
      search_criteria += "<" + this.columns[i].property;
      if (cval.indexOf("*") >= 0)
        search_criteria += " condition='like'";
      search_criteria += ">" + cval + "</" + this.columns[i].property + ">";
    }
  }

  return search_criteria;
}

// In standard Innovator client the form is selected based on the
// following ordered set of rules:
// 1) Test what forms are available for the identity 
//    (Any form assigned to an Identity that the user belongs to takes precidense over the world identity) 
// 2) Test Classification of the Item against any available Class forms. Class should be tested for exact match.  
//    If there is no exact match between Item classification and form class, use root class forms. 
//    (If classification of the item is null, root class form is used.) 
// 3) Test operation against the form to be used ("edit", "print", etc.)
//    (If no operation specific forms for class are present, use default form for class.  
//    If no default for the class, then test against root form for the operation.  
//    If no root form for the operation, then default for root.)
// 4) If there is still more than 1 form at this point use the form with the lowest Display Priority value.
//
// For simplicity we apply much more simple rule: "default" view with the lowest priority. That might be not
// OK for general case as the item type might not even have a "default" view; but for the purposes of the
// sample it's fine as we show only "Document" and "Part" item types and they both have "default" view.
GridPanel.prototype.getDefaultFormId_private = function() {
  var it = ic().metaCache.getItemType(this.tname);
  var views = it.getRelationships("View");
  var dviews = new Array();
  for (var i = 0; i < views.getItemCount(); i++) {
    var view = views.getItemByIndex(i);
    if (view.getProperty("type") == "default") {
      // Add to collection of default views
      dviews[dviews.length] = view;
    }
  }
  if (dviews.length == 0)
    return null;

  var dview = dviews[0];
  var priority = dview.getProperty("display_priority");
  for (var j = 1; j < dviews.length; j++) {
    var p = dviews[j].getProperty("display_priority");
    if (p < priority)
      dview = dviews[j];
  }
  return dview.getProperty("related_id");
}

// This is a sample of using asynchronous requests: the method is called
// when a particular item type is selected in TOC. After the type is loaded
// its default form is loaded asynchronously in anticipation that the user
// might want to see a details of an item shown in the grid. Note also
// that the form is loaded from server only once after which is cached in the
// meta-data cache from where it's returned on the next request without trip
// to the server. 
GridPanel.prototype.loadDefaultForm_private = function() {
  var fid = this.getDefaultFormId_private();
  if (fid) {
    // Load asynchronously the form
    ic().metaCache.getForm(fid, true);
  }
}

