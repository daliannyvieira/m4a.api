const fs = require('fs')
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const Multer = require('multer');
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert('./infra/firebase-adminsdk.json'),
  storageBucket: "match4action-9e993.appspot.com"
});

const bucket = admin.storage().bucket();

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadImage = async (file, fileName) => {
  let prom = new Promise((resolve, reject) => {
    if (!file) {
      reject('No image file');
    }

    let newFileName = `${fileName}_${Date.now()}`;

    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      },
      predefinedAcl: "publicRead"
    });

    blobStream.on('error', (error) => {
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
      const url = `https://match4action-9e993.appspot.com.storage.googleapis.com/${newFileName}`
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
  return prom;
}

module.exports = { uploadImage, multer };