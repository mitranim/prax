'use strict'

const emerge = require('emerge')
for (const key in emerge) exports[key] = emerge[key]

const atom = require('./atom')
for (const key in atom) exports[key] = atom[key]
