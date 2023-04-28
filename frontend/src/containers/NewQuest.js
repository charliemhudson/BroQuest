import React, { useRef, useState } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../lib/errorLib";
import { useAppContext } from "../lib/contextLib";
import { useFormFields } from "../lib/hooksLib";
import config from "../config";
import "./NewQuest.css";

export default function NewQuest() {
  const file = useRef(null);
  const nav = useNavigate();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [storyDetails, setStoryDetails] = useFormFields({
    title: "",
    genre: "",
    additionalDetails: "",
    playerCount: 2,
    characters: [
      {
        name: "",
        description: "",
      },
      {
        name: "",
        description: "",
      },
    ],
  });

  function validateForm() {
    return (
      storyDetails.title.length > 0 &&
      storyDetails.genre.length > 0 &&
      storyDetails.additionalDetails.length > 0 &&
      storyDetails.playerCount > 0
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);

    try {
      await createQuest(storyDetails);
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function createQuest(quest) {
    return API.post("quests", "/quests", {
      body: quest,
      timeout: 120000, //2 Minute
    });
  }

  return (
    <div className="NewQuest">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            autoFocus
            placeholder="Enter a title for your quest here."
            type="text"
            value={storyDetails.title}
            onChange={setStoryDetails}
          />
        </Form.Group>
        <Form.Group controlId="genre">
          <Form.Label>Genre</Form.Label>
          <Form.Control
            placeholder="Enter a genre for your quest here."
            type="text"
            value={storyDetails.genre}
            onChange={setStoryDetails}
          />
        </Form.Group>
        <Form.Group controlId="additionalDetails">
          <Form.Label>Additional Details</Form.Label>
          <Form.Control
            type="textarea"
            value={storyDetails.additionalDetails}
            placeholder="Enter some additional details about your quest here."
            onChange={setStoryDetails}
          />
        </Form.Group>
        <br />
        <br />

        <Form.Group controlId="characters.0.name">
          <Form.Label>Character 1 - Name</Form.Label>
          <Form.Control
            type="textarea"
            value={storyDetails.characters[0].name}
            placeholder="Enter a name for your first character here."
            onChange={setStoryDetails}
          />
        </Form.Group>
        <Form.Group controlId="characters.0.description">
          <Form.Label>Character 1 - Description</Form.Label>
          <Form.Control
            type="textarea"
            value={storyDetails.characters[0].description}
            placeholder="Enter a description for your first character here."
            onChange={setStoryDetails}
          />
        </Form.Group>
        <br />
        <br />

        <Form.Group controlId="characters.1.name">
          <Form.Label>Character 2 - Name</Form.Label>
          <Form.Control
            type="textarea"
            value={storyDetails.characters[1].name}
            placeholder="Enter a name for your second character here."
            onChange={setStoryDetails}
          />
        </Form.Group>
        <Form.Group controlId="characters.1.description">
          <Form.Label>Character 2 - Description</Form.Label>
          <Form.Control
            type="textarea"
            value={storyDetails.characters[1].description}
            placeholder="Enter a description for your second character here."
            onChange={setStoryDetails}
          />
        </Form.Group>

        <LoaderButton
          block="true"
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
      </Form>
    </div>
  );
}
