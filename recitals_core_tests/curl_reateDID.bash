#!/bin/bash

curl -X POST http://localhost:3000/did/createDID\
 -H "Content-Type: application/json"\
 -d @data_createDID.json