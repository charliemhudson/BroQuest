import { useState } from "react";

export function useFormFields(initialState) {
  const [fields, setValues] = useState(initialState);

  return [
    fields,
    function (event) {
      const { id, value } = event.target;
      const keys = id.split(".");

      setValues((prevState) => {
        const newState = { ...prevState };

        if (keys.length === 1) {
          newState[id] = value;
        } else if (keys.length === 2) {
          newState[keys[0]] = { ...prevState[keys[0]] };
          newState[keys[0]][keys[1]] = value;
        } else if (keys.length === 3) {
          newState[keys[0]] = [...prevState[keys[0]]];
          newState[keys[0]][keys[1]] = { ...prevState[keys[0]][keys[1]] };
          newState[keys[0]][keys[1]][keys[2]] = value;
        }

        return newState;
      });
    },
  ];
}
