const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const MONGO_URI = process.env["MONGO_URI"];

// Connect to DB
mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => console.log("MongoDB connected Successfully ")).catch((err) => console.log("An error occur: ", err));

// Schemas
const UrlsSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    reuired: true
  },
  createdAt: Date,
  submitedBy: {
    ipAddress: String,
    cleint: String,
  }
});

const Urls = mongoose.model("Urls", UrlsSchema);

// Express
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(cors({ optionsSuccessStatus: 200 }));
 
app.use((req, res, next) => {
  const { method, path, ip } = req;
  const logDetails = `${method} ${path} - ${ip}`;

  console.log(logDetails);
  next();
});

app.get("/", (_, res) => {
  res.sendFile("index.html");
});

app.use((req, res) => {
  res.status(404).json({error: "Not Found"});
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));