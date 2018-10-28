const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const shortid = require('shortid');

describe('Queue object', function () {

  const MongoQueue = require('..');
  const exampleJSON = require('./example.json');

  const dbUri = 'mongodb://localhost:27017';
  const dbName = 'simplecrawler-mongo-queue';
  
  before(function (done) {
    MongoClient.connect(dbUri, { useNewUrlParser: true }, (err, client) => {
      if (err) return done(err);
      this.dbClient = client;
      this.dbCollection = client.db(dbName).collection(shortid.generate());
      this.dbCollection.insertMany(exampleJSON, (err, result) => {
        if (err) return done(err);
        done();
      });
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

  it('throws an error when incorrect params passed', function () {
    try {
      new MongoQueue();
    } catch (e) {
      assert.equal(e.message, '`datastore` param should be a MongoDB collection');
    }

    try {
      new MongoQueue(this.dbCollection, '');
    } catch (e) {
      assert.equal(e.message, '`name` param should be a non-empty string');
    }
  });

  it('should be initialized without a name', function () {
    const queue = new MongoQueue(this.dbCollection);
    assert.ok(queue instanceof MongoQueue);
    assert.ok(shortid.isValid(queue.name));
  });

  it('should be initialized with given name', function () {
    this.queue = new MongoQueue(this.dbCollection, 'example');
    assert.ok(this.queue instanceof MongoQueue);
  });

  it('should replace `_id` with `id`', function () {
    const queueItem = {
      _id: 'id',
      host: 'example.com',
      path: '/foobar',
      port: '',
      protocol: 'http',
      uriPath: '/',
      url: 'http://example.com/foobar',
      depth: 1,
      referrer: 'http://example.com',
      fetched: false,
      status: 'created',
      stateData: {}
    };

    const result = this.queue.mapId(queueItem);

    assert.equal(result.id, 'id');
    assert.equal(result._id, undefined);
  });

  it('should find example record', function (done) {
    this.queue.exists('http://example.com/', (err, result) => {
      assert.equal(err, null);
      assert.equal(result, 1);
      done();
    });
  });

  it('should add to the queue', function (done) {
    const queueItem = {
      host: 'example.com',
      path: '/foobar',
      port: '',
      protocol: 'http',
      uriPath: '/',
      url: 'http://example.com/foobar',
      depth: 1,
      referrer: 'http://example.com',
      fetched: false,
      status: 'created',
      stateData: {}
    };

    this.queue.add(queueItem, false, (err, result) => {
      assert.equal(err, null);
      assert.ok(result.id);
      assert.equal(typeof result.created, 'object');

      Object.assign(result, {
        id: "id",
        created: null
      });
      Object.assign(queueItem, {
        id: "id",
        created: null,
        queueName: 'example',
        status: 'queued'
      });
      assert.deepStrictEqual(result, queueItem);

      done();
    });
  });

  it('should return error when add duplicate', function (done) {
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

    this.queue.add(queueItem, false, (err, result) => {
      if (err) {
        done();
      } else {
        assert.ok(false);
      }
    });
  });

  it('should return the queue item by id', function (done) {
    const queueItem = this.queue.mapId(exampleJSON[0]);

    this.queue.getById(1, (err, result) => {
      assert.equal(err, null);
      assert.deepStrictEqual(result, queueItem);
      done();
    });
  });

  it('should update queue item', function (done) {
    const updates = {
      stateData: {
        sentIncorrectSize: false
      }
    };

    const queueItem = Object.assign({}, this.queue.mapId(exampleJSON[0]));
    queueItem.stateData.sentIncorrectSize = false;

    this.queue.update(1, updates, (err, result) => {
      assert.equal(err, null);
      assert.deepStrictEqual(result, queueItem);
      done();
    });
  });

  it('should return error when updating nonexistent item', function (done) {
    const updates = {
      fetched: true,
      status: 'downloaded'
    };

    this.queue.update(0, updates, (err, result) => {
      if (err) {
        done();
      } else {
        assert.ok(false);
      }
    });
  });

  it('should return oldest unfetched item', function (done) {
    this.queue.oldestUnfetchedItem((err, result) => {
      assert.equal(err, null);
      assert.ok(result.id);
      assert.deepStrictEqual(result, this.queue.mapId(exampleJSON[2]));
      done();
    });
  });

  it('should return all fetched items', function (done) {
    this.queue.countItems({ fetched: true }, (err, result) => {
      assert.equal(err, null);
      assert.equal(result, 1);
      done();
    })
  })

  it('should return all queued items', function (done) {
    this.queue.countItems({ status: 'queued' }, (err, result) => {
      assert.equal(err, null);
      assert.equal(result, 3);
      done();
    })
  })

  it('should return length of the queue', function (done) {
    this.queue.getLength((err, result) => {
      assert.equal(err, null);
      assert.equal(result, 4);
      done();
    });
  });

});
