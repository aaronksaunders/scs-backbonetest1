


$.index.open();


var devicesCollection = Alloy.Collections.instance("Devices");
devicesCollection.fetch({
	beforeSend : devicesCollection.setHeader,
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