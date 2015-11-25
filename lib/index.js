'use strict'

const emerge = require('emerge')
Object.keys(emerge).forEach(key => {exports[key] = emerge[key]})

const atom = require('./atom')
Object.keys(atom).forEach(key => {exports[key] = atom[key]})

const fq = require('./fq')
Object.keys(fq).forEach(key => {exports[key] = fq[key]})
