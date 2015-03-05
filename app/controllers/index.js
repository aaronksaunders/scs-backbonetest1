// using for time formatting - http://momentjs.com/
var moment = require('moment');

var selectedItem = Alloy.Models.device;

var deviceCollection = Alloy.Collections.instance("device");
/**
 deviceCollection.fetch({
 beforeSend : deviceCollection.setHeader,
 success : function(collection, response, option) {
 console.log("Collection Response: " + JSON.stringify(collection, null, 2));
 },
 error : function(collection, response, option) {
 console.log(response);
 }
 });
 */

deviceCollection.getAll({
	success : function(collection, response, option) {
		console.log("Collection Response: " + JSON.stringify(collection, null, 2));
	},
	error : function(collection, response, option) {
		console.log(response);
	}
});

function doOnTableViewClick(_event) {

	// use the 'index' property from the event to determine
	// which model from the collection was selected
	var currentItem = deviceCollection.at(_event.index);

	// log for debugging purposes and convert object to
	// string that is readable
	console.log(JSON.stringify(currentItem, null, 2));

	// create the new controller and pass in the
	// model object as an argument 'item'
	var ctrl = Alloy.createController('detail', {
		'item' : currentItem
	});
}

/**
 *
 */
function sampleOfFetchingAModel() {
	var deviceModel = Alloy.Models.instance("device");
	var modelID = "54e0d1d502f817bc0600442a";

	deviceModel.authFetch(modelID, {
		success : function(_r, _c) {
			// log the output
			console.log("deviceModel.fetch: " + JSON.stringify(_r, null, 2));
		},
		error : function(_r2, _c2) {
			// log an error
			console.log("Error- deviceModel.fetch " + _r);
		}
	});
}

/**
 *
 */
function sampleOfSavingAModel() {
	// create a new model and save it
	//1) create a model object
	var deviceModel = Alloy.Models.instance("device");

	// 2) set attributes on the model
	deviceModel.set({
		"first_col" : "Added from Appcelerator",
		"second_col" : "So we begin",
	});

	// 3) save the model using the extended helper function created
	// to encapsulate the kinvey authentication in the model object
	deviceModel.authSave({
		success : function(_r, _c) {
			// log the output
			console.log("deviceModel.save: " + JSON.stringify(_r, null, 2));
		},
		error : function(_r2, _c2) {
			// log an error
			console.log("Error- deviceModel.save " + _r);
		}
	});
}

/**
 *
 */
function sampleOfUpdatingAModel() {
	// create a new model and save it
	//1) get a model object
	var deviceModel = Alloy.Models.instance("device");
	var modelID = "54e0d1d502f817bc0600442a";

	deviceModel.authFetch(modelID, {
		success : function(_r, _c) {

			// 2) set attributes on the model that you
			//    want to update
			deviceModel.set({
				"first_col" : "Added from Home Again"
			});

			// 3) save the model using the extended helper function created
			//    to encapsulate the kinvey authentication in the model object
			//    the rest adapter will know what to do, save or update based
			//    on the existence of the model id
			deviceModel.authSave({
				success : function(_model, _response) {
					// log the output
					console.log("deviceModel.update: " + JSON.stringify(_model, null, 2));

					// this will cause the UI to update to reflect the changes
					var collection = Alloy.Collections.instance("device");
					collection.getAll({});
				},
				error : function(_model, _response) {
					// log an error
					console.log("Error- deviceModel.update " + JSON.stringify(_response, null, 2));
				}
			});
		},
		error : function(_model, _response) {
			// log an error
			console.log("Error- deviceModel.update when fetching " + _model);
		}
	});

}

/**
 *
 * @param {Object} evt
 */
function doOpen(evt) {
	if (OS_ANDROID) {
	}
}

/**
 * used to transform the model for easier output on the UI.
 * 
 * this specifically was need to get the last modified date and the
 * creation date.
 * 
 * @param {Object} _model
 */
function transform(_model) {
	var transform = _model.toJSON();
	return {
		first_col : transform.first_col,
		second_col : transform.second_col,
		
		// format the date using moment library
		lastModified : moment(transform._kmd.lmt).format('MMMM Do YYYY, h:mm:ss a'),
	};
}

//
// Need to handle opening the windows based on the platform
// Since on IOS we need the NavigationWindow opened first and
// on android we do not.
if (OS_IOS) {
	Alloy.Globals.navWindow = $.getView();

	Alloy.Globals.navWindow.open();
} else {
	$.getView().open();
}
//
Alloy.Collections.instance("device").on('sync', function(_model) {
	alert('collection has been changed ' + JSON.stringify(_model));
});

sampleOfUpdatingAModel();

