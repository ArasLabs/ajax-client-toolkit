
var MetaDataType =
{
  ITEM_TYPE: "ItemType",
  FORM: "Form",
  LIST: "List",
  VAULT: "Vault"
}

/// <summary>
/// Cache for meta data (e.g. ItemTypes, Forms, etc.)
/// </summary>
function MetaDataCache() {
  this.cache = new Array();
  this.cache[MetaDataType.ITEM_TYPE] = new ItemHash("name");
  this.cache[MetaDataType.FORM] = new ItemHash();
  this.cache[MetaDataType.LIST] = new ItemHash();
  this.cache[MetaDataType.VAULT] = new Hash();
}

/// <summary>
/// If specified item type is not in the cache yet, get it from the server and put into the cache.
/// </summary>
/// <param name="itname">Item type name.</param>
/// <param name="asynch">'true' for asynchronous requests; 'false' by default.</param>
/// <returns>
/// SingleItem that represents the specified item type or Fault item if failed or not found.
/// </returns>
MetaDataCache.prototype.getItemType = function MetaDataCache_getItemType(itname, asynch) {
  if (!asynch)
    asynch = false;

  var it = this.cache[MetaDataType.ITEM_TYPE].getByKey(itname);
  if (!it) {
    // For the purpose of this particular application only properties and view are required. If another information will be
    // needed the request must be changed correspondingly. 
    var aml = "<Item type='ItemType' action='get' levels='1' select='*' config_path='Property|View'><name>" + itname + "</name></Item>";
    it = this.sendRequest_private(aml, asynch);
    if (!asynch && !it.isError()) {
      this.cache[MetaDataType.ITEM_TYPE].insert(it);
    }
  }
  return it;
}

/// <summary>
/// If specified form is not in the cache yet, get it from the server and put into the cache.
/// </summary>
/// <param name="id">Form id.</param>
/// <param name="asynch">'true' for asynchronous requests; 'false' by default.</param>
/// <returns>
/// SingleItem that represents the specified Form or Fault item if failed or not found.
/// </returns>
MetaDataCache.prototype.getForm = function MetaDataCache_getForm(id, asynch) {
  if (!asynch)
    asynch = false;

  var f = this.cache[MetaDataType.FORM].getByKey(id);
  if (!f) {
    // For the purpose of this particular application only fields of the form are required. If another information will be
    // needed the request must be changed correspondingly. 
    var aml = "<Item type='Form' action='get' levels='2' config_path='Body/Field' id='" + id + "'/>";
    f = this.sendRequest_private(aml, asynch);
    if (!asynch && !f.isError()) {
      this.cache[MetaDataType.FORM].insert(f);
    }
  }

  return f;
}

/// <summary>
/// Does the required transformation of the vault URL and caches the result with the vault ID as the key.
/// </summary>
/// <param name="vault">SingleItem that represents <Item type='Vault' ...></param>
/// <returns>
/// The vault URL or null if error occured or the URL transformation could not be performed.
/// </returns>
MetaDataCache.prototype.getVaultUrl = function MetaDataCache_getVaultUrl(vault) {
  var vid = vault.getId();
  var v = this.cache[MetaDataType.VAULT].getByKey(vid);
  if (!v) {
    var aml = "<url>" + vault.getProperty("vault_url") + "</url>";
    var result = ic().HttpConnector.callAction_private('TransformVaultServerURL', aml);
    var ritem = IomFactory().createItem(result);
    if (ritem.isError())
      return null;
    v = ritem.getNodeValue_private(ritem.dom.documentElement);
    this.cache[MetaDataType.VAULT].insert(vid, v);
  }

  return v;
}

MetaDataCache.prototype.getList = function MetaDataCache_getList(id, asynch) {
  if (!asynch)
    asynch = false;

  var l = this.cache[MetaDataType.LIST].getByKey(id);
  if (!l) {
    var aml = "<Item type='List' action='get' levels='1' id='" + id + "'/>";
    l = this.sendRequest_private(aml, asynch);
    if (!asynch && !l.isError()) {
      this.cache[MetaDataType.LIST].insert(l);
    }
  }

  return l;
}

// ====================== Private methods =============================================
MetaDataCache.prototype.sendRequest_private = function(aml, asynch) {
  var request = IomFactory().createItem(aml);
  if (asynch) {
    var controller = new HttpRequestAsyncController(MetaDataCache_onAsynchDone);
    request.apply(ic().HttpConnector, null, controller);
  }
  else {
    return request.apply(ic().HttpConnector);
  }
}

// Callback for asynchronous requests.
function MetaDataCache_onAsynchDone(aml) {
  var result = IomFactory().createItem(aml);
  if (!result.isError()) {
    var type = result.getAttribute("type");
    if (type == MetaDataType.ITEM_TYPE || type == MetaDataType.FORM || type == MetaDataType.LIST) {
      ic().metaCache.cache[type].insert(result);
    } 
  }
}