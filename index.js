const merge = require('lodash.merge');
const shortid = require('shortid');

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

  mapId(queueItem) {
    if (!queueItem) return null;
    const obj = Object.assign({ id: queueItem._id }, queueItem);
    delete obj['_id'];
    return obj;
  }

  add(queueItem, force, callback) {
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
          callback(err, this.mapId(result.ops[0]));
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

  getById(id, callback) {
    const query = {
      _id: id,
      queueName: this.name
    };

    this.datastore.findOne(query, (err, result) => {
      callback(err, this.mapId(result));
    });
  }

  update(id, updates, callback) {
    const query = {
      _id: id,
      queueName: this.name
    };

    this.datastore.findOne(query, (err, result) => {
      if (err) callback(err);

      const queueItem = merge({}, result, updates);

      this.datastore.replaceOne({ _id: id }, queueItem, {}, (err, result) => {
        if (err) {
          callback(err);
        } else if (!result.matchedCount) {
          callback(new Error("No queueItem found with that ID"));
        } else {
          callback(null, this.mapId(queueItem));
        }
      });
    });
  }

  oldestUnfetchedItem(callback) {
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

  countItems(comparator, callback) {
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
