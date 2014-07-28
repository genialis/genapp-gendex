'use strict';

angular.module('gendex.widgets')
.directive('geneplot', function() {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/geneplot.html',
        controller: ['$scope', '$http', '$element', '$timeout', '$compile', function ($scope, $http, $element, $timeout, $compile) {  //storageRequest, notify
            // console.log("inside genplot ctrl");

            $scope.selectedGraph = 1;

            var flotElem = $element.find('div.flotChart');

            var xAxis, yAxis, xValues, yValues;

            $scope.replot = function () {
                // console.log('replot genplot');
                if (!$scope.shared.filteredRows) return;

                xAxis = 'logcpm';
                yAxis = $scope.selectedGraph == 1 ? 'fdr' : 'logfc';
                xValues = _.pluck($scope.shared.filteredRows, xAxis);
                yValues = _.pluck($scope.shared.filteredRows, yAxis);

                var newSize = {
                    width: $element.width(),
                    height: $element.width()
                };

                var flotOptions = {
                    series: {
                        points: {
                            show: true,
                            radius: 1,
                            lineWidth: 2,
                            fill: false
                        },
                        shadowSize: 0
                    },
                    grid: {
                        hoverable: true,
                        clickable: true,
                        borderWidth: {
                            top: 0,
                            right: 0,
                            bottom: 1,
                            left: 1
                        }
                    },
                    legend: false,
                    zoom: {
                        interactive: false
                    },
                    pan: {
                        interactive: false
                    },
                    selection: {
                        mode: "xy",
                        color: "#5bc0de"
                    }
                };

                flotElem.css(newSize);

                var flotPlot;
                try{
                    flotPlot = $.plot(flotElem, [{data: _.zip(xValues, yValues), color: 'gray'}], flotOptions);
                } catch (err) {}
            };

            flotElem.bind("plotselected", function(event, ranges) {
                $scope.shared.selectedGenes = _.filter($scope.shared.data, function (row) {
                    return ((ranges.xaxis.from < row[xAxis]) && (row[xAxis] < ranges.xaxis.to) &&
                            (ranges.yaxis.from < row[yAxis]) && (row[yAxis] < ranges.yaxis.to));
                });
                if (!$scope.$$phase) $scope.$apply();
            });

            flotElem.bind("plotunselected", function () {
                $scope.shared.selectedGenes = [];
                if (!$scope.$$phase) $scope.$apply();
            });

            var tooltipElem = $element.find('div.tooltip');
            flotElem.bind("plothover", function (event, pos, item) {
                if (item) {
                    var x = pos.pageX - $element.position().left,
                        y = pos.pageY - $element.position().top;
                    tooltipElem.html($scope.shared.filteredRows[item.dataIndex]['gene']);
                    tooltipElem.css({top: y-20, left: x});
                    tooltipElem.fadeIn(200);
                } else {
                    tooltipElem.hide();
                }
            });

            $scope.$watch("shared.filteredRows", function () {
                $scope.replot();
            });

        }]
    };
});
