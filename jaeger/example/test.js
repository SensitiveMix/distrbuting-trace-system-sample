const initTracer = require("jaeger-client").initTracer;

const config = {
  serviceName: "nodejs-jaeger-tutorial",
  reporter: {
    logSpans: true,
    collectorEndpoint: 'http://127.0.0.1:14268/api/traces'
  },
  sampler: {
    type: "probabilistic",
    param: 1.0
  }
};

const options = {
  tags: {
    "nodejs-jaeger-tutorial.version": "1.1.2"
  }
};

const tracer = initTracer(config, options);

const span = tracer.startSpan("EXAMPLE");

span.setTag("hello", "world");
span.log({ foo: "bar" });

console.log("do stuff...");

span.finish();
