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

            function parseData(data) {
                var lines = data.split(/\n+/);
                // TODO: Better error checking (i.e. check whether line splits match the number of header columns)
                var table = _.filter(_.map(lines, split(/\t/)), function (line) { return line.length > 1; });

                var tabHeader = _.map(table[0], replace(/\./g, '_'));

                var keepMask = _.map(tabHeader, function (col) {
                    var lowCol = col.toLowerCase();
                    return /counts|rpkum/i.test(lowCol) || _.indexOf(['gene', 'fdr_de', 'lik_nde'], lowCol) >= 0;
                });
                var keptHeader = _.filter(tabHeader, function (col, ix) {
                    return keepMask[ix];
                });

                var ret = {};
                var ltcc = 1;
                var ltpc = 1;
                ret.cols = _.map(keptHeader, function (col) {
                    var ret = null;

                    if (/counts/i.test(col)) {
                        var newColName = /case/i.test(col) ? ['lt', ltcc++, 'c'] : ['lt', ltpc++, 'p'];
                        newColName = newColName.join('');
                        ret = {field: newColName, displayName: newColName.toUpperCase(), width: '*'};
                        $scope.shared.sampleCols.push(newColName);
                    }
                    else if (/rpkum/i.test(col)) {
                        var newColName = /case/i.test(col) ? 'rpkumcase' : 'rpkumctrl';
                        ret = {field: newColName, displayName: col, width: '*', visible: true};
                    }
                    else ret = {field: col.toLowerCase(), displayName: col, width: '**'};

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
                    $scope.shared.selectedGenes = parsed.rows;
                    $scope.gridVisible = true;
                }, notify.error('get Differential Expressions file'));
            }, notify.error('get Differential Expressions data'));

            // testing whether we can do without commented rows
            // $scope.selectedItems = [];
            $scope.gridOptions = {
                data: 'shared.selectedGenes',
                filterOptions: { filterText: '', useExternalFilter: true},
                selectedItems: [],
                multiSelect: false,
                columnDefs: 'columnDefs'
            };
            /*$scope.$watchCollection('selectedItems', function (items) {
                console.log('needed?');
                $scope.shared.selectedRow = items.length > 0 && items[0];
                console.log($scope.shared.selectedRow);
            });*/

            function refilter() {
                if (!$scope.shared.selectedGenes) return;
                $scope.shared.selectedGenes = filterByFieldText($scope.shared.data, $scope.gridOptions.filterOptions.filterText, true, true);
            }
            $scope.$watch('gridOptions.filterOptions.filterText', refilter);
            $scope.$watchCollection('shared.data', refilter);

            /*$scope.$watchCollection('shared.selectedGenes', function (rows) {
                if (!$scope.gridVisible) return;

                // this is just weird
                var setSelected = _.partialRight($scope.gridOptions.selectedGenes, true);
                console.log('$scope.shared.data.indexOf');
                console.log($scope.shared.data.indexOf);
                return _.map(rows, _.compose(setSelected, $scope.shared.data.indexOf));
            });*/

            // TODO: determine markedGenesSet usefulness in dextable example (maybe partial views will demand it?)
            $scope.shared.getMarkedOrSelectedGenes = function () {
                var ret = $scope.shared.selectedGenes;
                /*if(!$.isEmptyObject($scope.shared.markedGenesSet)){
                    ret = _.keys($scope.shared.markedGenesSet);
                }*/
                return ret;
            };
        }]
    };
});
