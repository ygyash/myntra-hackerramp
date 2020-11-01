# Myntra Hackerramp

Platform to visualize clothes on a 3d model and search them online.

## Motivation

In the realm of Fashion, change is the only constant. Style statement is extremely volatile and changes frequently. In such a scenario, it gets extremely difficult to keep track of the terms used for various apparels just arrived into town. Moreover, online shopping offers nearly no collaborative aid to interact with our friends and families to seek their advice on what to choose.
How can we enhance user shopping experience and bridge the gap between users by making the workflow of suggestions and recommendations as smooth as possible?

## Our Solution

We intend to propose a solution in the form a collaborative platform where a number of users come together to interact with each other and can customize a 3D avatar using simple operations like select and drag & drop from a cascade of trending looks and outfits provided.
Once they are done, our platform will provide them with various shopping links that redirect them to the desired apparel they’ve been having in mind.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development.

### Prerequisites

Things you need to run the app.

```
NodeJS
MongoDB (optional, add cloud url to mongoDBURI variable in app.js)
```

### Installing

A step by step series to get a development env running. Clone the repository and follow the instructions below:

1. Setup socket and webrtc server

```sh
npm install
npm start
```

2. Setup search results server

```sh
cd server
npm install
npm start
```

3. Head to the "http://localhost:5000" to load the index page.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details