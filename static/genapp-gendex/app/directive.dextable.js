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
        controller: ['$scope', '$filter', '$element', '$location', '$http', 'filterByFieldText', 'Data',
        function ($scope, $filter, $element, $location, $http, filterByFieldText, Data) {
            $scope.gridOptions = {};
            $scope.data = {};
            $scope.gridVisible = false;
            $scope.fieldsValuesCount = 0;
            console.log('inside dextable ctrl');

            // get JSON data
            Data.get({'processor_name__contains': 'differentialexpression'}, function (jsonData) {  
                // TODO, each object separately
                // retrieve tab-delimited file address with api v1
                // chosen data object is just a test case for filling the table
                var jsonData = jsonData.objects[0];
                // request tab-delimited file
                var tabUrl = [$location.protocol(), '://', $location.host(),
                              ':', $location.port(), jsonData.resource_uri, 'download/',
                              jsonData.output.diffexp.file].join('');

                $http.get(tabUrl)
                    .success(function (data) {
                        // tab header
                        $scope.tabHeader = data.slice(0, data.indexOf('\n')).replace(/\./g, '_').split(/[\t]+/);
                        // data
                        var vals = data.slice(data.indexOf('\n') + 1, data.length + 1).split(/[\n]+/);
                        $scope.data.values = vals;
                        // real length test
                        if (typeof vals[0] !== 'undefined') $scope.realColCount = vals[0].split(/[\t]+/).length;
                        else $scope.realColCount = 0;
                        $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                    })
                    .error(function (data, status) {
                        console.log(status);
                });
            });

            function beforeSelection (rowItem, event) {
                if (event.type == 'click') {
                    $scope.shared.selectedRow = rowItem;
                    return false;
                }
                return true;
            }

            $scope.filterOptions = {
                filterText: ''
            };

            // when upgrading to AngularJS 1.3, replace $watchCollection with $watchGroup
            // wait for both case and control column counts, build column definitions
            $scope.$watch('realColCount', function (count) {
                if (typeof count !== 'undefined') {
                    // build column definitions
                    var columnDefs = []
                    var ltcc = 1;
                    var ltpc = 1;
                    var tabHeader = $scope.tabHeader;

                    for (var i = 0; i < count; i++) {
                        var val = tabHeader[i];
                        // case-control columns
                        if (val.indexOf('Counts') > -1) {
                            var field = (val.indexOf('Case') > -1 ? ['lt', ltcc++, 'c'] : ['lt', ltpc++, 'p']).join('');
                            columnDefs.push({field: field, displayName: field.toUpperCase(), width: '*'});
                        }
                        // the rest
                        else columnDefs.push({field: val, displayName: val, width: '**'});
                    }

                    var colFields = [];
                    for (var i = 0; i < columnDefs.length; i++) {
                        colFields.push(columnDefs[i].field);
                    }
                    // push data to scope
                    $scope.columnDefs = columnDefs;
                    $scope.colFields = colFields;
                    $scope.fieldsValuesCount = $scope.fieldsValuesCount + 1;
                }
            });

            // wait for displayNames array and tab values array
            $scope.$watch('fieldsValuesCount', function (val) {
                if (val == 2) {
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
                    $scope.shared.filteredRows = grid;
                }
            });

            // set ng-grid options
            $scope.$watch('shared.filteredRows', function (data) {
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

            $scope.$watch('filterOptions.filterText', function (val) {
                // TODO: Study and modify existing filterByFieldText() OR write your own.
                // $scope.shared.filteredRows = filterByFieldText($scope.shared.data, val, false, true);
                if (typeof $scope.colFields !== 'undefined') {
                    // var colFields = $scope.colFields;
                    // console.log(colFields.length);
                    // var filterFields = {};
                    // for (var i = 0; i < colFields.length; i++) {
                    //     filterFields[colFields[i]] = '';
                    // }
                    // console.log(filterFields);
                    // filterFields['lt1c'] = val;

                    // TODO postavi <nekaj>: filter, odrežeš pri zadnjem :



                    if (val === '') $scope.shared.filteredRows = $scope.shared.data;
                    else {
                        var filterFields = {'lt1c': val, 'lt2c': val};
                        console.log(filterFields);
                        $scope.shared.filteredRows = $filter('filter')($scope.shared.data, filterFields, function(actual, expected) {
                            // console.log(expected + '  '  + actual);
                            return (expected.length <= actual.length && expected.indexOf(actual) > -1);
                        });
                        console.log($scope.shared.filteredRows);
                        // $scope.shared.data = $scope.shared.filteredRows;
                        // $scope.$digest();
                    }
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
