'use strict';

const
  lib = require("./lib.js"),
  express = require("express"),
  path = require("path"),
  bodyParser = require("body-parser"),
  fs = require('fs');

var html_algo_emptyList = "<tr><td>None</td><td></td><td>-</td><td>-</td><th><p><a class=\"btn btn-default\" href=\"#\" role=\"button\"><strike>Delete<strike></a></p></th></tr>";
var html_test_emptyList = "<tr><td>None</td><td>-</td>-<td></tr>";

var
  html_badPage = "",
  html_dashboard1 = "",
  html_dashboard2 = "",
  html_editAlgo1 = "",
  html_editAlgo2 = "",
  html_editAlgo3 = "",
  html_editAlgo4 = "",
  html_testAlgo1 = "",
  html_testAlgo2 = "",
  html_stats1 = "",
  html_stats2 = "";

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  lib.initSteem();
  if (!lib.hasFatalError()) {
    console.log("Dashboard min requirements met, will be active on HTTPS");
    loadFiles();
  } else {
    // kill node server to stop dashboard from showing and let owner know there is a problem without
    // giving any information away
    process.exit();
  }
});

module.exports = app;

// Utils
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason + ", MESSAGE: "+message);
  //res.status(code || 500).json({"error": message});
  res.status(code || 500).send(html_badPage);
}

function loadFiles() {
  loadFileToString("/html/bad-page.html", function(str) {
    html_badPage = str;
    console.log("got /html/bad-page.html from file");
  });
  loadFileToString("/html/dashboard-part-1.html", function(str) {
    html_dashboard1 = str;
    console.log("got /html/dashboard-part-1.html from file");
  });
  loadFileToString("/html/dashboard-part-2.html", function(str) {
    html_dashboard2 = str;
    console.log("got /html/dashboard-part-2.html from file");
  });
  loadFileToString("/html/edit-algo-part-1.html", function(str) {
    html_editAlgo1 = str;
    console.log("got /html/edit-algo-part-1.html from file");
  });
  loadFileToString("/html/edit-algo-part-2.html", function(str) {
    html_editAlgo2 = str;
    console.log("got /html/edit-algo-part-2.html from file");
  });
  loadFileToString("/html/edit-algo-part-3.html", function(str) {
    html_editAlgo3 = str;
    console.log("got /html/edit-algo-part-3.html from file");
  });
  loadFileToString("/html/edit-algo-part-4.html", function(str) {
    html_editAlgo4 = str;
    console.log("got /html/edit-algo-part-4.html from file");
  });
  loadFileToString("/html/test-algo-part-1.html", function(str) {
    html_testAlgo1 = str;
    console.log("got /html/test-algo-part-1.html from file");
  });
  loadFileToString("/html/test-algo-part-2.html", function(str) {
    html_testAlgo2 = str;
    console.log("got /html/test-algo-part-2.html from file");
  });
  loadFileToString("/html/stats-1.html", function(str) {
    html_stats1 = str;
    console.log("got /html/stats-1.html from file");
  });
  loadFileToString("/html/stats-2.html", function(str) {
    html_stats2 = str;
    console.log("got /html/stats-2.html from file");
  });
}

function loadFileToString(filename, callback) {
  fs.readFile(path.join(__dirname, filename), {encoding: 'utf-8'}, function(err,data) {
    var str = "";
    if (err) {
      console.log(err);
    } else {
      str = data;
    }
    if (callback) {
      callback(str);
    }
  });
}

function saveStringToFile(filename, str, callback) {
  fs.writeFile(path.join(__dirname, filename), str, function(err) {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      console.log("saveStringToFile successfully saved to file: "+filename);
      callback(true);
    }
  });
}

// public HTTPS interface

/*
* / [root]
*/
app.get("/", function(req, res) {
  var html_usercontent = "<a href=\"http://steemit.com/@"+process.env.STEEM_USER+"\" class=\"list-group-item\">"+process.env.STEEM_USER+" on Steemit</a>";
  res.send(200, 
      html_dashboard1 
      + html_usercontent
      + html_dashboard2);
});

/*
* /stats
*/
app.get("/stats", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/stats Unauthorized", "stats: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/stats Unauthorized", "stats: api_key invalid", 401);
    return;
  }
  lib.getPersistentString("last_log_html", function(logs) {
    var html_logs = "<html><body><h1>No logs yet, please run bot for first time!</h1></body></html>";
    if (logs != null) {
      html_logs = logs;
    }
    saveStringToFile("html/tmp-stats.html", html_logs, function(err) {
      if (err) {
        handleError(res, "can't save temp file", "/stats: can't save temp file", 500);
      } else {
        res.send(200, 
          html_stats1 
          + "/html/tmp-stats.html"
          + html_stats2);
      }
    });
  });
});

/*
 * /run-bot endpoint
 *
 * Starts an iteration of the bot mainLoop
 *
 * Example usage:
 * /run-bot?API_KEY=1234
 */
app.get("/run-bot", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key invalid", 401);
    return;
  }
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    if (obj) {
      res.status(obj.status).json(obj);
    } else {
      handleError(res, "/run-bot Internal error", "Run bot: Bot run failed internally, consult logs", 500);
    }
  });
});

// GET /edit-algo
app.get("/edit-algo", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/edit-algo Unauthorized", "edit-algo: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/edit-algo Unauthorized", "edit-algo: api_key invalid", 401);
    return;
  }
  if (req.query.remove) {
    // TODO : remove process.env.BOT_API_KEY, force from user
    lib.deleteWeightMetric(req.query.remove, process.env.BOT_API_KEY, function(result) {
      console.log("lib.deleteWeightMetric result: "+JSON.stringify(result));
      // show edit-algo as normal
      editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
    })
    return;
  }
  var str = "";
  var contents = "";
  if (req.query.author_whitelist) {
    str = "authorWhitelist";
    contents = req.query.author_whitelist;
  } else if (req.query.author_blacklist) {
    str = "authorBlacklist";
    contents = req.query.author_blacklist;
  } else if (req.query.content_category_whitelist) {
    str = "contentCategoryWhitelist";
    contents = req.query.content_category_whitelist;
  } else if (req.query.content_category_blacklist) {
    str = "contentCategoryBlacklist";
    contents = req.query.content_category_blacklist;
  } else if (req.query.content_word_whitelist) {
    str = "contentWordWhitelist";
    contents = req.query.content_word_whitelist;
  } else if (req.query.content_word_blacklist) {
    str = "contentWordBlacklist";
    contents = req.query.content_word_blacklist;
  } else if (req.query.domain_whitelist) {
    str = "domainWhitelist";
    contents = req.query.domain_whitelist;
  } else if (req.query.domain_blacklist) {
    str = "domainBlacklist";
    contents = req.query.domain_blacklist;
  }
  if (str.length > 0) {
    // update
    lib.updateMetricList(str, contents, process.env.BOT_API_KEY, function(result) {
      console.log("lib.updateMetricList result: "+JSON.stringify(result));
      // show edit-algo as normal
      editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
    });
    return;
  }
  editAlgoExec(res);  
});

// POST /edit-algo
app.post("/edit-algo", bodyParser.urlencoded({extended: false}), function(req, res) {
  console.log("/edit-algo POST request");
  // get options from post data
  console.log(" - req.body: "+JSON.stringify(req.body));
  // create query
  var query = {
    key: req.body.key,
    value: req.body.weight
  };
  if (req.body.lower) {
    query["lower"] = req.body.lower;
  }
  if (req.body.upper) {
    query["upper"] = req.body.upper;
  }
  // update
  lib.updateWeightMetric(query, req.body.api_key, function(result) {
    console.log("lib.updateWeightMetric result: "+JSON.stringify(result));
    // show edit-algo as normal
    editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
  });
});

function editAlgoExec(res, message) {
  lib.getPersistentJson("algorithm", function(algorithmResult) {
    var algorithm = {};
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - got algorithm from redis store: "+JSON.stringify(algorithm));
    } else {
      console.log(" - no algorithm in redis store, USING DEFAULT");
      // TODO : remove this default algorithm setting
      algorithm = {
        weights: [],
        authorWhitelist: [],
        authorBlacklist: [],
        contentCategoryWhitelist: [],
        contentCategoryBlacklist: [],
        contentWordWhitelist: [],
        contentWordBlacklist: [],
        domainWhitelist: [],
        domainBlacklist: []
      };
    }
    var html_whiteblacklists = "";
    //author_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"author_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.authorWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.authorWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Author whitelist</button></form></div>";
    //author_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"author_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.authorBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.authorBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Author blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //content_category_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_category_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentCategoryWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentCategoryWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Category whitelist</button></form></div>";
    //content_category_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_category_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentCategoryBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentCategoryBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Category blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //content_word_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_word_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentWordWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentWordWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Word whitelist</button></form></div>";
    //content_word_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_word_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentWordBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentWordBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Word blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //domain_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"domain_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.domainWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.domainWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Domain whitelist</button></form></div>";
    //domain_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"domain_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.domainBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.domainBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Domain blacklist</button></form></div>";

    console.log(" - algorithm: "+JSON.stringify(algorithm));
    var html_list = "";
    if (algorithm.weights.length > 0) {
      for (var i = 0 ; i < algorithm.weights.length ; i++) {
        html_list += "<tr><td>"+algorithm.weights[i].key+"</td><td>"+algorithm.weights[i].value+"</td>";
        if (algorithm.weights[i].hasOwnProperty("lower")) {
          html_list += "<td>"+algorithm.weights[i].lower+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        if (algorithm.weights[i].hasOwnProperty("upper")) {
          html_list += "<td>"+algorithm.weights[i].upper+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        // TODO : add href url delete to button
        html_list += "<th><p><a class=\"btn btn-default\" role=\"button\" href=\"javascript:deleteMetric("+i+")\">Delete</a></p></th>";
        html_list += "</tr>";
      }
    } else {
      html_list = html_algo_emptyList;
    }
    // send back response
    res.send(200, 
      html_editAlgo1
      + (message ? message : "")
      + html_editAlgo2
      + html_list
      + html_editAlgo3
      + html_whiteblacklists
      + html_editAlgo4);
    });
}

// GET /edit-algo
app.get("/test-algo", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/test-algo Unauthorized", "test-algo: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/test-algo Unauthorized", "test-algo: api_key invalid", 401);
    return;
  }
  // check for options from query data
  if (req.query.limit) {
    testAlgoExec(res, {limit: 5});
  } else {
    res.send(200, 
      html_testAlgo1 
      + html_test_emptyList
      + html_testAlgo2);
  }
});

// POST /edit-algo
app.post("/test-algo", bodyParser.urlencoded({extended: false}), function(req, res) {
  // TODO : get options from post data
  console.log("/test-algo POST request: "+req);
  res.send(200, 
    html_testAlgo1 
    + html_test_emptyList
    + html_testAlgo2);
});

function testAlgoExec(res, options) {
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    var postsMetadata = [];
    if (obj && obj.status == 200) {
      postsMetadata = obj.posts;
    }
    // build list
    var html_list = "";
    if (postsMetadata.length > 0) {
      for (var i = 0 ; i < postsMetadata.length ; i++) {
        html_list += "<tr><td><a href=\""+postsMetadata[i].url+"\">"+postsMetadata[i].title+"</a></td><td>"+postsMetadata[i].score+"</td>"
            + "<td>"+(postsMetadata[i].vote ? "YES" : "NO")+"</td></tr>";
      }
    } else {
      html_list = html_test_emptyList;
    }
    // TODO : make list
    res.send(200, 
      html_testAlgo1 
      + html_list
      + html_testAlgo2);
  }, options);
}