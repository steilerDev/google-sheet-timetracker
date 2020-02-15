const { DataProvider } = require('./util/DataProvider');
const express = require('express');
const bodyParser = require('body-parser');

const conf = require('./config/config.json');
const credentials = require('./config/credentials.json');
const package = require('./package.json');

const log = require('simple-node-logger').createSimpleLogger();
if(conf.debug) {
    log.setLevel('debug');
} else {
    log.setLevel('info');
}

log.info(`Welcome to ${package.name} by ${package.author.name} (${package.author.email}) v. ${package.version}`);

const dataProvider = new DataProvider(conf, credentials, log);

const api = express();
api.use(bodyParser.json());

/**
 * Static content within the 'html' folder is served to the root of the webserver
 */
api.use('/', express.static('html'));

/**
 * Method: GET
 * URI: /users
 * Returns: A JSON array, containing the available users:
 *      [
 *          {
 *              firstName: firstName,
 *              lastName: lastName,
 *              uid: uid
 *          },
 *          ...
 *      ]
 */
api.get('/users', (req, res) => {
    res.send(dataProvider.getUsers());
});

/**
 * Method: GET
 * URI: /user/${id}
 * Returns: A JSON object, containing all data related to the specified user:
 *      {
 *          firstName: firstName,
 *          lastName: lastName,
 *          uid: uid,
 *          status: status, //currently always 'active'
 *          signUpDate: {
 *              day: day,
 *              month: month,
 *              year: year
 *          },
 *          dataEntries: [
 *              {
 *                  date: {
 *                      day: day,
 *                      month: month,
 *                      year: year
 *                  },
 *                  type: type,
 *                  confirmed: [true | false]
 *              },
 *              ...
 *          ]
 *      }
 */
api.get('/user/:uid', (req, res) => {
    try {
        res.send(dataProvider.getUser(req.params.uid));
    } catch (err) {
        log.warn(`Unable to get user with ID ${req.params.uid}: ${err.message}`);
        res.status(404);
        res.send({
            "status": "error",
            "message": err.message
        });
    }
});

/**
 * Method: POST
 * URI: /user/${id}
 * Body: An array of types. Allowed item types "errands", "work", "catering":
 *      [ 'errands', 'work' ]
 * Returns: A JSON object, specifying success:
 *      { "status": "success" }
 * or a JSON object specifying error:
 *      { "status": "error", "message": "error message"}
 */
api.post('/user/:uid', (req, res) => {
    if(Array.isArray(req.body)) {
        const types = req.body.filter(item => item === "errands" || item === "work" || item === "catering");
        if(types.length > 0) {
            try {
                dataProvider.createEntry(req.params.uid, types);
                res.status(200);
                res.send({"status": "success"});
            } catch (err) {
                res.status(500);
                res.send({
                    "status": "error",
                    "message": err.message
                });
            }
        } else {
            res.status(400);
            res.send({
                "status": "error",
                "message": "No type specified"
            });
        }
    } else {
        res.status(400);
        res.send({
            "status": "error",
            "message": "No array specified"
        });
    }
});

api.listen(conf.port, (err) => {
    if(err) {
        log.fatal(`Web server error: ${err}`);
    } else {
        log.info(`Web server is listening on port ${conf.port}`);
    }
});
