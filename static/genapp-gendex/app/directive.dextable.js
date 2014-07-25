'use strict';

var app = angular.module('gendex.widgets');

app.directive('dextable', function () {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/dextable.html',
        controller: ['$scope', 'filterByFieldText', 'notify', 'Data', '$routeParams',
        function ($scope, filterByFieldText, notify, Data, $routeParams) {
            $scope.gridOptions = {};
            $scope.data = {};
            $scope.gridVisible = false;
            $scope.fieldsValuesCount = 0;
            // console.log('inside dextable ctrl');

            function initErrorNotify (msg, error) {
                $scope.errorMsg = msg;
                $scope.$on('notifyReady', function (error) {
                    notify.error($scope.errorMsg)(error);
                });
                $scope.gridVisible = false;
            }

            // request JSON data
            Data.get({'id': $routeParams.id}, function (caseData) {
                if (_.contains(caseData.type, 'differentialexpression') && _.contains(caseData.status, 'done')) {
                    // request tab-delimited file
                    Data.download({'id': $routeParams.id, 'file': caseData.output.diffexp.file}, function (data) {
                        var data = data.data;
                        // tab header
                        $scope.tabHeader = data.slice(0, data.indexOf('\n')).replace(/\./g, '_').split(/[\t]/);
                        // data
                        var vals = data.slice(data.indexOf('\n') + 1, data.length + 1).split(/[\n]+/);
                        $scope.data.values = vals;
                        // nr. of columns test
                        if (typeof vals[0] !== 'undefined') $scope.colCount = $scope.tabHeader.length;
                        // objective trigger
                        $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                    }, function (error) {
                        initErrorNotify('failed tab file request', error);
                    });
                }
                else initErrorNotify('wrong case id request', 'error');
            }, function (error) {
                initErrorNotify('failed JSON file request via api', error);
            });

            // when upgrading to AngularJS 1.3, replace $watchCollection with $watchGroup
            // wait for both case and control column counts, build column definitions
            $scope.$watch('colCount', function (count) {
                if (typeof count !== 'undefined') {
                    // build column definitions
                    var columnDefs = [],
                        ltcc = 1,
                        ltpc = 1,
                        tabHeader = $scope.tabHeader;

                    for (var i = 0; i < count; i++) {
                        var tH = tabHeader[i].toLowerCase();
                        // case-control columns
                        if (_.contains(tH, 'counts')) {
                            var field = (_.contains(tH, 'case') ? ['lt', ltcc++, 'c'] : ['lt', ltpc++, 'p'])
                                        .join('')
                            columnDefs.push({field: field, displayName: field.toUpperCase(), width: '*'});
                        }
                        // the rest: {fdr.de, lik.nde} (manual pick for now)
                        else if (_.indexOf(['gene', 'fdr_de', 'lik_nde'], tH) > -1) {
                            columnDefs.push({field: tH, displayName: tH.toUpperCase(), width: '**'});
                        }
                    }
                    // push data to scope
                    $scope.columnDefs = columnDefs;
                    // objective trigger
                    $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                }
            });

            // trigger when both objective triggers
            $scope.$watch('fieldsValuesCount', function (val) {
                // construct table and populate ng-grid
                if (val == 2) {
                    var line = null,
                        newline = null,
                        grid = [];
                    for (var i = 0; i < $scope.data.values.length; i++) {
                        line = $scope.data.values[i].split(/[\t]/);
                        newline = {};
                        for (var j = 0; j < $scope.columnDefs.length; j++) {
                            newline[$scope.columnDefs[j].field] = line[j];
                        }
                        grid.push(newline);
                    }
                    $scope.shared.data = grid;
                    $scope.shared.filteredRows = grid;
                }
            });

            // set ng-grid options
            $scope.$watchCollection('shared.filteredRows', function (data) {
                $scope.gridOptions.data = 'shared.filteredRows';
                $scope.gridOptions.filterOptions = $scope.filterOptions;
                $scope.gridOptions.selectedItems = [];
                $scope.gridOptions.beforeSelectionChange = beforeSelection;
                $scope.gridOptions.columnDefs = 'columnDefs';
            });

            // make ng-grid visible
            $scope.$watch('gridOptions', function (grid) {
                $scope.gridVisible = true;
            });
            
            function beforeSelection (rowItem, event) {
                if (event.type == 'click') {
                    $scope.shared.selectedRow = rowItem;
                    return false;
                }
                return true;
            }

            $scope.filterOptions = {
                filterText: '',
                useExternalFilter: true
            };

            $scope.$watch('filterOptions.filterText', function (val) {
                if (typeof $scope.shared.filteredRows !== 'undefined') {
                    $scope.shared.filteredRows = filterByFieldText($scope.shared.data, val, true, true);
                }
            });

            $scope.$watch('shared.selectedGenes', function (rows) {
                if ($scope.gridVisible) {
                    // $scope.gridOptions.selectAll(false);
                    for (var i = 0; i < rows.length; i++) {
                        var index = $scope.data.indexOf(rows[i]);
                        $scope.gridOptions.selectItem(index, true);
                    }
                }
            });
        }]
    }
});
