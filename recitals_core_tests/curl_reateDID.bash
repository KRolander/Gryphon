#!/bin/bash

curl -X POST http://localhost:3000/did/createDIDDataStruct\
 -H "Content-Type: application/json"\
 -d @data_createDID.json