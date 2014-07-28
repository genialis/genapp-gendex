'use strict';


angular.module('gendex', ['genjs.filters', 'genjs.services', 'gendex.controllers', 'gendex.widgets', 'ngRoute', 'ngGrid'])
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    	.when('/data/:id', {
			templateUrl: '/static/genapp-gendex/partials/gendex.html',
			controller: 'GenDexCtrl'
		})
	    .otherwise({
	        redirectTo: '/',
	        templateUrl: '/static/genapp-gendex/partials/gendex.html',
	        controller: 'GenDexCtrl'
	    });
}])
.config(['$httpProvider', function ($httpProvider) {
    // Adds a csrftoken to all http requests.
    $httpProvider.defaults.headers.common['X-CSRFToken'] = $.cookie('csrftoken');
}])
;
