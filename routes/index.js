var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');

//var mongodbUrl = "mongodb://courtsdocs:615iZrDh6Fwi50q@ds051740.mongolab.com:51740/courts_docs_stats"
var mongodbUrl = "mongodb://localhost:27017/CourtDocuments";

/* GET home page. */
router.get('/', function(req, res) {

  MongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err

    var collection = db.collection('updates');

    collection.count(function(err, count){
      res.render('index', { count: count });

    });
  });
});

/* GET home page. */
router.get('/cost', function(req, res) {
  res.render('cost');
});

router.get('/data', function(req, res) {

  MongoClient.connect(mongodbUrl, function(err, db) {
    if(err) throw err

    var collection = db.collection('updates');

    /*
    db.updates.aggregate({
  "$group": {
      _id: { $substr: [ "$publishedDate", 0, 13 ]},
      count: {$sum: 1}
  }
})

    */
    var numberOfUpdatesQuery = {
      "$group": {
        _id: { "$substr": [ "$publishedDate", 0, 13 ]},
        count: {"$sum": 1}
      }
    }

    var costQuery = [
      {"$unwind": "$documents"},
      // {"$match": {"documents.numberOfPages": { $gt: 20} } },
      { "$project": {
        publishedDate: "$publishedDate",
        pages: "$documents.numberOfPages",
        cost:  {$multiply: ["$documents.numberOfPages", 10]}
      }},


      { "$group": {
          _id: { $substr: [ "$publishedDate", 0, 13 ]},
          docs: { $sum: 1 },
          pages: { $sum: "$pages" },
          cost: { $sum: "$cost" }
      }}

    ];

    collection.aggregate(numberOfUpdatesQuery, function(err1, numUpdateResult) {
      collection.aggregate(costQuery, function(err2, costResult) {
        var numUpdatesDataMap = {};
        var costDataMap = {};
        var earliest = '9999-01-01T00:00:00Z';
        var latest = '0000-01-01T00:00:00Z';

        numUpdateResult.forEach(function(it){
          numUpdatesDataMap[it._id] = it.count;

          if(it._id < earliest) earliest = it._id;
          if(it._id > latest) latest = it._id;
        });


        costResult.forEach(function(it){
          costDataMap[it._id] = it.cost;

          if(it._id < earliest) earliest = it._id;
          if(it._id > latest) latest = it._id;
        });

        earliest = moment(earliest);
        latest = moment(latest);

        var dataSeries = []

        for(var now = earliest.clone(); now <= latest; now.add(1, 'hour')) {

          var newDateString = 'new Date('+now.year()+', '+(now.month())+', '+now.date()+', '+now.hour()+')';
          var count = numUpdatesDataMap[now.format("YYYY-MM-DDTHH")] || 0;
          var cost = costDataMap[now.format("YYYY-MM-DDTHH")] || 0;
          var costInUsd = (cost/100)

          dataSeries.push("  ["+newDateString+", "+count+", "+costInUsd+"]")
        }

        res.setHeader('Content-Type', 'application/json');
        res.end("[\n" + dataSeries.join(",\n") + "\n]");

      });
    });
  });
});


router.get('/data-cost', function(req, res) {

  MongoClient.connect(mongodbUrl, function(err, db) {
    if(err) throw err

    var collection = db.collection('updates');


    var aggQuery = [
      {"$unwind": "$documents"},
      // {"$match": {"documents.numberOfPages": { $gt: 20} } },
      { "$project": {
        publishedDate: "$publishedDate",
        pages: "$documents.numberOfPages",
        cost:  {$multiply: ["$documents.numberOfPages", 10]}
      }},


      { "$group": {
          _id: { $substr: [ "$publishedDate", 0, 13 ]},
          docs: { $sum: 1 },
          pages: { $sum: "$pages" },
          cost: { $sum: "$cost" }
      }}

    ];

    collection.aggregate(aggQuery, function(err, result) {

      var dataMap = {};
      var earliest = '9999-01-01T00:00:00Z';
      var latest = '0000-01-01T00:00:00Z';

      result.forEach(function(it){
        dataMap[it._id] = it.cost;

        if(it._id < earliest) earliest = it._id;
        if(it._id > latest) latest = it._id;
      });

      earliest = moment(earliest);
      latest = moment(latest);

      var dataSeries = []

      var cost = 0;
      for(var now = earliest.clone(); now <= latest; now.add(1, 'hour')) {

        var newDateString = 'new Date('+now.year()+', '+(now.month())+', '+now.date()+', '+now.hour()+')';
        var count = (dataMap[now.format("YYYY-MM-DDTHH")] || 0)/100;
        cost += count;
        dataSeries.push("  ["+newDateString+", "+cost+"]")
      }

      res.setHeader('Content-Type', 'application/json');
      res.end("[\n" + dataSeries.join(",\n") + "\n]");

    });
  });
});

module.exports = router;
