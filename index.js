const express = require("express");
const app = express();
const os = require("os");
const http = require("http").createServer(app);
var io = require("socket.io")(http);
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

var people = {};
var roomToModel = {};

app.get("/", (req, res) => {
  return res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", function (client) {
  console.log("Connection initiated...");
  console.log(people);
  console.log(roomToModel);
  client.on("create", function (name, room, model) {
    if (roomToModel[room]) {
      client.emit("room-already-exists");
      return;
    }

    console.log("New room creation initiated...");
    console.log(name + " has joined the server.");
    people[client.id] = {
      name: name,
      room: room,
    };

    /////// Video Conference Part Start
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom
      ? Object.keys(clientsInRoom.sockets).length
      : 0;
    console.log(numClients);

    if (numClients === 0) {
      client.emit("created", room, client.id);
    } else {
      io.sockets.in(room).emit("join", room);
      client.emit(
        "joined",
        room,
        client.id,
        Object.keys(clientsInRoom.sockets)
      );
      io.sockets.in(room).emit("ready");
    }
    /////// End

    client.join(room);
    console.log(people[client.id].room);
    var currModel;
    roomToModel[room] = {
      model: model,
      texture: `${model}top1bottom1foot1`,
    };
    client.emit("loadClothes", model, `${model}top1bottom1foot1`);
    client.emit("update", "You have connected to the server.");
    var members = [people[client.id].name];
    // console.log(members);
    io.to(people[client.id].room).emit("update-people", members);
  });

  client.on("join", function (name, room) {
    if (roomToModel[room] === undefined) {
      client.emit("room-not-found");
      return;
    }

    console.log(name + " has joined the server.");
    people[client.id] = {
      name: name,
      room: room,
    };

    /////// Video Conference Part Start
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom
      ? Object.keys(clientsInRoom.sockets).length
      : 0;
    console.log(numClients);

    if (numClients === 0) {
      client.emit("created", room, client.id);
    } else {
      io.sockets.in(room).emit("join", room);
      client.emit(
        "joined",
        room,
        client.id,
        Object.keys(clientsInRoom.sockets)
      );
      io.sockets.in(room).emit("ready");
    }
    /////// End

    client.join(room);
    console.log(people[client.id].room);
    client.emit(
      "loadClothes",
      roomToModel[room].model,
      roomToModel[room].texture
    );
    client.emit("update", "You have connected to the server.");
    client
      .to(people[client.id].room)
      .broadcast.emit("update", name + " has joined the server.");
    var members = [];
    for (var x in people) {
      // console.log(x,people[client.id].room);
      if (people[x].room === people[client.id].room)
        members.push(people[x].name);
    }
    console.log(members);
    io.to(people[client.id].room).emit("update-people", members);
  });

  client.on("send", function (msg) {
    console.log("send initiated");
    io.to(people[client.id].room).emit("chat", people[client.id].name, msg);
  });

  client.on("disconnect", function () {
    if (people[client.id]) {
      console.log(people[client.id].name + " has left the server.");
      io.to(people[client.id].room).emit(
        "update",
        people[client.id].name + " has left the server."
      );
      client.leave(people[client.id].room);
      var room = people[client.id].room;
      delete people[client.id];
      var members = [];
      for (var x in people) {
        if (people[x].room === room) members.push(people[x].name);
      }
      if (members.length === 0) {
        delete roomToModel[room];
      }
      io.sockets.emit("update-people", members);
    }
  });

  // Clothes Events
  client.on("change-clothes", function (texture) {
    var model = roomToModel[people[client.id].room].model;
    roomToModel[people[client.id].room].texture = model + texture;
    console.log(roomToModel);
    console.log(`Clothes of ${model} changed with texture ${texture}`);
    io.to(people[client.id].room).emit("loadClothes", model, model + texture);
    io.to(people[client.id].room).emit(
      "update",
      people[client.id].name + " has made some changes! Check it out. "
    );
  });

  // Video Conference Events
  client.on("message", function (message) {
    if (message.sendToRemoteUser) {
      client.broadcast.to(message.to).emit("message", message);
    } else {
      var rooms = Object.keys(client.rooms);
      rooms.forEach(function (room) {
        client.broadcast.to(room).emit("message", message);
      });
    }
  });

  client.on("disconnecting", () => {
    var rooms = Object.keys(client.rooms);
    rooms.forEach(function (room) {
      client.to(room).emit("disconnected", client.id);
    });
  });

  client.on("ipaddr", function () {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function (details) {
        if (details.family === "IPv4" && details.address !== "127.0.0.1") {
          client.emit("ipaddr", details.address);
        }
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
