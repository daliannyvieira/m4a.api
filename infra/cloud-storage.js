const admin = require('firebase-admin');

const storageBucket = 'match4action-9e993.appspot.com';

admin.initializeApp({
  storageBucket,
  credential: admin.credential.cert('./firebase-adminsdk.json'),
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
      const url = `https://${storageBucket}.storage.googleapis.com/${newFileName}`;
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
  return prom;
};

module.exports = { uploadImage };
