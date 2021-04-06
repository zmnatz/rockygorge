import React, { useEffect } from "react";

export default () => {
  useEffect(() => {
    fetch("/api/roster")
      .then((response) => console.log(response))
      .catch((e) => console.log(e));
  }, []);
  return <div></div>;
};
