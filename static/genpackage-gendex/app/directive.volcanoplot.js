'use strict';

angular.module('gendex.widgets')
.directive('volcanoplot', function () {
    return {
        scope: {
            shared: '='
        },
        restrict: 'A',
        replace: false,
        templateUrl: '/static/genpackage-gendex/partials/directives/volcanoplot.html',
        controller: ['$scope', '$element', '$timeout', '$routeParams', 'notify', 'cachedThrottle', 'StorageRequest', 'DiffExpParse',
            function ($scope, $element, $timeout, $routeParams, notify, cachedThrottle, StorageRequest, DiffExpParse) {
                console.log("inside volcanoplot ctrl");
                $scope.shared.widgets.childElements.volcanoplot = $element;

                $scope.refreshingData = true;
                $scope.differentialData = {};

                // TODO: Make StateUrl respond properly to GenDex (data from location).

                /** Dev helper function. */
                // TODO: keep the watch for testing purposes (once gene selection comes into play)
                $scope.$watch('shared.selectedGenes', function (data) {
                    if (!_.isArray(data)) return;
                    var genes = _.pluck(data, 'gene');

                    $scope.differentialData.points = DiffExpParse.calculateVolcano(data);
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

                    $scope.scatterOptions.points = $scope.differentialData.points || [];
                    if (_.isEmpty($scope.scatterOptions.points)) return;

                    $timeout($scope.scatterOptions.replot, 200); //end of transition/animation
                }
                var delayedReplot = _.debounce(replot, 200);
                $scope.$watchCollection('shared.selectedGenes', delayedReplot);


                $scope.scatterOptions = {
                    xaxis: 'log2 fold change',
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
                    $scope.windowCtrl.loading(val);
                });


                $scope.$watch(cachedThrottle($scope, function () {
                    return $element.width()+','+$element.height();
                }, 200), function (v) {
                    delayedReplot();
                });

            }
        ],
        require: '^window',
        link: function (scope, elem, attr, ctrl) {
            scope.windowCtrl = ctrl;
        }
    };
});
