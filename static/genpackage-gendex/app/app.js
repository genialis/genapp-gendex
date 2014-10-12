'use strict';


// angular.module('gendex', ['ngRoute', 'ngGrid', 'genjs.filters', 'genjs.services', 'genjs.table', 'genjs.tags', 'genjs.editabletags',
// 	'gendex.controllers', 'gendex.widgets', 'genexpress.widgets', 'genexpress.services', 'genexpress.directives', 'genexpress.controllers',
// 	'genexpress.filters', 'ui.date', 'blueimp.fileupload', 'ui.bootstrap', 'ui.bootstrap.position', 'ui.bootstrap.typeahead'])
angular.module('gendex', ['ngRoute', 'ngGrid', 'genjs.filters', 'genjs.services',
	'gendex.controllers', 'gendex.widgets',
	'genexpress.services', 'genexpress.directives', 'genexpress.widgets',
	'ui.date', 'ui.bootstrap', 'ui.bootstrap.position', 'ui.bootstrap.typeahead'])
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    	.when('/data/:id', {
			templateUrl: '/static/genpackage-gendex/partials/gendex.html',
			controller: 'GenDexCtrl'
		})
	    .otherwise({
	        redirectTo: '/',
	        templateUrl: '/static/genpackage-gendex/partials/gendex.html',
	        controller: 'GenDexCtrl'
	    });
}])
.constant('title', 'GenDex')
;
