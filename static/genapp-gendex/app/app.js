'use strict';



var gendex = angular.module('gendex', ['genjs.filters', 'genjs.services', 'gendex.widgets', 'ngRoute', 'ngGrid']);

gendex.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    	.when('/case/:id', {
			templateUrl: '/static/genapp-gendex/partials/gendex.html',
			controller: 'GenDexCtrl'
		})
	    .otherwise({
	        redirectTo: '/',
	        templateUrl: '/static/genapp-gendex/partials/gendex.html',
	        controller: GenDexCtrl
	    });
}]);

gendex.config(['$httpProvider', function ($httpProvider) {
    // Adds a csrftoken to all http requests.
    $httpProvider.defaults.headers.common['X-CSRFToken'] = $.cookie('csrftoken');
}]);
