'use strict';


angular.module('gendex.services', ['ngResource'])
    .factory('Data', ['$resource', '$http',
        /**
         *  .. js:attribute:: Data
         *
         *  Resource providing an interface for interaction with :class:`Data's <server.models.Data>` API.
         */
        function ($resource, $http) {
            var Data = $resource('/api/v1/data/:id/:func', {id: '@id'}, {

            });
            return Data;
        }
    ])
    .factory('filterByFieldText', [function () {
        /**
         * filterByFieldText(...) calls the inner filterByFieldText()
         * filterByFieldText.test() tests it
         * filterByFieldText.filterToParts(...) calls the inner filterToParts()
         * filterByFieldText.filterToParts.test() tests it
         */

        /**
         * Parse a string to a number if it is numeric.
         * parseFloat and parseInt would parse even if it is not numeric.
         * Also supports '0xff'
         */
        function strToNumIfNum(str) {
            return !isNaN(str) ? (+str) : str;
        }

        /**
         * Look at tests for usage examples
         */
        function filterToParts(filterText) {
            var testStringFunctions = {
                '<': function (str, value) {
                    return strToNumIfNum(str) < strToNumIfNum(value);
                },
                '>': function (str, value) {
                    return strToNumIfNum(str) > strToNumIfNum(value);
                },
                '<=': function (str, value) {
                    return strToNumIfNum(str) <= strToNumIfNum(value);
                },
                '>=': function (str, value) {
                    return strToNumIfNum(str) >= strToNumIfNum(value);
                },
                '=': function (str, value) {
                    return str.indexOf(value) >= 0;
                }
            };


            var filterParts = _.compact(filterText.split(/\s/));
            var filterType = _.groupBy(filterParts, function (part) {
                return part.indexOf(':') >= 0 ? 'field' : 'any';
            });
            return {
                any: _.map(filterType.any, function (part) {
                    return part.toLowerCase();
                }),
                field: _.map(filterType.field, function (part) {
                    part = part.toLowerCase();
                    var ndx = part.indexOf(':');

                    var field = part.slice(0, ndx);
                    var value = part.slice(ndx + 1);

                    var op = value.slice(0, 2);
                    if (!(op in testStringFunctions)) op = value.slice(0, 1);
                    if (!(op in testStringFunctions)) op = '';
                    value = value.slice(op.length);
                    if (!(op in testStringFunctions)) op = '=';

                    return {
                        field: field,
                        value: value,
                        operator: op,
                        test: function (str) {
                            return testStringFunctions[op](str, value);
                        }
                    };
                })
            };
        }

        /**
         * :mustContainAll:
         *     default false == row must contain one of the filter words
         *
         *     Row is kept if:
         *         !mustContainAll && (_.any(fields) || anyField)
         *          mustContainAll && (_.all(fields) && anyField)
         *
         * :dontFlatten:
         *     if data doesnt change much but filter does,
         *     you should pre-flatten the data and set this to true
         *     (flattening takes 80% of the filtering time)
         *
         * :flattenFn:
         *     default JSON.flattenData (which uses row.***_scheme to rename fields)
         *
         * Look at tests for usage examples
         */
        function filterByFieldText(data, filterText, mustContainAll, dontFlatten, flattenFn) {
            if (!data) return data;
            if (!filterText) return data;

            var groupingFn = _.any;
            if (mustContainAll) groupingFn = _.all;

            var partedFilter = filterToParts(filterText);

            if (!flattenFn) flattenFn = JSON.flattenData;
            return _.filter(data, function (row) {
                var rowFlat = !dontFlatten ? flattenFn(row) : row;
                var specificFieldMatch = groupingFn(partedFilter.field, function (filterPart) {
                    if (typeof rowFlat[filterPart.field] === "undefined") return false;
                    return filterPart.test(String(rowFlat[filterPart.field]).toLowerCase());
                });

                if (!mustContainAll && specificFieldMatch) return true;
                if (mustContainAll && !specificFieldMatch) return false;

                return groupingFn(partedFilter.any, function (part) {
                    return _.any(_.values(rowFlat), function (rowFieldValue) {
                        return rowFieldValue &&
                            String(rowFieldValue).toLowerCase().indexOf(part) >= 0;
                    });
                });
            });
        }


        function testFilterToParts() {
            var result = filterToParts('HELLO name:aaa static.description:<bbb world num:<3 num2:<=3');
            var correctData = _.isEqual(result,
                $.extend(true, {}, result, {
                    any: ["hello", "world"],
                    field: [{
                            field: "name",
                            value: "aaa",
                            operator: '='
                        }, {
                            field: "static.description",
                            value: "bbb",
                            operator: '<'
                        }, {
                            field: "num",
                            value: '3',
                            operator: '<'
                        }, {
                            field: "num2",
                            value: '3',
                            operator: '<='
                        }
                    ]
                })
            );
            var tests = [
                !result.field[2].test(3.2),
                result.field[2].test(2),
                !result.field[2].test('12'),
                !result.field[2].test('0x10'),
                result.field[2].test('0'),
                result.field[2].test('2.2'),
                result.field[2].test('0x1'),
                result.field[2].test('2.9'),
                !result.field[2].test('3'),
                !result.field[2].test('3.1'),

                result.field[3].test('0'),
                result.field[3].test('2.9'),
                result.field[3].test('3'),
                !result.field[3].test('3.1'),

                result.field[0].test('yap aaa b'),

                result.field[1].test('adding'), // lexicographical less than
                result.field[1].test('bba'),
                !result.field[1].test('bbbe')
            ];
            var good = correctData && _.all(tests);

            if(!good) throw new Error('Test for filterToParts failed ' + correctData + ' && ' + tests.join(','));
            return good;
        }

        function testFilterByFieldText() {
            var data = [
                {name: 'AA BB', static: {description: 'CC'}, note: 'DD', number: 0},
                {name: 'AA EE', static: {description: 'FC'}, note: 'DD', number: 2},
                {name: 'AA EE', static: {description: 'EE'}, note: 'EE', number: 4},
                {name: 'AA BB', static: {description: 'FF'}, note: 'EE', number: 6}
            ];

            var tests = [
                _.isEqual(
                    filterByFieldText(data, 'dd', false, false, JSON.flatten),
                    _.values(_.pick(data, [0, 1]))
                ),
                _.isEqual(
                    filterByFieldText(data, 'dd name:b', false, false, JSON.flatten),
                    _.values(_.pick(data, [0, 1, 3]))
                ),
                _.isEqual(
                    filterByFieldText(data, 'name:b static.description:c inexistent:something', false, false, JSON.flatten),
                    _.values(_.pick(data, [0, 1, 3]))
                ),
                _.isEqual(
                    filterByFieldText(data, 'number:<=4', false, false, JSON.flatten),
                    _.values(_.pick(data, [0, 1, 2]))
                ),
                _.isEqual(
                    filterByFieldText(data, 'dd name:b', true, false, JSON.flatten),
                    _.values(_.pick(data, [0]))
                )
            ];
            var good = _.all(tests);
            if(!good) throw new Error('Test for filterByFieldText failed ' + tests.join(','));
            return good;
        }

        var ret = filterByFieldText;
        ret.test = testFilterByFieldText;
        ret.filterToParts = filterToParts;
        ret.filterToParts.test = testFilterToParts;
        return ret;
    }])
;