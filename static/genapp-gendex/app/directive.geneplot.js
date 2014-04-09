'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('geneplot', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/geneplot.html',
        controller: ['$scope', '$attrs', function ($scope, $attrs) {



        }]
    }
});
