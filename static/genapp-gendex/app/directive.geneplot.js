'use sctrict';

var app = angular.module('gendex.widgets');

app.directive('geneplot', function() {
    return {
        restrict: 'A',
        scope: {},
        replace: false,
        templateUrl: '/static/genapp-gendex/partials/directives/geneplot.html',
        controller: function ($scope, $http, $element, $timeout, $compile, StorageRequest, notify) {
            console.log("inside volcanoplot ctrl");
            $scope.shared.elements.volcanoplot = $element;

            var volcanoModal;
            $scope.$watchCollection('shared.differentialExpressionsDataObjects', function (dataObjs) {
                if(!dataObjs) return;
                if(dataObjs.length <= 0) return;

                $scope.possibleTypes = $.map(dataObjs, function (dataObj) {
                    return {
                        label: dataObj.static.name,
                        val: dataObj.output.volcano_plot
                    };
                });

                $scope.shared.selectedDiffType = $scope.possibleTypes[0].val;
            });
            function getPointsData(json) {
                //json.flot contains some flot properties, like data
                var allPoints = $.extend({}, json.flot, {
                    label: 'All points',
                    clickable: true, /** all points: tooltip on click */
                    hoverable: false,
                    color: '#666',
                    highlightColor: '#000',
                    points: {
                        fill: false,
                        radius: 0.5,
                        lineWidth: 2
                    },
                    dictIxGenes: $scope.differentialData.dictIxGenes
                });

                if(!$scope.differentialData.dictGeneIxs) return [allPoints];
                if(!$scope.shared.selectedGenes) return [allPoints];

                var selectedPoints = {
                    label: 'Selected points',
                    clickable: false,
                    hoverable: true, /** selected points: tooltip on hover */
                    highlightColor: '#124859',
                    points: {
                        fill: true,
                        fillColor: '#5bc0de', /** TODO: should be bound to @brand-info */
                        radius: 5,
                        lineWidth: 0
                    },
                    data: _.map($scope.shared.selectedGenes, function (geneID) { /** $.map doesnt work correctly when returning [x,y] */
                        var pointIx = $scope.differentialData.dictGeneIxs[geneID];
                        return allPoints.data[pointIx];
                    }),
                    dictIxGenes: angular.copy($scope.shared.selectedGenes)
                };

                return [allPoints, selectedPoints];
            }

            $scope.differentialData = {
                points: [],
                json: {}
            };

            $scope.reload = function () {
                $scope.refreshingData = true;
                if(!$scope.shared.selectedDiffType) return;
                $scope.differentialData = {
                    points: [],
                    json: {}
                };

                $scope.oldRequest = StorageRequest.get({id: $scope.shared.selectedDiffType}, function (data) {
                    $scope.differentialData.json = data.json;
                    $scope.differentialData.dictIxGenes = data.json.genes;
                    $scope.differentialData.dictGeneIxs = _.invert(data.json.genes);

                    $scope.replot();
                    $scope.refreshingData = false;
                }, function (reason) {
                    $scope.refreshingData = false;

                    if (reason.status == 401)
                        notify({message: "You do not have permission to get storage objects for VolcanoPlot", type: 'danger'});
                    else
                        notify({message: "An error occured while getting storage objects for VolcanoPlot, sorry", type: 'danger'});
                });
            };

            $scope.$watch('refreshingData', function (val) {
                //getting to <window> scope...
                $element.parent().scope().$emit( val ? 'dimOn' : 'dimOff' );
                $element.parent().scope().$emit( val ? 'loadOn' : 'loadOff' );
            });

            $scope.replot = function () {
                $scope.differentialData.points = getPointsData($scope.differentialData.json);

                var newSize = {
                    width: $element.parent().width() - 30,
                    height: $element.parent().height() - $element.find('.graphHead').height() -
                            $element.parents('.windowContent').siblings('.graphHandle').height()
                };

                var flotOptions = {
                    series: {
                        points: {
                            show: true
                        },
                        shadowSize: 0
                    },
                    grid: {
                        hoverable: true,
                        autoHighlight: true,
                        clickable: true,
                        mouseActiveRadius: 5,
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
                    xaxes: [{
                        axisLabel: $scope.differentialData.json.xlabel,
                    }],
                    yaxes: [{
                        axisLabel: $scope.differentialData.json.ylabel,
                    }],
                    hooks: {
                        drawOverlay: function(flot, ctx){
                            $scope.drawSelectionRect && $scope.drawSelectionRect(flot, ctx);
                        }
                    }
                };

                var flotElem = $element.find('div.flotChart');
                flotElem.css(newSize);

                // draw
                var flotPlot;
                try {
                    $timeout(function () { //end of transition/animation
                        var pTime1 = performance.now();
                        flotPlot = $.plot(flotElem, $scope.differentialData.points, flotOptions);
                        var pTime2 = performance.now();
                        if(pTime2 - pTime1 > 100) console.log('TODO: speed up Volcano plot draw time: ', pTime2 - pTime1, 'ms');
                    }, 200);
                } catch (err) {
                    // just crying about 0 element height
                }
            };

            var oldSelectedGenes = [];

            var delayedReload = _.debounce($scope.reload, 200);
            var delayedReplot = _.debounce($scope.replot, 200);
            var flotElem = $element.find('div.flotChart');

            $scope.$watchCollection('shared.selectedGenes', delayedReplot);
            $scope.$watchCollection('shared.allGenes', delayedReload);
            $scope.$watch('shared.selectedDiffType', delayedReload);

            $scope.$watch(function () { return $element.width()+','+$element.height(); }, function (v) {
                delayedReplot();
            });


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
            /** Rectangle drag select */
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
                flotElem.on("plothover", function (event, pos, item) {
                    if(flotElem.data("draggingStarted")){
                        flotElem.data("draggingStarted", false);
                        dataRect.start.x = pos.x;
                        dataRect.start.y = pos.y;
                    }
                    dataRect.end.x = pos.x;
                    dataRect.end.y = pos.y;

                    /** Find selected */
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
            }
            rectangleSelection();


            $timeout(function(){
                //move modal outside of positioned parent (preventing high z)
                volcanoModal = $element.find('#volcanoSelectionModal');
                volcanoModal.parents('.windows').append(volcanoModal);
            }, 0);

            /** VolcanoModal grid */
            $scope.localSelectedGenesWithinRect = [];
            function updateGridColumnNames() {
                $scope.gridColumns = [
                    {field:'geneName', displayName:'Gene Name'},
                    {field:'x', displayName: $scope.differentialData.json.xlabel},
                    {field:'y', displayName: $scope.differentialData.json.ylabel}
                ];
            }
            updateGridColumnNames();
            $scope.$watch('differentialData.json.xlabel', updateGridColumnNames);
            $scope.$watch('differentialData.json.ylabel', updateGridColumnNames);

            $scope.gridOptions = {
                data: 'genesInRectSelection',
                filterOptions: {filterText: ''},
                columnDefs: 'gridColumns',
                multiSelect: true,
                selectedItems: $scope.localSelectedGenesWithinRect
            };

            /** Handle selection */
            $scope.sendSelectedGenes = function () {
                $scope.shared.setSelectedGenes(_.pluck($scope.localSelectedGenesWithinRect, 'geneID'));
            };

            /**
                TODO: speed up..
                jquery.flot.axisLabels.js : 427
                    redraws if there are any axis labels
            */

            function tooltips() {
                var tooltipAppendTo = flotElem;

                /** Tooltip for all points on click */
                var tooltipElemAll = null;
                var contentElemAll = null;
                flotElem.on("plotclick", function (event, pos, item) {
                    item = prioritizeSelectedPoints(item);

                    if(!item){
                        if(tooltipElemAll){
                            flotDestroyTooltip(tooltipElemAll);
                            tooltipElemAll = null;
                        }
                    }else{
                        if(!tooltipElemAll){
                            tooltipElemAll = flotCreateTooltip(tooltipAppendTo);
                            contentElemAll = tooltipElemAll.find('.content');
                        }
                        var geneID = item.series.dictIxGenes[item.dataIndex];
                        var tooltipText = $scope.shared.geneInfo[geneID]['name'];
                        flotMoveTooltip(tooltipAppendTo, pos.pageX, pos.pageY, tooltipElemAll, contentElemAll, tooltipText);
                    }
                });

                /** Tooltip for selected points on hover */
                var tooltipElemSelected = null;
                var contentElemSelected = null;
                var hoveredItem = null;
                var backupHoveredHighlighted = null;
                flotElem.on("plothover", function (event, pos, item) {
                    hoveredItem = item;
                    if(!item){
                        if(tooltipElemSelected){
                            flotDestroyTooltip(tooltipElemSelected);
                            tooltipElemSelected = null;
                        }
                    }else{
                        if(!tooltipElemSelected){
                            tooltipElemSelected = flotCreateTooltip(tooltipAppendTo);
                            contentElemSelected = tooltipElemSelected.find('.content');
                        }
                        var geneID = item.series.dictIxGenes[item.dataIndex];
                        var tooltipText = $scope.shared.geneInfo[geneID]['name'];
                        flotMoveTooltip(tooltipAppendTo, pos.pageX, pos.pageY, tooltipElemSelected, contentElemSelected, tooltipText);
                    }
                });
                /** Tooltip for selected points on click */
                function prioritizeSelectedPoints(item) {
                    if(backupHoveredHighlighted){
                        flotElem.data('plot').unhighlight(backupHoveredHighlighted.seriesIndex, backupHoveredHighlighted.dataIndex);
                    }
                    if(hoveredItem){
                        var replacedItem = item;
                        setTimeout(function () {
                            // unhighlight autohighlighted point
                            flotElem.data('plot').unhighlight(replacedItem.seriesIndex, replacedItem.dataIndex);
                        }, 0);
                        backupHoveredHighlighted = hoveredItem;

                        flotElem.data('plot').highlight(hoveredItem.seriesIndex, hoveredItem.dataIndex);
                        // If there is a tooltip for selected points, give it a priority
                        item = hoveredItem;
                    }
                    return item;
                }
            }
            tooltips();
        }    }
});
