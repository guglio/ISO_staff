//URL of the CouchDB server
var urlDB = "http://localhost:5984/ciam";

// initialize the app
var app = angular.module('app', ['ngRoute'])
  .config(function ($routeProvider,$locationProvider) {
      $routeProvider.
          when('/', //table view of all the employees
            {
              templateUrl: 'views/index.html',
              controller:'IndexCtrl'
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
          otherwise({ //fallback view
            redirectTo: '/'
          });
  })


  // controller to load initial data
  .controller('IndexCtrl', function($scope, loadLocalData,$rootScope){

    // Load data inside $rootScope.localData if it's not already loaded
    if($rootScope.localData_employees === undefined || $rootScope.localData_courses === undefined){
      console.log("...loading data...");
      loadLocalData();
    }
    else {
      console.log("already loaded");
    }
  })


  // controller to fetch and display the employees data inside a table
  .controller('EmployeesCtrl', function($scope, $route,$rootScope,$location) {

    // If it's not already loaded, return to index view
    if($rootScope.localData_employees === undefined){
      $location.path('/');
    }
    else{
      // property used to change the order of employees (A->Z or Z->A)
      $scope.orderProp = "value.cognome";
      $scope.asc = false; // default A->Z
    }

    // function to relaod the current view, so the data it's updated
    $scope.reloadData = function(){
      $route.reload();
    };
  })



  // controller to handle the detail view of employees.
  // I collect the URL id to determine the ID of the employee
  .controller("EmployeeCtrl", function($scope, $http, $routeParams){
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
                    },
                    function errorCallback(response) {
                      console.log("Error "+response.status+" - "+response.statusText);
                    }
                );
            }
          });
  })



  // controller to submit new employee to the database.
  .controller('NewEmployeeCtrl', function($scope, $http){
    $scope.submitMyForm = function(){
        // add the "nome_completo" var to the "fields" array
        $scope.fields.nome_completo = $scope.fields.cognome + " " + $scope.fields.nome;

        // post the data to the server
        $http.post(urlDB, $scope.fields).
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
    // function to clean the data inside fields after resetting the view
    $scope.resetForm = function(){
      delete $scope.fields;
    }
  })



  // controller that handle the add of new course
  .controller('NewCourseCtrl', function($scope, $http, $rootScope, $location){
    // If it's not already loaded, return to index view
    if($rootScope.localData_employees === undefined){
      $location.path('/');
    }
    else{

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
                var ids = []; // initialize the participants's ids array
                for (var i=0;i<$scope.num_partecipanti;i++){
                  ids.push($scope.partecipanti[i].id); // populate the array
                }
                console.log(ids);
                // request documents with the corresponding participants id
                $http.post(urlDB+'/_all_docs?include_docs=true',{"keys":ids}).then(
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
    }
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
        var dipendenti_n = $rootScope.localData_employees.length; // length of all the employees (dip -> global var)
        var saved_n = $scope.selection.length; // length of partecipants

        if($scope.partecipanti) // create the array if it doesn't exists
          $scope.partecipanti = [];

        // loop inside the gloabl employees data, to find the saved ones
        for(var i = 0; i < dipendenti_n; i++){
          currentDip = $rootScope.localData_employees[i];

          for(var j = 0; j < saved_n; j++){
            currentID = $scope.selection[j];
            // if found, add to the "partecipanti" array
            if(currentDip.id == currentID){

              $scope.partecipanti.push({nome:currentDip.doc.nome,cognome:currentDip.doc.cognome,mansione:currentDip.doc.qualifica,risultato:"Positivo",data:$scope.fields.data,id:currentDip.id});
            }
          }
        }
        $scope.fields.partecipanti = $scope.partecipanti;
        // update the total numbers of staff (for display purpose and input placeholder)
        $scope.num_partecipanti = $scope.partecipanti.length;
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
      }
      $scope.search = null;
    };

    // watch for changes to the date of the course, to update the view and the data of the corresponding employees course date
    $scope.$watch('fields.data', function() {
      var dipendenti_n = $scope.partecipanti.length;
      for(var i = 0; i < dipendenti_n; i++)
        $scope.fields.partecipanti[i].data = $scope.fields.data;
    });
  })



  // controller to fetch and display the courses data inside a table
  .controller('CoursesCtrl', function($scope, $route,$rootScope, $location){
    // If it's not already loaded, return to index view
    if($rootScope.localData_employees === undefined){
      $location.path('/');
    }

    // function to relaod the current view, so the data it's updated
    $scope.reloadData = function(){
      $route.reload();
    };
  })



  // // factory to save globally the data (employees and tutors), to reduce calls to the database
  // .factory('Personale', function($http){
  //   var personale = {};
  //   var docenti = [];
  //   var tutors = {};
  //   var n;
  //   return{
  //     getPersonale: function(){
  //       return personale;
  //     },
  //     getDocenti: function(){
  //       return docenti;
  //     },
  //     addNewDocente : function(entry){
  //       docenti.push(entry);
  //     },
  //     addTutor : function(entry){
  //       tutors = entry;
  //     },
  //     dataLoaded : function(){
  //       return n;
  //     },
  //     loadData: function(Personale){
  //       $http.get(urlDB+'/_design/views/_view/staff?include_docs=true')
  //            .then(
  //              function successCallback(response) {
  //                // save to factory variable, so I don't have to fetch everytime the employees data
  //                 personale = response.data.rows;
  //
  //
  //               },
  //               function errorCallback(response) {
  //                 console.log("Error "+response.status+" - "+response.statusText);
  //               }
  //           );
  //     }
  //   }
  // })
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
  });
