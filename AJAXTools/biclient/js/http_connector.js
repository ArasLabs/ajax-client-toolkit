
// ------------- HttpRequestAsyncController --------------------------------------------------
/// <summary>
/// Must be used if asynchronous call to Innovator server must be made. In this case user must
/// create the instance of the class passing to the constructor the callback function that will
/// be called when the request is done. The instance must be passed to the Item.apply(...)
/// method. Item.apply(...) also sets the abort callback on the controller which could be
/// called through 'abortRequest' method if the HTTP request must be stopped.
/// </summary>
function HttpRequestAsyncController(onReadyCallback) {
  this.onready = onReadyCallback;
  this.onabort = null;
}

/// <summary>
/// The method must be called if the request that was started by passing the controller to Item.apply(...)
/// needs to be stopped.
/// </summary>
HttpRequestAsyncController.prototype.abortRequest = function HttpRequestAsyncController_abortRequest() {
  if (this.onabort)
    this.onabort();
}

// Enumerator for request ready state
var RequestReadyState =
{
  UNINITIALIZED: 0,
  LOADING: 1,
  LOADED: 2,
  INTERACTIVE: 3,
  COMPLETE: 4
}

// ------------ XmlHttp -----------------------------------------------------------------------
/// <summary>
/// Browser independent HTTP request sender. Allows sending either synchronous or asynchronous
/// requests to the specified Innovator server.
/// </summary>
/// <remarks>
/// The class is internal and NOT supposed to be called directly. Instead users must use 
/// Item.apply(...).
/// </remarks>
function XmlHttp() {
  // NOTE: if fact IE 7 and up has support for the XMLHttpRequest but
  //          a) it has to be enabled in IE settings which might not be done by some reason
  //          b) user might still have IE 6
  //       This is why ActiveX is used for IE
  this.obj = null;
  if (!_is_IE_)
    this.obj = new XMLHttpRequest();
  else
    this.obj = new ActiveXObject("Microsoft.XMLHTTP");
}

/// <summary>
/// Main method of the class that sends either synchronous or asynchronous
/// requests to the specified Innovator server. Passed db\user\password are
/// set as request headers.
/// </summary>
/// <param name="url">Innovator server URL</param>
/// <param name="db">Name of Innovator database</param>
/// <param name="user">Name of Innovator user</param>
/// <param name="password">User's encrypted (MD5) password</param>
/// <param name="body">AML that has to be sent</param>
/// <param name="controller">
/// Instance of HttpRequestAsyncController. If specified then asynchronous request is made; otherwise
/// the request is synchronous.
/// </param>
XmlHttp.prototype.send = function XmlHttp_send(url, db, user, password, soap_action, body, controller) {
  var xmlhttp = this.obj;

  function onReadyStateChangeHandler() {
    if (xmlhttp && xmlhttp.readyState == RequestReadyState.COMPLETE) {
      controller.onready(xmlhttp.responseText);
    }
  }

  function onAbortRequest() {
    xmlhttp.onreadystatechange = new Function();
    xmlhttp.abort();
  }

  var async = (controller && controller.onready) ? true : false;
  if (async) {
    xmlhttp.onreadystatechange = onReadyStateChangeHandler;
    controller.onabort = onAbortRequest;
  }

  xmlhttp.open("POST", url, async);
  xmlhttp.setRequestHeader('Content-Type', 'application/xml');

  if (soap_action)
    xmlhttp.setRequestHeader("SOAPAction", soap_action);
  if (user)
    xmlhttp.setRequestHeader("AUTHUSER", user);
  if (password)
    xmlhttp.setRequestHeader("AUTHPASSWORD", password);
  if (db)
    xmlhttp.setRequestHeader("DATABASE", db);

  // NOTE: 2 additional headers could be set - LOCALE and TIMEZONE_NAME; e.g.
  //       LOCALE="en-US"; TIMEZONE_NAME="Eastern Standard Time". The problem
  //       that browsers do NOT have access to the corresponding functionality
  //       of the underlying OS and it's impossible to get locale and time
  //       zone set on the client machine. Value for LOCALE could be obtained
  //       from the list of the languages in the browser (which is not exactly
  //       the same as getting the current locale from OS, but better than nothing).
  //       Time zone currently is NOT supported (as far as I know) by any browser.

  body = "<?xml version='1.0' encoding='utf-8' ?>" + body;
  try {
    xmlhttp.send(body);
    if (!async) {
      return xmlhttp.responseText;
    }
  }
  catch (exc) {
    var exc_msg = (exc.description) ? exc.description : exc.toString();
    return "<Fault><faultstring>Failed to send request to '" + url + "' : " + exc_msg + "</faultstring></Fault>";
  }
}

// ------------ HttpConnector -----------------------------------------------------------------
/// <summary>
/// Instance of the class defines a connection to a particular Innovator server and must be
/// passed to the Item.apply(...) method to send the request expressed by the item's AML to
/// the Innovator server.
/// </summary>
/// <remarks>
/// The constructor is internal and NOT supposed to be called directly. Instead users must use 
/// IomFactory().createHttpConnector(...).
/// </remarks>
/// <param name="url">Innovator server URL</param>
/// <param name="db">Name of Innovator database</param>
/// <param name="user">Name of Innovator user</param>
/// <param name="password">
/// User password. If specified password is already MD5 value it'll not be encrypted again;
/// otherwise it'll be converted into an MD5 value.
/// </param>
function HttpConnector(url, db, user, password) {
  var aspx = "Server/InnovatorServer.aspx";
  if (url.indexOf(aspx) < 0) {
    if (url.charAt(url.length - 1) != '/') {
      url += "/";
    }
    url += aspx;
  }
  this.url = url;
  this.db = db;
  this.user = user;

  this.password = null;
  if (password) {
    if (/^[0-9a-f]{32}$/i.test(password)) {
      this.password = password;
    }
    else {
      this.password = calcMD5(password);
    }
  }

  this.userId = null;
}

/// <summary>
/// Login to Innovator. Must be the first call on new instance of the class.
/// </summary>
/// <returns>
/// Returns item that contains result of the login (if login failed the return item is 'FaultItem').
/// </returns>
HttpConnector.prototype.login = function HttpConnector_login() {
  var result = IomFactory().createItem(this.callAction_private("ValidateUser", "<Item/>"));
  if (!result.isError()) {
    var rstr = result.getAml();
    this.userId = rstr.substr(rstr.indexOf("<id>") + 4, 32);
  }
  return result;
}

/// <summary>
/// Logout from Innovator.
/// </summary>
HttpConnector.prototype.logout = function HttpConnector_logout() {
  this.callAction_private("Logoff", "<logoff skip_unlock='1'/>");
}

HttpConnector.prototype.getDbList = function HttpConnector_getDbList() {
  url = this.url.substring(0, this.url.indexOf("InnovatorServer.aspx")) + "DBList.aspx";
  try {
    var result = new Array();
    // Create a new xmlhttp object for each request to avoid problems when multiple 
    // requests are made at the same time.
    var xmlhttp = new XmlHttp();
    var response = IomFactory().createXmlDocument(xmlhttp.send(url, null, null, null, null, "<GetDB/>"));
    var dbs = response.getElementsByTagName("DB");
    for (var i = 0; i < dbs.length; i++) {
      result[i] = dbs[i].getAttribute("id");
    }

    return result;
  }
  catch (exc) {
    return null;
  }
}

/// <summary>
/// Private method that not supposed to be called directly; instead user must call Item.apply(...).
/// </summary>
/// <param name="soap_action">SOAP action; e.g "ApplyItem"</param>
/// <param name="body">AML that has to be sent</param>
/// <param name="controller">
/// Instance of HttpRequestAsyncController. If specified then asynchronous request is made; otherwise
/// the request is synchronous.
/// </param>
HttpConnector.prototype.callAction_private = function HttpConnector_callAction(soap_action, body, controller) {
  var xmlhttp = new XmlHttp();
  return xmlhttp.send(this.url, this.db, this.user, this.password, soap_action, body, controller);
}


