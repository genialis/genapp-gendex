'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('geneplot', function() {
    return {
        restrict: 'A',
        scope: {
            shared: '='
        },
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/geneplot.html',
        controller: function ($scope, $http, $element, $timeout, $compile) {  //storageRequest, notify
            console.log("inside genplot ctrl");

            $scope.selectedGraph = 1;

            var flotElem = $element.find('div.flotChart');

            $scope.replot = function () {
                console.log('replot genplot');
                if (!$scope.shared.filteredRows) return;

                var xValues = _.pluck($scope.shared.filteredRows, 'logcpm'),
                    yValues = _.pluck($scope.shared.filteredRows, $scope.selectedGraph == 1 ? 'fdr' : 'logfc');

                var newSize = {
                    width: $element.width(),
                    height: $element.width()
                };

                var flotOptions = {
                    series: {
                        points: {
                            show: true,
                            radius: 0.5,
                            lineWidth: 2,
                            fill: false
                        },
                        shadowSize: 0
                    },
                    grid: {
                        hoverable: true,
                        clickable: true,
                        borderWidth: {
                            top: 0,
                            right: 0,
                            bottom: 1,
                            left: 1
                        }
                    },
                    legend: false,
                    zoom: {
                        interactive: false
                    },
                    pan: {
                        interactive: false
                    },
                    hooks: {
                        drawOverlay: function(flot, ctx){
                            $scope.drawSelectionRect && $scope.drawSelectionRect(flot, ctx);
                        }
                    }
                };

                flotElem.css(newSize);

                var flotPlot;
                try{
                    flotPlot = $.plot(flotElem, [{data: _.zip(xValues, yValues), color: 'gray'}], flotOptions);
                } catch (err) {}
            };


            function calcBounding(rect) {
                var x = Math.min(rect.start.x, rect.end.x);
                var y = Math.min(rect.start.y, rect.end.y);
                var ex = Math.max(rect.start.x, rect.end.x);
                var ey = Math.max(rect.start.y, rect.end.y);
                return {
                    x: x,
                    y: y,
                    width: ex - x,
                    height: ey - y,
                    top: y,
                    left: x,
                    bottom: ey,
                    right: ex
                };
            }

            function rectangleSelection() {
                flotElem.attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false); // disable text selection

               /** Displayed rect */
                var rect = {
                    start: { x: 0, y: 0 },
                    end:   { x: 0, y: 0 }
                };

                flotElem.on("mousedown", function (e) {
                    flotElem.data("dragging", true);
                    flotElem.data("draggingStarted", true);
                    rect.start.x = e.offsetX;
                    rect.start.y = e.offsetY;
                });

                flotElem.on("mousemove", function (e) {
                    rect.end.x = e.offsetX;
                    rect.end.y = e.offsetY;

                    /** Trigger draw rect */
                    if(flotElem.data('plot')) flotElem.data('plot').triggerRedrawOverlay();
                });

                flotElem.on("mouseup", function (e) {
                    flotElem.data("dragging", false);
                    flotElem.data("findSelected", true);
                    rect.end.x = e.offsetX;
                    rect.end.y = e.offsetY;
                });

                /** Draw rect [pixels] */
                $scope.drawSelectionRect = function (flot, ctx) {
                    if(flotElem.data("dragging")){
                        ctx.beginPath();
                        ctx.strokeStyle = '#5bc0de'; /** TODO: should be bound to @brand-info */
                        var bounds = calcBounding(rect);
                        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                        ctx.stroke();
                        ctx.closePath();
                    }
                };

                /** Data rect [values] */
                var dataRect = {
                    start: {x: 0, y: 0},
                    end: {x: 0, y: 0}
                };
/*
                flotElem.on("plothover", function (event, pos, item) {
                    if(flotElem.data("draggingStarted")){
                        flotElem.data("draggingStarted", false);
                        dataRect.start.x = pos.x;
                        dataRect.start.y = pos.y;
                    }
                    dataRect.end.x = pos.x;
                    dataRect.end.y = pos.y;

                    // Find selected
                    var flotPlot = flotElem.data('plot');
                    var required = ($scope.differentialData.dictIxGenes) && flotPlot;
                    if(flotElem.data("findSelected") && required){
                        flotElem.data("findSelected", false);

                        var allPointsDatas = $.grep(flotPlot.getData(), function (data) {
                            return data.label == 'All points';
                        });

                        var bounds = calcBounding(dataRect);
                        $scope.genesInRectSelection = [];
                        angular.forEach(allPointsDatas[0].data, function (point, pointIx) {
                            if( ((bounds.left <= point[0]) && (point[0] <= bounds.right)) &&
                                ((bounds.top <= point[1]) && (point[1] <= bounds.bottom)) ) {

                                var geneID = allPointsDatas[0].dictIxGenes[pointIx];
                                var genePoint = {
                                    geneID: geneID,
                                    geneName: geneID,
                                    x: point[0],
                                    y: point[1]
                                };
                                if($scope.shared.geneInfo && $scope.shared.geneInfo[geneID]){
                                    genePoint.geneName = $scope.shared.geneInfo[geneID]['name'];
                                }
                                $scope.genesInRectSelection.push(genePoint);
                            }
                        });

                        $scope.gridOptions.selectAll(false);
                        if($scope.genesInRectSelection.length > 0){
                            volcanoModal.modal('show');
                        }
                        if(!$scope.$$phase) $scope.$digest();
                    }
                });
*/
            }
            rectangleSelection();


            $scope.$watch("shared.filteredRows", function () {
                $scope.replot();
            });

        }
    }
});
