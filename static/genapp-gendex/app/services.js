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
;
