'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('geneplot', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/geneplot.html',
        controller: ['$scope', '$http', '$element', function ($scope, $http, $element) {

            var flotElem = $element.find('div.flotChart');
            $.plot(flotElem, [ [[0, 0], [1, 1]] ], { yaxis: { max: 1 }, xaxis : {max: 1 } });

        }]
    }
});
