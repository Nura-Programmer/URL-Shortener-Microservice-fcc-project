const dns = require('dns');
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
    // unique: true,
  },
  short_url: {
    type: Number,
    reuired: true,
    // unique: true,
  },
  dns: {
    address: String,
    family: Number,
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

if (!process.env['DISABLE_XORIGIN']) {
  app.use(function (req, res, next) {
    var allowedOrigins = [
      'https://narrow-plane.gomix.me',
      'https://www.freecodecamp.com',
    ];
    var origin = req.headers.origin || '*';
    if (!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      // console.log(origin);
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
    }
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

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
    .then((_urls) => {
      // const len = _urls.length;

      const redirectUrl = _urls.find((_url) => _url.short_url === short_url);

      if (redirectUrl === undefined) return res.json({ error: 'invalid url' });

      console.log(
        `Using Short Url: ${short_url}, Redirecting to: ${redirectUrl.original_url}`
      );

      res.redirect(redirectUrl.original_url);
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: err });
    });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  const protocolRegEx = /((http)|(ftp))(s)?:\/\//;
  const host = url
    .replace(protocolRegEx, '')
    .split('/')
    .find((p) => p.indexOf('.') > 2);

  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.log('invalid url', err);
      return res.json({ error: 'invalid url' });
    }

    Urls.find({})
      .then((_urls) => {
        const len = _urls.length;

        const urlExist = _urls.find((_url) => {
          const _splitUrl = _url.original_url.split('/');
          const splitUrl = url.split('/');

          if (
            _url.dns.address === address &&
            _splitUrl[_splitUrl.length - 1] === splitUrl[splitUrl.length - 1]
          )
            return true;

          return false;
        });

        if (urlExist) {
          console.log('already exist: ', {
            original_url: urlExist.original_url,
            short_url: urlExist.short_url,
          });

          return res.json({
            original_url: urlExist.original_url,
            short_url: urlExist.short_url,
          });
        }

        const urlObj = {
          original_url: url,
          short_url: len + 1,
          createdAt: new Date().toDateString(),
          dns: {
            address,
            family,
          },
          submitedBy: {
            ipAddress: req.ip,
            client: req.get('User-Agent'),
          },
        };

        new Urls(urlObj)
          .save()
          .then((_url) => {
            console.log('created: ', _url);

            res.json({
              original_url: _url.original_url,
              short_url: _url.short_url,
            });
          })
          .catch((err) => {
            console.error(err);
            res.json({ error: err });
          });
      })
      .catch((err) => {
        console.error(err);
        res.json({ error: err });
      });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
