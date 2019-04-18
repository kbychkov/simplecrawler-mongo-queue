const flatten = require('flatten-obj')();
const shortid = require('shortid');

let initPromise;

class MongoQueue {
  constructor(datastore, name) {
    if (typeof datastore !== 'object') throw new Error('`datastore` param should be a MongoDB collection');

    if (!name) {
      name = shortid.generate();
    } else if (typeof name !== 'string' || name.length === 0) {
      throw new Error('`name` param should be a non-empty string');
    }

    this.datastore = datastore;
    this.name = name;
  }

  init() {
    if (!initPromise) {
      initPromise = this.datastore.createIndexes([
        { key: { queueName: 1, status: 1, created: 1 } },
        { key: { url: 'hashed' } }
      ]);
    }

    return initPromise;
  }

  mapId(queueItem) {
    if (!queueItem) return null;

    (Array.isArray(queueItem) ? queueItem : [queueItem]).forEach(item => {
      item.id = item._id;
    });

    return queueItem;
  }

  async add(queueItem, force, callback) {
    await this.init();

    const doc = Object.assign({}, queueItem, {
      queueName: this.name,
      status: 'queued',
      created: new Date()
    });

    this.exists(queueItem.url, (err, exists) => {
      if (err) {
        callback(err);
      } else if (!exists || force) {
        this.datastore.insertOne(doc, (err, result) => {
          if (err) {
            callback(err);
          } else {
            callback(null, this.mapId(result.ops[0]));
          }
        });
      } else {
        const error = new Error('Resource already exists in queue!');
        error.code = "DUPLICATE";
        callback(error);
      }
    });
  }

  exists(url, callback) {
    this.countItems({ url }, callback);
  }

  // Parameter `index` doesn't make sense in database.
  // I think it should be better to change `index` param to `id`
  // in order to correspond with `update` method.
  // I did not found use of this method in crawler.
  get(index, callback) {
    callback(new Error('Not implemented'));
  }

  async getById(id, callback) {
    await this.init();

    const query = {
      _id: id
    };

    this.datastore.findOne(query, (err, result) => {
      callback(err, this.mapId(result));
    });
  }

  async update(id, updates, callback) {
    await this.init();

    const query = {
      _id: id
    };
    const update = {
      $set: flatten(updates)
    };

    this.datastore.findOneAndUpdate(query, update, { returnOriginal: false }, (err, result) => {
      if (err) {
        callback(err);
      } else if (!result.lastErrorObject.n) {
        callback(new Error("No queueItem found with that ID"));
      } else {
        callback(null, this.mapId(result.value));
      }
    });
  }

  async oldestUnfetchedItem(callback) {
    await this.init();

    const query = {
      queueName: this.name,
      status: 'queued'
    };

    this.datastore.findOne(query, { limit: 1, sort: { created: 1 } }, (err, result) => {
      callback(err, this.mapId(result));
    });
  }

  max(statisticName, callback) {
    callback(new Error('Not implemented'));
  }

  min(statisticName, callback) {
    callback(new Error('Not implemented'));
  }

  avg(statisticName, callback) {
    callback(new Error('Not implemented'));
  }

  async countItems(comparator, callback) {
    await this.init();

    const query = Object.assign({ queueName: this.name }, comparator);

    this.datastore.countDocuments(query, callback);
  }

  filterItems(comparator, callback) {
    callback(new Error('Not implemented'));
  }

  getLength(callback) {
    this.countItems({}, callback);
  }
}

module.exports = MongoQueue;
