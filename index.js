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

  static async create(datastore, name) {
    const queue = new MongoQueue(datastore, name);
    await queue.datastore.createIndexes([
      { key: { queueName: 1, status: 1, created: 1 } },
      { key: { url: 'hashed' } }
    ]);
    return queue;
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

  static isAllowedStat(statisticName) {
    const allowedStats = [
      'actualDataSize',
      'contentLength',
      'downloadTime',
      'requestLatency',
      'requestTime'
    ];

    return allowedStats.includes(statisticName);
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

  async get(id, callback) {
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

  async max(statisticName, callback) {
    await this.init();

    if (!MongoQueue.isAllowedStat(statisticName)) {
      return callback(new Error('Invalid statistic'));
    }

    const query = {
      queueName: this.name,
      fetched: true
    };

    const key = {
      [`stateData.${statisticName}`]: -1
    };

    this.datastore.findOne(query, { limit: 1, sort: key }, (err, result) => {
      callback(err, result.stateData[statisticName]);
    });
  }

  async min(statisticName, callback) {
    await this.init();

    if (!MongoQueue.isAllowedStat(statisticName)) {
      return callback(new Error('Invalid statistic'));
    }

    const query = {
      queueName: this.name,
      fetched: true
    };

    const key = {
      [`stateData.${statisticName}`]: 1
    };

    this.datastore.findOne(query, { limit: 1, sort: key }, (err, result) => {
      callback(err, result.stateData[statisticName]);
    });
  }

  async avg(statisticName, callback) {
    await this.init();

    if (!MongoQueue.isAllowedStat(statisticName)) {
      return callback(new Error('Invalid statistic'));
    }

    const query = {
      queueName: this.name,
      fetched: true
    };

    const key = {
      _id: null,
      avg: { $avg: `$stateData.${statisticName}` }
    };

    this.datastore.aggregate().match(query).group(key).toArray((err, result) => {
      callback(err, result[0].avg);
    });
  }

  async countItems(comparator, callback) {
    await this.init();

    const query = Object.assign({ queueName: this.name }, comparator);

    this.datastore.countDocuments(query, callback);
  }

  async filterItems(comparator, callback) {
    await this.init();

    const query = Object.assign({ queueName: this.name }, comparator);

    this.datastore.find(query).toArray((err, result) => {
      callback(err, this.mapId(result));
    });
  }

  getLength(callback) {
    this.countItems({}, callback);
  }
}

module.exports = MongoQueue;
