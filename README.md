# Frinx UniConfig tool

## Installation 

#### Requirements
* [Docker](https://www.docker.com/)   

In the project directory, run: 
#### `docker build --build-arg "ODL=<ip>:8181" --build-arg "WF_SERVER=<ip>:8080" -t uniconfig-ui .` <br>
Creates docker container with installation of UniConfig-UI. <br>

## Startup <br>
In the project directory, run: 

#### `docker run -d -p 3000:3000 uniconfig-ui` <br>
Starts the UniConfig-UI container using ODL/WF_SERVER host defined at installation.
