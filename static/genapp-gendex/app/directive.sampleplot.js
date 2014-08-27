'use strict';

angular.module('gendex.widgets')
.directive('sampleplot', function() {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/sampleplot.html',
        controller: ['$scope', '$attrs', '$element', '$timeout', 'cachedThrottle', function ($scope, $attrs, $element, $timeout, cachedThrottle) {
            console.log('inside sampleplot ctrl');
            var flotElem = $element.find('div.flotChartMds');
            var ltcc = 0;

            $scope.norms = {
                all: [
                    { name: 'Manhattan', norm: _.compose(numeric.sum, numeric.abs) },
                    { name: 'Euclidean', norm: numeric.norm2   },
                    { name: 'Maximum',   norm: numeric.norminf }
                ],
                selected: null,
                disabled: true
            };
            $scope.norms.selected = $scope.norms.all[1];

            function mds(distances, dimensions) {
                dimensions = dimensions || 2;

                var M = numeric.mul(-0.5, numeric.pow(distances, 2));

                function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
                var rowMeans = mean(M),
                    colMeans = mean(numeric.transpose(M)),
                    totalMean = mean(rowMeans);

                for (var i = 0; i < M.length; ++i) {
                    for (var j = 0; j < M[0].length; ++j) {
                        M[i][j] += totalMean - rowMeans[i] - colMeans[j];
                    }
                }

                var ret = numeric.svd(M),
                    eigenValues = numeric.sqrt(ret.S);
                return ret.U.map(function(row) {
                    return numeric.mul(row, eigenValues).splice(0, dimensions);
                });
            }

            $scope.replot = function () {
                $scope.norms.disabled = false;
                var columns = $scope.shared.sampleCols,
                    vectors = {};

                angular.forEach(columns, function (col) {
                    vectors[col] = _.pluck($scope.shared.selectedGenes, col);
                });
                var distFn = _.compose($scope.norms.selected.norm, numeric.sub);

                var distances = [];
                for (var i = 0; i < columns.length; i++) {
                    var dist = [];
                    for (var j = 0; j < columns.length; j++) {
                        if (i == j) {
                            dist.push(0);
                        } else if (i > j) {
                            dist.push(distances[j][i]);
                        } else {
                            dist.push(distFn(vectors[columns[i]], vectors[columns[j]]));
                        }
                    }
                    distances.push(dist);
                }

                var coordinates = mds(distances);

                var newSize = {
                    width: $element.parent().width() - 30,
                    height: $element.parent().height() - $element.find('.widgetControls').height() -
                            $element.parents('.windowContent').siblings('.graphHandle').height()
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
                        hoverable: true,
                        clickable: true,
                        borderWidth: {
                            top: 1,
                            right: 1,
                            bottom: 1,
                            left: 1
                        }
                    },
                    xaxes: [{
                        axisLabel: '', // TODO: Set or delete
                    }],
                    yaxes: [{
                        axisLabel: '', // TODO: Set or delete
                    }],
                };

                flotElem.css(newSize);

                // draw
                var flotPlot;
                
                $timeout(function () { //end of transition/animation
                    try {
                        for (var i = 0; i < columns.length; i++) if (/c/i.test(columns[i])) ltcc++;
                        flotPlot = $.plot(flotElem, [{data: coordinates.splice(0, ltcc), color: 'red'}, {data: coordinates, color: 'blue'}], flotOptions);
                        ltcc = 0;
                    } catch (err) {}
                }, 200);
            };

            var delayedReplot = _.debounce($scope.replot, 200);

            $scope.$watch('shared.selectedGenes', function () {
                if (!_.isEmpty($scope.shared.sampleCols)) delayedReplot();
            });

            $scope.$watch(cachedThrottle($scope, function () {
                return $element.width() + ',' + $element.height();
            }, 200), function (v) {
                if (!_.isEmpty($scope.shared.sampleCols)) delayedReplot();
            });

            function tooltips() {
                var tooltipAppendTo = flotElem;

                /** Tooltip for selected points on hover */
                var tooltipElemSelected = null;
                var contentElemSelected = null;
                $scope.hoveredItem = null;
                flotElem.on("plothover", function (event, pos, item) {
                    $scope.hoveredItem = item;
                    if(!item || flotElem.data('dragging')){
                        if(tooltipElemSelected){
                            flotDestroyTooltip(tooltipElemSelected);
                            tooltipElemSelected = null;
                        }
                    }
                    else {
                        if (!tooltipElemSelected) {
                            tooltipElemSelected = flotCreateTooltip(tooltipAppendTo);
                            contentElemSelected = tooltipElemSelected.find('.content');
                        }

                        var tooltipText;
                        if (item.seriesIndex == 0) {
                            tooltipText = ['LT', item.dataIndex + 1, 'C'].join('');
                        }
                        else {
                            tooltipText = ['LT', item.dataIndex + 1, 'P'].join('');
                        }
                        flotMoveTooltip(tooltipAppendTo, pos.pageX, pos.pageY, tooltipElemSelected, contentElemSelected, tooltipText);
                    }
                });
            }
            tooltips();
        }]
    };
});
