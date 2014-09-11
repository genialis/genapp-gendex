'use strict';

angular.module('gendex.widgets')
.directive('volcanoplot', function () {
    return {
        scope: {
            shared: '='
        },
        restrict: 'A',
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/volcanoplot.html',
        controller: ['$scope', '$element', '$timeout', '$routeParams', 'notify', 'cachedThrottle', 'StorageRequest',
            function ($scope, $element, $timeout, $routeParams, notify, cachedThrottle, StorageRequest) {
                console.log("inside volcanoplot ctrl");
                $scope.shared.widgets.childElements.volcanoplot = $element;

                $scope.refreshingData = true;
                $scope.differentialData = { json: {} };

                // TODO: Make StateUrl respond properly to GenDex (data from location).

                /** Calculate volcanoplot coordinates */
                function calcCoordinates(data) {
                    var infIdx = [];
                    var max = -Infinity;
                    var coordinates = _.map(data, function (row, idx) {
                        var x = Math.log((parseFloat(row.rpkumcase) + 1) / (parseFloat(row.rpkumctrl) + 1)) / Math.LN2;
                        var y = -Math.log(parseFloat(row.fdr_de)) / Math.LN10;
                        if (row.fdr_de == 0) infIdx.push(idx);
                        if (y > max && y < Infinity) max = y;
                        return [x, y];
                    });

                    _.forEach(infIdx, function (val) { // map Infinity coordinates to next max
                        coordinates[val][1] = max;
                    });

                    return coordinates;
                }

                /** Dev helper function. */
                // TODO: keep the watch for testing purposes (once gene selection comes into play)
                $scope.$watch('shared.selectedGenes', function (data) {
                    if (!_.isArray(data)) return;
                    var genes = _.pluck(data, 'gene');

                    $scope.differentialData.json = {flot: {data: calcCoordinates(data)}};
                    $scope.differentialData.dictIxGenes = genes;
                    $scope.differentialData.dictGeneIxs = _.invert(genes);

                    replot();
                });

                function replot() {
                    var newSize = {
                        width: $element.parent().width() - 30,
                        height: $element.parent().height() - $element.find('.widgetControls').height() -
                                $element.parents('.windowContent').siblings('.graphHandle').height()
                    };
                    var flotElem = $element.find('div.flotChart');
                    flotElem.css(newSize);

                    $scope.scatterOptions.points = _.path($scope.differentialData, 'json.flot.data') || [];
                    if (_.isEmpty($scope.scatterOptions.points)) return;

                    $timeout($scope.scatterOptions.replot, 200); //end of transition/animation
                }
                var delayedReplot = _.debounce(replot, 200);
                $scope.$watchCollection('shared.selectedGenes', delayedReplot);


                $scope.scatterOptions = {
                    xaxis: 'log2',
                    yaxis: '-log10(FDR)',
                    onInit: function (options) {
                    },
                    onDraw: function (flot, ctx) {
                        $scope.refreshingData = false;
                    },
                    getTooltipText: function (item) {
                        var geneID = $scope.differentialData.dictIxGenes[item.mainIndex];
                        return $scope.shared.geneInfo[geneID]['name'];
                    },
                    getSelectedPointIxs: function () {
                        if (!$scope.differentialData.dictGeneIxs) return [];
                        return _.map($scope.shared.selectedGenes, function (geneID) {
                            return $scope.differentialData.dictGeneIxs[geneID];
                        });
                    },
                    getMarkedPointIxs: function () {
                        return [];
                    },
                    onSingleSelect: function (ix, modifierOn, options) {
                        var geneID = $scope.differentialData.dictIxGenes[ix];
                        if (!modifierOn) {
                            $scope.shared.setSelectedGenes([geneID], true); // TODO: make selection
                        }
                        if (modifierOn && !_.contains($scope.shared.selectedGenes, geneID)) {
                            $scope.shared.addSelectedGenes([geneID], true);
                        }
                        if (modifierOn && _.contains($scope.shared.selectedGenes, geneID)) {
                            $scope.shared.setSelectedGenes(_.without($scope.shared.selectedGenes, geneID), true);
                        }
                    },
                    onListSelect: function (ixs, modifierOn, options) {
                        var geneIDs = _.at($scope.differentialData.dictIxGenes, ixs);

                        if (!modifierOn) {
                            $scope.shared.setSelectedGenes(geneIDs, true);
                        } else {
                            $scope.shared.addSelectedGenes(geneIDs, true);
                        }
                    }
                };

                $scope.$watch('refreshingData', function (val) {
                    //getting to <window> scope...
                    $element.parent().scope().$emit( val ? 'dimOn' : 'dimOff' );
                    $element.parent().scope().$emit( val ? 'loadOn' : 'loadOff' );
                });


                $scope.$watch(cachedThrottle($scope, function () {
                    return $element.width()+','+$element.height();
                }, 200), function (v) {
                    delayedReplot();
                });

            }
        ]
    };
});
