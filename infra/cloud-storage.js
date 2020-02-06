const admin = require('firebase-admin');
// require('dotenv').config();
// require('dotenv').load();

// console.log('process.env.RELACIONAL_DB_USERNAME', process.env.FIREBASE_CREDENTIALS)

var serviceAccount = require('../firebase-adminsdk.json');

const storageBucket = 'match4action-9e993.appspot.com';

admin.initializeApp({
  storageBucket,
  credential: admin.credential.cert(serviceAccount),
});

const bucket = admin.storage().bucket();

const uploadImage = async (file, fileName) => {
  const prom = new Promise((resolve, reject) => {
    if (!file) {
      reject('No image file');
    }

    const newFileName = `${fileName}_${Date.now()}`;

    const fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      predefinedAcl: 'publicRead',
    });

    blobStream.on('error', () => {
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
      resolve(newFileName);
    });

    blobStream.end(file.buffer);
  });
  return prom;
};

const getImage = async (imageName) => {
  try {
    const file = await bucket.file(imageName);
    return await file.get();
  } catch (err) {
    return err;
  }
};

const deleteImage = async (imageName) => {
  try {
    const file = await bucket.file(imageName);
    return await file.remove();
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports = { uploadImage, getImage, deleteImage, storageBucket };
