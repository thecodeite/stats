var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res) {

  var dbUrl = "mongodb://localhost:27017/CourtDocuments";

  MongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err

    var collection = db.collection('updates');

    collection.count(function(err, count){
      res.render('index', { count: count });

    });
  });
});

router.get('/data', function(req, res) {

  var dbUrl = "mongodb://localhost:27017/CourtDocuments";

  MongoClient.connect(dbUrl, function(err, db) {
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
    var aggQuery = {
      "$group": {
        _id: { "$substr": [ "$publishedDate", 0, 13 ]},
        count: {"$sum": 1}
      }
    }

    collection.aggregate(aggQuery, function(err, result) {

      var dataMap = {};
      var earliest = '9999-01-01T00:00:00Z';
      var latest = '0000-01-01T00:00:00Z';

      result.forEach(function(it){
        dataMap[it._id] = it.count;

        if(it._id < earliest) earliest = it._id;
        if(it._id > latest) latest = it._id;
      });

      earliest = moment(earliest);
      latest = moment(latest);

      var dataSeries = []

      for(var now = earliest.clone(); now <= latest; now.add(1, 'hour')) {
      
        var newDateString = 'new Date('+now.year()+', '+(now.month())+', '+now.date()+', '+now.hour()+')';
        var count = dataMap[now.format("YYYY-MM-DDTHH")] || 0;

        dataSeries.push("  ["+newDateString+", "+count+"]")
      }

      res.setHeader('Content-Type', 'application/json');
      res.end("[\n" + dataSeries.join(",\n") + "\n]");

    });
  });
});

module.exports = router;
