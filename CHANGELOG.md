# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.1](https://github.com/kbychkov/simplecrawler-mongo-queue/compare/v1.0.0...v1.0.1) (2019-10-26)


### Bug Fixes

* fix MongoDB deprecation warning ([e9e4da3](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/e9e4da3))
* make `create` reusable in a child class ([20707ae](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/20707ae))

# [1.0.0](https://github.com/kbychkov/simplecrawler-mongo-queue/compare/v0.4.0...v1.0.0) (2019-06-24)


### Features

* introduce MongoQueue.create method ([0f1a8a1](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/0f1a8a1))



# [0.4.0](https://github.com/kbychkov/simplecrawler-mongo-queue/compare/v0.3.0...v0.4.0) (2019-04-28)


### Features

* add `avg` method ([10e23a3](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/10e23a3))
* add `filterItems` method ([7c7a032](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/7c7a032))
* add `max` and `min` methods ([86d6561](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/86d6561))



# [0.3.0](https://github.com/kbychkov/simplecrawler-mongo-queue/compare/v0.2.0...v0.3.0) (2019-04-13)


### Bug Fixes

* error handling ([8fafa61](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/8fafa61)), closes [#2](https://github.com/kbychkov/simplecrawler-mongo-queue/issues/2)


### Performance Improvements

* add an index to speed up `exists` method ([378cfc6](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/378cfc6))
* create an index on the queue collection ([8db098a](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/8db098a))
* optimize queries with `id` ([9a5b87e](https://github.com/kbychkov/simplecrawler-mongo-queue/commit/9a5b87e))



# 0.2.0 (2019-01-13)
