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
            $scope.filterFields = {};
            console.log('inside dextable ctrl');

            // get JSON data
            Data.get({'processor_name__contains': 'differentialexpression'}, function (jsonData) {  
                // TODO, each object separately
                // retrieve tab-delimited file address with api v1
                // chosen data object is just a test case for filling the table
                var jsonData = jsonData.objects[0],
                // request tab-delimited file
                    tabUrl = [$location.protocol(), '://', $location.host(),
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
                filterText: '',
                useExternalFilter: true
            };

            // when upgrading to AngularJS 1.3, replace $watchCollection with $watchGroup
            // wait for both case and control column counts, build column definitions
            $scope.$watch('realColCount', function (count) {
                if (typeof count !== 'undefined') {
                    // build column definitions
                    var columnDefs = [],
                        ltcc = 1,
                        ltpc = 1,
                        tabHeader = $scope.tabHeader;

                    for (var i = 0; i < count; i++) {
                        var val = tabHeader[i];
                        // case-control columns
                        if (val.indexOf('Counts') > -1) {
                            var field = (val.indexOf('Case') > -1 ? ['lt', ltcc++, 'c'] : ['lt', ltpc++, 'p'])
                                        .join('')
                                        .toLowerCase();
                            columnDefs.push({field: field, displayName: field.toUpperCase(), width: '*'});
                        }
                        // the rest
                        else {
                            columnDefs.push({field: val.toLowerCase(), displayName: val, width: '**'});
                        }
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

            function strToNumIfNum(str) {
                return !isNaN(str) ? (+str) : str;
            }

            $scope.cmpFunctions = {
                ':<=': function (str, value) {
                    return strToNumIfNum(str) <= strToNumIfNum(value);
                },
                ':>=': function (str, value) {
                    return strToNumIfNum(str) >= strToNumIfNum(value);
                },
                ':<': function (str, value) {
                    return strToNumIfNum(str) < strToNumIfNum(value);
                },
                ':>': function (str, value) {
                    return strToNumIfNum(str) > strToNumIfNum(value);
                },
                ':=': function (str, value) {
                    return _.isEqual(str, value);
                },
                ':': function (str, value) {
                    return _.contains(str, value);
                }
            };

            
            $scope.$watch('filterOptions.filterText', function (val) {
                if (typeof $scope.colFields !== 'undefined') {
                    // search text filter
                    // TODO: substring filtering without arguments, ex: "0 0" => "lt1c lt2c")
                    var filterFields = {},
                        val = val.toLowerCase();
                    if (_.isEqual(val, '')) $scope.shared.filteredRows = $scope.shared.data;
                    else {
                        var vals = val.split(/[\s]+/g);
                        $scope.searchArgs = vals;
                        var testFun = $scope.cmpFunctions;                   
                        var comps = Object.keys(testFun);
                        // space separated vals
                        for (i in vals) {
                            var val = vals[i];
                            // comparator separated vals
                            for (var i=0; i < comps.length; i++) {
                                if (_.contains(val, comps[i])) {
                                    var keyval = val.split(comps[i]);
                                    // set a filter function
                                    $scope.filterFunction = testFun[comps[i]];
                                    var colFields = $scope.colFields;
                                    for (var j = 0; j < colFields.length; j++) {
                                        if (_.contains(colFields[j], keyval[0])) {
                                            $scope.filterFields[colFields[j]] = [keyval[1], comps[i]];
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        // filter shared.data
                        $scope.shared.filteredRows = $filter('filter')($scope.shared.data, function(row) {
                            return _.every(row, function(val, key) {
                                var fFields = $scope.filterFields;
                                return _.has(fFields, key) ?
                                       $scope.cmpFunctions[fFields[key][1]](val, fFields[key][0]) : true;
                            });
                        });
                        // reset predicate
                        $scope.filterFields = {};
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
