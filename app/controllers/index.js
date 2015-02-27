var selectedItem = Alloy.Models.device;

var deviceCollection = Alloy.Collections.instance("device");
deviceCollection.fetch({
	beforeSend : deviceCollection.setHeader,
	success : function(collection, response, option) {
		console.log("Collection Response: " + JSON.stringify(collection, null, 2));
	},
	error : function(collection, response, option) {
		console.log(response);
	}
});

/**
 devicesCollection.getAll({
 success : function(_r, _c) {
 console.log("Collection Response: " + JSON.stringify(_r, null, 2));
 },
 error : function(_r2, _c2) {
 console.log(_r);
 }
 });

 */

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

/**
 *
 * @param {Object} evt
 */
function doOpen(evt) {
	if (OS_ANDROID) {
	}
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
