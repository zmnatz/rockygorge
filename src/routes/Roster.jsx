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
    <>
      <p>
        Not on the list?{" "}
        <a
          href="https://usarugby.sportlomo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to register
        </a>
        .
      </p>
      <div
        dangerouslySetInnerHTML={{
          __html: roster
        }}
      />
    </>
  );
};
