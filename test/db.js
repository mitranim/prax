'use strict'

const main = require('path').join(__dirname, '..', require('../package').main)

const Beacon = require(main).Beacon

const beacon = new Beacon()

const db = exports.db = {
  collection: [],

  add (value) {
    if (!~db.collection.indexOf(value)) {
      db.collection.push(value)
      beacon.trigger()
    }
  },

  remove (value) {
    const index = db.collection.indexOf(value)
    if (~index) {
      db.collection.splice(index, 1)
      beacon.trigger()
    }
  },

  getAll () {
    beacon.watch()
    return db.collection.slice()
  },

  getLast () {
    beacon.watch()
    return db.collection[db.collection.length - 1]
  }
}
