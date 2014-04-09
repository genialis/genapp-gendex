'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('dextable', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/dextable.html',
        controller: ['$scope', '$attrs', function ($scope, $attrs) {
            $scope.gridOptions = {
                data: []
            };
        }]
    }
});
