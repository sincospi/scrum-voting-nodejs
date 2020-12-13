const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const port = process.env.PORT || 4001;
const router = require("./router");

const app = express();
app.use(cors());
app.use(router);

const server = http.createServer(app);

const io = socketIo(server);

const appState = {
  connectedUsers: {},
  title: "",
  revealVotes: false
};

io.on("connection", (socket) => {
  appState.connectedUsers[socket.id] = { id: socket.id };
  console.log(
    `${socket.id} connected`,
    Object.keys(appState.connectedUsers).length
  );
  broadcast();

  socket.on("disconnect", () => {
    delete appState.connectedUsers[socket.id];
    console.log(
      `${socket.id} disconnected`,
      Object.keys(appState.connectedUsers).length
    );
    broadcast();
  });

  socket.on("initUser", ({ name, vote }) => {
    console.log(`${socket.id} init`, name, vote);
    appState.connectedUsers[socket.id].name = name;
    appState.connectedUsers[socket.id].vote = vote;
    broadcast();
  });

  socket.on("setName", ({ name }) => {
    console.log(`${socket.id} new name`, name);
    appState.connectedUsers[socket.id].name = name;
    broadcast();
  });

  socket.on("setTitle", ({ title }) => {
    console.log(`${socket.id} new title`, title);
    appState.title = title;
    broadcast();
  });

  socket.on("reveal", () => {
    console.log(`${socket.id} REVEAL`);
    appState.revealVotes = true;
    broadcast();
  });

  socket.on("setVote", ({ vote }) => {
    console.log(`${socket.id} new title`, vote);
    appState.connectedUsers[socket.id].vote = vote;
    broadcast();
  });

  socket.on("reset", () => {
    console.log(`${socket.id} RESET`);
    Object.values(appState.connectedUsers).forEach((user) => (user.vote = ""));
    appState.title = "";
    appState.revealVotes = false;
    console.log("appState", appState);
    broadcast();
  });
});

function broadcast() {
  const payload = {
    date: new Date(),
    ...appState,
    connectedUsers: Object.values(appState.connectedUsers)
  };
  io.emit("FromAPI", payload);
  console.log("Broadcast", payload.date);
}

server.listen(port, () => console.log(`Listening on port ${port}`));
