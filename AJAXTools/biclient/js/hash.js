
/// <summary>
/// Generic hash table. Can be constructed as: new Hash( key1, val1, key2, val2, ... );
/// </summary>
function Hash() {
  this.length = 0;
  this.items = new Array();
  for (var i = 0; i < arguments.length; i += 2) {
    if (typeof (arguments[i + 1]) != 'undefined') {
      this.items[arguments[i]] = arguments[i + 1];
      this.length++;
    }
  }

  this.removeByKey = function(in_key) {
    var tmp_previous;
    if (typeof (this.items[in_key]) != 'undefined') {
      this.length--;
      var tmp_previous = this.items[in_key];
      delete this.items[in_key];
    }

    return tmp_previous;
  }

  this.getByKey = function(in_key) {
    return this.items[in_key];
  }

  this.insert = function(in_key, in_value) {
    var tmp_previous;
    if (typeof (in_value) != 'undefined') {
      if (typeof (this.items[in_key]) == 'undefined') {
        this.length++;
      }
      else {
        tmp_previous = this.items[in_key];
      }

      this.items[in_key] = in_value;
    }

    return tmp_previous;
  }

  this.hasKey = function(in_key) {
    return typeof (this.items[in_key]) != 'undefined';
  }

  this.clear = function() {
    for (var i in this.items) {
      delete this.items[i];
    }

    this.length = 0;
  }
}

/// <summary>
/// Special hash for Items. Can be constructed as: new ItemHash( keyed_prop, item1, item2, ... ).
/// If keyed property name is not specied then 'id' is assumed.
/// </summary>
function ItemHash( pname ) {
  this.hash = new Hash();
  this.pname = ( !pname ) ? "id" : pname;
  for (var i = 0; i < arguments.length; i++) {
    var item = arguments[i];
    if (typeof (item) == "ItemList") {
      var count = item.getItemCount();
      for (var j = 0; j < count; j++) {
        var sitem = item.getItemByIndex(j);
        this.insert(sitem);
      }
    }
    else if (typeof (item) == "SingleItem") {
      this.insert(item);
    }
  }

  this.remove = function(item) {
    if (item) {
      this.hash.removeByKey(this.getItemKey_private(item));
    }
  }

  this.removeByKey = function(key) {
    this.hash.removeByKey(key);
  }
  
  this.insert = function(item) {
    if (item) {
      this.hash.insert(this.getItemKey_private(item), item);
    }
  }

  this.getByKey = function(key) {
    return this.hash.getByKey(key);
  }

  this.getByProperty = function(pname, pvalue) {
    for (var key in this.hash.items) {
      var item = this.getByKey(key);
      if (item.getProperty(pname) == pvalue) {
        return item;
      }
    }
    return null;
  }

  this.hasItem = function(item) {
    if (item) {
      return this.hash.hasKey(this.getItemKey_private(item));
    }
  }

  this.hasKey = function(key) {
    return this.hash.hasKey(key);
  }

  this.clear = function() {
    this.hash.clear();
  }

  this.getItemKey_private = function(item) {
    if (this.pname == "id") {
      return item.getId();
    }
    else {
      return item.getProperty(this.pname);
    }
  }
}


