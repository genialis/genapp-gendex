'use strict';

angular.module('gendex.widgets')
.directive('volcanowidget', function () {
    return {
        scope: {
            shared: '='
        },
        restrict: 'A',
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/volcanowidget.html',
        controller: ['$scope', '$element', '$routeParams', function ($scope, $element, $routeParams) {

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
            //$scope.shared.selectedDiffType = $routeParams.id;

            $scope.volcanoOptions = {
                onInit: function (volcanoScope) {

                    /** Dev helper function. */
                    // TODO: keep the watch for testing purposes (once gene selection comes into play)
                    volcanoScope.$watch('shared.selectedGenes', function (data) {
                        if (!_.isArray(data)) return;
                        var fakejson = {
                            'flot': {'data': calcCoordinates(data)},
                            'xlabel': 'log2',
                            'ylabel': '-log10(FDR)',
                            'genes': _.pluck(data, 'gene')
                        };
                
                        volcanoScope.differentialData.json = fakejson;
                        volcanoScope.differentialData.dictIxGenes = fakejson.genes;
                        volcanoScope.differentialData.dictGeneIxs = _.invert(fakejson.genes); // needed for getSelectedPointIxs

                        volcanoScope.replot();
                    });

                    volcanoScope.$watch('refreshingData', function (val) {
                        //getting to <window> scope...
                        $element.parent().scope().$emit( val ? 'dimOn' : 'dimOff' );
                        $element.parent().scope().$emit( val ? 'loadOn' : 'loadOff' );
                    });
                },
                onSingleSelect: function (volcanoScope, ix, modifierOn, options) {
                    var geneID = volcanoScope.differentialData.dictIxGenes[ix];
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
                onListSelect: function (volcanoScope, ixs, modifierOn, options) {
                    var geneIDs = _.at(volcanoScope.differentialData.dictIxGenes, ixs);

                    if (!modifierOn) {
                        volcanoScope.shared.setSelectedGenes(geneIDs, true);
                    } else {
                        volcanoScope.shared.addSelectedGenes(geneIDs, true);
                    }
                }
            };

        }]
    };
});