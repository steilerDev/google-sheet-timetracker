import React from "react";
import "./App.css";
import Logo from "./logo.png";

import UserSelect from "./components/UserSelect";
import WorkSelect from "./components/WorkSelect";
import WorkList from "./components/WorkList";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

export default () => {
  return (
    <Router>
      <div>
        <div className="div-center">
          <div className="content">
            <img src={Logo} alt="Logo" className="logo" />
            <Switch>
              <Route exact path="/users/:uid">
                <WorkSelect />
              </Route>
              <Route exact path="/users/:uid/work">
                <WorkList />
              </Route>
              <Route exact path="/">
                <UserSelect />
              </Route>
            </Switch>
          </div>
        </div>
      </div>
    </Router>
  );
};
