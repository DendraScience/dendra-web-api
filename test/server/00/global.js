const chai = require('chai')
const errors = require('@feathersjs/errors')
const fs = require('fs')
const path = require('path')
const util = require('util')

const readFile = util.promisify(fs.readFile)

async function loadJSON(filePath) {
  return JSON.parse(await readFile(filePath))
}

async function loadData(fileName) {
  return loadJSON(path.join(__dirname, '../../data', `${fileName}.json`))
}

async function getData(dataOrFileName) {
  let data

  if (Array.isArray(dataOrFileName)) {
    data = []

    for (const dfn of dataOrFileName) {
      const d = typeof dfn === 'string' ? await loadData(dfn) : dfn
      data.push(d)
    }
  } else if (typeof dataOrFileName === 'string') {
    data = await loadData(dataOrFileName)
  } else {
    data = dataOrFileName
  }

  return data
}

function getCode(codeOrName) {
  return typeof codeOrName === 'string'
    ? new errors[codeOrName]('Error').code
    : codeOrName
}

async function shouldCreateWithError(
  client,
  servicePath,
  dataOrFileName,
  code
) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).create(data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retDoc).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retDoc, retErr }
}

async function shouldCreateWithoutError(client, servicePath, dataOrFileName) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).create(data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  expect(retDoc).to.have.property('_id')

  return { retDoc, retErr }
}

async function shouldFindWithError(client, servicePath, query = {}, code) {
  let retRes
  let retErr

  try {
    retRes = await client.service(servicePath).find({ query })
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retRes).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retRes, retErr }
}

async function shouldFindWithoutError(
  client,
  servicePath,
  query = {},
  length = 1,
  paginate = true
) {
  let retRes
  let retErr

  try {
    retRes = await client.service(servicePath).find({ query })
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  if (paginate) {
    expect(retRes)
      .to.have.property('data')
      .lengthOf(length)
  } else {
    expect(retRes).to.have.lengthOf(length)
  }

  return { retRes, retErr }
}

async function shouldGetWithError(client, servicePath, id, code) {
  let retDoc
  let retErr

  try {
    retDoc = await client.service(servicePath).get(id)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retDoc).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retDoc, retErr }
}

async function shouldGetWithoutError(client, servicePath, id) {
  let retDoc
  let retErr

  try {
    retDoc = await client.service(servicePath).get(id)
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err.message)
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  expect(retDoc).to.have.property('_id')

  return { retDoc, retErr }
}

async function shouldPatchMultipleWithError(
  client,
  servicePath,
  query,
  dataOrFileName,
  code
) {
  let retRes
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retRes = await client.service(servicePath).patch(null, data, { query })
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retRes).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retRes, retErr }
}

async function shouldPatchWithError(
  client,
  servicePath,
  id,
  dataOrFileName,
  code
) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).patch(id, data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retDoc).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retDoc, retErr }
}

async function shouldPatchWithoutError(
  client,
  servicePath,
  id,
  dataOrFileName
) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).patch(id, data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  expect(retDoc).to.have.property('_id')

  return { retDoc, retErr }
}

async function shouldRemoveMultipleWithError(client, servicePath, query, code) {
  let retRes
  let retErr

  try {
    retRes = await client.service(servicePath).remove(null, { query })
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retRes).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))
}

async function shouldRemoveWithError(client, servicePath, id, code) {
  let retDoc
  let retErr

  try {
    retDoc = await client.service(servicePath).remove(id)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retDoc).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retDoc, retErr }
}

async function shouldRemoveWithoutError(client, servicePath, id) {
  let retDoc
  let retErr

  try {
    retDoc = await client.service(servicePath).remove(id)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  expect(retDoc).to.have.property('_id')

  return { retDoc, retErr }
}

async function shouldUpdateMultipleWithError(
  client,
  servicePath,
  query,
  dataOrFileName,
  code
) {
  let retRes
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retRes = await client.service(servicePath).update(null, data, { query })
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retRes).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retRes, retErr }
}

async function shouldUpdateWithError(
  client,
  servicePath,
  id,
  dataOrFileName,
  code
) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).update(id, data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retDoc).to.be.undefined
  expect(retErr).to.have.property('code', getCode(code))

  return { retDoc, retErr }
}

async function shouldUpdateWithoutError(
  client,
  servicePath,
  id,
  dataOrFileName
) {
  let retDoc
  let retErr

  const data = await getData(dataOrFileName)

  try {
    retDoc = await client.service(servicePath).update(id, data)
  } catch (err) {
    retErr = err
  }

  /* eslint-disable-next-line no-unused-expressions */
  expect(retErr).to.be.undefined
  expect(retDoc).to.have.property('_id')

  return { retDoc, retErr }
}

global.assert = chai.assert
global.expect = chai.expect

global.helper = {
  getCode,

  loadData,
  loadJSON,

  shouldCreateWithError,
  shouldCreateWithoutError,

  shouldFindWithError,
  shouldFindWithoutError,

  shouldGetWithError,
  shouldGetWithoutError,

  shouldPatchMultipleWithError,
  shouldPatchWithError,
  shouldPatchWithoutError,

  shouldRemoveMultipleWithError,
  shouldRemoveWithError,
  shouldRemoveWithoutError,

  shouldUpdateMultipleWithError,
  shouldUpdateWithError,
  shouldUpdateWithoutError
}

global.app = require(path.join(__dirname, '../../../dist/server/app'))

global.path = path
