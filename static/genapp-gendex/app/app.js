'use strict';

var gendex = angular.module('gendex', ['gendex.widgets', 'ngRoute', 'ngGrid']);

gendex.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.otherwise({
        redirectTo: '/',
        templateUrl: '/static/genpackage-gendex/partials/gendex.html',
        controller: GenDexCtrl
    });
}]);

gendex.config(function ($httpProvider) {
    // Adds a csrftoken to all http requests.
    $httpProvider.defaults.headers.common['X-CSRFToken'] = $.cookie('csrftoken');
});
