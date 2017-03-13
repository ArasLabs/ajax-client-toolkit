
/// <summary>
/// The class is derived from the basic Item and provides methods for iteration
/// over the list of items.
/// </summary>
/// <remarks>
/// Currently the class does NOT support a creation of 'ItemList' object from,
/// let's say, an array of 'SingleItem's. The only way to create an instance of
/// the class is to pass an AML with multiple <Item> siblings to IomFactory().createItem(...).
/// </remarks>
function ItemList(nodes) {
  if (nodes && nodes.length > 0) {
    Item.call(this, nodes[0].ownerDocument);
    this.nodes = nodes;
  }
}

ItemList.prototype = new Item;

ItemList.prototype.getClass = function ItemList_getClass() {
  return "ItemList";
}

ItemList.prototype.getItemCount = function ItemList_getItemCount() {
  return (this.nodes) ? this.nodes.length : 0;
}

ItemList.prototype.getItemByIndex = function ItemList_getItemByIndex(indx) {
  return (this.nodes) ? new SingleItem(this.nodes[indx]) : null;
}