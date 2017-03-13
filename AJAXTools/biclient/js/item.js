
// ------------ Based class for all Item subclasses -------------------------------------------

/// <summary>
/// The constructor is not supposed to be called directly mostly because user always need
/// to create a particular sub-type of Item and not the base Item. Please use 
/// IomFactory().createItem(...) instead.
/// </summary>
function Item(doc) {
  this.dom = doc;
}

/// <summary>
/// Returns name of the sub-type. The method is overwritten in each derived class.
/// </summary>
Item.prototype.getClass = function Item_getClass() {
  return "Item";
}

/// <summary>
/// Returns 'true' if it's an instance of 'Fault' class.
/// </summary>
Item.prototype.isError = function Item_isError() {
  return (this.getClass() == "Fault") ? true : false;
}

/// <summary>
/// Returns 'true' if it's an instance of 'ItemList' class.
/// </summary>
Item.prototype.isList = function Item_isList() {
  return (this.getClass() == "ItemList") ? true : false;
}

/// <summary>
/// Returns string representation of the AML that the item holds.
/// </summary>
Item.prototype.getAml = function Item_getAml() {
  return this.getXml_private(this.dom.documentElement);
}

/// <summary>
/// Sends the AML request to the Innovator server defined by the passed 'connector' object.
/// </summary>
/// <param name="connector">Instance of HttpConnector object.</param>
/// <param name="soap_action">SOAP acton. If not defined then 'ApplyItem' is assumed.</param>
/// <param name="controller">
/// Instance of HttpRequestAsyncController object. Need to be passed ONLY if the request must
/// be made asynchronously.
/// </param>
/// <returns>
/// Returns the item that represent the AML response returned from the Innovator server.
/// </returns>
Item.prototype.apply = function Item_apply(connector, soap_action, controller) {
  if (!connector)
    return IomFactory().createItem("<Fault><faultstring>Not valid 'connector' object was passed to the 'Item.apply'</faultstring></Fault>");

  if (!soap_action)
    soap_action = "ApplyItem";

  return IomFactory().createItem(connector.callAction_private(soap_action, this.getAml(), controller));
}

/// <summary>
/// Returns number of <Item>s that the instance represent. The method is overwritten in most of derived classes.
/// </summary>
Item.prototype.getItemCount = function Item_getItemCount() {
  return 0;
}

/// <summary>
/// Returns item with the specified index. The method is overwritten in most of derived classes.
/// </summary>
Item.prototype.getItemByIndex = function Item_getItemByIndex(indx) {
  return null;
}


// ===================== Private methods ======================================================

// All methods with suffix "_private" are NOT a part of the public interface and
// supposed to be called ONLY by other methods of the class.
Item.prototype.getXml_private = function Item_getXml_private(node) {
  if (!node)
    return null;

  // IE
  if (_is_IE_)
    return node.xml;
  // Non IE
  else
    return new XMLSerializer().serializeToString(node);
}

Item.prototype.getChildNode_private = function Item_getChildNode_private(node, name) {
  if (!node || !node.childNodes)
    return null;

  for (var i = 0; i < node.childNodes.length; i++) {
    var child = node.childNodes[i];
    if (child.nodeType == NodeType.ELEMENT_NODE && child.nodeName == name)
      return child;
  }

  return null;
}

Item.prototype.getChildNodes_private = function Item_getChildNodes_private(node, name) {
  if (!node || !node.childNodes)
    return null;

  var result = new Array();
  for (var i = 0; i < node.childNodes.length; i++) {
    var child = node.childNodes[i];
    if (child.nodeType == NodeType.ELEMENT_NODE && child.nodeName == name)
      result[result.length] = child;
  }

  return result;
}

Item.prototype.getNodeValue_private = function Item_getNodeValue_private(node) {
  if (!node)
    return null;

  // IE
  if (_is_IE_)
    return node.text;
  // Non IE
  else
    return node.textContent;
}

Item.prototype.setNodeValue_private = function Item_setNodeValue_private(node, val) {
  if (!node)
    return;

  // IE
  if (_is_IE_)
    node.text = val;
  // Non IE
  else
    node.textContent = val;
}

Item.prototype.getAttribute_private = function(node, name) {
  for (var i = 0; i < node.attributes.length; i++) {
    var attr = node.attributes[i];
    if (attr.nodeName == name) {
      return this.getNodeValue_private(attr);
    }
  }
  return null;
}
