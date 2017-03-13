
var ItemMode =
{
  VIEW: 0,
  EDIT: 1
}

var ItemStatus = 
{
  OLD: 1,
  NEW: 2,
  DIRTY: 3
}

/// <summary>
/// Bottom-right panel that shows details of a particular item.
/// </summary>
function DetailsPanel() {
  this.frame = top.frames.details;
  this.form_table = this.frame.document.getElementById("item_details");
  this.toolbar_table = this.frame.document.getElementById("item_toolbar");
  this.separator = this.frame.document.getElementById("item_tb_separator");
  this.item_id = null;
  this.item_mode = ItemMode.VIEW;
  this.item_status = ItemStatus.OLD;
  this.shown_props = new Array(); 
}

/// <summary>
/// Clears the panel.
/// </summary>
DetailsPanel.prototype.clear = function() {
  this.cleanToolbar_private();

  this.separator.style.display = "none";
  rcount = this.form_table.rows.length;
  for (var i = 0; i < rcount; i++) {
    this.form_table.deleteRow(-1);
  }

  this.item_id = null;
  this.item_mode = ItemMode.VIEW;
  this.item_status = ItemStatus.OLD;
  this.shown_props = new Array();
}

/// <summary>
/// Shows the specified item in the panel.
/// </summary>
DetailsPanel.prototype.showItem = function(id) {
  // Number of columns on the panel
  var COLUMNS = 3;

  if (this.item_id == id)
    return;

  this.clear();

  this.item_id = id;
  var item = ic().itemCache.getItem(id);
  if (item) {
    var is_dirty = item.getAttribute("isDirty", null);
    if (is_dirty)
      this.item_status = ItemStatus.DIRTY;
    else {
      var is_new = item.getAttribute("isNew", null);
      if (is_new)
        this.item_status = ItemStatus.NEW;
    }
    this.item_mode = ItemMode.EDIT;
  }
  else {
    item = this.fetchItemFromServer_private();
    if (item.isError()) {
      if (item.getErrorCode() == 0)
        return;
      else {
        ic().errorDialog(item.getErrorString(), item.getErrorDetails());
        return;
      }
    }

    var lstatus = item.getLockStatus();
    if (lstatus == 1)
      ic().itemCache.insert(item);

    this.item_mode = (lstatus == 1) ? ItemMode.EDIT : ItemMode.VIEW;
  }

  var itdef = ic().metaCache.getItemType(item.getType());
  this.updateToolbar_private(itdef, lstatus);

  var fields = this.getVisibleFields_private();

  var tbl_row;
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    // Insert new row
    if ((i % COLUMNS) == 0)
      tbl_row = this.form_table.insertRow(-1);

    var prop_id = field.getProperty("propertytype_id", null);
    // Some fields do NOT have corresponding property id. In general the 'Form' is
    // a very specific for standard Innovator client thing; for instance, in many cases
    // field does not references a property, instead the field is populated
    // on some event - e.g. form load, etc. And, of course, all event handlers
    // are specific to the standard Innovator client and can NOT be used here.
    // So, if the field doesn't have a reference to a property id then we try
    // to match field to property by name (seems to be more or less working for
    // 'Part' and 'Document' but it doesn't mean that it'll work for all other
    // types).
    var prop = (prop_id) ? this.getPropertyById_private(itdef, prop_id) : this.getPropertyByName_private(itdef, field.getProperty("name"));
    var cell_indx = i % COLUMNS;
    var pcell = tbl_row.insertCell(cell_indx);
    pcell.className = "medium";
    pcell.style.width = 100 / COLUMNS + "%";
    pcell.innerHTML = this.buildCellContent_private(field, prop, item);
  }

  // For document show document files as well
  if (this.item_mode == ItemMode.VIEW && item.getType() == "Document") {
    this.showFiles_private(item);
  }
}

/// <summary>
/// Show currently shown item in the EDIT mode in the details panel.
/// </summary>
DetailsPanel.prototype.editItem = function() {
  var app = ic();

  var id = this.item_id;
  this.item_id = null;

  var aml = "<Item type='" + app.grid.tname + "' id='" + id + "' action='lock' />";
  var lock_request = IomFactory().createItem(aml);
  var lock_result = lock_request.apply(app.HttpConnector);
  if (lock_result.isError()) {
    app.errorDialog(lock_result.getErrorString());
    return;
  }

  // If lock succeeded it brought back the locked item
  lock_result.setAttribute("action", "update");
  var itdef = app.metaCache.getItemType(app.grid.tname);
  if (itdef.getProperty("is_versionable", "") == 1) {
    lock_result.setProperty("new_version", 0);
  }
  app.itemCache.insert(lock_result);
  app.grid.updateLockStatus(1);
  this.showItem(id);
}

/// <summary>
/// Unlock currently shown item and show it in VIEW mode in the details panel.
/// </summary>
DetailsPanel.prototype.unlockItem = function() {
  var app = ic();

  var id = this.item_id;
  this.item_id = null;

  // Pop up a dialog that warns that changes will be lost
  // TBD: use standard confirm(...) dialog
  if (this.item_mode == ItemStatus.DIRTY) {
    // call dialog; if cancel -> return
  }

  var aml = "<Item type='" + app.grid.tname + "' id='" + id + "' action='unlock'/>";
  var unlock_req = IomFactory().createItem(aml);
  var unlock_result = unlock_req.apply(app.HttpConnector);
  if (unlock_result.isError()) {
    app.errorDialog(unlock_result.getErrorString());
    return;
  }

  app.itemCache.remove(id);
  app.grid.updateLockStatus(0);
  unlock_result.setAttribute("isDirty", null);
  this.item_status = ItemStatus.OLD;
  app.grid.updateRow(unlock_result);
  this.showItem(id);
}

/// <summary>
/// Save currently shown item.
/// </summary>
DetailsPanel.prototype.saveItem = function() {
  var app = ic();
  var item = app.itemCache.getItem(this.item_id);
  // New item has a fake ID so it has to be cleared before sending
  // the request to the server.
  if (this.item_status == ItemStatus.NEW)
    item.setAttribute("id", null);

  // Check that all required properties are set; etc.
  var itdef = app.metaCache.getItemType(item.getType());
  if (!this.validateBeforeSave_private(item, itdef))
    return;

  var result = item.apply(app.HttpConnector);
  if (result.isError()) {
    app.errorDialog(result.getErrorString());
    return;
  }
  else {
    item.setAttribute("isDirty", null);
    item.setAttribute("isNew", null);

    if (this.item_status == ItemStatus.NEW) {
      item = this.replaceCurrentItem_private(item, result);
      app.grid.updateLockStatus(1);
      app.grid.updateRow(item);
    }
    // If item type is versioned than on first save a new version is created,
    // after that we keep modifying the same version
    else if (itdef.getProperty("is_versionable", "") == 1 && item.getProperty("new_version") == 0) {
      item = this.replaceCurrentItem_private(item, result);
    }

    if (this.item_status == ItemStatus.NEW) {
      // Reset id on the class to force re-rendering the details panel
      this.item_id = null;
      this.showItem(item.getId());
    }
    else {
      this.item_status = ItemStatus.OLD;
      this.updateToolbar_private(itdef, 1);
    }

    app.successDialog("Item successfully saved");
  }
}

/// <summary>
/// The callback on any field change. Updates item in memory, toolbar and the grid.
/// </summary>
DetailsPanel.prototype.changeItem = function(control, pname) {
  var item = ic().itemCache.getItem(this.item_id);
  item.setProperty(pname, control.value);
  if (this.item_status != ItemStatus.NEW) {
    item.setAttribute("isDirty", 1);
    this.item_status = ItemStatus.DIRTY;
    var itdef = ic().metaCache.getItemType(item.getType());
    this.updateToolbar_private(itdef, 1);
  }

  ic().grid.updateColumn(this.item_id, pname, control.value);
}

/// <summary>
/// Delete currently shown item. Remove the item from memory and from grid.
/// </summary>
DetailsPanel.prototype.deleteItem = function() {
  if (!confirm("Are you sure you would like to delete the item?"))
    return;

  var app = ic();

  if (this.item_status != ItemStatus.NEW) {
    var aml = "<Item type='" + app.grid.tname + "' id='" + this.item_id + "' action='delete'/>";
    var req = IomFactory().createItem(aml);
    var result = req.apply(app.HttpConnector);
    if (result.isError()) {
      app.errorDialog(result.getErrorString());
      return;
    }
  }

  app.itemCache.remove(this.item_id);
  app.grid.removeRow();
  this.clear();
}

/// <summary>
/// Open search dialog and (if any item is selected) update the shown item and upgate the item in cache.
/// </summary>
DetailsPanel.prototype.openSearchDialog = function(tname, pname) {
  var dargs = new Object();
  dargs["ic"] = ic();
  dargs["type"] = tname;

  var result = showModalDialog("search.htm", dargs, "dialogHeight:560px; dialogWidth:950px; center:yes; resizable:no; scroll:yes; status:no; help:no;");
  if (!result)
    return;

  // Update item in cache
  var item = ic().itemCache.getItem(this.item_id);
  item.setProperty(pname, result.item_id);
  item.setPropertyAttribute(pname, "keyed_name", result.item_key);

  // Update the UI
  var ctrl = this.frame.document.getElementById(pname + "_value");
  ctrl.value = result.item_key;
}

// ===================== Private methods =========================================================

DetailsPanel.prototype.replaceCurrentItem_private = function(old_item, new_item) {
  var app = ic();
  app.itemCache.remove(old_item);
  app.itemCache.insert(new_item);
  this.item_id = new_item.getId();
  new_item.setAttribute("action", "update");
  app.grid.updateLink(this.item_id);

  return new_item;
}

DetailsPanel.prototype.updateToolbar_private = function(itdef, lstatus) {
  this.cleanToolbar_private();

  var row = this.toolbar_table.insertRow(-1);
  var cell;

  var lindx = 0;
  if (this.item_mode == ItemMode.VIEW) {
    // Lock 
    cell = row.insertCell(lindx);
    lindx++;
    if (lstatus == 0 && this.getPermissions_private(itdef, "can_update")) {
      cell.innerHTML = "<a style='font-weight: bold;' href='javascript:ic().details.editItem()'>Edit</a>";
    }
    else {
      cell.style.color = "#cccccc";
      cell.style.fontWeight = "bold";
      cell.innerHTML = "Edit";
    }
  }
  else {
    // Unlock
    if (this.item_status != ItemStatus.NEW) {
      cell = row.insertCell(lindx);
      lindx++;
      cell.innerHTML = "<a style='font-weight: bold;' href='javascript:ic().details.unlockItem()'>Unlock</a>";

      cell = row.insertCell(lindx);
      lindx++;
      cell.innerHTML = "&nbsp;|&nbsp;";
    }

    // Save
    cell = row.insertCell(lindx);
    lindx++;
    if (this.item_status == ItemStatus.DIRTY || this.item_status == ItemStatus.NEW) {
      cell.innerHTML = "<a style='font-weight: bold;' href='javascript:ic().details.saveItem()'>Save</a>";
    }
    else {
      cell.style.color = "#cccccc";
      cell.style.fontWeight = "bold";
      cell.innerHTML = "Save";
    }
  }

  cell = row.insertCell(lindx);
  lindx++;
  cell.innerHTML = "&nbsp;|&nbsp;";

  cell = row.insertCell(lindx);
  if (this.item_status == ItemStatus.NEW || (lstatus != 2 && this.getPermissions_private(itdef, "can_delete"))) {
    cell.innerHTML = "<a style='font-weight: bold;' href='javascript:ic().details.deleteItem()'>Delete</a>";
  }
  else {
    cell.style.color = "#cccccc";
    cell.style.fontWeight = "bold";
    cell.innerHTML = "Delete";
  }

  this.separator.style.display = "";
}

DetailsPanel.prototype.getPermissions_private = function(itdef, access_type) {
  var aml = "<Item id='" + this.item_id + "' typeId='" + itdef.getId() + "' action='getPermissions' access_type='" + access_type + "'/>";
  var request = IomFactory().createItem(aml);
  var response = request.apply(ic().HttpConnector, "ApplyItem");

  return (!response.isError() && response.getAml().indexOf("<Result>1</Result>") >= 0) ? true : false;
}

DetailsPanel.prototype.buildCellContent_private = function(field, prop, item) {
  var pname = (prop) ? prop.getProperty("name") : "[unknown property]";
  if( prop )
    this.shown_props[this.shown_props.length] = pname; 
  
  var req_marker = "";
  if (this.item_mode != ItemMode.VIEW) {
    var is_required = (prop) ? prop.getProperty("is_required") == "1" : false;
    req_marker = (is_required) ? "*&nbsp;" : "";
  }
  var html = "<table style='width:100%;'><tr><td style='width: 30%;'><b>" + req_marker + field.getProperty("label") + "</b></td><td style='width: 70%;'>";
  var val = item.getProperty(pname);
  if (!val)
    val = "";
  else {
    // If it's an ID then show the keyed_name of the referenced item.
    if (/^[0-9a-f]{32}$/i.test(val)) {
      val = item.getPropertyAttribute(pname, "keyed_name", "");
    }
  }

  if (this.item_mode == ItemMode.VIEW) {
    html += val;
  }
  else {
    html += this.createControlForProperty(prop, val);
  }
  html += "</td></tr></table>";

  return html;
}

DetailsPanel.prototype.createControlForProperty = function(prop, val) {
  if (!prop)
    return "";

  var pname = prop.getProperty("name");
  var ptype = prop.getProperty("data_type");
  
  var result = "";

  switch (ptype) {
    case "string":
    case "text":
    case "integer":
    case "float":
    case "decimal":
    case "ml_string":
    case "date":
      result += "<input style='width:90%;' type='text' id='" + pname + "_value' value='" + val + "' onChange='javascript:ic().details.changeItem(this,\"" + pname + "\")'/>";
      break;

    case "boolean":
      result += "<input type='checkbox' id='" + pname + "_value' value='" + val + "' onChange='javascript:ic().details.changeItem(this,\"" + pname + "\")'/>";
      break;

    case "image":
    case "color":
    case "federated":
    case "foreign":
      result += val;
      alert("Property of type '" + ptype + "' is not supported yet");
      break;

    case "md5":
      result += "<input style='width:90%;' type='password' id='" + pname + "_value' value='" + val + "' onChange='javascript:ic().details.changeItem(this,\"" + pname + "\")'/>";
      break;

    case "sequence":
    case "formatted text":
      result += val;
      break;

    case "item":
      var dstype = prop.getPropertyAttribute("data_source", "keyed_name");
      result += "<input style='width:80%;' readonly='true' type='text' id='" + pname + "_value' value='" + val + "' onChange='javascript:ic().details.changeItem(this,\"" + pname + "\")'/>";
      result += "<input style='width: 10%' type='button' value='...' onclick='javascript:ic().details.openSearchDialog(\"" + dstype + "\", \"" + pname + "\")' />";
      break;

    case "list":
    case "filter list":
    case "color list":
    case "mv_list":
      var list_id = prop.getProperty("data_source");
      var list = ic().metaCache.getList(list_id);
      result += "<select style='width:90%;' id='" + pname + "_value' onchange='javascript:ic().details.changeItem(this,\"" + pname + "\")'>";
      var lvals = list.getRelationships("Value");
      for (var i = 0; i < lvals.getItemCount(); i++) {
        var lval = lvals.getItemByIndex(i);
        var lval2 = lval.getProperty("value");
        var selected = (lval2 == val) ? " selected='true'" : "";
        //result += "<option label='" + lval.getProperty("label") + "' value='" + lval2 + "'" + selected + "/>";
        result += "<option value='" + lval2 + "'" + selected + ">" + lval.getProperty("label") + "</option>";
      }
      result += "</select>";
      break;
  }

  return result;
}

DetailsPanel.prototype.getVisibleFields_private = function() {
  var result = new Array();

  // At that point the form must be already loaded - it's done
  // asynchronously when the grid is populated. So here
  // the form definition is just taken from the meta-cache.
  var formdef = ic().metaCache.getForm(ic().grid.getDefaultFormId_private());
  var all_fields = formdef.getRelationships("Body").getItemByIndex(0).getRelationships("Field");
  for (var i = 0; i < all_fields.getItemCount(); i++) {
    var field = all_fields.getItemByIndex(i);
    // Show only fields that are set as 'visible' and that have a label.
    if (field.getProperty("is_visible") == "1" && field.getProperty("label")) {
      result[result.length] = field;
    }
  }
  return result;
}

DetailsPanel.prototype.fetchItemFromServer_private = function() {
  var tname = ic().grid.tname;
  // For documents bring also information about files
  var levels = (tname == "Document") ? " levels='2'" : "";
  var cpath = (tname == "Document") ? " config_path='Document File'" : "";
  var aml = "<Item type='" + tname + "' action='get' id='" + this.item_id + "'" + levels + cpath + "/>";
  var req = IomFactory().createItem(aml);
  return req.apply(ic().HttpConnector);
}

DetailsPanel.prototype.getPropertyById_private = function(itdef, pid) {
  var props = itdef.getRelationships("Property");
  for (var i = 0; i < props.getItemCount(); i++) {
    var prop = props.getItemByIndex(i);
    if (prop.getId() == pid)
      return prop;
  }

  return null;
}

DetailsPanel.prototype.getPropertyByName_private = function(itdef, pname) {
  var props = itdef.getRelationships("Property");
  for (var i = 0; i < props.getItemCount(); i++) {
    var prop = props.getItemByIndex(i);
    if (prop.getProperty("name") == pname)
      return prop;
  }

  return null;
}

DetailsPanel.prototype.showFiles_private = function(doc_item) {
  // Space break
  var row = this.form_table.insertRow(-1);
  var cell = row.insertCell(0);
  cell.innerHTML = "<br/><br/>";

  // Header
  row = this.form_table.insertRow(-1);
  cell = row.insertCell(0);
  cell.className = "medium";
  cell.innerHTML = "<b>Document Files:</b>";

  // List of files
  var dfiles = doc_item.getRelationships("Document File");
  for (var i = 0; i < dfiles.getItemCount(); i++) {
    var file = dfiles.getItemByIndex(i).getPropertyItem("related_id");
    if (!file)
      continue;

    var futils = new FileUtils(file);

    row = this.form_table.insertRow(-1);
    cell = row.insertCell(0);
    cell.className = "medium";
    cell.innerHTML = "<a href='javascript:ic().details.openFile_private(\"" + futils.getDownloadUrl() + "\")'>" + file.getProperty("filename") + "</a>";
  }
}

DetailsPanel.prototype.cleanToolbar_private = function() {
  var rcount = this.toolbar_table.rows.length;
  for (var j = 0; j < rcount; j++) {
    this.toolbar_table.deleteRow(-1);
  }
}

DetailsPanel.prototype.openFile_private = function(url) {
  setTimeout("window.open('" + url + "','FileOpen')", 50);
}

DetailsPanel.prototype.validateBeforeSave_private = function(item, itdef) {
  var count = this.shown_props.length;
  var not_set_props = new Array();

  for (var i = 0; i < count; i++) {
    var prop = this.getPropertyByName_private(itdef, this.shown_props[i]);
    var is_req = prop.getProperty("is_required");
    if (is_req && is_req == "1") {
      var pname = prop.getProperty("name");
      if (!item.getProperty(pname)) {
        var plabel = prop.getProperty("label");
        if (!plabel)
          plabel = pname;
        not_set_props[not_set_props.length] = plabel;
      }
    }
  }

  if (not_set_props.length == 0) {
    return true;
  }
  else {
    var msg = "The following properties must be set: ";
    for (var j = 0; j < not_set_props.length; j++) {
      if (j > 0)
        msg += ", ";
      msg += not_set_props[j];
      ic().errorDialog(msg);

      return false;
    }
  }
}
