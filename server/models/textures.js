const mongoose = require('mongoose');

const textureSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    textureImage: {
        type: String, 
        required: true 
    }
});

module.exports = mongoose.model('Texture', textureSchema);