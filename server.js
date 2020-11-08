// call all the required packages
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const { config } = require('dotenv');

// CREATE EXPRESS APP
const app = express();
app.use(express.static(`${__dirname}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
config(); // invoking the dotenv config here
const uri = process.env.ATLAS_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.log(err));

mongoose.connection.on('connected', () => {
  console.log('Mongoose is connected...');
});

// Set EJS as templating engine
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024, // max file size 1MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg)$/)) {
      cb(new Error('only upload files with jpg or jpeg format.'));
    }
    cb(undefined, true); // continue with upload
  },
});

const image = require('./model');
// Retrieving the image
app.get('/gallery', (req, res) => {
  image.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      res.render('gallery', { items });
    }
  });
});

// Uploading the image
app.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.render('app', { error: err });
      return;
    } if (err) {
      // An unknown error occurred when uploading.
      res.render('app', { error: err });
      return;
    }
    const obj = {
      title: req.body.title,
      img: {
        data: req.file.buffer.toString('base64'),
      },
    };
    image.create(obj, (error, item) => {
      if (error) {
        console.log(error);
      } else {
      // item.save();
        res.render('app', { success: 'Image saved!' });
      }
    });
  });
});

app.get('/', (req, res) => {
  res.render('app');
});

app.listen('3000' || process.env.PORT, (err) => {
  if (err) { throw err; }
  console.log('Server started');
});

module.exports = app;
