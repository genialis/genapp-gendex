'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('sampleplot', function() {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/sampleplot.html',
        controller: ['$scope', '$attrs', '$element', function ($scope, $attrs, $element) {
            console.log('inside sampleplot ctrl');

            var flotElem = $element.find('div.flotChart');

            $scope.selectedNorm = 2;

            function mds(distances, dimensions) {
                dimensions = dimensions || 2;

                var M = numeric.mul(-.5, numeric.pow(distances, 2));

                function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
                var rowMeans = mean(M),
                    colMeans = mean(numeric.transpose(M)),
                    totalMean = mean(rowMeans);

                for (var i = 0; i < M.length; ++i) {
                    for (var j = 0; j < M[0].length; ++j) {
                        M[i][j] += totalMean - rowMeans[i] - colMeans[j];
                    }
                }

                var ret = numeric.svd(M),
                    eigenValues = numeric.sqrt(ret.S);
                return ret.U.map(function(row) {
                    return numeric.mul(row, eigenValues).splice(0, dimensions);
                });
            };

            $scope.replot = function () {
                console.log('replot sampleplot');

                var columns = ['lt1c', 'lt2c', 'lt3c', 'lt1p', 'lt2p', 'lt3p'],
                    vectors = {};

                angular.forEach(columns, function (col) {
                    vectors[col] = _.pluck($scope.shared.filteredRows, col);
                });

                var norm;
                switch ($scope.selectedNorm) {
                    case 1:
                        norm = function (arr) {
                            arr = numeric.abs(arr);
                            return numeric.sum(arr);
                        }
                        break;
                    case 2:
                        norm = numeric.norm2;
                        break;
                    case 3:
                        norm = numeric.norminf;
                        break;
                }

                var distances = [];
                for (var i = 0; i < columns.length; i++) {
                    var dist = [];
                    for (var j = 0; j < columns.length; j++) {
                        if (i == j) {
                            dist.push(0);
                        } else if (i > j) {
                            dist.push(distances[j][i]);
                        } else {
                            dist.push(norm(numeric.sub(vectors[columns[i]], vectors[columns[j]])));
                        }
                    }
                    distances.push(dist);
                }

                var coordinates = mds(distances);

                var newSize = {
                    width: $element.width(),
                    height: $element.width()
                };

                var flotOptions = {
                    series: {
                        points: {
                            show: true,
                            radius: 5,
                            fill: true
                        },
                        shadowSize: 0
                    },
                    grid: {
                        hoverable: true,
                        clickable: true,
                        borderWidth: {
                            top: 1,
                            right: 1,
                            bottom: 1,
                            left: 1
                        }
                    },
                    xaxis: {
                        show: false
                    },
                    yaxis: {
                        show: false
                    }
                };

                flotElem.css(newSize);

                var flotPlot;
                try{
                    flotPlot = $.plot(flotElem, [{data: coordinates.splice(0,3), color: 'red'}, {data: coordinates, color: 'blue'}], flotOptions);
                } catch (err) {}
            };

            tooltipElem = $element.find('div.tooltip');
            flotElem.bind("plothover", function (event, pos, item) {
                if (item) {
                    var x = pos.pageX - $element.position().left,
                        y = pos.pageY - $element.position().top;
                    tooltipElem.html("FOO");
                    tooltipElem.css({top: y-20, left: x});
                    tooltipElem.fadeIn(200);
                } else {
                    tooltipElem.hide();
                }
            });

            $scope.$watch("shared.filteredRows", function () {
                $scope.replot();
            });
        }]
    }
});
