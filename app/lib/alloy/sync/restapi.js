function InitAdapter() {

	return {};
}

/*
 * this function makes the actual HTTP request to the server
 * utilizing the options that were passed in from the sync
 * call.
 *
 * the _callback parameter is the function that will be called
 * when the http request is fulfilled with a response from the
 * server
 */
function apiCall(_options, _callback) {

	var xhr = Ti.Network.createHTTPClient({
		timeout : ONE_MINUTE / 2
	});
	xhr.options = _options;
	xhr.open(_options.type, _options.url);

	xhr.onload = function() {

		var data = null;
		try {

			data = JSON.parse(xhr.responseText);
			Ti.API.debug("apiCall response Text::" + xhr.responseText);
			_callback({
				success : true,
				text : xhr.responseText || null,
				data : data || null
			});
		} catch (EE) {
			Ti.API.error("Error parsing response text: " + EE);
			Ti.API.error("Error parsing response text: " + xhr.responseText);
			_callback({
				success : false,
				text : xhr.responseText || null,
				data : data || null
			});
		}
	};
	xhr.onerror = function() {

		_callback({
			success : false,
			text : xhr.responseText
		});
		Ti.API.error("Error Text::" + xhr.responseText);
	};
	for (var header in _options.headers) {
		xhr.setRequestHeader(header, _options.headers[header]);
	}
	_options.beforeSend && _options.beforeSend(xhr);

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

/**
 * this call maps the BackboneJS calls to the specific HTTP verbs
 * so that the proper http request can be made
 *
 * @param {Object} method
 * @param {Object} model
 * @param {Object} opts
 */
function Sync(method, model, opts) {

	// map method to HTTP VERB
	var methodMap = {
		create : "POST",
		read : "GET",
		update : "PUT",
		"delete" : "DELETE"
	};
	var type = methodMap[method];

	// set all of the opts to  the local variable
	var params = _.extend({}, opts);

	// allow for overriding the HTTP verb
	params.type = params.type || type;

	// get the headers or set them to an empty set
	params.headers = params.headers || {};

	// get the url for the request from the parameters or
	// check to see if it was provided by the model
	if (!params.url) {
		params.url = model && model.url && model.url();
		if (!params.url) {
			Ti.API.debug("fetch ERROR: NO BASE URL");
			return;
		}
	}

	// for legacy support - not applicable in most scenarios
	if (Alloy.Backbone.emulateJSON) {
		params.contentType = "application/x-www-form-urlencoded";
		params.processData = true;
		params.data = params.data ? {
			model : params.data
		} : {};
	}

	// if the API does not support PUT and DELETE it is handled here
	if (Alloy.Backbone.emulateHTTP && ("PUT" === type || "DELETE" === type)) {
		Alloy.Backbone.emulateJSON && (params.data._method = type);
		params.type = "POST";
		params.beforeSend = function() {
			params.headers["X-HTTP-Method-Override"] = type;
		};
	}

	// a catch to deal with old issue with Android HTTP library
	!Ti.Android && (params.headers["Content-Type"] = "application/json; charset=utf-8");

	// local/private function for handle  the response from
	// the server
	var callbackOptions = function(_resp) {
		if (_resp.success) {
			params.success(_resp.data || _resp.text, _resp.text);
		} else {
			try {
				params.error && params.error(JSON.parse(_resp.text), _resp.text);
			} catch (EE) {
				params.error && params.error({}, _resp.text);
			}
			Ti.API.debug("ERROR" + _resp.text);
			model.trigger("error");
		}
	};

	// if there is a model id then set the id on the URL
	// we are assuming the end point follows the normal REST API
	// convention
	debugger;
	var modelId = (model[model.idAttribute] || model.get(model.idAttribute));
	if (modelId) {
		params.url = params.url + '/' + modelId;
	}

	// if the JSON object to be persisted is provided as a parameter,
	//then use that data and NOT the data in the actual model
	if (opts.JSON) {
		params.data = model.toJSON();
	} else
	// add the data to the query string NOT the body of the request
	if (opts.data || !model || "create" != method && "update" != method) {
		if (opts.data) {
			var query = "";
			for (var i in opts.data) {
				query += i + "=" + opts.data[i] + "&";
			}
			params.url += "?" + query.substring(0, query.length - 1);
			params.data = null;
		}
	} else
	// add the data to the body of the request
	{
		params.data = JSON.stringify(model.toJSON());
	}

	// display the URL to be used for API call
	Ti.API.debug("THE URL " + params.url);

	// make the appropriate API call
	switch (method) {
	case "delete":
	case "update":

		apiCall(params, function(_r) {
			callbackOptions(_r);
			model.trigger( _r ? "fetch change sync" : "error");
		});
		break;

	case "create":
		apiCall(params, function(_r) {
			callbackOptions(_r);
			model.trigger( _r ? "fetch sync" : "error");
		});
		break;

	case "read":

		apiCall(params, function(_r) {
			callbackOptions(_r);
			model.trigger( _r ? "fetch sync" : "error");
		});
	}
}

var ONE_MINUTE = 6e4;

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
