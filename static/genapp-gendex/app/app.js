'use strict';



var gendex = angular.module('gendex', ['gendex.filters', 'gendex.services', 'gendex.widgets', 'ngRoute', 'ngGrid']);

gendex.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.otherwise({
        redirectTo: '/',
        templateUrl: '/static/genapp-gendex/partials/gendex.html',
        controller: GenDexCtrl
    });
}]);

gendex.config(['$httpProvider', function ($httpProvider) {
    // Adds a csrftoken to all http requests.
    $httpProvider.defaults.headers.common['X-CSRFToken'] = $.cookie('csrftoken');
}]);
