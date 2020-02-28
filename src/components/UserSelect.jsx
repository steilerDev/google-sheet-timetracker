import React, { useState } from "react";
import { Form } from "react-bootstrap";

import { useHistory } from "react-router-dom";

export default () => {
  const [users, setUsers] = useState();
  let history = useHistory();

  if (!users) {
    fetch("http://localhost:3000/users")
      .then(resp => resp.json())
      .then(resp => setUsers(resp));
  }

  const onChange = uid => {
    history.push("/users/" + uid);
  };

  return (
    <div>
      <h2>Strichliste</h2>
      <Form.Control
        as="select"
        option="2"
        onChange={e => onChange(e.target.value)}
        value="default"
      >
        <option disabled value="default">
          Wähle deinen Namen
        </option>
        {users
          ? users.map(user => (
              <option value={user.uid} key={user.uid}>
                {user.firstName} {user.lastName}
              </option>
            ))
          : ""}
      </Form.Control>
    </div>
  );
};
