import React, { useState } from "react";
import { Form, Button, ListGroup } from "react-bootstrap";
import { useParams } from "react-router-dom";

export default () => {
  let { uid } = useParams();
  const [work, setWork] = useState();

  if (!work) {
    fetch("http://localhost:3000/users/" + uid)
      .then(resp => resp.json())
      .then(resp => setWork(resp));
  } else {
    console.log(work.dataEntries);
  }

  return (
    <div>
      <Form.Group controlId="name">
        <Form.Label>Arbeit</Form.Label>
        {["errands", "catering", "work"].map(type => (
          <Form.Check type="radio" id={`test`} label={type} />
        ))}
        <Button>Eintragen</Button>
      </Form.Group>

      <ListGroup>
        <ListGroup.Item>Deine bisherigen Arbeiten</ListGroup.Item>

        {work?.dataEntries.map(w => (
          <ListGroup.Item
            variant={
              w.status === "confirmed"
                ? "success"
                : w.status === "rejected"
                ? "danger"
                : "secondary"
            }
          >
            {w.entryDate.date}.{w.entryDate.month}.{w.entryDate.year} - {w.type}{" "}
            - {w.status}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};
