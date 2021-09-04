const express = require("express");
const path = require("path");
const moment = require("moment");
const bodyParser = require("body-parser");

const url = 'mongodb://localhost:27017/footwearShop';

app = express();

const MongoClient = require("mongodb").MongoClient;
var db;

MongoClient.connect(url, function(err, database) {
    if (err) throw err;
    db = database.db("footwearShop");
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get("/", (req, res) => {
    db.collection("footwear").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.render('index.ejs', {footwear: result});
    });
});

app.get("/sales", (req, res) => {
    db.collection("sales").find({}).toArray(function(err, result) {
        if(err) throw err;
        res.render('sales.ejs', {sales: result, moment: moment});
    });
});

app.get('/addProduct', (req, res) => {
    res.render('addProduct.ejs');
});

app.post('/added', (req, res) => {
    let pid = parseInt(req.body.productID);
    let brand = req.body.brand;
    let category = req.body.category;
    let name = req.body.productName;
    let size = parseInt(req.body.size);
    let quantity = parseInt(req.body.quantity);
    let costprice = parseInt(req.body.costprice);
    let sellingprice = parseInt(req.body.sellingprice);

    var dataObj = {
        'productID': pid, 'brand': brand, 
        'category': category,
        'name': name, 
        'size': size, 
        'quantity': quantity, 
        'costprice': costprice, 
        'sellingprice': sellingprice
    };

    db.collection('footwear').insertOne(dataObj, (err, res) => {
        if(err) throw err;
        console.log("1 Document Inserted in footwear!");
    });

    var salesObj = {
        'purchaseDate': new Date(),
        'productID': pid, 
        'unitPrice': sellingprice, 
        'quantity': quantity, 
        'totalSales': quantity*sellingprice
    };
    
    db.collection('sales').insertOne(salesObj, (err, res) => {
        if(err) throw err;
        console.log('1 Document Inserted in Sales!');
    })
    res.redirect("/");
});

app.get('/delete/:pid', (req, res) => {
    db.collection('footwear').deleteOne({"productID": parseInt(req.params.pid)}, (err, obj) => {
        if(err) throw err;
        // console.log(res);
        console.log('1 Document deleted!');
    });
    db.collection('sales').deleteOne({"productID": parseInt(req.params.pid)}, (err, obj) => {
        if(err) throw err;
        // console.log(res);
        console.log('1 Document deleted!');
    });
    res.redirect("/");
});

app.get('/edit/:pid', (req, res) => {
    db.collection('footwear').findOne({'productID': parseInt(req.params.pid)}, (err, result) => {
       if(err) throw err;
       res.render('edit.ejs', {data: result});
    });
});

app.post('/edited/:pid', (req, res) => {
    let pid = parseInt(req.params.pid);
    let updatedQuantity = parseInt(req.body.newQuantity);
    let updatedCostPrice = parseInt(req.body.newCostprice);
    let updatedSellingPrice = parseInt(req.body.newSellingprice);
    let updatedTotalSales = updatedSellingPrice*(parseInt(req.body.newQuantity));

    db.collection('footwear').findOne({'productID': parseInt(req.params.pid)}, (err, result) => {
        if(err) throw err;
        db.collection('footwear').updateOne({'productID': pid},
            {$set: {'quantity': updatedQuantity + result['quantity'],
                    'costprice': updatedCostPrice,
                    'sellingprice': updatedSellingPrice
                }});
    });
    db.collection('sales').findOne({'productID': parseInt(req.params.pid)}, (err, result) => {
       if(err) throw err;
        db.collection('sales').updateOne({'productID': pid},
            {$set: {'totalSales': updatedTotalSales + result['totalSales'],
                    'quantity': updatedQuantity + result['quantity'],
                    'unitPrice': updatedSellingPrice
                }});
    });
    // console.log(updatedQuantity, updatedCostPrice, updatedSellingPrice, updatedTotalSales);
    res.redirect('/');

});

app.listen(4200, () => {
    console.log("Server running at port: 4200 !");
});


