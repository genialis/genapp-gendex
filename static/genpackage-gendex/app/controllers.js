'use strict';

angular.module('gendex.controllers', [])
	.controller('GenDexCtrl', ['$scope', '$http', '$timeout', '$location', 'Data', 'StorageRequest', 'notify', 'cachedThrottle', 'StateUrl',
		function ($scope, $http, $timeout, $location, Data, StorageRequest, notify, cachedThrottle, StateUrl) {
	    $scope.shared = {
	        data: [],
	        selectedRow: [],
	        selectedGenes: [],
	        widgets: {
	            elements: {},
	            childElements: {},
	            turnedOn: {}
	        },
	        markedGenesSet: {} // all keys should be either true or deleted
	    };

	    var qArrSeperator = ",";

        /**
            default widget positions and sizes
        */
        function windowGridSize(newSize, oldSize) {
            $scope.gridCellSize = $('.windowWidthRef').width()/8;
            var hCell = 444/8;
            var hb = 8*hCell+30;
            var h8 = 8*hCell;
            var wb = 8*$scope.gridCellSize+30;
            var w8 = 8*$scope.gridCellSize;

            $scope.positions2222 = {
                zIndex: [ 5,  4,  3,  2,    1],
                left:   [ 0, wb,  0, wb,    0],
                top:    [ 0,  0, hb, hb, 2*hb],
                width:  [w8, w8, w8, w8,   w8],
                height: [h8, h8, h8, h8,   h8]
            };

            if(oldSize && newSize){
                var resizedWidthRatio = newSize/oldSize;
                var currentPositions = $scope.getWindowsInfo();
                angular.forEach(currentPositions.width, function (width, ix) {
                    currentPositions.width[ix] *= resizedWidthRatio;
                    currentPositions.height[ix] *= resizedWidthRatio;
                    currentPositions.top[ix] *= resizedWidthRatio;
                    currentPositions.left[ix] *= resizedWidthRatio;
                });
                //TODO: solve issue of scaling up from small screen where .window width is below min-width
                $scope.loadPos(currentPositions);
            }
        }
        windowGridSize();
        $scope.$watch(cachedThrottle($scope, function () {
            return $('.windowWidthRef').width();
        }, 600), windowGridSize);

        /**
            move and resize widgets
        */
        $scope.loadPos = function (q) {
            var neededList = ['zIndex', 'left', 'top', 'width', 'height'];

            var hasNeeded = _.all(neededList, function (prop) {
                return _.has(q, prop);
            });
            if (hasNeeded) {
                if(_.isString(q.zIndex)){
                    q = _.map(q, function (str) {
                        return str.split(qArrSeperator);
                    });
                }

                var infoLength = _.max(_.map(_.pick(q, neededList), _.size));

                var wins = $('.window');
                wins = wins.slice(0, infoLength);

                var keys = _.keys(q);
                var cols = _.values(q);
                var rows = _.zip(cols); //transpone
                var objs = _.map(rows, function (row) {
                    return _.object(keys, row);
                });
                wins.each(function (i) {
                    $(this).css(objs[i]);
                    $(this).addClass('animateMovement');
                });
                setTimeout(function () {
                    wins.each(function (i) {
                        $(this).removeClass('animateMovement');
                    });
                }, 200);
            }
        };

        $scope.startedWidgetsPositions = false;
        $timeout(function () {
            // loadedState part taken out of original function from GenExpress controller.js
            (localStorage.genexpressWindowsInfo) ?
            $scope.loadPos(JSON.parse(localStorage.genexpressWindowsInfo)) : $scope.loadPos($scope.positions2222);
            $scope.startedWidgetsPositions = true;
        }, 0);

        $scope.resetPos = function () {
            delete localStorage.genexpressWindowsInfo;
            windowGridSize();
            $scope.loadPos($scope.positions2222);
        };

        $scope.getWindowsInfo = function () {
            var objs = $(".window").map(function () {
                var e = $(this);
                return {
                    zIndex: parseInt(e.css("z-index")),
                    left:   parseInt(e.css("left")),
                    top:    parseInt(e.css("top")),
                    width:  e.width(),
                    height: e.height()
                };
            });

            var rows = _.map(objs, _.values);
            var cols = _.zip(rows); //transpone
            var keys = _.keys(objs[0]);

            return _.object(keys, cols);
        };

        $scope.$watch(cachedThrottle($scope, function () {
            return $scope.getWindowsInfo();
        }, 600), function (windowsInfo) {
            if ($scope.startedWidgetsPositions) {
                $scope.relativeWindowsInfo = angular.copy(windowsInfo);
                var relativeToWidth = $('.windowWidthRef').width();
                angular.forEach($scope.relativeWindowsInfo.width, function (width, ix) {
                    $scope.relativeWindowsInfo.width[ix] /= relativeToWidth;
                    $scope.relativeWindowsInfo.height[ix] /= relativeToWidth;
                    $scope.relativeWindowsInfo.top[ix] /= relativeToWidth;
                    $scope.relativeWindowsInfo.left[ix] /= relativeToWidth;
                });
                // why localStorage? remove all instances, if possible
                localStorage.genexpressWindowsInfo = JSON.stringify(windowsInfo);
            }
        }, true);
	}])
;
