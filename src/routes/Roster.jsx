import React, { useEffect, useState } from "react";

async function getRoster() {
  try {
    const response = await fetch("/api/roster");
    return await response.text();
  } catch (e) {
    console.info("unable to retrieve roster");
    return "";
  }
}

export default () => {
  const [roster, setRoster] = useState("");

  useEffect(() => {
    getRoster().then(setRoster);
  }, []);
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: roster
      }}
    />
  );
};
