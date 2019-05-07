'use strict'

const express = require('express')
const app = express()
const initTracer = require('jaeger-client').initTracer
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')

const config = {
  serviceName: 'jaeger-formatter',
  reporter: {
    logSpans: true,
  //    agentHost: '47.75.121.242',
  //    agentPort: 6832,
    collectorEndpoint: 'http://127.0.0.1:14268/api/traces'
  },
  sampler: {
    type: 'probabilistic',
    param: 1.0
  }
}
const tracer = initTracer(config, 'format-service')

const port = 8081

app.listen(port, function () {
  console.log('Formatter app listening on port ' + port)
})

app.get('/format', function (req, res) {
  console.log(req.headers)
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers)
  const span = tracer.startSpan('http_server', {
    childOf: parentSpanContext,
    tags: {[Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER}
  })

  const helloTo = req.query.helloTo

  span.log({
    'event': 'format',
    'value': helloTo
  })

  span.finish()

  res.send(`Hello, ${helloTo}!`)
})
