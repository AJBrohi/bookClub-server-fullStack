const express = require('express');
// const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ooeef.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(express.json());
app.use(cors());

const port = 5000;

app.get("/", (req, res) => {
    res.send("Hello World");
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookCollection = client.db(process.env.DB_NAME).collection("books");
    const userBookCollection = client.db(process.env.DB_NAME).collection("users");
    const ordersCollection = client.db(process.env.DB_NAME).collection("orders");

    // Book Collections
  app.post('/addBook', (req, res) => {
    console.log(req.body);
    const bookData = req.body;
    bookCollection.insertOne(bookData)
      .then(data => {
        console.log(data.ops[0]);
        res.send(data.ops[0]);
      })
      .catch(err => console.log(err))
  })

  app.get('/allBooks', (req, res) => {
    const search = req.query.search;
    bookCollection.find({bookName: {$regex: search}})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/delete/:id', (deleteReq, deleteRes) => {
    const id = deleteReq.params.id;
    bookCollection.deleteOne({ _id: ObjectId(id) })
      .then(document => {
        deleteRes.send(document);
      })
  })

  app.get('/delete/user-book/:id', (req, res) => {
    const id = req.params.id;
    userBookCollection.deleteOne({ _id: ObjectId(id) })
      .then(document => {
        res.send(document);
      })
  })

  app.get('/all-users-books', (req, res) => {
    userBookCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/user-books', (req, res) => {
    const userEmail = req.query.email;
    userBookCollection.find({ userEmail })
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/delete/user-books/email', (req, res) => {
    const userEmail = req.query.email;
    userBookCollection.deleteMany({ userEmail })
      .then(document => {
        res.send(document);
      })
  })

  app.post('/user-book/update-from-table/:id', (req, res) => {
    const id = req.params.id;
    const quantity = req.body.quantity;
    userBookCollection.updateOne({ _id: ObjectId(id) }, {
      $set: { quantity }
    })
      .then(result => {
        res.send(result);
      })
  })

  app.post('/user/add-book', (req, res) => {
    const userBookData = req.body;
    userBookCollection.insertOne(userBookData)
      .then(data => {
        res.send(data.ops[0])
      })
      .catch(err => console.log(err))
  })

  app.post('/user-book/update-from-book-card/:id', (req, res) => {
    const id = req.params.id;
    const userEmail = req.query.email;
    const userBookData = req.body;
    userBookCollection.findOne({ _id: ObjectId(id), userEmail })
      .then(data => {
        data.quantity += userBookData.quantity;
        userBookCollection.updateOne({ _id: ObjectId(id) }, {
          $set: { quantity: data.quantity }
        })
          .then(result => {
            res.send(result);
          })
      })
      .catch(err => console.log(err))
  })

  app.get('/user-order', (req, res) => {
    const email = req.query.email;
    ordersCollection.findOne({ email })
      .then(data => {
        res.send(data);
      })
  })

  function orderInsertion(order, email, res) {

    ordersCollection.insertOne({ order, email })
      .then(data => {
        res.send(data.ops[0]);
      })
  }

  app.post('/update-user/orders', (req, res) => {
    const order = req.body;
    const email = req.query.email;
    ordersCollection.findOne({ email })
      .then(data => {
        if (!data) {
          orderInsertion(order, email, res);
        }
        else {
          ordersCollection.updateOne({ email }, {
            $set: { email, order }
          })
            .then(result => {
              res.send(result);
            })
        }
      })

  })
});

app.listen(process.env.PORT || port);