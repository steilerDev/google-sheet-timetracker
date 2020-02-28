import React, { useState } from "react";
import { ListGroup } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestion,
  faTimes,
  faCheck,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";

export default () => {
  let { uid } = useParams();
  const [work, setWork] = useState();

  if (!work) {
    fetch("http://localhost:3000/users/" + uid)
      .then(resp => resp.json())
      .then(resp => setWork(resp));
  }

  return (
    <div>
      <Link to={`/users/${uid}`}>
        <FontAwesomeIcon icon={faArrowLeft} /> Zurück zum Eintragen
      </Link>
      <hr />
      {work?.dataEntries.map(w => (
        <ListGroup.Item
          key={w.id}
          variant={
            w.status === "confirmed"
              ? "success"
              : w.status === "rejected"
              ? "danger"
              : "secondary"
          }
        >
          {w.status === "confirmed" ? (
            <FontAwesomeIcon icon={faCheck} />
          ) : w.status === "rejected" ? (
            <FontAwesomeIcon icon={faTimes} />
          ) : (
            <FontAwesomeIcon icon={faQuestion} />
          )}{" "}
          {w.entryDate.date}.{w.entryDate.month}.{w.entryDate.year} -{" "}
          {w.type === "errands"
            ? "Besorgungen"
            : w.type === "catering"
            ? "Verpflegung"
            : w.type === "work"
            ? "Arbeit"
            : "UNBEKANNT"}
        </ListGroup.Item>
      ))}
      {work ? (work.dataEntries.length === 0 ? "Kein Eintrag" : "") : ""}
    </div>
  );
};
