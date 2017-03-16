//URL of the CouchDB server
var urlDB = "http://localhost:5984";

// initialize the app
var app = angular.module('app', ['ngRoute'])
  .config(function ($routeProvider,$locationProvider) {
      $routeProvider.
          when('/ciam/:id', //routes for detail view of employee
            {
              templateUrl: 'views/scheda.html',
              controller: 'SchedaCtrl'
            }).
          when('/new_dipendente', //view to create new employee
            {
              templateUrl: 'views/dipendente.html',
              controller: 'NewDipendenteCtrl'
            }).
          when('/new_corso', //view to create new course
            {
              templateUrl: 'views/corso.html',
              controller: 'NewCorsoCtrl'
            }).
          when('/', //table view of all the employees
            {
              templateUrl: 'views/all.html',
              controller: 'AllCtrl'
            }).
          otherwise({ //fallback view
            redirectTo: '/'
          });
  })



  // controller to handle the detail view of employees.
  // I collect the URL id to determine the ID of the employee
  .controller("SchedaCtrl", function($scope, $http, $routeParams){
    $http.get(urlDB+'/ciam/'+$routeParams.id) // get employee details
         .then(function successCallback(response) {
            $scope.dipendente = response.data; // save details to "dipendendente"
            if(!$scope.dipendente.corsi); // check if there are course to display
            else{
              var corsi = []; // initialize an empty array to save the courses
                angular.forEach($scope.dipendente.corsi, function(value, key){
                  corsi.push(value.id); // loop and save courses inside the array "corsi"
                });
                // request to server for the details of the course
                $http.post(urlDB+'/ciam/_all_docs?include_docs=true',{"keys":corsi}).
                  then(
                    function successCallback(response) {
                      $scope.corsi = response.data.rows; // save the courses details inside "corsi", to render the inside the view
                    },
                    function errorCallback(response) {
                      console.log("Error "+response.status+" - "+response.statusText);
                    }
                );
            }
          });
  })



  // controller to fetch and display the employees data inside a table
  .controller('AllCtrl', function($scope, $http, Personale) {
    // request to server for the employees data.
    // I created a custom view to filter the employees
    // TODO: change the request url with something like {"key":["staff":true]} to avoid relying to a custom view
    // one other thing is that if there is a record without the value staff (but only "tutor"), it will be skipped.
    $http.get(urlDB+'/ciam/_design/all/_view/all')
         .then(
           function successCallback(response) {
             // save to factory variable, so I don't have to fetch everytime the employees data
              Personale.addNewPersonale(response.data.rows);
              // save locally to $scope the data
              $scope.personale = Personale.getPersonale();
            },
            function errorCallback(response) {
              console.log("Error "+response.status+" - "+response.statusText);
            }
        );
    // property used to change the order of employees (A->Z or Z->A)
    $scope.orderProp = "value.cognome";
    $scope.asc = false; // default A->Z
    $scope.personale = []; // initialize the array empty

    // watch for changes to the array "personale", when changes are made,
    // search for the property "docente", and add to the factory variable "docenti" the current record
    $scope.$watch('personale', function() {
      for(var i = 0; i < $scope.personale.length; i++){
        if($scope.personale[i].value.docente)
          Personale.addNewDocente($scope.personale[i]);
      }
    });
  })



  // controller to submit new employee to the database.
  .controller('NewDipendenteCtrl', function($scope, $http, Personale){
    $scope.submitMyForm = function(){
        // add the "nome_completo" var to the "fields" array
        $scope.fields.nome_completo = $scope.fields.cognome + " " + $scope.fields.nome;
        $scope.fields.type = "employee"; // add the value employee to type

        // post the data to the server
        $http.post(urlDB+'/ciam', $scope.fields).
          then(
              function successCallback(response) {
                console.log("Data upload without errors");
              },
              function errorCallback(response) {
                console.log("Error "+response.status+" - "+response.statusText);
              });
        //
        //todo: add to Personale or reload it, so it's updated globally!
        //
    };
  })



  // controller that handle the add of new course
  .controller('NewCorsoCtrl', function($scope, $http, Personale){

    $scope.fields = {}; // initialize the fields object
    $scope.rapporto_placeholder = "xx/"+ new Date().getFullYear(); // create a custom placeholder for the course internal ID
    $scope.dip = Personale.getPersonale(); // save inside the $scope the employees data
    $scope.docs = Personale.getDocenti(); // save inside the $scope the tutors data
    $scope.selection = []; // array for selected employees
    $scope.partecipanti = []; // array for partecipants
    $scope.selectionDoc = []; // array for selected tutors
    $scope.docenti = []; // array for tutors

    // function to submit data to the database
    $scope.submitMyForm = function(){
        if($scope.partecipanti && $scope.docenti){
          $scope.fields.partecipanti = $scope.partecipanti;
          $scope.fields.docenti = $scope.docenti;
        }
        $scope.fields.type = "corso"; // set the type of this record to "corso"

        // post data
        $http.post(urlDB+'/ciam', $scope.fields)
          .then(
            function successCallback(response) {
              var corso_id = response.data.id; // get the "_id" of the course
              var ids = []; // initialize the participants's ids array
              for (var i=0;i<$scope.num_partecipanti;i++){
                ids.push($scope.partecipanti[i].id); // populate the array
              }
              // request documents with the corresponding participants id
              $http.post(urlDB+'/ciam/_all_docs?include_docs=true',{"keys":ids}).then(
                function successCallback(response) {
                  var dipendentiUpdate = []; // initialize empty array for the updated data
                  var n = response.data.rows.length;
                  for(var j=0;j<n;j++){
                    dipendentiUpdate.push(response.data.rows[j].doc);
                    if(!dipendentiUpdate[j].corsi)
                      dipendentiUpdate[j].corsi = []; // if the document doesn't have yet a "corsi" array, create one
                    dipendentiUpdate[j].corsi.push({id:corso_id}); // add the course id to the current document
                  }
                  // post the updated data to the database
                  $http.post(urlDB+'/ciam/_bulk_docs',{"docs":dipendentiUpdate}).then(
                    function successCallback(response) {
                      console.log(response.status+" - "+response.statusText);
                      $scope.resetForm(); // reset form data
                    },
                    function errorCallback(response) {
                      console.log("Error "+response.status+" - "+response.statusText);
                    }
                  );
                },
                function errorCallback(response) {
                  console.log("Error "+response.status+" - "+response.statusText);
                }
              );
            },
            function errorCallback(response) {
              console.log("Error "+response.status+" - "+response.statusText);
            }
        );

    };

    // function to reset the current format data (used by the reset button and after the data submission)
    $scope.resetForm = function(){
      $scope.selection = [];
      $scope.partecipanti = [];
      $scope.selectionDoc = [];
      $scope.docenti = [];
      $scope.num_partecipanti = 0;
      $scope.num_docenti = 0;
    };

    // function to add/remove partecipants (staff or employees) to the relative array (employees -> selection, tutors -> selectionDoc)
    $scope.addPartecipanti = function addPartecipanti(id,type){
      // to reuse the same function, I divided the type of input data
      if(type === 'partecipante'){
        var idx = $scope.selection.indexOf(id);
        // if it exists, remove it
        if(idx > -1){
          $scope.selection.splice(idx,1);
        }
        // otherwise, add to the array
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

    // function to save the selected partecipants (staff or tutors) to the corresponding array for display purpose
    $scope.savePersone = function savePersone(type){
      // to reuse the same function, I divided the type of input data
      if(type == "partecipanti"){
        var dipendenti_n = $scope.dip.length; // length of all the employees (dip -> global var)
        var saved_n = $scope.selection.length; // length of partecipants

        if($scope.partecipanti) // create the array if it doesn't exists
          $scope.partecipanti = [];

        // loop inside the gloabl employees data, to find the saved ones
        for(var i = 0; i < dipendenti_n; i++){
          currentDip = $scope.dip[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selection[j];
            // if found, add to the "partecipanti" array
            if(currentDip.id == currentID){

              $scope.partecipanti.push({nome:currentDip.value.nome,cognome:currentDip.value.cognome,mansione:currentDip.value.qualifica,risultato:"Positivo",data:$scope.fields.data,id:currentDip.id});
            }
          }
        }
        // update the total numbers of staff (for display purpose and input placeholder)
        $scope.num_partecipanti = $scope.partecipanti.length;
      }
      if(type == "docenti"){
        var docenti_n = $scope.docs.length; // length of all the tutors (docs -> global var)
        var saved_n = $scope.selectionDoc.length; // length of tutors

        if($scope.docenti) // create the array if it doesn't exists
          $scope.docenti = [];

        // loop inside the gloabl tutors data, to find the saved ones
        for(var i = 0; i < docenti_n; i++){
          currentDoc = $scope.docs[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selectionDoc[j];

            // if found, add to the "docenti" array
            if(currentDoc.id == currentID){

              $scope.docenti.push({nome:currentDoc.value.nome,cognome:currentDoc.value.cognome,id:currentDoc.id});
            }
          }
        }
        // update the total numbers of tutos (for display purpose)
        $scope.num_docenti = $scope.docenti.length;
      }
      $scope.search = null;
    };

    // watch for changes to the date of the course, to update the view and the data of the corresponding employees course date
    $scope.$watch('fields.data', function() {
      var dipendenti_n = $scope.partecipanti.length;
      for(var i = 0; i < dipendenti_n; i++)
        $scope.partecipanti[i].data = $scope.fields.data;
    });
  })



  // factory to save globally the data (employees and tutors), to reduce calls to the database
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
