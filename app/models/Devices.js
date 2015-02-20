/** ===========================================================================
 *
 * This is a sample model file that is integrated to a Kinvey back end. This
 * file holds the information for both the model and collection called Devices
 *
 * This is loosely structured on the BackboneJS model, information on BackboneJS
 * is available here -
 *
 * Information on Appcelerator Alloy Model/Collection implementation is available
 * here
 *
 * ============================================================================
 */

// I have saved constants in an external file that is included here using the
// javascript requires functionality
//
// Best Practices for Alloy and discussion on requires:
//    http://docs.appcelerator.com/titanium/3.0/#!/guide/Alloy_Best_Practices_and_Recommendations
//
var KINVEY_CONST = require("kinveyConstants").constants;

//
// SEE HOW WE HAVE REQUIRED THE LIBRARY FILE AND UTILZED THE
// INFORMATION FROM THAT FILE
console.log(KINVEY_CONST.url);

exports.definition = {
	config : {

		adapter : {
			// Specifiy the sync adapter to use for this model
			// and collection
			type : "restapi",

			// collection name property, not really needed when using
			// the REST API sync adapter
			collection_name : "Devices"
		}
	},
	/**
	 * model for the collection below
	 */
	extendModel : function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
			url : function() {
				return KINVEY_CONST.url;
			}
		});

		return Model;
	},
	/**
	 * This is the collection associated with the model above.
	 */
	extendCollection : function(Collection) {
		_.extend(Collection.prototype, {
			//
			// extended functions and properties go here.
			//
			// you can add functions that will be specific to this collection. It is a way
			// to separate out all model/collection specific functionality without
			// scattering it all over various controllers
			//
			/**
			 * returns the url that is associated with this collection
			 */
			url : function() {
				return KINVEY_CONST.url;
			},
			/**
			 * a function for setting the header when requests are made.
			 *
			 * @param {Object} xhr
			 */
			setHeader : function(xhr) {
				xhr.setRequestHeader("Authorization", KINVEY_CONST.basicAuthValue);
			},
			/**
			 * a helper function to simplify the fetching of the collection and hiding
			 * the complexity setting the headers on each request
			 *
			 * @param {Object} _options
			 */
			getAll : function(_options) {
				this.fetch(_.extend(_options, {
					beforeSend : this.setHeader
				}));
			}
		});

		return Collection;
	}
};
