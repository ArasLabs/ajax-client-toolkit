
// --------------- Global variables -----------------------------------------------------------

// Enumerator for Xml node types
var NodeType =
{
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12
}

// Global variable that defines type of the browser. At this point it's a boolean (IE\nonIE)
// which seems to be enough for targeted browsers IE\FireFox\Safari.
var _is_IE_ = (window.ActiveXObject) ? true : false;


// ----------------- IomFactory class ------------------------------------------------------------

/// <summary>
/// IomFactory singleton.
/// </summary>

function IomFactory() {
  if (!top.IomFactoryInstance) {
    top.IomFactoryInstance = new IomFactoryImpl();
  }

  return top.IomFactoryInstance;
}

/// <summary>
/// This constructor should not be called directly; please use IomFactory() to
/// get the singleton instance of the class.
/// </summary>
function IomFactoryImpl() {
}

/// <summary>
/// Creates instance of XML DOM object and loads the passed xml into it.
/// </summary>
/// <param name="xml">XML that has to be loaded into the newly created XML DOM object.</param>
IomFactoryImpl.prototype.createXmlDocument = function IomFactoryImpl_createXmlDocument(xml) {
  var xmlDoc = null;

  // Non IE
  if (!_is_IE_) {
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(xml, "text/xml");
  }
  // IE
  else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    xmlDoc.preserveWhiteSpace = true;
    xmlDoc.validateOnParse = false;
    xmlDoc.loadXML(xml);
  }

  return xmlDoc;
}

/// <summary>
/// Creates instance of HttpConnector with specified parameters.
/// </summary>
/// <param name="url">Innovator server URL</param>
/// <param name="db">Name of Innovator database</param>
/// <param name="user">Name of Innovator user</param>
/// <param name="password">User password</param>
IomFactoryImpl.prototype.createHttpConnector = function IomFactoryImpl_createHttpConnector(url, db, user, password) {
  return new HttpConnector(url, db, user, password);
}

/// <summary>
/// Creates instance of a class derived from 'Item' class ('SingleItem', 'ItemList', etc.)
/// depending on the passed xml.
/// </summary>
IomFactoryImpl.prototype.createItem = function IomFactoryImpl_createItem(aml) {
  function _getItemRootNode(node) {
    var root = node;

    var rname = root.nodeName;
    if (rname == "Envelope" || rname == "Body" || rname.indexOf(":Envelope") > 0 || rname.indexOf(":Body") > 0) {
      root = _getItemRootNode(root.childNodes[0]);
    }

    return root;
  }

  function _getChildNodes(node, name) {
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

  if (!aml)
    aml = "<Item/>";

  var doc;
  var type = typeof aml;
  if (type == "string") {
    doc = IomFactory().createXmlDocument(aml);
  }
  else
    doc = aml;

  var root = _getItemRootNode(doc.documentElement);
  var rname = root.nodeName;

  if (rname == "Item") {
    return new SingleItem(root);
  }
  else if (rname == "Fault" || rname.indexOf(":Fault") > 0) {
    return new Fault(root);
  }
  else if (rname == "Result" || rname == "AML") {
  var nl = _getChildNodes(root, "Item");
    if (nl.length == 0)
      return new Item(doc);
    else if (nl.length == 1)
      return new SingleItem(nl[0]);
    else
      return new ItemList(nl);
  }
  else
    return new Item(doc);
}


