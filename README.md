# Credit Card Server

This repository includes the Node.JS code for a credit card server which includes authentication (using nginx), input validation (using z-schema and luhn algorithm) and async storage (using redis)

# Requirements

NodeJS required modules: 
 - express, uuid, redis, async, z-schema, luhn

Other requirements:
  - Run redis process (for async storage) - *mandatory*
  - Run ngnix with the given config file and passwords for authentication on port 80 (optional)
  
