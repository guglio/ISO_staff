var app = angular.module('app', ['ngRoute'])
  .config(function ($routeProvider,$locationProvider) {
      $routeProvider.
          when('/scheda/:id',
            {
              templateUrl: 'views/scheda.html'
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
  .controller("SchedaCtrl", function($scope, $location, $routeParams){
    //var accessData = window.localStorage['dipendenti'];
    $scope.db = angular.fromJson(window.localStorage['dipendenti']);
    $scope.dipendente = [];
    cod_fiscale = $routeParams.id;

    angular.forEach($scope.db, function(value, key){
      if(value.cod_fiscale == cod_fiscale){
        $scope.dipendente = value;
      }
    });
  })
  .controller('AllCtrl', function($scope, $http) {
    $http.get('data/dipendenti.json')
         .then(function(res){
            $scope.personale = res.data;
            window.localStorage['dipendenti'] = angular.toJson($scope.personale);
          });
    $http.get('data/corsi.json')
         .then(function(res){
            window.localStorage['corsi'] = angular.toJson(res.data);
          });
  })
  .controller('CorsiCtrl', function($scope,$routeParams){

    $scope.corsidb = angular.fromJson(window.localStorage['corsi']);
    $scope.corsi = [];
    cod_fiscale = $routeParams.id;
    angular.forEach($scope.corsidb, function(value, key){
      var flagIn = 0;
      var esitoCorso = "";
      angular.forEach(value.partecipanti, function(v, k){
        if(cod_fiscale == v.dipendente){
          flagIn = 1;
          esitoCorso = v.risultato;
        }
      });
      if(flagIn){
        value.esito = esitoCorso;
        $scope.corsi.push(value);
      }
    });
  });
