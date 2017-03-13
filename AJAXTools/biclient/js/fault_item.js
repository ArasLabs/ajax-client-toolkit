
/// <summary>
/// The class is derived from the basic Item and represents a 'Fault' item that could be
/// returned from server. Provides methods for getting error code, error description, etc.
/// </summary>
function Fault(node) {
  Item.call(this, node.ownerDocument);
  this.node = node;
}

Fault.prototype = new Item;

Fault.prototype.getClass = function Fault_getClass() {
  return "Fault";
}

Fault.prototype.getAml = function Fault_getAml() {
  return this.getXml_private(this.node);
}

Fault.prototype.apply = function Fault_apply() {
}

Fault.prototype.getErrorCode = function Fault_getErrorCode() {
  return this.getNodeValue_private(this.getChildNode_private(this.node, "faultcode"));
}

Fault.prototype.getErrorString = function Fault_getErrorString() {
  return this.getNodeValue_private(this.getChildNode_private(this.node, "faultstring"));
}

Fault.prototype.getErrorDetails = function Fault_getErrorDetails() {
  return this.getNodeValue_private(this.getChildNode_private(this.node, "detail"));
}

