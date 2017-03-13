
/// <summary>
/// The class is derived from the basic Item and represents a single <Item>. Provides
/// methods for get\set properties; get\set attributes and sending the request that
/// the item's AML represents to the server.
/// </summary>
function SingleItem(node) {
  Item.call(this, node.ownerDocument);
  this.node = node;
}

SingleItem.prototype = new Item;

SingleItem.prototype.getClass = function SingleItem_getClass() {
  return "SingleItem";
}

/// <summary>
/// Returns a string representation of the item's aml. 
/// </summary>
SingleItem.prototype.getAml = function SingleItem_getAml() {
  return this.getXml_private(this.node);
}

/// <summary>
/// Returns ID of the item. 
/// </summary>
SingleItem.prototype.getId = function SingleItem_getId() {
  var id = this.getProperty("id", null);
  if (!id)
    id = this.getAttribute("id", null);

  return id;
}

/// <summary>
/// Returns type of the item. 
/// </summary>
SingleItem.prototype.getType = function SingleItem_getType() {
  return this.getAttribute("type", null);
}

/// <summary>
/// Always returns 1 as it's the class represents a single item.
/// </summary>
SingleItem.prototype.getItemCount = function SingleItem_getItemCount() {
  return 1;
}

/// <summary>
/// Always returns itself as it's the class represents a single item.
/// </summary>
SingleItem.prototype.getItemByIndex = function SingleItem_getItemByIndex(indx) {
  return this;
}

/// <summary>
/// Gets value of the property with the specified name. 
/// </summary>
/// <param name="pname">Property name.</param>
/// <param name="default_value">Default value of the property.</param>
/// <returns>
/// If the property is an item-property, ID of the item-property is returned.
/// If the property doesn't exist or it's an item-property without ID, the default value
/// is returned; otherwise the method returns value of the specified property.
/// </returns>
SingleItem.prototype.getProperty = function SingleItem_getProperty(pname, default_value) {
  if (!pname)
    return default_value;

  var pnode = this.getChildNode_private(this.node, pname);
  if (!pnode)
    return default_value;
  else {
    var sub_item = this.getChildNode_private(pnode, "Item");
    if (sub_item) {
      var si = new SingleItem(sub_item);
      return si.getId();
    }
    else {
      return this.getNodeValue_private(pnode);
    }
  }
}

/// <summary>
/// Returns a SingleItem that represents the specified property of type 'Item'. 
/// </summary>
/// <param name="pname">Property name.</param>
/// <param name="default_value">Default value of the property.</param>
/// <returns>
/// If the property has sub-node <Item> then the SingleItem representing this sub-node
/// is returned. Otherwise the method returns 'null'.
/// </returns>
SingleItem.prototype.getPropertyItem = function SingleItem_getPropertyItem(pname) {
  if (!pname)
    return null;

  var pnode = this.getChildNode_private(this.node, pname);
  if (!pnode) {
    return null;
  }
  else {
    var sub_item = this.getChildNode_private(pnode, "Item");
    if (sub_item) {
      return new SingleItem(sub_item);
    }
    else {
      return null;
    }
  }
}

/// <summary>
/// Set the property with the specified name. If property doesn't exist on the item, create it
/// first and then set.
/// </summary>
/// <param name="pname">Property name.</param>
/// <param name="pvalue">Value to be set on the property.</param>
SingleItem.prototype.setProperty = function SingleItem_setProperty(pname, pvalue) {
  if (pname) {
    var pnode = this.getChildNode_private(this.node, pname);
    if (!pnode) {
      pnode = this.node.ownerDocument.createElement(pname);
      this.node.appendChild(pnode);
    }
    this.setNodeValue_private(pnode, pvalue);
  }
}

/// <summary>
/// Returns value of the attribute with the specified name.
/// </summary>
/// <param name="name">The qualified name of the attribute.</param>
/// <param name="default_value">Default value of the attribute.</param>
/// <returns>Attribute value if the attribute exists, default value otherwise</returns>
SingleItem.prototype.getAttribute = function SingleItem_getAttribute(name, default_value) {
  if (!name)
    return default_value;

  var result = this.getAttribute_private(this.node, name);

  return (result) ? result : default_value;
}

/// <summary>
/// Set the value of the attribute with the specified name.
/// </summary>
/// <param name="name">The name of the attribute to create or alter.</param>
/// <param name="val">The value to be set on the attribute. If not defined or 'null' the attribute is removed.</param>
SingleItem.prototype.setAttribute = function SingleItem_setAttribute(name, val) {
  if (name) {
    // 0 is considered a valid value; 'undefined'/'null'/'' is considered as 'remove' command
    if (!val && val != 0) {
      this.node.removeAttribute(name);
    }
    else {
      this.node.setAttribute(name, val);
    }
  }
}

/// <summary>
/// Returns the value of the specified attribute of the specified property.
/// </summary>
/// <param name="pname">The name of the property.</param>
/// <param name="aname">The name of the attribute.</param>
/// <param name="default_value">The default value to return if either property of its attribute not found.</param>
SingleItem.prototype.getPropertyAttribute = function SingleItem_getPropertyAttribute(pname, aname, default_value) {
  if (!pname || !aname)
    return default_value;

  var aval;
  var pnode = this.getChildNode_private(this.node, pname);
  if (pnode) {
    aval = this.getAttribute_private(pnode, aname);
  }

  return ( aval ) ? aval : default_value;
}

/// <summary>
/// Set the value of the specified attribute of the specified property.
/// </summary>
/// <param name="pname">The name of the property.</param>
/// <param name="aname">The name of the attribute.</param>
/// <param name="avalue">The value to be set.</param>
SingleItem.prototype.setPropertyAttribute = function SingleItem_setPropertyAttribute(pname, aname, avalue) {
  if (!pname || !aname)
    return;

  var pnode = this.getChildNode_private(this.node, pname);
  if (pnode) {
    pnode.setAttribute(aname, avalue);
  }
}

/// <summary>
/// Returns either relationships with the specified name or all relationships
/// if the name was not specified.
/// </summary>
/// <param name="rname">The name of the relationship.</param>
SingleItem.prototype.getRelationships = function SingleItem_getRelationships(rname) {
  var all = new Array();
  var rels_node = this.getChildNode_private(this.node, "Relationships");
  if (rels_node) {
    all = this.getChildNodes_private(rels_node, "Item");
    if (all && all.length > 0 && rname) {
      var specific = new Array();
      for (var i = 0; i < all.length; i++) {
        var rel = new SingleItem(all[i]);
        if (rel.getAttribute("type") == rname) {
          specific[specific.length] = all[i];
        }
      }
      return new ItemList(specific);
    }
  }
  return new ItemList(all);
}

/// <summary>
/// Returns lock status of the item: 0 - not locked; 1 - locked by me; 2 - locked by someone else.
/// </summary>
/// <remarks>
/// Note that the method returns the status based on the information in memory and does NOT fetch the latest 
/// state from the server.
/// </remarks>
SingleItem.prototype.getLockStatus = function SingleItem_getLockStatus() {
  var locked_by = this.getProperty("locked_by_id", null);
  var lstatus = (locked_by) ? ((locked_by != ic().HttpConnector.userId) ? 2 : 1) : 0;
  return lstatus;
}
