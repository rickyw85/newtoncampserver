const express = require('express');
const Listing = require('../models/listing');
const authenticate = require('../authenticate');
const cors = require('./cors');

const listingRouter = express.Router();

listingRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Listing.find()
    .populate('comments.author')
    .then(listings => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(listings);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Listing.create(req.body)
    .then(listing => {
        console.log('Listing Created ', listing);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(listing);
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /listings');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Listing.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

listingRouter.route('/:listingId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .populate('comments.author')
    .then(listing => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(listing);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /listings/${req.params.listingId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Listing.findByIdAndUpdate(req.params.listingId, {
        $set: req.body
    }, { new: true })
    .then(listing => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(listing);
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Listing.findByIdAndDelete(req.params.listingId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

listingRouter.route('/:listingId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .populate('comments.author')
    .then(listing => {
        if (listing) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(listing.comments);
        } else {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .then(listing => {
        if (listing) {
            req.body.author = req.user._id;
            listing.comments.push(req.body);
            listing.save()
            .then(listing => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(listing);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /listings/${req.params.listingId}/comments`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .then(listing => {
        if (listing) {
            for (let i = (listing.comments.length-1); i >= 0; i--) {
                listing.comments.id(listing.comments[i]._id).remove();
            }
            listing.save()
            .then(listing => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(listing);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

listingRouter.route('/:listingId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .populate('comments.author')
    .then(listing => {
        if (listing && listing.comments.id(req.params.commentId)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(listing.comments.id(req.params.commentId));
        } else if (!listing) {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /listings/${req.params.listingId}/comments/${req.params.commentId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .then(listing => {
        if (listing && listing.comments.id(req.params.commentId)) {
            if((listing.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
                if (req.body.rating) {
                    listing.comments.id(req.params.commentId).rating = req.body.rating;
                }
                if (req.body.text) {
                    listing.comments.id(req.params.commentId).text = req.body.text;
                }
                listing.save()
                .then(listing => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(listing);
                })
                .catch(err => next(err));
            } else {
                err = new Error('You are not authorized to delete this comment!')
                err.status = 403;
                return next(err); 
            }  
        } else if (!listing) {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Listing.findById(req.params.listingId)
    .then(listing => {
        if (listing && listing.comments.id(req.params.commentId)) {
            if((listing.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
                listing.comments.id(req.params.commentId).remove();    
            listing.save()
            .then(listing => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(listing);
            })
            .catch(err => next(err));
        } else {
            err = new Error('You are not authorized to delete this comment!')
            err.status = 403;
            return next(err); 
        }      
        } else if (!listing) {
            err = new Error(`Listing ${req.params.listingId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = listingRouter;