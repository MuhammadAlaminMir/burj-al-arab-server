const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();
var serviceAccount = require('./configs/burj-al-arab-123-firebase-adminsdk-sdssi-798ca19891.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DatabaseURL,
});
const app = express();
app.use(cors());
app.use(bodyParser.json());
console.log(process.env.DB_Pass);
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.tyenc.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    const bookings = client.db('burjAlArab').collection('bookings');

    console.log('connect');

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking).then((result) => {
            res.send(result.insertedCount > 0);
        });
        console.log(newBooking);
    });
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin
                .auth()
                .verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email;
                    if (tokenEmail == req.query.email) {
                        bookings
                            .find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            });
                    } else {
                        res.status(401).send('Un authorized access');
                    }
                })
                .catch(function (error) {
                    res.status(401).send('Un authorized access');
                });
        } else {
            res.status(401).send('Un authorized access');
        }
    });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(4000);
