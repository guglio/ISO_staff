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
            Personale.addNewPersonale(res.data.rows);
            $scope.personale = Personale.getPersonale();
          });

    $scope.orderProp = "value.cognome";
    $scope.asc = false;
    $scope.personale = [];

    $scope.$watch('personale', function() {
      for(var i = 0; i < $scope.personale.length; i++){
        if($scope.personale[i].value.docente)
          Personale.addNewDocente($scope.personale[i]);
      }
    });

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
        //
        //todo: add to Personale, so globally is loaded!
        //
    };
  })
  .controller('NewCorsoCtrl', function($scope, $http, Personale, $timeout){

    $scope.fields = [];
    $scope.rapporto_placeholder = "xx/"+ new Date().getFullYear();
    $scope.dip = Personale.getPersonale();
    $scope.docs = Personale.getDocenti();

    $scope.submitMyForm = function(){
        if($scope.partecipanti && $scope.docenti){
          $scope.fields.partecipanti = $scope.partecipanti;
          $scope.fields.docenti = $scope.docenti;
        }
        $scope.fields.type = "corso";
        var data = $scope.fields;
        console.log(data);
        //$http.post(urlDB+'/ciam', data);
    };



    $scope.selection = [];
    $scope.partecipanti = [];

    $scope.selectionDoc = [];
    $scope.docenti = [];

    $scope.addPartecipanti = function addPartecipanti(id,type){
      if(type === 'partecipante'){
        var idx = $scope.selection.indexOf(id);
        if(idx > -1){
          $scope.selection.splice(idx,1);
        }
        else{
            $scope.selection.push(id);
        }
      }
      if(type === 'docente'){
        var idx = $scope.selectionDoc.indexOf(id);
        if(idx > -1){
          $scope.selectionDoc.splice(idx,1);
        }
        else{
            $scope.selectionDoc.push(id);
        }
      }
    };
    $scope.resetForm = function(){
      $scope.selection = [];
      $scope.partecipanti = [];
      $scope.selectionDoc = [];
      $scope.docenti = [];
      $scope.num_partecipanti = 0;
      $scope.num_docenti = 0;
    };
    $scope.savePersone = function savePersone(type){

      if(type == "partecipanti"){
        var dipendenti_n = $scope.dip.length;
        var saved_n = $scope.selection.length;

        if($scope.partecipanti)
          $scope.partecipanti = [];

        for(var i = 0; i < dipendenti_n; i++){
          currentDip = $scope.dip[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selection[j];

            if(currentDip.id == currentID){

              $scope.partecipanti.push({nome:currentDip.value.nome,cognome:currentDip.value.cognome,mansione:currentDip.value.qualifica,risultato:"Positivo",data:$scope.fields.data,id:currentDip.id});
            }
          }
        }
        $scope.num_partecipanti = $scope.partecipanti.length;
      }
      if(type == "docenti"){
        var docenti_n = $scope.docs.length;
        var saved_n = $scope.selectionDoc.length;

        if($scope.docenti)
          $scope.docenti = [];

        for(var i = 0; i < docenti_n; i++){
          currentDoc = $scope.docs[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selectionDoc[j];

            if(currentDoc.id == currentID){

              $scope.docenti.push({nome:currentDoc.value.nome,cognome:currentDoc.value.cognome,id:currentDoc.id});
            }
          }
        }
        $scope.num_docenti = $scope.docenti.length;
      }
      $scope.search = "";
    };



    $scope.$watch('fields.data', function() {
      var dipendenti_n = $scope.partecipanti.length;
      for(var i = 0; i < dipendenti_n; i++)
        $scope.partecipanti[i].data = $scope.fields.data;
    });













  })
  .factory('Personale', function(){
    var personale = {};
    var docenti = [];
    return{
      getPersonale: function(){
        return personale;
      },
      getDocenti: function(){
        return docenti;
      },
      addNewPersonale : function(entry){
        personale = entry;
      },
      addNewDocente : function(entry){
        docenti.push(entry);
      }
    }
  });
