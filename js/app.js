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
              controller: 'NewDipendenteCtrl'
            }).
          when('/new_corso',
            {
              templateUrl: 'views/corso.html',
              controller: 'NewCorsoCtrl'
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
  .controller('AllCtrl', function($scope, $http, Personale) {
    $http.get(urlDB+'/ciam/_design/all/_view/all')
         .then(function(res){
            Personale.addNew(res.data.rows);
            $scope.personale = Personale.getValues();
          });


      $scope.orderProp = "value.cognome";
      $scope.asc = false;
  })
  .controller('NewDipendenteCtrl', function($scope, $http, Personale){
    $scope.submitMyForm = function(){
        /* while compiling form , angular created this object*/
        $scope.fields.nome_completo = $scope.fields.cognome + " " + $scope.fields.nome;
        $scope.fields.type = "dipendente";
        var data = $scope.fields;
        console.log(data);
        /* post to server*/
        $http.post(urlDB+'/ciam', data);
    };
  })
  .controller('NewCorsoCtrl', function($scope, $http, Personale){
    current_date = new Date();
    $scope.rapporto_placeholder = "xx/"+ current_date.getFullYear();
    $scope.submitMyForm = function(){
        if($scope.partecipanti && $scope.docenti){
          $scope.fields.partecipanti = $scope.partecipanti;
          $scope.fields.docenti = $scope.docenti;
        }
        $scope.fields.type = "corso";
        var data = $scope.fields;
        console.log(data);
        /* post to server*/
        $http.post(urlDB+'/ciam', data);
    };
    console.log(Personale.getValues());

    $scope.addPartecipante = function(){
      if(!$scope.partecipanti)
        $scope.partecipanti = [];
      $scope.partecipanti.push({nome:$scope.par.nome,cognome:$scope.par.cognome,mansione:$scope.par.mansione,risultato:"Positivo",data:$scope.fields.data});
      console.log($scope.partecipanti);
      $scope.num_partecipanti = $scope.partecipanti.length;

      $scope.par.nome = '';
      $scope.par.cognome = '';
      $scope.par.mansione = '';
    };
    $scope.removePartecipante = function(){
      $scope.partecipanti.pop({nome:$scope.par.nome,cognome:$scope.par.cognome,mansione:$scope.par.mansione,risultato:$scope.par.risultato});
      $scope.num_partecipanti = $scope.partecipanti.length;
    }
    $scope.addRow = function() {
      if(!$scope.docenti)
        $scope.docenti = [];
      $scope.docenti.push({ nome: $scope.doc.nome, cognome: $scope.doc.cognome, mansione: $scope.doc.mansione });
      $scope.doc.nome = '';
      $scope.doc.cognome = '';
      $scope.doc.mansione = '';
    }

  })
  .factory('Personale', function(){
    var personale = {};
    return{
      getValues: function(){
        return personale;
      },
      addNew : function(entry){
        personale = entry;
      }
    }
  });
//   .directive('autoComplete', function($timeout) {
//     return function(scope, iElement, iAttrs) {
//             iElement.autocomplete({
//                 source: scope[iAttrs.uiItems],
//                 select: function() {
//                     $timeout(function() {
//                       iElement.trigger('input');
//                     }, 0);
//                 }
//             });
//     };
// });
