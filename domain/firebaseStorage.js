const firebase = require('firebase');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs')
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const imageFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const handleImage = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10000
  },
  fileFilter: imageFilter
});

const cleanFolder = (file) => {
  fs.unlink(file, (err) => {
    if (err) throw err;
  });
}

const createPublicFileURL = (storageName) => {
  return `http://storage.googleapis.com/${bucketName}/${storageName}`;
}

const projectId = config.projectId
const bucketName = `${projectId}.appspot.com`;
const keyFilename='./infra/firebase-adminsdk.json';

const firebaseStorage = new Storage({
  projectId: projectId,
  keyFilename: keyFilename
});

const bucket = firebaseStorage.bucket(bucketName);

const sendAvatar = async (file) => {
  try {
    const storageFile = await bucket.upload(file.path, {
      destination: `user-avatar/${file.filename}`,
      public: true,
    })
    if (storageFile) {
      cleanFolder(file.path)
      return createPublicFileURL(file.filename)
    }
    cleanFolder(file.path)
    throw err
  }
  catch (err) {
    console.error('ERROR:', err);
    cleanFolder(file.path)
    throw err;
  }
}

const sendPhotos = async (file) => {
  try {
    const imgs = file.data
    const initiativeName = file.initiative.name

    const storageFile = await bucket.upload(imgs.path, {
      destination: `initiative-photos/${initiativeName}/${file.data.filename}`,
      public: true,
    })

    if (storageFile) {
      cleanFolder(imgs.path)
      return createPublicFileURL(`initiative-photos/${initiativeName}/${file.data.filename}`)
    }
    cleanFolder(imgs.path)
    throw err
  }
  catch (err) {
    console.error('ERROR:', err);
    cleanFolder(imgs.path)
    throw err;
  }
}

module.exports = { sendAvatar, sendPhotos, handleImage };