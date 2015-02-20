


$.index.open();


var devicesCollection = Alloy.Collections.instance("Devices");
devicesCollection.fetch({
	beforeSend : devicesCollection.setHeader,
	success : function(_r, _c) {
		console.log("Collection Response: " + JSON.stringify(_r, null, 2));
	},
	error : function(_r2, _c2) {
		console.log(_r2);
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