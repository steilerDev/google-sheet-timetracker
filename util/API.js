const express = require('express');
const bodyParser = require('body-parser');

class API {
    constructor(dataProvider, conf, log) {
        this._api = express();
        this._log = log;
        this._conf = conf;
        this._dataProvider = dataProvider;

        this._api.use(bodyParser.json());
        this._initRoutes();
    }

    listen() {
        this._api.listen(this._conf.port, (err) => {
            if(err) {
                this._log.fatal(`Unable to start web server: ${err}`);
                throw new Error(`Unable to start web server: ${err}`);
            } else {
                this._log.info(`Web server is listening on port ${this._conf.port}`);
            }
        });
    }

    _initRoutes() {
        this._log.debug(`Initializing routes for API...`);
        /**
         * Static content within the 'html' folder is served to the root of the webserver
         */
        this._api.use('/', express.static('html'));

        /**
         * Method: GET
         * URI: /users
         * Returns: A JSON array, containing the available users:
         *      [
         *          {
         *              firstName: firstName,
         *              lastName: lastName,
         *              uid: uid
         *              status: status, //currently always 'active'
         *              signUpDate: {
         *                  day: day,
         *                  month: month,
         *                  year: year
         *              }
         *          },
         *          ...
         *      ]
         */
        this._api.get('/users', this._getUsers.bind(this));

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
        this._api.get('/user/:uid', this._getUser.bind(this));

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
        this._api.post('/user/:uid', this._createEntry.bind(this));

        this._log.debug(`API routes successfully initialized!`);
    }

    _getUsers(req, res) {
        this._log.debug(`Getting all users...`);
        let users = this._dataProvider.getUsers();
        this._log.info(`Transmitting all user (${users.length})`);
        res.status(200);
        res.send(JSON.stringify(users));
    }

    _getUser(req, res) {
        try {
            this._log.debug(`Getting user by ID...`);
            if(req.params.uid) {
                let user = this._dataProvider.getUser(req.params.uid);
                this._log.info(`Transmitting user ${user.toString()}`);
                res.status(200);
                res.send(user.toJSON());
            } else {
                this._log.error(`Unable to get user, ID parameter is missing: ${JSON.stringify(req.params)}`);
                res.status(400);
                res.send({
                    "status": "error",
                    "message": "ID parameter is missing"
                });
            }
        } catch (err) {
            this._log.error(`Unable to get user with ID ${req.params.uid}: ${err.message}`);
            res.status(404);
            res.send({
                "status": "error",
                "message": err.message
            });
        }
    }

    _createEntry(req, res) {
        this._log.debug(`Creating new entry...`);
        if(Array.isArray(req.body)) {
            const types = req.body.filter(item => item === "errands" || item === "work" || item === "catering");
            if(types.length > 0) {
                try {
                    this._log.debug(`Getting user by ID...`);
                    if(req.params.uid) {
                        let user = this._dataProvider.getUser(req.params.uid);
                        user.createEntry(types);
                        this._log.info(`Successfully created new entry of type ${types} for user ${user.toString()}`);
                        res.status(200);
                        res.send({"status": "success"});
                    } else {
                        this._log.error(`Unable to get user, ID parameter is missing: ${JSON.stringify(req.params)}`);
                        res.status(400);
                        res.send({
                            "status": "error",
                            "message": "ID parameter is missing"
                        });
                    }
                } catch (err) {
                    this._log.error(`Unable to create new entry of type ${types}: ${err.message}`);
                    res.status(500);
                    res.send({
                        "status": "error",
                        "message": err.message
                    });
                }
            } else {
                this._log.error(`Unable to create new entry, no type(s) defined`);
                res.status(400);
                res.send({
                    "status": "error",
                    "message": "No type specified"
                });
            }
        } else {
            this._log.error(`Unable to create new entry, no array specified`);
            res.status(400);
            res.send({
                "status": "error",
                "message": "No array specified"
            });
        }
    }
}

module.exports = { API };