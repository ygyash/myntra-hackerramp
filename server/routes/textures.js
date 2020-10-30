const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const Texture = require("../models/textures");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

// const fileFilter = (req, file, cb) => {
//   // reject a file
//   if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

const upload = multer({
  storage: storage
//   limits: {
    // fileSize: 1024 * 1024 * 5
//   },
//   fileFilter: fileFilter
});

router.get("/", (req, res, next) => {
  Texture.find()
    .select("name description link _id textureImage")
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        Textures: docs.map(doc => {
          return {
            id: doc.id,
            name: doc.name,
            description: doc.description,
            link: doc.link,
            textureImage: doc.textureImage,
            _id: doc._id,
            request: {
              type: "GET",
              url: "http://localhost:5000/textures/" + doc._id
            }
          };
        })
      };
      //   if (docs.length >= 0) {
      res.status(200).json(response);
      //   } else {
      //       res.status(404).json({
      //           message: 'No entries found'
      //       });
      //   }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.post("/", upload.single('textureImage'), (req, res, next) => {
  const { id, name, link, description } = req.body;
  let texture = {};
  texture.id = id
  texture.name = name;
  texture.description = description;
  texture.link = link;
  texture.textureImage = req.file.path;
  let textureModel = new Texture(texture);
  textureModel
    .save()
    .then(result => {
        console.log(result);
        res.status(201).json({
          message: "Created product successfully",
          createdProduct: {
              id: result.id,
              name: result.name,
              link: result.link,
              description: result.description,
              textureImage: result.textureImage,
              _id: result._id,
              request: {
                  type: 'GET',
                  url: "http://localhost:3000/products/" + result._id
              }
          }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});

router.get("/:textureId", (req, res, next) => {
  const id = req.params.textureId;
  Texture.find({ id: id })
    .select('id name description link _id textureImage')
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
            Texture: doc,
            request: {
                type: 'GET',
                url: 'http://localhost:5000/textures'
            }
        });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.delete("/:textureId", (req, res, next) => {
  const id = req.params.textureId;
  Texture.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Texture deleted',
          request: {
              type: 'POST',
              url: 'http://localhost:5000/textures',
              body: { name: 'String', description: 'String' }
          }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

module.exports = router;
