const Crawler = require('simplecrawler');
const MongoQueue = require('../index');
const MongoClient = require('mongodb').MongoClient;

const url = process.argv[2];

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
client.connect(async err => {
  if (err) return console.error(err.message );

  const db = client.db('simplecrawler-mongo-queue');
  const collection = db.collection('queue');

  const crawler = new Crawler(url);
  crawler.queue = await MongoQueue.create(collection);

  crawler.on('crawlstart', () => {
    console.log(`crawler.queue.name = ${crawler.queue.name}`);
  });

  crawler.on('fetchheaders', queueItem => {
    console.log(`${queueItem.stateData.code} ${queueItem.url}`);
  });

  crawler.on('complete', () => {
    console.log(`crawler.queue.name = ${crawler.queue.name}`);
    client.close();
    process.exit();
  });

  crawler.start();
});
