import React, { useRef, useState, useEffect } from "react";
import { Form, Accordion, Card, Button } from "react-bootstrap";
import { API, Storage } from "aws-amplify";
import { useParams, useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../lib/errorLib";
import config from "../config";
import "./Quests.css";

export default function Quests() {
  const { id } = useParams();
  const nav = useNavigate();
  const [quest, setQuest] = useState(null);
  const [nextMove, setNextMove] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const sectionsRef = useRef([]);

  useEffect(() => {
    function loadQuest() {
      return API.get("quests", `/quests/${id}`);
    }

    async function onLoad() {
      try {
        const quest = await loadQuest();
        setQuest(quest);
        console.log(quest);
        sectionsRef.current = quest.chapters.map((chapter) =>
          renderSection(chapter)
        );
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  const renderSection = (chapter) => {
    const contId = "Chapter " + chapter.chapterNumber;
    const parsedText = chapter.text
      .split("\n")
      .map((str, index) => <p key={index}>{str}</p>);

    return (
      <React.Fragment key={chapter.chapterNumber}>
        <h2>{contId}</h2>
        {parsedText}
      </React.Fragment>
    );
  };

  function validateForm() {
    return nextMove.length > 0;
  }

  function saveQuest(quest) {
    return API.put("quests", `/quests/${id}`, {
      body: quest,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);

    try {
      await saveQuest({
        ...quest,
        nextMove,
      });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function deleteQuest() {
    return API.del("quests", `/quests/${id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this quest?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteQuest();
      nav("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Quests">
      {quest && (
        <>
          <Accordion>
            <Accordion.Header>Story Details</Accordion.Header>

            <Accordion.Body>
              <Form>
                <Form.Group controlId="title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    autoFocus
                    placeholder="Enter a title for your quest here."
                    type="text"
                    value={quest.title}
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <Form.Group controlId="genre">
                  <Form.Label>Genre</Form.Label>
                  <Form.Control
                    placeholder="Enter a genre for your quest here."
                    type="text"
                    value={quest.genre}
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <Form.Group controlId="additionalDetails">
                  <Form.Label>Additional Details</Form.Label>
                  <Form.Control
                    type="textarea"
                    value={quest.additionalDetails}
                    placeholder="Enter some additional details about your quest here."
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <br />
                <br />

                <Form.Group controlId="characters.0.name">
                  <Form.Label>Character 1 - Name</Form.Label>
                  <Form.Control
                    type="textarea"
                    value={quest.characters[0].name}
                    placeholder="Enter a name for your first character here."
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <Form.Group controlId="characters.0.description">
                  <Form.Label>Character 1 - Description</Form.Label>
                  <Form.Control
                    autoFocus
                    type="textarea"
                    value={quest.characters[0].description}
                    placeholder="Enter a description for your first character here."
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <br />
                <br />

                <Form.Group controlId="characters.1.name">
                  <Form.Label>Character 2 - Name</Form.Label>
                  <Form.Control
                    autoFocus
                    type="textarea"
                    value={quest.characters[1].name}
                    placeholder="Enter a name for your second character here."
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
                <Form.Group controlId="characters.1.description">
                  <Form.Label>Character 2 - Description</Form.Label>
                  <Form.Control
                    autoFocus
                    type="textarea"
                    value={quest.characters[1].description}
                    placeholder="Enter a description for your second character here."
                    onChange={setQuest}
                    disabled
                  />
                </Form.Group>
              </Form>
            </Accordion.Body>
          </Accordion>

          {sectionsRef.current}

          <br />
          <Form onSubmit={handleSubmit}>
            <br />
            <Form.Group controlId="nextMove">
              <Form.Control
                autoFocus
                placeholder="Take your next move."
                type="text"
                value={nextMove}
                onChange={(e) => setNextMove(e.target.value)}
              />
            </Form.Group>
            <LoaderButton
              block="true"
              size="lg"
              type="submit"
              isLoading={isLoading}
              disabled={!validateForm()}
            >
              Submit
            </LoaderButton>
            <LoaderButton
              className="ms-3"
              block="true"
              size="lg"
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </LoaderButton>
          </Form>
        </>
      )}
    </div>
  );
}
