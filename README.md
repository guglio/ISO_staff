# ISO 9001 - Management of employees and courses

The purpose of this project is to reduce the amount of paper needed to manage and record the employee's card. Another purpose is to reduce the time that the quality office's staff spend updating and organizing the data of employees and courses.

In general, this project is intended as a tool to manage employees data and formation courses, related to ISO 9001:2015.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine / local server.

*NOTE: This project it's still under development. I created a dedicated branch for CouchDB (named couchDB, so much creativity) so use that, for now.*

### Prerequisites

You need a local machine or server, with a web-server and an instance of CouchDB up and running.

#### Web-server
You can choose what solution you prefer. For development purpose I installed [http-server](https://www.npmjs.com/package/http-server).

For global installation:
```shell
npm install http-server -g
```
Usage:
```shell
cd project path/
http-server
```

In the server I installed [Apache](https://httpd.apache.org/), for more information about the installation, refer to the server OS and corresponding Apache version.

#### Apache CouchDB
I worked with the [NoSQL](https://en.wikipedia.org/wiki/NoSQL) database [Apache CouchDB](http://couchdb.apache.org/), but the next step will be to create a version based on [MongoDB](https://www.mongodb.com).
CouchDB it's really easy to install and configure.

I'm running it on a MacBook Air (Mid 2012 with macOS 10.12.3), as development machine, and on a Raspberry Pi 2 as server.

For the macOS, you need to download the zip from: [http://couchdb.apache.org/#download](http://couchdb.apache.org/#download). Here there are the Mac version and Windows version.

For the Raspberry Pi, it was a little trickier, but I found a valid guide here: [https://cwiki.apache.org/confluence/display/COUCHDB/Raspbian](https://cwiki.apache.org/confluence/display/COUCHDB/Raspbian).
Remeber to change the first line of the guide's code
```shell
echo deb http://packages.erlang-solutions.com/debian wheezy contrib >> /etc/apt/sources.list
```
to
```shell
echo deb http://packages.erlang-solutions.com/debian  your_distro contrib >> /etc/apt/sources.list
```
If you are not sure about the available / supported distros, have a look here [http://packages.erlang-solutions.com/debian/dists/](http://packages.erlang-solutions.com/debian/dists/)

### Installing

When you have Apache and CouchDB running, you need to clone or download the repository (more info [here](https://help.github.com/articles/cloning-a-repository/) on how to clone with different platforms):

**MacOS**

Open terminal and type:
```shell
git clone https://github.com/guglio/ISO_staff.git
```
After downloading the repository, you need to create the database inside CouchDB.

In my project, I called 'ciam'. Create your database, with the name of your choice.

#### Database data structure

I structured the data for the employees with these scheme:
```json
{
  "_id": "Auto-generated",
  "_rev": "Auto-generated and auto-updated",
  "nome_completo": "Full name",
  "cognome": "Surname",
  "nome": "Name",
  "cod_fiscale": "Tax code",
  "cantiere": "Site",
  "qualifica": "Qualification",
  "cod_dipendente": "Employee internal ID",
  "data_assunzione": "Hire date",
  "cod_contratto": "Contract code",
  "contratto_tempo": "Position type",
  "data_nascita": "Birthday",
  "comune_nascita": "Birthplace",
  "indirizzo": "Address",
  "cap": "ZIP",
  "comune": "City of residence",
  "provincia": "Province of residence",
  "staff": "true | false",
  "tutor": "true | false",
  "type": "employee",
  "corsi":[
    {
      "id":"Course's _id"
    }
  ]
}
```
The structure for the courses are the following:
```json
{
  "_id": "Auto-generated",
  "_rev": "Auto-generated and auto-updated",
  "num_addestramento": "Number of the course (xx/2017)",
  "data": "Date of the course",
  "data_inizio": "Begin date of the course",
  "data_fine": "Finish date of the course",
  "documentazione": "Type of documentation used during the course",
  "oggetto": "Purpose of the course",
  "argomenti": "Topics covered",
  "metodo_verifica": "Verification method",
  "partecipanti": [
    {
      "nome": "Employee's name",
      "cognome": "Employee's surname",
      "mansione": "Qualification",
      "risultato": "Result - positive | negative",
      "data": "Date of the course",
      "id": "Employee's _id"
    }
  ],
  "docenti": [
    {
      "nome": "Tutor's name",
      "cognome": "Tutor's surname",
      "id": "Tutor's _id"
    }
  ],
  "type": "corso"
}

```
You need to link the project to the database. Open the file `js/app.js` and change the var `urlDB`, adding your database url.

Mine looks like this: `var urlDB = "http://localhost:5984/ciam";`. This var is used in every `$http` request.

Ok, now you have the project up and running!

I added lots of commentes (almost every line of code) inside `js/app.js`, to help understand better the approach I used for this project.


## Built With

* [AngularJS 1.6](https://angularjs.org/) - framework to handle the data
* [Bootstrap](http://getbootstrap.com/) - framework to render the data
* [Node.js](https://nodejs.org) - to install development modules
* [http-server](https://www.npmjs.com/package/http-server) - web-server for development
* [Apache CouchDB](http://couchdb.apache.org/) - NoSQL database
* [Apache server](https://httpd.apache.org/) - web server for server
* [Compass](http://compass-style.org/) - CSS framework
* [Sass](http://sass-lang.com/) - awesome stylesheets
* [Atom](https://atom.io/) - text editor

## Versioning

I use git for versioning.

## Author

[Guglielmo Turco](https://github.com/guglio)
