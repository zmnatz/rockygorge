/* globals paypal */
import React, { useLayoutEffect } from "react";

export default () => {
  useLayoutEffect(() => {
    paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "blue",
          layout: "vertical",
          label: "paypal"
        },
        createOrder: (data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: "200"
                }
              }
            ]
          }),
        onApprove: function(data, actions) {
          return actions.order
            .capture()
            .then(details =>
              alert(
                `Thank you for paying your dues ${
                  details.payer.name.given_name
                }. Transaction completed.`
              )
            );
        }
      })
      .render("#paypal-button-container");
  }, []);
  return (
    <div>
      <h2>Spring Dues: $200</h2>
      <p>
        Dues for the Spring are $200. This helps pay for player registration,
        insurance, fields and referees as well as equipment.
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
