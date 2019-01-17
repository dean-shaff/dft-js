// wast files have slightly different syntax than wat files
const fs = require('fs')

const getInputFile = () => {
  var inputFileName = process.argv[2]
  return inputFileName
}

const convert = (inputStr) => {
  var outputStr = inputStr.replace(/local.get/g, 'get_local')
                          .replace(/local.set/g, 'set_local')
  return outputStr
}


const main = () => {
  var inputFileName = getInputFile()
  var outputFileName = inputFileName.replace('.wast', '.wat')
  var contents = fs.readFileSync(inputFileName, 'utf8')
  var outputStr = convert(contents)
  fs.writeFileSync(outputFileName, outputStr)
}

if (typeof require != 'undefined' && require.main==module) {
  main()
}
