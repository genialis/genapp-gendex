'use strict';

var gendex = angular.module('gendex', ['ngRoute']);

gendex.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.otherwise({
        redirectTo: '/',
        templateUrl: '/static/genapp-gendex/partials/gendex.html',
        controller: GenDexCtrl
    });
}]);

gendex.config(function ($httpProvider) {
    // Adds a csrftoken to all http requests.
    $httpProvider.defaults.headers.common['X-CSRFToken'] = $.cookie('csrftoken');
});
