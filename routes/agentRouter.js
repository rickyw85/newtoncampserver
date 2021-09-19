const express = require('express');
const Agent = require('../models/agent');
const authenticate = require('../authenticate');
const cors = require('./cors');

const agentRouter = express.Router();

agentRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Agent.find()
    .then(agents => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(agents);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Agent.create(req.body)
    .then(gent => {
        console.log('Agent Created ', agent);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(agent);
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /agents');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Agent.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

agentRouter.route('/:agentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Agent.findById(req.params.agentId)
    .then(agent => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(agent);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /agents/${req.params.agentId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Agent.findByIdAndUpdate(req.params.agentId, {
        $set: req.body
    }, { new: true })
    .then(agent => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(agent);
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Agent.findByIdAndDelete(req.params.agentId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

module.exports = agentRouter;