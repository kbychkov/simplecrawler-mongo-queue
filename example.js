const Crawler = require('simplecrawler');
const MongoQueue = require('./index');
const MongoClient = require('mongodb').MongoClient;

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
client.connect(err => {
  const db = client.db('simplecrawler-mongo-queue');
  const collection = db.collection('queue');

  const crawler = new Crawler('http://example.com');
  crawler.queue = new MongoQueue(collection);
  crawler.maxDepth = 2;

  crawler.on('fetchheaders', (queueItem) => {
    console.log(queueItem.url);
  });

  crawler.on('complete', () => {
    console.log('Crawl complete!');
    client.close();
    process.exit();
  });

  crawler.start();
});
