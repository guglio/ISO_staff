// TODO: aggiungere n° patente + scadenza + tipologia di patente (A,b,etc)
//      carta identità + scadenza
//      aggiungere files al singolo


//URL of the CouchDB server
// var urlDB = "http://192.168.1.23:5984/ciam";
var urlDB = "http://localhost:5984/ciam";
var modello_personale = {
  "modello_numero" : "7.2.2.2",
  "revisione" : "00",
  "data_revisione" : "01/01/2017"
};
var rapporto_addestramento = {
  "modello_numero" : "7.2.2.2",
  "revisione" : "00",
  "data_revisione" : "01/01/2017"
};
var pianoAddestramentoAnnuale = {
  "modello_numero": "7.1.2.1",
  "revisione": "00",
  "data_revisione":"31/01/2017"
};
// initialize the app
var app = angular.module('app', ['ngRoute'])
  .config(function ($routeProvider,$locationProvider) {
      $routeProvider.
          when('/', //table view of all the employees
            {
              templateUrl: 'views/home.html',
              controller:'HomeCtrl'
            }).
          when('/new_employee', //view to create new employee
            {
              templateUrl: 'views/new_employee.html',
              controller: 'NewEmployeeCtrl'
            }).
          when('/new_course', //view to create new course
            {
              templateUrl: 'views/new_course.html',
              controller: 'NewCourseCtrl'
            }).
          when('/employees', //table view of all the employees
            {
              templateUrl: 'views/employees.html',
              controller: 'EmployeesCtrl'
            }).
          when('/employee/:id', //routes for detail view of employee
            {
              templateUrl: 'views/employee.html',
              controller: 'EmployeeCtrl'
            }).
          when('/courses',
            {
                templateUrl: 'views/courses.html',
                controller: 'CoursesCtrl'
            }).
          when('/course/:id', //routes for detail view of course
            {
              templateUrl: 'views/course.html',
              controller: 'CourseCtrl'
            }).
          when('/course/:_id/:id',
            {
              templateUrl: 'views/employee.html',
              controller: 'EmployeeCtrl'
            }).
          otherwise({ //fallback view
            redirectTo: '/'
          });
  })


  // controller to load initial data
  .controller('HomeCtrl', function($scope, loadLocalData, $rootScope, $q){

    // Load data inside $rootScope.localData if it's not already loaded
    if($rootScope.localData_employees === undefined || $rootScope.localData_courses === undefined || $rootScope.localData_tutors === undefined){
      loadLocalData();
      $q.all($rootScope);
    }
  })


  // controller to fetch and display the employees data inside a table
  .controller('EmployeesCtrl', function($scope, $route,$rootScope,$location,loadLocalData,$q) {

    // If it's not already loaded, load the data
    if($rootScope.localData_employees === undefined || $rootScope.localData_courses === undefined || $rootScope.localData_tutors === undefined){
      loadLocalData();
      $q.all($rootScope);
    }
    // property used to change the order of employees (A->Z or Z->A)
    $scope.orderProp = "value.cognome";
    $scope.asc = false; // default A->Z

    // function to relaod the current view, so the data it's updated
    $scope.reloadData = function(){
      $route.reload();
    };
  })



  // controller to handle the detail view of employees.
  // I collect the URL id to determine the ID of the employee
  .controller("EmployeeCtrl", function($scope, $http, $routeParams,CourseLink){
    $scope.modello_num = modello_personale.modello_numero;
    $scope.modello_revisione = modello_personale.revisione;
    $scope.data_revisione_modello = modello_personale.data_revisione;
    $scope.fromCorso = false;

    // if this controller it's called from the course's detail view, add the link on top (Home / Elenco Corsi / course_id / surname name)
    if(Object.getOwnPropertyNames($routeParams).length>1){
      $scope.fromCorso = true;
      var courselink = CourseLink.getCourseUrl();
      $scope.course = [];
      $scope.course._id = courselink.url;
      $scope.course.num_addestramento = courselink.name;
    }
    $http.get(urlDB+'/'+$routeParams.id) // get employee details
         .then(function successCallback(response) {
            $scope.dipendente = response.data; // save details to "dipendendente"
            if(!$scope.dipendente.corsi); // check if there are course to display
            else{
              var corsi = []; // initialize an empty array to save the courses
                angular.forEach($scope.dipendente.corsi, function(value, key){
                  corsi.push(value.id); // loop and save courses inside the array "corsi"
                });
                // request to server for the details of the course
                $http.post(urlDB+'/_all_docs?include_docs=true',{"keys":corsi}).
                  then(
                    function successCallback(response) {
                      $scope.corsi = response.data.rows; // save the courses details inside "corsi", to render the inside the view

                      $scope.corsi.forEach(function(corso){
                        var partecipantiArr = corso.doc.partecipanti;
                        partecipantiArr.forEach(function(partecipante){
                          if(partecipante.id === $scope.dipendente._id)
                            corso.doc.risultato=partecipante.risultato;
                        });
                      });
                    },
                    function errorCallback(response) {
                      console.log("Error "+response.status+" - "+response.statusText);
                    }
                );
            }
          });
  })



  // controller to submit new employee to the database.
  .controller('NewEmployeeCtrl', function($scope, $http,loadLocalData){
    $scope.fields = {
      nome: "ASDA",
      cognome: "LKNLN",
      data_nascita: new Date(2013, 9, 22),
      comune_nascita: "MMM",
      cod_fiscale: "NILNLN",
      cantiere: "LONIN",
      qualifica: "NIN",
      cod_dipendente: "IONN",
      data_assunzione: new Date(2013, 9, 22),
      contratto_tempo: "ASOIDJDNA",
      nome_completo: "LKNLN ASDA"
    };


    $scope.submitMyForm = function(){
        // add the "nome_completo" var to the "fields" array
        $scope.fields.nome_completo = $scope.fields.cognome + " " + $scope.fields.nome;

        // post the data to the server
        // $http.post(urlDB, $scope.fields).
        //   then(
        //       function successCallback(response) {
        //         console.log("Data upload without errors");
        //         // update local data
        //         loadLocalData();
        //       },
        //       function errorCallback(response) {
        //         console.log("Error "+response.status+" - "+response.statusText);
        //       });
    };




    // function to clean the data inside fields after resetting the view
    $scope.resetForm = function(){
      delete $scope.fields;
    }
  })



  // controller that handle the add of new course
  .controller('NewCourseCtrl', function($scope, $http, $rootScope, $location, loadLocalData,$q){
    // If it's not already loaded, load the data
    if($rootScope.localData_employees === undefined || $rootScope.localData_courses === undefined || $rootScope.localData_tutors === undefined){
      loadLocalData();
      $q.all($rootScope);
    }

    $scope.fields = {}; // initialize the fields object
    $scope.rapporto_placeholder = "xx/"+ new Date().getFullYear(); // create a custom placeholder for the course internal ID
    $scope.selection = []; // array for selected employees
    $scope.partecipanti = []; // array for partecipants
    $scope.selectionDoc = []; // array for selected tutors
    $scope.docenti = []; // array for tutors
    $scope.fields.course = true; // set the type of this record to "corso"
    // function to submit data to the database
    $scope.submitMyForm = function(){
        if($scope.partecipanti && $scope.docenti){
          $scope.fields.partecipanti = $scope.partecipanti;
          $scope.fields.docenti = $scope.docenti;
        }


        // post data
        $http.post(urlDB, $scope.fields)
          .then(
            function successCallback(response) {
              var corso_id = response.data.id; // get the "_id" of the course
              // request documents with the corresponding participants id
              $http.post(urlDB+'/_all_docs?include_docs=true',{"keys":$scope.papartecipants}).then(
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
                  $http.post(urlDB+'/_bulk_docs',{"docs":dipendentiUpdate}).then(
                    function successCallback(response) {
                      console.log(response.status+" - "+response.statusText);
                      $scope.resetForm(); // reset form data
                      loadLocalData();
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
      delete $scope.fields;
      $scope.searchStaff = undefined;
      $scope.searchTutors = undefined;
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
        var dipendenti_n = $rootScope.localData_employees.length; // length of all the employees (dip -> global var)
        var saved_n = $scope.selection.length; // length of partecipants

        if($scope.partecipanti) // create the array if it doesn't exists
          $scope.partecipanti = [];

        for(var i = 0; i < saved_n; i++ ){
          currentID = $scope.selection[i];
          for(var j = 0; j < dipendenti_n; j++){
            currentDip = $rootScope.localData_employees[j];

            if(currentDip.id == currentID){

              $scope.partecipanti.push({nome:currentDip.doc.nome,cognome:currentDip.doc.cognome,mansione:currentDip.doc.qualifica,risultato:"Positivo",data:$scope.fields.data,id:currentDip.id});
            }
          }
        }

        $scope.fields.partecipanti = $scope.partecipanti;
        // update the total numbers of staff (for display purpose and input placeholder)
        $scope.num_partecipanti = $scope.partecipanti.length;
        $scope.searchStaff = undefined;
      }
      if(type == "docenti"){
        var docenti_n = $rootScope.localData_tutors.length; // length of all the tutors (docs -> global var)
        var saved_n = $scope.selectionDoc.length; // length of tutors

        if($scope.docenti) // create the array if it doesn't exists
          $scope.docenti = [];

        // loop inside the gloabl tutors data, to find the saved ones
        for(var i = 0; i < docenti_n; i++){
          currentDoc = $rootScope.localData_tutors[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selectionDoc[j];

            // if found, add to the "docenti" array
            if(currentDoc.id == currentID){

              $scope.docenti.push({nome:currentDoc.doc.nome,cognome:currentDoc.doc.cognome,id:currentDoc.id});

            }
          }
        }
        $scope.fields.docenti = $scope.docenti;
        // update the total numbers of tutos (for display purpose)
        $scope.num_docenti = $scope.docenti.length;
        $scope.searchTutors = undefined;
      }
    };

    // watch for changes to the date of the course, to update the view and the data of the corresponding employees course date
    $scope.$watch('fields.data', function() {
      var dipendenti_n = $scope.partecipanti.length;
      for(var i = 0; i < dipendenti_n; i++)
        $scope.fields.partecipanti[i].data = $scope.fields.data;
    });
  })



  // controller to fetch and display the courses data inside a table
  .controller('CoursesCtrl', function($scope, $route, $rootScope, $location,loadLocalData,$q){
    // If it's not already loaded, load the data
    if($rootScope.localData_employees === undefined || $rootScope.localData_courses === undefined || $rootScope.localData_tutors === undefined){
      loadLocalData();
      $q.all($rootScope);
    }
    $scope.modello_num = pianoAddestramentoAnnuale.modello_numero;
    $scope.modello_revisione = pianoAddestramentoAnnuale.revisione;
    $scope.data_revisione_modello = pianoAddestramentoAnnuale.data_revisione;
    // function to relaod the current view, so the data it's updated
    $scope.reloadData = function(){
      $route.reload();
    };
  })



  // controller to show course details
  .controller('CourseCtrl',function($scope, $http, $routeParams,CourseLink){
    $scope.modello_num = rapporto_addestramento.modello_numero;
    $scope.modello_revisione = rapporto_addestramento.revisione;
    $scope.data_revisione_modello = rapporto_addestramento.data_revisione;

    $http.get(urlDB+'/'+$routeParams.id) // get employee details
         .then(
            function successCallback(response) {
              // save details to "dipendendente"
              $scope.course = response.data;
              CourseLink.setCourseUrl($scope.course._id,$scope.course.num_addestramento);
              // check if there are partecipants to display
              if(!$scope.course.partecipanti)
                $scope.course.num_partecipanti = 0;
              else
                $scope.course.num_partecipanti = $scope.course.partecipanti.length;
            },
            function errorCallback(response) {
              console.log("Error "+response.status+" - "+response.statusText);
            }
          );
  })


  // factory to load the data locally, inside $rootScope
  .factory('loadLocalData',function($http, $rootScope){
    return function loadLocalData(){
      $http.get(urlDB+'/_design/views/_view/staff?include_docs=true')
           .then(
             function successCallback(response) {
               // save to $rootScope variable, so I don't have to fetch everytime the employees data
               $rootScope.localData_employees = response.data.rows;
               console.log("Employees: OK");
              },
              function errorCallback(response) {
                console.log("Employees: "+response.status+" - "+response.statusText);
              }
          );
      $http.get(urlDB+'/_design/views/_view/course?include_docs=true')
           .then(
             function successCallback(response) {
               // save to $rootScope variable, so I don't have to fetch everytime the courses data
               $rootScope.localData_courses = response.data.rows;
               console.log("Courses: OK");
              },
              function errorCallback(response) {
                console.log("Courses: "+response.status+" - "+response.statusText);
              }
          );
      $http.get(urlDB+'/_design/views/_view/tutor?include_docs=true')
           .then(
             function successCallback(response) {
               // save to $rootScope variable, so I don't have to fetch everytime the tutors data
               $rootScope.localData_tutors = response.data.rows;
               console.log("Tutors: OK");
              },
              function errorCallback(response) {
                console.log("Tutors: "+response.status+" - "+response.statusText);
              }
          );
    }
  })

  .factory('CourseLink',function(){
    var courseUrl = [];
    return{
      setCourseUrl : function(url,value){
        courseUrl.url = url;
        courseUrl.name = value;
      },
      getCourseUrl : function(){
        tmp = courseUrl;
        courseUrl = [];
        return tmp;
      }
    }
  });
