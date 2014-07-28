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
        controller: ['$scope', 'filterByFieldText', 'notify', 'Data', '$routeParams',
        function ($scope, filterByFieldText, notify, Data, $routeParams) {
            $scope.gridVisible = false;
            // console.log('inside dextable ctrl');

            var split = _.curry(function (delim, str) {
                return str.split(delim);
            });
            var replace = _.curry(function (from, to, str) {
                return str.replace(from, to);
            });

            function parseData(data) {
                var lines = data.split(/\n+/);
                var table = _.map(lines, split(/\t/));

                var tabHeader = _.map(table[0], replace(/\./g, '_'));

                var keepMask = _.map(tabHeader, function (col) {
                    var lowCol = col.toLowerCase();
                    return /counts/i.test(lowCol) || _.indexOf(['gene', 'fdr_de', 'lik_nde'], lowCol) >= 0;
                });
                var keptHeader = _.filter(tabHeader, function (col, ix) {
                    return keepMask[ix];
                });

                var ret = {};
                var ltcc = 1;
                var ltpc = 1;
                ret.cols = _.map(keptHeader, function (col) {
                    var ret = {field: col, displayName: col, width: '**'};

                    if (/counts/i.test(col)) {
                        var newColName = /case/i.test(col) ? ['lt', ltcc++, 'c'] : ['lt', ltpc++, 'p'];
                        newColName = newColName.join('');
                        ret = {field: newColName, displayName: newColName.toUpperCase(), width: '*'};
                    }
                    return ret;
                });
                var newFields = _.map(ret.cols, 'field');
                ret.rows = _.map(table.slice(1), function (row) {
                    return _.zipObject(newFields, _.filter(row, function (col, ix) {
                        return keepMask[ix];
                    }));
                });
                return ret;
            }

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
                    var parsed = parseData(raw.data);

                    $scope.columnDefs = parsed.cols;
                    $scope.shared.data = parsed.rows;
                    $scope.shared.filteredRows = parsed.rows;
                    $scope.gridVisible = true;

                }, notify.error('get Differential Expressions file'));
            }, notify.error('get Differential Expressions data'));

            $scope.selectedItems = [];
            $scope.gridOptions = {
                data: 'shared.filteredRows',
                filterOptions: { filterText: '', useExternalFilter: true},
                selectedItems: $scope.selectedItems,
                multiSelect: false,
                columnDefs: 'columnDefs'
            };
            $scope.$watchCollection('selectedItems', function (items) {
                $scope.shared.selectedRow = items.length>0 && items[0];
            });

            function refilter() {
                if (!$scope.shared.filteredRows) return;
                $scope.shared.filteredRows = filterByFieldText($scope.shared.data, $scope.gridOptions.filterOptions.filterText, false, true);
            }
            $scope.$watch('gridOptions.filterOptions.filterText', refilter);
            $scope.$watchCollection('shared.data', refilter);

            $scope.$watchCollection('shared.selectedGenes', function (rows) {
                if (!$scope.gridVisible) return;

                var setSelected = _.partialRight($scope.gridOptions.selectItem, true);
                _.map(rows, _.compose(setSelected, $scope.shared.data.indexOf));
            });
        }]
    };
});
