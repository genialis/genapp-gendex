'use strict';

angular.module('gendex.controllers', [])
.controller('GenDexCtrl', ['$scope', function($scope){
   $scope.shared = {
        data: [],
        filteredRows: [],
        selectedRow: [],
        selectedGenes: [],
        widgets: {
            elements: {},
            childElements: {},
            turnedOn: {}
        },
        markedGenesSet: {} // all keys should be either true or deleted
    };
}])
;
