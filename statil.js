'use strict'

const {version} = require('./package.json')
const prod = process.env.NODE_ENV === 'production'

module.exports = {
  imports: {version, prod},
}
