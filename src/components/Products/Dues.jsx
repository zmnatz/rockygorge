import React from "react";

export default () => {
  return (
    <div>
      <h2>Spring Dues: $100</h2>
      <p>
        Dues for the Spring are $100. This helps pay for insurance, fields, referees, and equipment. A Paypal account is not required. If you don't have one click "Pay with Debit or Credit Card"
      </p>
      <p>Pay your dues!</p>
      <form
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="FFP2DBEXTBWL8" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif"
          border="0"
          name="submit"
          alt="PayPal - The safer, easier way to pay online!"
        />
        <img
          alt=""
          border="0"
          src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif"
          width="1"
          height="1"
        />
      </form>
      <h2>GOD Donations</h2>
      <p>
        Your club needs you. Help out Rocky Gorge Rugby and donate today. Your
        donation lets Rocky Gorge buy new equipment, rent fields and help the
        club grow. Donate today to lord your contributions over lesser GODS and
        gloat to the young whippersnappers about how you saved their butts.
      </p>
      <form
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="UAHLMT3W9ABYQ" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
          border="0"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Donate with PayPal button"
        />
        <img
          alt=""
          border="0"
          src="https://www.paypal.com/en_US/i/scr/pixel.gif"
          width="1"
          height="1"
        />
      </form>
    </div>
  );
};
