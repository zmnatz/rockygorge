import React from "react";

export default () => {
  return (
    <div>
      <h2>Hall of Fame Banquet</h2>
      <div>Saturday, April 18</div>
      <div>Time: 7:00 PM to 11:00 PM</div>
      <div>Location: Stonehouse - 8775 Cloudleap Ct, Columbia, MD 21045</div>
      <form
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="27RNPWEG2K8DJ" />
        <table>
          <tr>
            <td>
              <input type="hidden" name="on0" value="Options" />
              Options
            </td>
          </tr>
          <tr>
            <td>
              <select name="os0">
                <option value="Couple">Couple $100.00 USD</option>
                <option value="Individual">Individual $50.00 USD</option>
              </select>{" "}
            </td>
          </tr>
          <tr>
            <td>
              <input type="hidden" name="on1" value="Your Name:" />
              Your Name:
            </td>
          </tr>
          <tr>
            <td>
              <input type="text" name="os1" maxlength="200" />
            </td>
          </tr>
          <tr>
            <td>
              <input type="hidden" name="on2" value="Date's Name:" />
              Date's Name:
            </td>
          </tr>
          <tr>
            <td>
              <input type="text" name="os2" maxlength="200" />
            </td>
          </tr>
        </table>
        <input type="hidden" name="currency_code" value="USD" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_paynowCC_LG.gif"
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
    </div>
  );
};
