'use strict';

angular.module('gendex.controllers', [])
.controller('GenDexCtrl', ['$scope', function($scope){
   $scope.shared = {
        data: [],
        filteredRows: [],
        selectedRow: [],
        selectedGenes: []
    };

}])
;
