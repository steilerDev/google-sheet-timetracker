import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const BACKEND = require('../../../config/config').backend_url;

export default () => {
  let { uid } = useParams();
  const [userInfo, setuserInfo] = useState();
  const [isLoading, setLoading] = useState(false);
  const today = new Date();

  const [work, setWork] = useState([]);

  if (!userInfo) {
    fetch(`${BACKEND}/users/${uid}`)
      .then(resp => resp.json())
      .then(resp => setuserInfo(resp));
  }

  const handleClick = () => {
    if (work.length !== 0) {
      setLoading(true);
    } else {
      alert("Du musst eine Tätigkeit auswählen");
    }
  };

  useEffect(() => {
    if (isLoading) {
      axios
        .post(`${BACKEND}/users/${uid}`, work)
        .then(res => setLoading(false))
        .catch(err => alert("Es ist ein Fehler aufgetreten"));
    }
  }, [isLoading]);

  const handleInputChange = event => {
    const target = event.target;
    const arr = [...work];
    if (!target.checked && work.includes(target.id)) {
      arr.splice(arr.indexOf(target.id));
    } else if (target.checked && !work.includes(target.id)) {
      arr.push(target.id);
    }
    setWork(arr);
  };

  return (
    <div>
      <Link to="/">
        <FontAwesomeIcon icon={faArrowLeft} /> Zurück zur Namensauswahl
      </Link>
      <hr />
      <h2>{userInfo ? userInfo.firstName + " " + userInfo.lastName : ""}</h2>
      <h5>
        {today.getDate()}.{today.getMonth() + 1}.{today.getFullYear()}
      </h5>
      <br />
      <Form.Group controlId="name">
        <Form.Label>Heutige Tätigkeit eintragen:</Form.Label>

        <Form.Check
          id="errands"
          label="Besorgungen"
          onChange={handleInputChange}
        />
        <Form.Check
          id="catering"
          label="Verpflegung"
          onChange={handleInputChange}
        />
        <Form.Check id="work" label="Arbeit" onChange={handleInputChange} />
        <br />
        <Button
          variant="primary"
          disabled={isLoading}
          onClick={!isLoading ? handleClick : null}
        >
          {isLoading ? "Lädt..." : "Eintragen"}
        </Button>
      </Form.Group>
      <hr />
      <Link to={`/users/${uid}/work`}>Alle meine Tätigkeiten anzeigen</Link>
    </div>
  );
};
