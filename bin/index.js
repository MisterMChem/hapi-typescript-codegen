#!/usr/bin/env node
const argv = require('yargs').argv
const fs = require('fs');
const path = require('path');   
const directory = path.resolve(__dirname, process.cwd());
const swaggerToTS = require("@manifoldco/swagger-to-ts");

if (argv.config) {
    console.log('config path provided: ' + argv.config);
} else {
    console.log('no config provided, defaulting to <ROOT>/.hts.config.json');
}


const configPath = directory + (argv.config || '/.hts.config.json');
fs.readFile(configPath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        console.log('received data: ' + data);
        processConfiguration(JSON.parse(data));
    } else {
        if (err.code === 'ENOENT') {
            console.log('No config found at ' + configPath);
        }
    }
});

function processConfiguration(config) {
    const { hapiSwaggerOpts, swaggerTSOpts } = config;

    if (!hapiSwaggerOpts) {
        console.log('No hapi-swagger options provided, received: ' + JSON.stringify(config));
        return
    }
    if (!swaggerTSOpts) {
        console.log('No swagger-to-ts opts provided, received: ' + JSON.stringify(config));
        return;
    }

    readSwaggerFile(config)
}

function readSwaggerFile(config) {
    const { hapiSwaggerOpts } = config;
    const { swaggerLocation } = hapiSwaggerOpts;
    fs.readFile(swaggerLocation, {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            console.log('received data: ' + data);
            generateTypes(JSON.parse(data));
        } else {
            if (err.code === 'ENOENT') {
                console.log('No swagger found at ' + swaggerLocation);
            }
        }
    
    });
}

function generateTypes(config, swagger) {
    const { swaggerTSOpts } = config;
    swaggerToTS(swagger, swaggerTSOpts);
}


