
/// <summary>
/// Provides a set of utility methods for working with items of type 'File'
/// </summary>
function FileUtils(item) {
  // It's assumed here that the item passed to the constructor is an item of type 'File'
  // which has already relationship 'Located' in it with related 'Vault'
  this.item = item;
}

/// <summary>
/// Returns the URL that must be used for the file download.
/// </summary>
FileUtils.prototype.getDownloadUrl = function FileItem_getDownloadUrl() {
  var lrel = this.item.getRelationships("Located").getItemByIndex(0);
  var vault = lrel.getPropertyItem("related_id");

  var result = ic().metaCache.getVaultUrl(vault);
  result += "?dbName=" + escape(ic().HttpConnector.db) + "&fileID=" + this.item.getId() + "&fileName=" + escape(this.item.getProperty("filename"));

  return result;
}

