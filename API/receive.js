#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var ex = 'tut.topic';

        ch.assertExchange(ex, 'topic', {durable: true});

        ch.assertQueue('test', {exclusive: false}, function(err, q) {
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
            ch.bindQueue(q.queue, ex, 'sprawdzarka.compile.baz');

            ch.consume(q.queue, function(msg) {
                debugger;
                console.log(" [x] %s: took from queue '%s'", msg.fields.routingKey, JSON.parse(msg.content).language);
            }, {noAck: true});
        });
    });
});