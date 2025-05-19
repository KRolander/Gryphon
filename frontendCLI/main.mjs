import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import * as utils from './utils.mjs';
import fetch from 'node-fetch';
//import script from "path"

async function initialize(){

    const interf = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    let verifier = true;
    while(verifier){
        const value1 = await interf.question("Press 1 to start the magic"+'\n');
        if (value1 === "1"){
            console.log("Good!"+'\n');
            //script()
            principalScreen(interf,verifier);
            verifier = false;
        }
        else {
            console.log("Magic happens only at 1"+'\n');
        }
    }


}

async function principalScreen(interf,verifier){

    try{
        while(verifier){
            const value2 = await interf.question("What do you want to do?:"+'\n'+"1. Issue DID"+'\n'+
                "2. TODO"+'\n' + "3. Exit"+'\n');

            switch (value2){
                case "1":
                    console.log('\n');
                    const password = await interf.question("Please provide a password for your DID " +
                        "(remember to store it securely):"+'\n');
                    const {publicKey, privateKey} = utils.generateKeys(password);
                    const DID = utils.createDID();

                    const response = await fetch('http://localhost:3000/did/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            DID: DID,
                            publicKey: publicKey 
                        }),
                    });

                    if (response.ok) {
                        const DIDDocument = await response.json(); 
                        //console.log("DID Document received:", DIDDocument);
                        console.log(JSON.stringify(DIDDocument, null, 2));
                        // Example of accessing fields
                        console.log("DID:", DIDDocument.id);
                        console.log("Public Key:", DIDDocument.publicKey);
                        } else {
                        const errorText = await response.text();
                        console.error("Error:", errorText);
}

                    didScreen(interf,verifier,DID);//add DID param here
                    //console.log("This is your DID");//+did after generated above
                    break;
                case "2":
                    console.log("To be implemented");
                    break;
                case "3":
                    verifier = false;
                    break;
                default:
                    console.log("Wrong value");
                    break;
            }
        }
    } finally {
        interf.close();
    }
}

async function didScreen(interf,verifier, DID){

    try{
        while(verifier){
            const value3 = await interf.question("This is your DID: "+DID+'\n'+'\n'+
                "What do you want to do next?:"+'\n' +
            "1. Go back"+'\n'+
            "2. See DID document"+'\n'+
            "3. Exit"+'\n');
            switch (value3){
                case "1":
                    principalScreen(interf,verifier);
                    break;
                case "2":
                    docScreen(interf,verifier);//+DID document
                    break;
                case "3":
                    verifier = false;
                    break;
            }
        }
    } finally {
        interf.close();
    }
}

async function docScreen(interf,verifier){//+DID document
    //transform DID document into readable JSON
    try{
        while(verifier){
            const value4 = await interf.question("This is your DID document: "+'\n'+'\n'+
                "What do you want to do next?:"+'\n' +
                "1. Go back"+'\n'+
                "2. Exit"+'\n');
            switch (value4){
                case "1":
                    didScreen(interf,verifier);
                    break;
                case "2":
                    verifier=false;
                    break;
                default:
                    console.log("Wrong option"+'\n');
                    break;
            }
        }
    } finally {
        interf.close();
    }
}
initialize();