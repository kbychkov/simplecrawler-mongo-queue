const Crawler = require('simplecrawler');
const MongoQueue = require('./index');
const MongoClient = require('mongodb').MongoClient;
const Server = require('./test/fixtures/server');

const server = new Server(100);

server.on('listening', () => console.log('Server started on http://localhost:8000'));
server.listen(8000);

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
client.connect(err => {
  const db = client.db('simplecrawler-mongo-queue');
  const collection = db.collection('queue');

  const crawler = new Crawler('http://localhost:8000');
  crawler.queue = new MongoQueue(collection);

  console.log(`queue.name = '${crawler.queue.name}'`);

  crawler.on('fetchheaders', (queueItem) => {
    console.log(queueItem.url);
  });

  crawler.on('complete', () => {
    console.log('Crawl complete!');
    client.close();
    server.close(() => {
      process.exit();
    });
  });

  crawler.start();
});
