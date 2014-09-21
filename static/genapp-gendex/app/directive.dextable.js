'use strict';

angular.module('gendex.widgets')
.directive('dextable', function () {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/dextable.html',
        controller: ['$scope', 'filterByFieldText', 'notify', 'Data', '$routeParams', 'DiffExpParse',
        function ($scope, filterByFieldText, notify, Data, $routeParams, DiffExpParse) {
            console.log('inside dextable ctrl');
            // TODO remove shared.gendex when StateUrl gets fixed for GenDex
            $scope.shared.gendex = true;
            $scope.shared.sampleCols = [];
            $scope.gridVisible = false;

            var split = _.curry(function (delim, str) {
                return str.split(delim);
            });
            var replace = _.curry(function (from, to, str) {
                return str.replace(from, to);
            });

            // request JSON data
            Data.get({'id': $routeParams.id}, function (diffData) {
                if (!diffData || !_.contains(diffData.type, 'differentialexpression') || !_.contains(diffData.status, 'done')) {
                    notify({message: 'Bad data requested', type: 'error'});
                    return;
                }
                if (!diffData.output && diffData.output.diffexp && diffData.output.diffexp.file) {
                    notify({message: 'Differential Expressions file is missing in requested data', type: 'error'});
                    return;
                }
                // request tab-delimited file
                Data.download({'id': $routeParams.id, 'file': diffData.output.diffexp.file}, function (raw) {
                    var parsed = DiffExpParse.parseTab(raw.data);
                    $scope.shared.sampleCols = parsed.sampleCols;
                    $scope.columnDefs = parsed.cols;
                    $scope.shared.data = parsed.rows;
                    $scope.shared.selectedGenes = parsed.rows;
                    $scope.gridVisible = true;
                }, notify.error('get Differential Expressions file'));
            }, notify.error('get Differential Expressions data'));

            // testing whether we can do without commented rows
            $scope.selectedItems = [];
            $scope.gridOptions = {
                data: 'shared.selectedGenes',
                filterOptions: { filterText: '', useExternalFilter: true},
                selectedItems: $scope.selectedItems,
                multiSelect: true,
                columnDefs: 'columnDefs'
            };

            $scope.$watchCollection('scope.gridOptions', function (items) {
                $scope.shared.selectedRow = !_.isEmpty(items) && items[0];
            });

            $scope.$watchCollection('scope.gridOptions', function (rows) {
                if (!$scope.gridOptions || !$scope.gridVisible) return;
                // this is just weird
                console.log($scope.gridOptions.selectItem);
                var setSelected = _.partialRight($scope.gridOptions.selectItem, true);
                console.log('$scope.shared.data.indexOf');
                console.log($scope.shared.data.indexOf);
                _.map(rows, _.compose(setSelected, $scope.shared.selectedGenes.indexOf));
            });

            function refilter() {
                if (!$scope.shared.selectedGenes) return;
                $scope.shared.selectedGenes = filterByFieldText($scope.shared.data, $scope.gridOptions.filterOptions.filterText, true, true);
            }
            $scope.$watch('gridOptions.filterOptions.filterText', refilter);
            $scope.$watchCollection('shared.data', refilter);

            // TODO: determine markedGenesSet usefulness in dextable example (maybe partial views will demand it?)
            $scope.shared.getMarkedOrSelectedGenes = function () {
                return $scope.shared.selectedGenes;
            };
        }]
    };
});
