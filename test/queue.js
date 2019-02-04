const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const shortid = require('shortid');

describe('Queue object', function () {

  const MongoQueue = require('..');
  const exampleJSON = require('./example.json');

  const dbUri = 'mongodb://localhost:27017';
  const dbName = 'simplecrawler-mongo-queue-test';

  before(function (done) {
    MongoClient.connect(dbUri, { useNewUrlParser: true }, (err, client) => {
      if (err) return done(err);
      this.dbClient = client;
      done();
    });
  });

  after(function (done) {
    this.dbClient.db(dbName).dropDatabase(() => {
      this.dbClient.close();
      done();
    });
  });

  it('exports function', function () {
    assert.equal(typeof MongoQueue, 'function');
  });

  it('throws an error when incorrect `datastore` passed', function () {
    try {
      new MongoQueue();
    } catch (e) {
      assert.equal(e.message, '`datastore` param should be a MongoDB collection');
    }
  });

  it('throw an error when incorrect `name` passed', function () {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());

    try {
      new MongoQueue(dbCollection, '');
    } catch (e) {
      assert.equal(e.message, '`name` param should be a non-empty string');
    }
  });

  it('initialized without a name', function () {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection);

    assert.ok(queue instanceof MongoQueue);
    assert.ok(shortid.isValid(queue.name));
  });

  it('initialized with a given name', function () {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    assert.ok(queue instanceof MongoQueue);
    assert.equal(queue.name, 'example');
  });

  it('creates index on the collection', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection);

    queue.init().then(result => {
      assert.equal(result, 'queueName_1_status_1_created_1');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should replace `_id` with `id`', function () {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection);
    const queueItem = exampleJSON[0];

    const result = queue.mapId(queueItem);

    assert.equal(result.id, 1);
    assert.equal(result._id, undefined);
  });

  it('should find example record', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.exists('http://example.com/', (err, result) => {
        assert.equal(err, null);
        assert.equal(result, 1);
        done();
      });
    });
  });

  it('should add to the queue', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');
    const queueItem = {
      host: 'example.com',
      path: '/',
      port: '',
      protocol: 'http',
      uriPath: '/',
      url: 'http://example.com/',
      depth: 1,
      referrer: 'http://example.com',
      fetched: false,
      status: 'created',
      stateData: {}
    };

    queue.add(queueItem, false, (err, result) => {
      assert.equal(err, null);
      assert.ok(result.id);
      assert.ok(result.created instanceof Date);
      assert.equal(result.status, 'queued');
      done();
    });
  });

  it('should return error when add duplicate', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');
    const queueItem = {
      host: 'example.com',
      path: '/',
      port: '',
      protocol: 'http',
      uriPath: '/',
      url: 'http://example.com/',
      depth: 1,
      referrer: 'http://example.com',
      fetched: false,
      status: 'created',
      stateData: {}
    };

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.add(queueItem, false, (err, result) => {
        if (err) {
          done();
        } else {
          assert.ok(false);
        }
      });
    });
  });

  it('should return the queue item by id', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.getById(1, (err, result) => {
        assert.equal(err, null);
        assert.equal(result.url, 'http://example.com/');
        done();
      });
    });
  });

  it('should update queue item', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');
    const updates = {
      stateData: {
        sentIncorrectSize: false
      }
    };

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.update(1, updates, (err, result) => {
        assert.equal(err, null);
        assert.equal(result.url, 'http://example.com/');
        assert.equal(result.stateData.sentIncorrectSize, false);
        assert.equal(result.stateData.headers['content-encoding'], 'gzip');
        done();
      });
    });
  });

  it('should return error when updating nonexistent item', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');
    const updates = {
      fetched: true,
      status: 'downloaded'
    };

    queue.update(0, updates, (err, result) => {
      if (err) {
        assert.equal(err.message, 'No queueItem found with that ID');
        done();
      } else {
        assert.ok(false);
      }
    });
  });

  it('should return oldest unfetched item', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.oldestUnfetchedItem((err, result) => {
        assert.equal(err, null);
        assert.equal(result.id, 2);
        assert.equal(result.url, 'http://example.com/foo');
        done();
      });
    });
  });

  it('should return all fetched items', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.countItems({ fetched: true }, (err, result) => {
        assert.equal(err, null);
        assert.equal(result, 1);
        done();
      });
    });
  })

  it('should return all queued items', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.countItems({ status: 'queued' }, (err, result) => {
        assert.equal(err, null);
        assert.equal(result, 2);
        done();
      });
    });
  })

  it('should return length of the queue', function (done) {
    const dbCollection = this.dbClient.db(dbName).collection(shortid.generate());
    const queue = new MongoQueue(dbCollection, 'example');

    dbCollection.insertMany(exampleJSON, (err, result) => {
      if (err) return done(err);
      queue.getLength((err, result) => {
        assert.equal(err, null);
        assert.equal(result, 3);
        done();
      });
    });
  });

});
