const firebase = require('firebase');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs')
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const Multer = require('multer');

const storage = new Storage({
  projectId: config.projectId,
  keyFilename: './infra/firebase-adminsdk.json'
});

const bucket = storage.bucket('gs://match4action-11b34.appspot.com');

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
  }
});

const uploadImageToStorage = async (file, username) => {
  let prom = new Promise((resolve, reject) => {
    if (!file) {
      reject('No image file');
    }
    let newFileName = `${username}_${Date.now()}`;

    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
      const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
  return prom;
}

module.exports = { uploadImageToStorage, multer };