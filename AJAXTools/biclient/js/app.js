
// Include files that constitute the "application layer" of the application.
// NOTE: the advantage of this approach - well structured code where each
//       class placed in its own file. The disadvantage - browsers will make
//       a separate request back to the server to bring each file. Although
//       after the very first time each of these calls will end up with
//       304 response (Not Modified), in the WAN with big latency it might
//       have a noticable impact on performance. One of ways to deal with it -
//       merge the content of all these files directly into this file.
document.write("<script src='js/hash.js' type='text/javascript'></script>");
document.write("<script src='js/meta_cache.js' type='text/javascript'></script>");
document.write("<script src='js/item_cache.js' type='text/javascript'></script>");
document.write("<script src='js/file_utils.js' type='text/javascript'></script>");
document.write("<script src='js/grid_panel.js' type='text/javascript'></script>");
document.write("<script src='js/toc_panel.js' type='text/javascript'></script>");
document.write("<script src='js/details_panel.js' type='text/javascript'></script>");
document.write("<script src='js/ic.js' type='text/javascript'></script>");
