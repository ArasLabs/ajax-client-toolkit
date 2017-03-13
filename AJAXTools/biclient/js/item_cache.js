
function ItemCache() {
  this.items = new ItemHash();
}

ItemCache.prototype.insert = function(item) {
  this.items.insert(item);
}

ItemCache.prototype.remove = function(item) {
  if (typeof (item) == "string") {
    this.items.removeByKey(item);
  }
  else {
    this.items.remove(item);
  }
}

ItemCache.prototype.hasItem = function(id) {
  return this.items.hasKey(id);
}

ItemCache.prototype.getItem = function(id) {
  return this.items.getByKey(id);
}

ItemCache.prototype.getAllItems = function() {
  return this.items.hash.items;
}
