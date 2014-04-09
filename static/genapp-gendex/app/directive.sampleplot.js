'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('sampleplot', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/sampleplot.html',
        controller: ['$scope', '$attrs', function ($scope, $attrs) {



        }]
    }
});
