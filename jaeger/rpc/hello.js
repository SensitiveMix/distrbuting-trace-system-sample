'use strict'

const assert = require('assert')
const initTracer = require('jaeger-client').initTracer
const request = require('request-promise')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')

function sayHello (helloTo) {
  const span = tracer.startSpan('say-hello')
  span.setTag('hello-to', helloTo)

  formatString(helloTo, span)
        .then(data => {
          return printHello(data, span)
        })
        .then(data => {
          span.setTag(Tags.HTTP_STATUS_CODE, 200)
          span.finish()
        })
        .catch(err => {
          span.setTag(Tags.ERROR, true)
          span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode || 500)
          span.finish()
        })
}

function formatString (input, rootSpan) {
  const url = `http://localhost:8081/format?helloTo=${input}`
  const fn = 'format'

  const span = tracer.startSpan(fn, {childOf: rootSpan.context()})
  span.log({
    'event': 'format-string',
    'value': input
  })

  return httpGet(fn, url, span)
}

function printHello (input, rootSpan) {
  const url = `http://localhost:8082/publish?helloStr=${input}`
  const fn = 'publish'

  const span = tracer.startSpan(fn, {childOf: rootSpan.context()})
  span.log({
    'event': 'print-string',
    'value': input
  })
  return httpGet(fn, url, span)
}

function httpGet (fn, url, span) {
  const method = 'GET'
  const headers = {}

  span.setTag(Tags.HTTP_URL, url)
  span.setTag(Tags.HTTP_METHOD, method)
  span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT)
    // Send span context via request headers (parent id etc.)
  tracer.inject(span, FORMAT_HTTP_HEADERS, headers)

  return request({url, method, headers})
            .then(data => {
              span.finish()
              return data
            }, e => {
              span.finish()
              throw e
            })
}

assert.ok(process.argv.length === 3, 'expecting one argument')

const helloTo = process.argv[2]

const config = {
  serviceName: 'jaeger-start',
  reporter: {
    logSpans: true,
  //    agentHost: '47.75.121.242',
  //    agentPort: 6832,
    collectorEndpoint: 'http://47.75.121.242:14268/api/traces'
  },
  sampler: {
    type: 'probabilistic',
    param: 1.0
  }
}

const tracer = initTracer(config, 'hello-world')

sayHello(helloTo)

setTimeout(e => { tracer.close() }, 12000)
