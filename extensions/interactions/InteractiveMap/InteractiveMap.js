// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Directive for the InteractiveMap interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveInteractiveMap', [
  'HtmlEscaperService', 'interactiveMapRulesService', function(
  HtmlEscaperService, interactiveMapRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/InteractiveMap',
      controller: [
        '$scope', '$attrs', '$timeout', function($scope, $attrs, $timeout) {
          $scope.coords = [
            HtmlEscaperService.escapedJsonToObj($attrs.latitudeWithValue),
            HtmlEscaperService.escapedJsonToObj($attrs.longitudeWithValue)];
          $scope.zoom = (
            HtmlEscaperService.escapedJsonToObj($attrs.zoomWithValue));

          $scope.$on('showInteraction', function() {
            refreshMap();
          });

          $scope.mapMarkers = [];

          // This is required in order to avoid the following bug:
          //   http://stackoverflow.com/questions/18769287
          var refreshMap = function() {
            $timeout(function() {
              google.maps.event.trigger($scope.map, 'resize');
              $scope.map.setCenter({
                lat: coords[0],
                lng: coords[1]
              });
            }, 100);
          };

          var coords = $scope.coords || [0, 0];
          var zoomLevel = parseInt($scope.zoom, 10) || 0;
          $scope.mapOptions = {
            center: new google.maps.LatLng(coords[0], coords[1]),
            zoom: zoomLevel,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };

          $scope.registerClick = function($event, $params) {
            var ll = $params[0].latLng;
            $scope.mapMarkers.push(new google.maps.Marker({
              map: $scope.map,
              position: ll
            }));

            $scope.onSubmit({
              answer: [ll.lat(), ll.lng()],
              rulesService: interactiveMapRulesService
            });
          };

          refreshMap();
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseInteractiveMap', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);

        var latLongPair = _answer[0] + ',' + _answer[1];
        $scope.staticMapUrl =
          'https://maps.googleapis.com/maps/api/staticmap?' +
          'center=' + latLongPair + '&zoom=4&size=500x400' +
          '&maptype=roadmap&visual_refresh=true&markers=color:red|' +
          latLongPair + '&sensor=false';
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseInteractiveMap', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/InteractiveMap',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.formattedCoords = Math.abs(_answer[0]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[0] >= 0 ? 'N' : 'S');
        $scope.formattedCoords += ', ';
        $scope.formattedCoords += Math.abs(_answer[1]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[1] >= 0 ? 'E' : 'W');
      }]
    };
  }
]);

oppia.factory('interactiveMapRulesService', function() {
  var RADIUS_OF_EARTH_KM = 6371.0;
  var degreesToRadians = function(angle) {
    return angle / 180 * Math.PI;
  };
  var getDistanceInKm = function(point1, point2) {
    var latitude1 = degreesToRadians(point1[0]);
    var latitude2 = degreesToRadians(point2[0]);
    latitudeDifference = degreesToRadians(point2[0] - point1[0]);
    longitudeDifference = degreesToRadians(point2[1] - point1[1]);

    // Use the haversine formula
    haversineOfCentralAngle = Math.pow(Math.sin(latitudeDifference / 2), 2) +
      Math.cos(latitude1) * Math.cos(latitude2) *
      Math.pow(Math.sin(longitudeDifference / 2), 2);

    return RADIUS_OF_EARTH_KM *
      2 * Math.asin(Math.sqrt(haversineOfCentralAngle));
  };

  return {
    Within: function(answer, inputs) {
      var actualDistance = getDistanceInKm(inputs.p, answer);
      return actualDistance <= inputs.d;
    },
    NotWithin: function(answer, inputs) {
      var actualDistance = getDistanceInKm(inputs.p, answer);
      return actualDistance > inputs.d;
    }
  };
});
