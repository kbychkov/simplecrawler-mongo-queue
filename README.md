# MongoDB queue for Simplecrawler

[![npm](https://img.shields.io/npm/v/simplecrawler-mongo-queue.svg)](https://www.npmjs.com/package/simplecrawler-mongo-queue)
[![Travis (.org)](https://img.shields.io/travis/kbychkov/simplecrawler-mongo-queue.svg)](https://travis-ci.org/kbychkov/simplecrawler-mongo-queue)
[![Dependency Status](https://img.shields.io/david/kbychkov/simplecrawler-mongo-queue.svg)](https://david-dm.org/kbychkov/simplecrawler-mongo-queue)
[![devDependency Status](https://img.shields.io/david/dev/kbychkov/simplecrawler-mongo-queue.svg)](https://david-dm.org/kbychkov/simplecrawler-mongo-queue?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/kbychkov/simplecrawler-mongo-queue.svg)](https://greenkeeper.io/)

This is a queue implementation for [simplecrawler](https://www.npmjs.com/package/simplecrawler) powered by MongoDB.

## Installation

```
npm install --save simplecrawler-mongo-queue
```

## Usage

First of all, create a new Simplecrawler instance as described in the [documentation](https://github.com/simplecrawler/simplecrawler#getting-started). Then create the queue instance and assign it to `crawler.queue` property.

```javascript
const Crawler = require('simplecrawler');
const MongoQueue = require('simplecrawler-mongo-queue');

(async () => {
  const crawler = new Crawler('http://example.com');
  crawler.queue = await MongoQueue.create(datastore, name);
  crawler.start();
})();
```

The `create` method returns `MongoQueue` instance and has two arguments:

- `datastore` - the application should provide a MongoDB collection where the queue will be stored.
- `name` (optional) - a name of the queue to distinguish the different crawlers. If the argument is omitted the constructor creates a random queue name.

## Resources

- [Example](https://github.com/kbychkov/simplecrawler-mongo-queue/tree/master/example)
- [Performance charts](https://kbychkov.github.io/simplecrawler-mongo-queue/)
