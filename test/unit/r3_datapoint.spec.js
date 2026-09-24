/**
 * Unit tests for /r3/datapoints (no Mongo, no nock).
 */

const { expect } = require('chai')
const errors = require('@feathersjs/errors')
const qs = require('qs')
const configure = require('../../src/server/services/r3_datapoint')
const hooks = require('../../src/server/services/r3_datapoint/hooks')

const Service = configure.Service

function feathersAxiosError(status, name, message, className) {
  const err = new Error(message)
  err.response = {
    status,
    data: {
      name,
      message,
      code: status,
      className: className || name
    }
  }
  return err
}

describe('r3_datapoint Service', function () {
  it('serializes nested mappings and Date times on the outbound query string', async function () {
    let captured
    const http = {
      get: async function (url, config) {
        captured = {
          url: url,
          query: config.paramsSerializer(config.params)
        }
        return {
          status: 200,
          data: [
            {
              t: '2020-06-01T00:00:00.000',
              lt: '2020-06-01T00:00:00.000',
              o: 0,
              v: 1.5
            }
          ]
        }
      }
    }
    const svc = new Service({
      url: 'http://r3.example/internal/feathers',
      http: http
    })
    const gte = new Date('2015-09-02T23:50:00.000Z')

    const result = await svc.find({
      query: {
        organization_id: 'org1',
        table_id: 'tbl1',
        mappings: [{ input_name: 'AirTemp_Avg' }],
        time: { $gte: gte }
      }
    })

    expect(captured.url).to.equal(
      'http://r3.example/internal/feathers/datapoints'
    )
    expect(captured.query).to.contain('mappings[0][input_name]=AirTemp_Avg')
    expect(qs.parse(captured.query).time.$gte).to.equal(gte.toISOString())
    expect(result).to.have.length(1)
    expect(result[0].v).to.equal(1.5)
  })

  it('throws GeneralError when the URL is missing', async function () {
    const svc = new Service({
      http: {
        get: async function () {
          throw new Error('http should not be called')
        }
      }
    })

    try {
      await svc.find({
        query: {
          organization_id: 'org1',
          table_id: 'tbl1',
          mappings: [{ input_name: 'AirTC' }]
        }
      })
      throw new Error('expected GeneralError')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.GeneralError)
      expect(err.message).to.match(/URL undefined/)
    }
  })

  it('throws BadRequest when organization_id, table_id, or mappings are missing', async function () {
    const svc = new Service({
      url: 'http://r3.example/internal/feathers',
      http: {
        get: async function () {
          throw new Error('http should not be called')
        }
      }
    })

    try {
      await svc.find({
        query: { table_id: 'tbl1', mappings: [{ input_name: 'AirTC' }] }
      })
      throw new Error('expected BadRequest')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.BadRequest)
    }

    try {
      await svc.find({
        query: { organization_id: 'org1', mappings: [{ input_name: 'AirTC' }] }
      })
      throw new Error('expected BadRequest')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.BadRequest)
    }

    try {
      await svc.find({
        query: { organization_id: 'org1', table_id: 'tbl1' }
      })
      throw new Error('expected BadRequest')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.BadRequest)
    }
  })

  it('maps R3 Feathers 400 onto BadRequest', async function () {
    const svc = new Service({
      url: 'http://r3.example/internal/feathers',
      http: {
        get: async function () {
          throw feathersAxiosError(400, 'BadRequest', 'nope', 'bad-request')
        }
      }
    })

    try {
      await svc.find({
        query: {
          organization_id: 'org1',
          table_id: 'tbl1',
          mappings: [{ input_name: 'AirTC' }]
        }
      })
      throw new Error('expected BadRequest')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.BadRequest)
      expect(err.message).to.equal('nope')
      expect(err.code).to.equal(400)
    }
  })

  it('maps R3 Feathers 404 onto NotFound', async function () {
    const svc = new Service({
      url: 'http://r3.example/internal/feathers',
      http: {
        get: async function () {
          throw feathersAxiosError(404, 'NotFound', 'missing', 'not-found')
        }
      }
    })

    try {
      await svc.find({
        query: {
          organization_id: 'org1',
          table_id: 'tbl1',
          mappings: [{ input_name: 'AirTC' }]
        }
      })
      throw new Error('expected NotFound')
    } catch (err) {
      expect(err).to.be.instanceOf(errors.NotFound)
      expect(err.message).to.equal('missing')
      expect(err.code).to.equal(404)
    }
  })

  it('qs.stringify of mappings matches Feathers bracket keys', function () {
    const raw = qs.stringify(
      {
        organization_id: 'org1',
        table_id: 'tbl1',
        mappings: [{ input_name: 'AirTemp_Avg' }]
      },
      { encodeValuesOnly: true }
    )
    expect(raw).to.contain('mappings[0][input_name]=AirTemp_Avg')
  })
})

describe('r3_datapoint after find annotHelpers', function () {
  it('evaluates v and attaches q even when compact is omitted', async function () {
    const context = {
      params: {
        actions: { evaluate: 'v = v * 2', flag: 1 },
        annotationIds: ['ann1']
      },
      result: [{ t: '2020-06-01T00:00:00.000', o: 0, v: 1.5 }]
    }

    await hooks.after.find(context)

    expect(Number(context.result[0].v)).to.equal(3)
    expect(context.result[0].q).to.deep.equal({
      annotation_ids: ['ann1'],
      flag: 1
    })
  })

  it('swallows evaluate errors and still writes q', async function () {
    const context = {
      params: {
        actions: { evaluate: 'v = v *', flag: 2 },
        annotationIds: ['ann2']
      },
      result: [{ v: 4 }]
    }

    await hooks.after.find(context)

    expect(context.result[0].v).to.equal(4)
    expect(context.result[0].q.flag).to.equal(2)
    expect(context.result[0].q.annotation_ids).to.deep.equal(['ann2'])
  })
})
