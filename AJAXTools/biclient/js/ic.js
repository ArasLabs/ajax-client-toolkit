
/// <summary>
/// Singleton for InnovatorClient.
/// </summary>
function ic() {
  if (!top.InnovatorClient) {
    top.InnovatorClient = new InnovatorClientImpl();
  }

  return top.InnovatorClient;
}

function InnovatorClientImpl() {
  this.HttpConnector = null;
  this.metaCache = new MetaDataCache();
  this.itemCache = new ItemCache();

  // It's assumed here that the code is deployed to the location where the
  // Innovator server with which the client is going to work with is deployed. The
  // reason for this is that otherwise the client code must make cross-domain
  // requests that are either not allowed in pre-3.5 FireFox or will cause "preflight"
  // calls with HTTP OPTIONS that are not supported by Innovator server. The
  // directory that the code must be deployed must be: Innovator/Client/biclient. 
  var indx = window.location.href.toLowerCase().indexOf("/client/biclient");
  this.baseUrl = window.location.href.substring(0, indx);
  
  this.toc = null;
  this.grid = null;
  this.details = null;
}

/// <summary>
/// Pop up a 'success' dialog. 
/// </summary>
InnovatorClientImpl.prototype.successDialog = function InnovatorClientImpl_successDialog(msg) {
  alert(msg);
}

/// <summary>
/// Pop up 'error' dialog. 
/// </summary>
InnovatorClientImpl.prototype.errorDialog = function InnovatorClientImpl_errorDialog(msg, details) {
  var full_msg = "ERROR";
  if (msg)
    full_msg += ":\n" + msg;
  if (details)
    full_msg += "\n\nDETAILS:\n" + details;
  alert(full_msg);
}