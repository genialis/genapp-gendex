'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('sampleplot', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/sampleplot.html',
        controller: ['$scope', '$attrs', '$element', function ($scope, $attrs, $element) {

            console.log('sampleplot');

            var flotElem = $element.find('div.flotChart');
            console.log(flotElem);

            $.plot(flotElem, [ [[0, 0], [0.5, 0.5]] ], { yaxis: { max: 1 }, xaxis : {max: 1 } });


        }]
    }
});
