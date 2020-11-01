const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MONGOURI } = require('./key');
const bodyParser = require("body-parser");

const textureRoutes = require("./routes/textures");

const app = express();

const port = process.env.PORT || 5001;

mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.connection.on("Connected", () => {
    console.log('DB is connected');
})

mongoose.connection.on("Error", (err) => {
    console.log(err);
})

app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/textures", textureRoutes);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


