const express = require('express');
const app = express();
const http = require('http').createServer(app);
var io = require('socket.io')(http);
require('dotenv').config();

var people = {};

io.on("connection", function (client) {
    console.log("Connection initiated...");
    client.on("join", function(name,room){
        console.log(name + " has joined the server.");
        people[client.id]  = {
            name:name,
            room:room
        };
        client.join(room);
        console.log(people[client.id].room);
        client.emit("update", "You have connected to the server.");
        client.to(people[client.id].room).broadcast.emit("update", name + " has joined the server.");
        var members =[];
        for(var x in people){
            // console.log(x,people[client.id].room);
            if(people[x].room===people[client.id].room)
                members.push(people[x].name);
        };
        console.log(members);
        io.to(people[client.id].room).emit("update-people", members);
    }); 
    
    client.on("send", function(msg){
        console.log("send initiated");
        io.to(people[client.id].room).emit("chat", people[client.id].name, msg);
    });
    
    client.on("disconnect", function(){
        if(people[client.id]){
            console.log(people[client.id].name + " has left the server.");
            io.to(people[client.id].room).emit("update", people[client.id].name + " has left the server.");
            client.leave(people[client.id].room);
            var room = people[client.id].room;
            delete people[client.id];
            var members =[];
            for(var x in people){
                if(people[x].room===room)
                    members.push(people[x].name);
            };
            io.sockets.emit("update-people", members);
        }
    });
    
    client.on("change-clothes",function(model,texture){
        console.log(`Clothes of ${model} changed with texture ${texture}`);
        io.to(people[client.id].room).emit('clothes',model,texture);
        io.to(people[client.id].room).emit('update',people[client.id].name+' has made some changes! Check it out. ');
    })
});






http.listen(5000,()=>{
    console.log("Listening on port 5000");
});