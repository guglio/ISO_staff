var urlDB = "http://localhost:5984";

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
  .controller('NewCorsoCtrl', function($scope, $http, Personale, $timeout){

    $scope.fields = [];
    $scope.rapporto_placeholder = "xx/"+ new Date().getFullYear();
    $scope.dip = Personale.getValues();

    $scope.submitMyForm = function(){
        if($scope.partecipanti && $scope.docenti){
          $scope.fields.partecipanti = $scope.partecipanti;
          $scope.fields.docenti = $scope.docenti;
        }
        $scope.fields.type = "corso";
        var data = $scope.fields;
        console.log(data);
        $http.post(urlDB+'/ciam', data);
    };



    $scope.selection = [];
    $scope.partecipanti = [];

    $scope.selectionDoc = [];
    $scope.docenti = [];

    $scope.addPartecipanti = function addPartecipanti(id,type){

      var idx = $scope.selection.indexOf(id);
      if(idx > -1){
        $scope.selection.splice(idx,1);
      }
      else{
          $scope.selection.push(id);
      }
    };
    $scope.savePersone = function savePersone(type){

      if(type == "partecipante"){
        var dipendenti_n = $scope.dip.length;
        var saved_n = $scope.selection.length;

        if($scope.partecipanti)
          $scope.partecipanti = [];

        for(var i = 0; i < dipendenti_n; i++){
          currentDip = $scope.dip[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selection[j];

            if(currentDip.id == currentID){

              $scope.partecipanti.push({nome:currentDip.value.nome,cognome:currentDip.value.cognome,mansione:currentDip.value.qualifica,risultato:"Positivo",data:$scope.fields.data});
            }
          }
        }
        $scope.num_partecipanti = $scope.partecipanti.length;
      }
      if(type == "docente"){
        var docenti_n = $scope.docenti;
      }
    };



    $scope.$watch('fields.data', function() {
      var dipendenti_n = $scope.partecipanti.length;
      for(var i = 0; i < dipendenti_n; i++)
        $scope.partecipanti[i].data = $scope.fields.data;
    });













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
