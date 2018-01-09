const {assign} = require('espo')

// true = use subdirectories
// http://fineonly.com/solutions/regex-exclude-a-string
const requireContext = require.context('./', true, /^((?!\/index).)*\.js$/)

const index = requireContext.keys().map(requireContext)

assign(exports, ...index, {index})

assign(window.app, {utils: exports})
