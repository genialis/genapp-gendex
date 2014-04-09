'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('dextable', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/dextable.html',
        controller: ['$scope', '$attrs', function ($scope, $attrs) {
            $scope.myData = [{name: "Moroni", age: 50},
                     {name: "Tiancum", age: 43},
                     {name: "Jacob", age: 27},
                     {name: "Nephi", age: 29},
                     {name: "Enos", age: 34}];

            $scope.gridOptions = {
                data: 'myData'
            };
        }]
    }
});
