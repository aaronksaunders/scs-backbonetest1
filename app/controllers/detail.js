// arguments from initializing the controller
var args = arguments[0] || {};

// copies from the data from passed in module of data-binding
$.device.set(args.item.attributes);

// opens window with helper function, for platform specific UI
Alloy.Globals.openWindow($.detailWindow, true);

/**
 * closes the window with helper function, for platform specific UI
 */
function closeWindow(evt) {
	Alloy.Globals.closeWindow($.detailWindow);
}

// free the model-view data binding resources when this
// view-controller closes
$.detailWindow.addEventListener("close", function() {
	$.destroy();
});
