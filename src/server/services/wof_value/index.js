const errors = require('@feathersjs/errors')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const sax = require('sax')
const axios = require('axios')
const instance = axios.create({
  headers: {
    'Content-Type': 'text/xml; charset=utf-8'
  },
  httpAgent: new Agent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  httpsAgent: new HttpsAgent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  maxRedirects: 0,
  responseType: 'stream',
  timeout: 180000
})
const hooks = require('./hooks')
const { MAX_TIME, MIN_TIME } = require('../../lib/datapoints')

/**
 * Custom service that submits an InfluxDB SELECT using query parameters:
 *
 *   SELECT <sc> FROM <fc> WHERE <wc> GROUP BY <gbc> [ORDER BY time DESC] [LIMIT $limit]
 *
 *   sc - select clause (defaults to '*')
 *   fc - from clause (defaults to 'logger_data')
 *   wc - where clause (optional)
 *   gbc - group by clause (optional)
 *   $sort[time] - pass (-1) to return the most recent timestamps first
 *   $limit - return the first N points
 *   api - config key pointing to an InfluxDB HTTP API (defaults to 'default')
 *   db - database name (required)
 */
class Service {
  setup(app) {
    this.app = app
    this.logger = app.logger
  }

  async find(params) {
    const query = params.query || {}
    const { location, time, url, variable, $sort: sort, $limit: limit } = query
    const isDesc = sort && sort.time === -1
    const isTimeGt = time && time.$gt instanceof Date
    const isTimeGte = time && time.$gte instanceof Date
    const isTimeLt = time && time.$lt instanceof Date
    const isTimeLte = time && time.$lte instanceof Date
    const censorCodeQuery =
      query.censor_code !== undefined ? query.censor_code + '' : ''
    const qualityControlLevelCodeQuery =
      query.quality_control_level_code !== undefined
        ? query.quality_control_level_code + ''
        : ''
    const nowDate = new Date()
    const defaultStartDate = new Date(
      nowDate.getTime() - 365 * 24 * 60 * 60 * 1000
    )
    const defaultEndDate = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000)
    const fetchInterval =
      query.fetch_interval !== undefined
        ? query.fetch_interval | 0
        : 30 * 24 * 60 * 60 * 1000
    const fetchLimit =
      query.fetch_limit !== undefined ? query.fetch_limit | 0 : 200
    const result = []

    let isFetching = true
    let fetchCount = 0
    let fetchStartDate
    let fetchEndDate

    const queryStartDate = isTimeGt
      ? time.$gt
      : isTimeGte
      ? time.$gte
      : defaultStartDate
    let queryEndDate = isTimeLt
      ? time.$lt
      : isTimeLte
      ? time.$lte
      : defaultEndDate

    // HACK: Support querying recent values with DESC
    if (queryEndDate > defaultEndDate) queryEndDate = defaultEndDate

    if (isDesc) {
      fetchStartDate = new Date(queryEndDate.getTime() - fetchInterval)
      fetchEndDate = queryEndDate
    } else {
      fetchStartDate = queryStartDate
      fetchEndDate = new Date(queryStartDate.getTime() + fetchInterval)
    }

    while (isFetching) {
      const xml =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
        ' xmlns:tns="http://www.cuahsi.org/his/1.1/ws/"' +
        ' xmlns:s1="http://www.cuahsi.org/waterML/1.1/"' +
        ' xmlns:tm="http://microsoft.com/wsdl/mime/textMatching/">' +
        '<soap:Body>' +
        '<GetValuesObject xmlns="http://www.cuahsi.org/his/1.1/ws/">' +
        '<authToken></authToken>' +
        `<location>${location}</location>` +
        `<variable>${variable}</variable>` +
        `<startDate>${fetchStartDate
          .toISOString()
          .substring(0, 19)}</startDate>` +
        `<endDate>${fetchEndDate.toISOString().substring(0, 19)}</endDate>` +
        '</GetValuesObject></soap:Body></soap:Envelope>'

      this.logger.debug(`POST ${url}\n  ${xml}`)

      let response
      try {
        response = await instance.post(url, xml)
      } catch (err) {
        // Retry in case of keep-alive race
        // SEE: https://github.com/node-modules/agentkeepalive#support-reqreusedsocket
        if (
          err.request &&
          err.request.reusedSocket &&
          err.code === 'ECONNRESET'
        ) {
          this.logger.warn(`ECONNRESET retrying POST ${url}`)
          response = await instance.post(url, xml)
        } else throw err
        throw err
      }

      if (response.status !== 200)
        throw new errors.BadRequest(
          `Non-success status code ${response.status}`
        )

      const body = response.data

      if (!body) throw new errors.BadRequest('No body returned')

      const saxStream = sax.createStream(true)
      const values = []
      let error
      let maxExtent = MIN_TIME
      let minExtent = MAX_TIME
      let value

      saxStream.on('opentag', function (node) {
        value = null
        if (node.name === 'value') {
          try {
            const { attributes } = node
            const { timeOffset } = attributes

            value = Object.assign({}, attributes, {
              dateTime:
                attributes.dateTime && new Date(attributes.dateTime + 'Z'),
              dateTimeUTC:
                attributes.dateTimeUTC &&
                new Date(attributes.dateTimeUTC + 'Z'),
              timeOffset:
                timeOffset > '' && timeOffset.length === 6
                  ? (timeOffset.substring(4) | 0) +
                    (timeOffset.substring(1, 3) | 0) *
                      60 *
                      (timeOffset.substring(0, 1) === '-' ? -1 : 1)
                  : 0
            })
          } catch (err) {
            error = err
          }
        }
      })
      saxStream.on('text', function (text) {
        if (value) value.value = parseFloat(text)
      })
      saxStream.on('closetag', function (name) {
        if (
          name === 'value' &&
          value &&
          !isNaN(value.value) &&
          (censorCodeQuery === '' || censorCodeQuery === value.censorCode) &&
          (qualityControlLevelCodeQuery === '' ||
            qualityControlLevelCodeQuery === value.qualityControlLevelCode)
        ) {
          const { dateTime } = value
          const dateTimeInt = dateTime.getTime()

          if (
            (!isTimeLt || dateTime < time.$lt) &&
            (!isTimeLte || dateTime <= time.$lte) &&
            (!isTimeGt || dateTime > time.$gt) &&
            (!isTimeGte || dateTime >= time.$gte) &&
            (dateTimeInt > maxExtent || dateTimeInt < minExtent)
          ) {
            // Maintain extents
            maxExtent = Math.max(maxExtent, dateTimeInt)
            minExtent = Math.min(minExtent, dateTimeInt)

            values.push(value)
          }
        }
      })
      saxStream.on('error', function (err) {
        error = err
        value = null
        this._parser.error = null
        this._parser.resume()
      })

      await new Promise(resolve => {
        body.on('error', err => {
          error = err
          resolve()
        })
        body.pipe(saxStream).on('end', () => {
          resolve()
        })
      })

      body.removeAllListeners()
      saxStream.removeAllListeners()
      body.unpipe(saxStream)
      body.destroy()

      if (error)
        throw new errors.BadRequest('Error occurred', { error: error.message })

      if (isDesc) {
        values.reverse()

        fetchStartDate = new Date(fetchStartDate.getTime() - fetchInterval)
        fetchEndDate = new Date(fetchEndDate.getTime() - fetchInterval)
      } else {
        fetchStartDate = new Date(fetchStartDate.getTime() + fetchInterval)
        fetchEndDate = new Date(fetchEndDate.getTime() + fetchInterval)
      }

      result.push(...values)

      fetchCount++ // Prevent runaway fetching

      if (
        result.length >= limit ||
        fetchCount >= fetchLimit ||
        fetchEndDate < queryStartDate ||
        fetchStartDate > queryEndDate
      )
        isFetching = false
    }

    // Trim to limit
    if (result.length > limit) result.length = limit

    return result
  }
}

module.exports = function (app) {
  // const services = app.get('services')

  // if (!services.wof_value) return

  app.use('/wof/values', new Service())

  // Get the wrapped service object, bind hooks
  app.service('wof/values').hooks(hooks)
}
