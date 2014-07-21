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
        controller: ['$scope', '$filter', '$element', '$location', '$http', 'Data',
                    function ($scope, $filter, $element, $location, $http, Data) {

            $scope.gridOptions = {};
            $scope.data = {};
            $scope.gridVisible = false;
            $scope.fieldsValuesCount = 0;
            console.log('inside dextable ctrl');

            // get JSON data
            Data.get({'processor_name__contains': 'differentialexpression'}, function (data) {  
                // TODO, each object separately
                // This data is just a test case for filling the table!
                var data = data.objects[0];

                // request tab-delimited file -- REFORMAT v ngResource
                var tabUrl = [$location.protocol(), '://', $location.host(),
                                    ':', $location.port(), data.resource_uri, "download/",
                                    data.output.diffexp.file].join('');
                console.log(tabUrl);

                $http.get(tabUrl)
                    .success(function (data) {
                        data = data.slice(data.indexOf('\n') + 1, data.length + 1);
                        $scope.data.values = data.split(/[\n]+/);
                        $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                    })
                    .error(function (data, status) {
                        console.log(status);
                });

                // parse data to scope
                $scope.ccCounts = [];
                $scope.ccCounts.push(data.input.case.length);
                $scope.ccCounts.push(data.input.control.length);
            });

            function buildColumnDefs (ltcc, ltpc) {
                // gene column
                var columnDefs = [{field: 'gene', displayName: 'Gene', width: '**'}];
                // control columns
                for (var i = 1; i <= ltcc; i++) {
                    columnDefs.push({field: 'lt' + i + 'c', displayName: 'LT' + i +'C', width: '*'});
                }
                // test columns
                for (var i = 1; i <= ltpc; i++) {
                    columnDefs.push({field: 'lt' + i + 'p', displayName: 'LT' + i +'P', width: '*'});
                }
                // calculations columns
                columnDefs.push({field: 'logfc', displayName: 'logFC', width: '**'},
                                {field: 'logcpm', displayName: 'logCPM', width: '**'},
                                {field: 'pvalue', displayName: 'PValue', width: '**'},
                                {field: 'fdr', displayName: 'FDR', width: '**'});
                return columnDefs;
            }

            // when upgrading to AngularJS 1.3, replace $watchCollection with $watchGroup
            // wait for both case and control column counts, build column definitions
            $scope.$watchCollection('ccCounts', function (vals) {
                if (vals && vals.length == 2) {
                    $scope.columnDefs = buildColumnDefs(vals[0], vals[1]);

                    var colFields = [];
                    for (var i = 0; i < $scope.columnDefs.length; i++) {
                        colFields.push($scope.columnDefs[i].field);
                    }
                    $scope.colFields = colFields;
                    $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                }
            });

            // wait for displayNames array and tab values array
            $scope.$watch('fieldsValuesCount', function (arr) {
                if ($scope.fieldsValuesCount == 2) {
                    var line = null;
                    var newline = null;
                    var grid = [];
                    for (var i = 0; i < $scope.data.values.length; i++) {
                        line = $scope.data.values[i].split(/[\t]+/);
                        newline = {};
                        for (var j = 0; j < $scope.colFields.length; j++) {
                            newline[$scope.colFields[j]] = line[j];
                        }
                        grid.push(newline);
                    }
                    $scope.shared.data = grid;
                }
            });

            // set ng-grid options
            $scope.$watch('shared.data', function (data) {
                console.log('inside shared.data watch');
                $scope.gridOptions.data = 'shared.data';
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
                if (event.type == "click") {
                    $scope.shared.selectedRow = rowItem;
                    return false;
                }
                return true;
            }

            // TODO: Apply text filters from genjs.services
            $scope.filterOptions = {
                filterText: ''
            };

            $scope.$watch('filterOptions.filterText', function (val) {
                $scope.shared.filteredRows = $filter('filter')($scope.shared.data, val);
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
