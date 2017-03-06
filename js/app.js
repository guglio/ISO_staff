var urlDB = "http://127.0.0.1:5984";

var app = angular.module('app', ['ngRoute'])
  .config(function ($routeProvider,$locationProvider) {
      $routeProvider.
          when('/ciam/:id',
            {
              templateUrl: 'views/scheda.html',
              controller: 'SchedaCtrl'
            }).
          when('/new_dipendente',
            {
              templateUrl: 'views/dipendente.html',
              controller: 'NewCtrl'
            }).
          when('/new_corso',
            {
              templateUrl: 'views/corso.html',
              controller: 'NewCtrl'
            }).
          when('/',
            {
              templateUrl: 'views/all.html',
              controller: 'AllCtrl'
            }).
          otherwise({
            redirectTo: '/'
          });
  })
  .controller("SchedaCtrl", function($scope, $http, $routeParams){
    $http.get(urlDB+'/ciam/'+$routeParams.id)
         .then(function(res){
            $scope.dipendente = res.data;
            if(!$scope.dipendente.corsi)
              return;
            else{
            var corsi = "[";
              angular.forEach($scope.dipendente.corsi, function(value, key){
                corsi += "\""+value.id+"\""+",";
              });
              corsi = corsi.slice(0, -1);
              corsi += "]";
              $http.get(urlDB+'/corsi_formazione/_all_docs?keys='+corsi+"&include_docs=true").
                then(function(res){
                  $scope.corsi = res.data.rows;
                });
            }
          });
  })
  .controller('AllCtrl', function($scope, $http) {
    $http.get(urlDB+'/ciam/_design/all/_view/all')
         .then(function(res){
            $scope.personale = res.data.rows;
          });

      $scope.orderProp = "value.cognome";
      $scope.asc = false;

  })
  .controller('NewCtrl', function($scope, $http){
    $scope.submitMyForm = function(){
        /* while compiling form , angular created this object*/
        $scope.fields.nome_completo = $scope.fields.cognome + " " + $scope.fields.nome;
        var data = $scope.fields;
        /* post to server*/
        console.log(data);
        $http.post(urlDB+'/ciam', data);
    }
  });
