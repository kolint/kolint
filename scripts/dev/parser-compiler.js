const { Parser } = require('jison')
const fs = require('fs')
const path = require('path')

const bnf = fs.readFileSync(path.resolve('./src/parser/grammar.jison'), 'utf8')
const parser = new Parser(bnf /*, { debug: true, type: 'lr' }*/)

const parserSource = parser.generate()
const parserPath = path.resolve('lib/document-parser.js')

console.log('Writing compiler to \'' + parserPath + '\'...')
fs.writeFileSync(parserPath, parserSource)
