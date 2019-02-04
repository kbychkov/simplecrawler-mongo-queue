# MongoDB queue for Simplecrawler

[![npm](https://img.shields.io/npm/v/simplecrawler-mongo-queue.svg)](https://www.npmjs.com/package/simplecrawler-mongo-queue)
[![Travis (.org)](https://img.shields.io/travis/kbychkov/simplecrawler-mongo-queue.svg)](https://travis-ci.org/kbychkov/simplecrawler-mongo-queue)
[![Dependency Status](https://img.shields.io/david/kbychkov/simplecrawler-mongo-queue.svg)](https://david-dm.org/kbychkov/simplecrawler-mongo-queue)
[![devDependency Status](https://img.shields.io/david/dev/kbychkov/simplecrawler-mongo-queue.svg)](https://david-dm.org/kbychkov/simplecrawler-mongo-queue?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/kbychkov/simplecrawler-mongo-queue.svg)](https://greenkeeper.io/)

This is a queue implementation for [simplecrawler](https://www.npmjs.com/package/simplecrawler) backed by MongoDB.

**Warning!** The library is still in development and may work unstable.

## Installation

```
npm install --save simplecrawler-mongo-queue
```

## Usage

First of all, create a new simplecrawler instance as described in the [documentation](https://www.npmjs.com/package/simplecrawler#getting-started). Then create the queue instance and assign it to `crawler.queue` property.

```javascript
const Crawler = require('simplecrawler');
const MongoQueue = require('simplecrawler-mongo-queue');

const crawler = new Crawler('http://example.com');
crawler.queue = new MongoQueue(datastore, name);
```

The `MongoQueue` constructor has two arguments.

- `datastore` - the application should provide a MongoDB collection where the queue will be stored.
- `name` (optional) - a name of the queue to distinguish the different crawlers. If the argument is omitted the constructor creates a random queue name.

## Example

Below is a minimal usage example with connection to MongoDB.

```javascript
const Crawler = require('simplecrawler');
const MongoQueue = require('simplecrawler-mongo-queue');
const MongoClient = require('mongodb').MongoClient;

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
client.connect(err => {
  const db = client.db('crawler');
  const collection = db.collection('queue');

  const crawler = new Crawler('http://example.com');
  crawler.queue = new MongoQueue(collection, 'mycrawler');

  crawler.on('complete', () => {
    client.close();
    process.exit();
  });

  crawler.start();
});
```
