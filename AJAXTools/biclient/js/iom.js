
// Include files that constitute the "IOM layer" of the application.
// NOTE: the advantage of this approach - well structured code where each
//       class placed in its own file. The disadvantage - browsers will make
//       a separate request back to the server to bring each file. Although
//       after the very first time each of these calls will end up with
//       304 response (Not Modified), in the WAN with big latency it might
//       have a noticable impact on performance. One of ways to deal with it -
//       merge the content of all these files directly into this file.
document.write("<script src='js/md5.js' type='text/javascript'></script>");
document.write("<script src='js/iom_factory.js' type='text/javascript'></script>");
document.write("<script src='js/http_connector.js' type='text/javascript'></script>");
document.write("<script src='js/item.js' type='text/javascript'></script>");
document.write("<script src='js/single_item.js' type='text/javascript'></script>");
document.write("<script src='js/fault_item.js' type='text/javascript'></script>");
document.write("<script src='js/item_list.js' type='text/javascript'></script>");

