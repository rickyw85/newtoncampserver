const express = require('express');
const favoriteRouter = express.Router();
const Favorite = require('../models/favorite');
const bodyParser = require('body-parser');
const cors = require('./cors');
const authenticate = require('../authenticate');

favoriteRouter.use(bodyParser.json());

 // All Favorites
 favoriteRouter.route(`/`)
 .options(cors.corsWithOptions, (req, res) => res.sendStatus(200)) 
     .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
       Favorite.findOne({user: req.user._id })  // Find current users favorites
        .populate('favorites.campsites').populate('user')
        .then(favorites => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites)
        })
       .catch(err => next(err));          
     })
     .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({user: req.user._id })  // Find current users favorites
        .then(favorite => {
          if (favorite) {     // check if user currently has any favorites
            req.body.forEach(reqEl => {   // check if any chosen favorites already exist
              if (favorite.campsites.every(favEl => reqEl._id != favEl)) {
                favorite.campsites.push(reqEl);    // no duplicates, add campsite to favorites list
              } else console.log(`${reqEl._id} already added as favorite`);
            });
            favorite.save()   // update favorites document in db
            .then(favorite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            }, (err) => next(err));
          }
          else {          // user has no favorites, create new favorite document
            Favorite.create({"user": req.user._id, "campsites": req.body})
            .then(favorite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            }, (err) => next(err));
          }
        }, (err) => next(err))   
        .catch(err => next(err));  
     })
     .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
       res.statusCode = 403;
       res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
     })
     .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
       Favorite.findOneAndDelete({user: req.user._id })  // Find current users favorites, and delete doc
       .then(response => {
         res.statusCode = 200;
         res.setHeader('Content-Type', 'application/json');
         res.json(response);
       })
       .catch(err => next(err));           
     });
 

// Specific Favorite
favoriteRouter.route(`/:campsiteId`)
.options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    Favorite.findOne({user: req.user._id })  // Find current users favorites
    .then(favorite => {
      if (favorite) {     // check if user currently has any favorites
        if (favorite.campsites.every(el => req.params.campsiteId != el)) {
          favorite.campsites.push(req.params.campsiteId);    // no duplicates, add campsite to favorites list
        } else console.log(`${reqEl._id} already in the list of favorites!`);       
        favorite.save()   // update favorites document in db
        .then(favorite => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        }, (err) => next(err));
      }
      else {          // user has no favorites, create new favorite document
        Favorite.create({"user": req.user._id, "campsites": [req.params.campsiteId]})
        .then(favorite => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        }, (err) => next(err));
      }
    }, (err) => next(err))   
    .catch(err => next(err));  
 })

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    Favorite.findOne({user: req.user._id })  // Find current users favorites
    .then(favorite => {
      if (favorite) {
        let indexToDelete = favorite.campsites.indexOf(req.params.campsiteId);
        if (indexToDelete < 0 ) {
          console.log(`${req.params.campsiteId} is not in the list of favorites!`);
        } else { 
          favorite.campsites.splice(indexToDelete, 1);  // delete favorite
          favorite.save()   // update favorites document in db
          .populate('user')
          .populate('favorites.campsites')
          .then(favorite => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          }, (err) => next(err));
        } 
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
      }  
    }).catch(err => next(err)); 
});

 module.exports = favoriteRouter;