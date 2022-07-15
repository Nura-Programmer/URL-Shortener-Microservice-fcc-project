const cors = require('cors');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MONGO_URI = process.env['MONGO_URI'];

// Connect to DB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected Successfully '))
  .catch((err) => console.log('An error occur: ', err));

// Schemas
const UrlsSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    unique: true,
  },
  short_url: {
    type: Number,
    reuired: true,
    unique: true,
  },
  createdAt: Date,
  submitedBy: {
    ipAddress: String,
    client: String,
  },
});

const Urls = mongoose.model('Urls', UrlsSchema);

// Express
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors({ optionsSuccessStatus: 200 }));
 
app.use((req, res, next) => {
  const { method, path, ip } = req;
  const logDetails = `${method} ${path} - ${ip}`;

  console.log(logDetails);
  next();
});

app.get('/', (_, res) => {
  res.sendFile('index.html');
});

app.get('/api/shorturl/:short_url?', (req, res) => {
  const short_url = parseInt(req.params.short_url);

  Urls.find({})
    .then((urls) => {
      const len = urls.length;

      if (short_url < 1 || short_url > len)
        return res.status(400).json({ error: 'Out of range' });

      let redirectUrl = urls.find(
        (url) => url.short_url == short_url
      ).original_url;

      console.log(
        `Using Short Url: ${short_url}, Redirecting to: ${redirectUrl}`
      );

      res.redirect(redirectUrl);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err });
    });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
