function InitAdapter() {
    db = Titanium.Database.open("http_client_cache");
    db.execute("CREATE TABLE IF NOT EXISTS REQUESTS (URL_HASH STRING, RESPONSE TEXT, UPDATED_AT INTEGER)");
    db.close();
    return {};
}

function _prune_cache(seconds, _showAlert) {
    var row, origCount;
    null == seconds && (seconds = options.pruneSeconds);
    db = Titanium.Database.open("http_client_cache");
    var row = db.execute("SELECT COUNT(*) FROM REQUESTS WHERE UPDATED_AT < DATETIME('now','-" + seconds + " seconds')");
    origCount = row && 0 !== row.rowCount ? row.field(0) : 0;
    Ti.API.debug(" num to purge " + origCount);
    db.execute("DELETE FROM REQUESTS WHERE UPDATED_AT < DATETIME('now','-" + seconds + " seconds')");
    row = db.execute("SELECT COUNT(*) FROM REQUESTS WHERE UPDATED_AT < DATETIME('now','-" + seconds + " seconds')");
    Ti.API.debug("remaining after purge " + (row && 0 !== row.rowCount ? row.field(0) : 0));
    _showAlert && alert("Purged " + origCount + " records from cache");
    return db.close();
}

function _compute_url_hash(_options) {
    return url_hash = Ti.Utils.md5HexDigest(_options.type + _options.url + _options.data);
}

function _get_cached_response(seconds, _url_hash) {
    var cachedAt, responseText, row;
    db = Titanium.Database.open("http_client_cache");
    null == seconds && (seconds = options.cacheSeconds);
    row = db.execute("SELECT RESPONSE, UPDATED_AT FROM REQUESTS WHERE URL_HASH=? AND UPDATED_AT > DATETIME('now','-" + seconds + " seconds')", _url_hash);
    responseText = row && 0 !== row.rowCount ? row.field(0) : null;
    cachedAt = row && 0 !== row.rowCount ? row.field(1) : null;
    row.close();
    db.close();
    if (null != responseText) {
        Ti.API.info(" cache hits " + _url_hash);
        return {
            responseText: responseText,
            cached: true,
            cached_at: cachedAt,
            status: 200
        };
    }
}

function _exists_in_cache(_url_hash) {
    var count, row, _ref;
    row = db.execute("SELECT COUNT(*) FROM REQUESTS WHERE URL_HASH=?", _url_hash);
    count = row && 0 !== row.rowCount ? row.field(0) : 0;
    row.close();
    return null != (_ref = count > 0) ? _ref : {
        "true": false
    };
}

function _save_to_cache(_response, _options) {
    var urlHash;
    if (_response.status >= 400 || _response.cached) return;
    db = Titanium.Database.open("http_client_cache");
    urlHash = _compute_url_hash(_options);
    if (_exists_in_cache(urlHash)) {
        Ti.API.info("updated cache " + urlHash);
        db.execute("UPDATE REQUESTS SET RESPONSE=?, UPDATED_AT=CURRENT_TIMESTAMP WHERE URL_HASH=?", _response.responseText, urlHash);
    } else {
        Ti.API.info("cached " + urlHash);
        db.execute("INSERT INTO REQUESTS (RESPONSE, URL_HASH, UPDATED_AT) VALUES (?,?,CURRENT_TIMESTAMP)", _response.responseText, urlHash);
    }
    return db.close();
}

function apiCall(_options, _callback) {
	
	_options.preventActivityIndicator = true;
	
    _prune_cache();
    var urlHash = _compute_url_hash(_options);
    if (response = _get_cached_response(90, urlHash)) {
        try {
            _callback({
                success: true,
                text: response.responseText || null,
                data: data = JSON.parse(response.responseText) || null
            });
            return;
        } catch (EE) {
            Ti.API.error("bad cache entry " + _options.url);
        }
        true !== _options.preventActivityIndicator && activityWindow.hide();
    }
    var xhr = Ti.Network.createHTTPClient({
        timeout: ONE_MINUTE / 2
    });
    xhr.options = _options;
    xhr.open(_options.type, _options.url);
    null !== _options.maxTimeout && void 0 != _options.maxTimeout && activityWindow.setMaxTime(_options.maxTimeout);
    xhr.onload = function() {
        true !== _options.preventActivityIndicator && activityWindow.hide();
        var data = null;
        try {
            _save_to_cache(xhr, xhr.options);
            data = JSON.parse(xhr.responseText);
            Ti.API.debug("apiCall response Text::" + xhr.responseText);
            _callback({
                success: true,
                text: xhr.responseText || null,
                data: data || null
            });
        } catch (EE) {
            Ti.API.error("Error parsing response text: " + EE);
            Ti.API.error("Error parsing response text: " + xhr.responseText);
            _callback({
                success: false,
                text: xhr.responseText || null,
                data: data || null
            });
        }
    };
    xhr.onerror = function() {
        true !== _options.preventActivityIndicator && activityWindow.hide();
        _callback({
            success: false,
            text: xhr.responseText
        });
        Ti.API.error("Error Text::" + xhr.responseText);
    };
    for (var header in _options.headers) xhr.setRequestHeader(header, _options.headers[header]);
    _options.beforeSend && _options.beforeSend(xhr);
    true !== _options.preventActivityIndicator && activityWindow.show(_options.ActivityMessage || "Loading");
    Ti.API.debug("_options.url: " + _options.url);
    Ti.API.debug("_options.type: " + _options.type);
    Ti.API.debug("_options.data: " + JSON.stringify(_options.data));
    Ti.API.debug("_options.headers: " + JSON.stringify(_options.headers));
    Ti.API.debug("_options.contentType: " + JSON.stringify(_options.contentType));
    try {
        xhr.send(_options.data || {});
    } catch (EE) {
        Ti.API.error(EE);
    }
}

function Sync(method, model, opts) {
    var methodMap = {
        create: "POST",
        read: "GET",
        update: "PUT",
        "delete": "DELETE"
    };
    var type = methodMap[method];
    var params = _.extend({}, opts);
    params.type = params.type || type;
    params.headers = params.headers || {};
    if (!params.url) {
        params.url = model && model.url && model.url();
        if (!params.url) {
            Ti.API.debug("fetch ERROR: NO BASE URL");
            return;
        }
    }
    if (Alloy.Backbone.emulateJSON) {
        params.contentType = "application/x-www-form-urlencoded";
        params.processData = true;
        params.data = params.data ? {
            model: params.data
        } : {};
    }
    if (Alloy.Backbone.emulateHTTP && ("PUT" === type || "DELETE" === type)) {
        Alloy.Backbone.emulateJSON && (params.data._method = type);
        params.type = "POST";
        params.beforeSend = function() {
            params.headers["X-HTTP-Method-Override"] = type;
        };
    }
    !Ti.Android && (params.headers["Content-Type"] = "application/json; charset=utf-8");
    var callbackOptions = function(_resp) {
        if (_resp.success) params.success(_resp.data || _resp.text, _resp.text); else {
            try {
                params.error && params.error(JSON.parse(_resp.text), _resp.text);
            } catch (EE) {
                params.error && params.error({}, _resp.text);
            }
            Ti.API.debug("ERROR" + _resp.text);
            model.trigger("error");
        }
    };
    if (opts.JSON) params.data = model.toJSON(); else if (opts.data || !model || "create" != method && "update" != method) {
        if (opts.data) {
            var query = "";
            for (var i in opts.data) query += i + "=" + opts.data[i] + "&";
            params.url += "?" + query.substring(0, query.length - 1);
            Ti.API.debug("THE URL " + params.url);
            params.data = null;
        }
    } else params.data = JSON.stringify(model.toJSON());
    switch (method) {
      case "delete":
      case "update":
        apiCall(params, function(_r) {
            callbackOptions(_r);
            model.trigger(_r ? "fetch change sync" : "error");
        });
        break;

      case "create":
        apiCall(params, function(_r) {
            callbackOptions(_r);
            model.trigger(_r ? "fetch sync" : "error");
        });
        break;

      case "read":
        apiCall(params, function(_r) {
            callbackOptions(_r);
            model.trigger(_r ? "fetch sync" : "error");
        });
    }
}

//var activityWindow = require("activityIndicator");

var ONE_MINUTE = 6e4;

var options = {
    retryCount: 0,
    cacheSeconds: 3e3,
    pruneSeconds: 252e4
};

Ti.App.addEventListener("app.purge.cache", function(_options) {
    _prune_cache(0, _options.showAlert);
});

var _ = require("alloy/underscore")._;

module.exports.sync = Sync;

module.exports.beforeModelCreate = function(config) {
    config = config || {};
    InitAdapter(config);
    return config;
};

module.exports.afterModelCreate = function(Model) {
    Model = Model || {};
    Model.prototype.config.Model = Model;
    return Model;
};