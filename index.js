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

// console.log(process.env.DB_USER);
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
    // console.log(204)
    const search = req.query.search;
    // console.log(search," => ");
    bookCollection.find({bookName: {$regex: search}})
      .toArray((err, documents) => {
        // console.log(documents);
        res.send(documents);
      })
  })

  // Delete a book from MongoDB by id using (params)...
  app.get('/delete/:id', (deleteReq, deleteRes) => {
    const id = deleteReq.params.id;
    bookCollection.deleteOne({ _id: ObjectId(id) })
      .then(document => {
        // console.log(document.deletedCount);
        deleteRes.send(document);
      })
  })

  // User Collections
  app.get('/delete/user-book/:id', (req, res) => {
    const id = req.params.id;
    // console.log(id)
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
    // console.log(userEmail);
    userBookCollection.find({ userEmail })
      .toArray((err, documents) => {
        // console.log(documents);
        res.send(documents);
      })
  })

  app.get('/delete/user-books/email', (req, res) => {
    const userEmail = req.query.email;
    // console.log(userEmail);
    userBookCollection.deleteMany({ userEmail })
      .then(document => {
        // console.log(document.deletedCount);
        res.send(document);
      })
  })

  app.post('/user-book/update-from-table/:id', (req, res) => {
    const id = req.params.id;
    const quantity = req.body.quantity;
    // console.log( quantity, " ", id)
    userBookCollection.updateOne({ _id: ObjectId(id) }, {
      $set: { quantity }
    })
      .then(result => {
        // console.log(result.modifiedCount);
        res.send(result);
      })
  })

  app.post('/user/add-book', (req, res) => {
    const userBookData = req.body;
    // console.log(userBookData)
    userBookCollection.insertOne(userBookData)
      .then(data => {
        res.send(data.ops[0])
      })
      .catch(err => console.log(err))
  })

  app.post('/user-book/update-from-book-card/:id', (req, res) => {
    // console.log(req.params.id,"\n",req.body);
    const id = req.params.id;
    // console.log(id);
    const userEmail = req.query.email;
    const userBookData = req.body;
    userBookCollection.findOne({ _id: ObjectId(id), userEmail })
      .then(data => {
        // console.log("Old data => ",  data);
        data.quantity += userBookData.quantity;
        // console.log("Updated data => ", data);
        userBookCollection.updateOne({ _id: ObjectId(id) }, {
          $set: { quantity: data.quantity }
        })
          .then(result => {
            res.send(result);
          })
      })
      .catch(err => console.log(err))
  })

  // Order Collection
  app.get('/user-order', (req, res) => {
    const email = req.query.email;
    ordersCollection.findOne({ email })
      .then(data => {
        // console.log(data, " =>");
        res.send(data);
      })
  })

  function orderInsertion(order, email, res) {

    // console.log(email)
    ordersCollection.insertOne({ order, email })
      .then(data => {
        // console.log(data.ops[0]);
        res.send(data.ops[0]);
      })
  }

  app.post('/update-user/orders', (req, res) => {
    const order = req.body;
    const email = req.query.email;
    // console.log(email);
    ordersCollection.findOne({ email })
      .then(data => {
        // console.log(data);
        if (!data) {
          orderInsertion(order, email, res);
        }
        else {
          ordersCollection.updateOne({ email }, {
            $set: { email, order }
          })
            .then(result => {
              // console.log(result);
              res.send(result);
            })
        }
      })

  })
});

app.listen(process.env.PORT || port);