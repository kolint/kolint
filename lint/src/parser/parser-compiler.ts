// OBS: The document parser js file generation has an delay of 5 seconds to reduse computer stress

import { Parser } from 'jison'
import * as fs from 'fs'
import * as path from 'path'
import { YY } from './document-builder'
import { Node } from './bindingDOM'

const bnf = fs.readFileSync(path.join(__dirname, '../../src/parser/grammar.jison'), 'utf8')
const parser = new Parser<YY, Node[]>(bnf /*, { debug: true, type: 'lr' }*/)

// generate source, ready to be written to disk
const parserSource = parser.generate()

const parserDir = path.resolve(__dirname, '..', '..', 'lib')
const parserPath = path.resolve(parserDir, 'document-parser.js')

if (!fs.existsSync(parserDir)) fs.mkdirSync(parserDir)

console.log('Writing data to ' + parserPath)
fs.writeFileSync(parserPath, parserSource)