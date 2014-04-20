'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('sampleplot', function() {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/sampleplot.html',
        controller: ['$scope', '$attrs', '$element', function ($scope, $attrs, $element) {
            console.log('inside sampleplot ctrl');

            var flotElem = $element.find('div.flotChart');

            $scope.replot = function () {


                console.log('replot sampleplot');

                var lt1c = _.pluck($scope.shared.filteredRows, 'lt1c'),
                    lt2c = _.pluck($scope.shared.filteredRows, 'lt2c'),
                    lt3c = _.pluck($scope.shared.filteredRows, 'lt3c'),
                    lt1p = _.pluck($scope.shared.filteredRows, 'lt1p'),
                    lt2p = _.pluck($scope.shared.filteredRows, 'lt2p'),
                    lt3p = _.pluck($scope.shared.filteredRows, 'lt3p');

                var newSize = {
                    width: $element.width(),
                    height: $element.width()
                };

                var flotOptions = {
                    series: {
                        points: {
                            show: true,
                            radius: 5,
                            fill: true
                        },
                        shadowSize: 0
                    },
                    grid: {
                        borderWidth: {
                            top: 0,
                            right: 0,
                            bottom: 1,
                            left: 1
                        }
                    },
                    xaxis: {
                        min: 0,
                        max: 1
                    },
                    yaxis: {
                        min: 0,
                        max: 1
                    }
                };

                flotElem.css(newSize);

                var flotPlot;
                try{
                    flotPlot = $.plot(flotElem, [{data: [[0.15, 0.1], [0.2, 0.05], [0.1, 0.3]], color: 'red'}, {data: [[0.95, 0.9], [0.8, 0.95], [0.85, 0.8]], color: 'blue'}], flotOptions);
                } catch (err) {}
            };

            $scope.$watch("shared.filteredRows", function () {
                $scope.replot();
            });
        }]
    }
});
