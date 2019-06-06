import React from "react";
import { Link } from "@reach/router";
export default () => (
  <form
    default
    path="/"
    action="https://www.paypal.com/cgi-bin/webscr"
    method="post"
    target="_top"
  >
    <input type="hidden" name="cmd" value="_s-xclick" />
    <input type="hidden" name="hosted_button_id" value="YLEJB8UF5F3GY" />
    <table>
      <tbody>
        <tr>
          <td>
            <input type="hidden" name="on0" value="Price Options" />
            Price Options
          </td>
        </tr>
        <tr>
          <td>
            <select name="os0">
              <option value="1 Team">1 Team $225.00 USD</option>
              <option value="2 Teams">2 Teams $400.00 USD</option>
              <option value="3 Teams">3 Teams $600.00 USD</option>
              <option value="High School Team">
                High School Team $100.00 USD
              </option>
            </select>{" "}
          </td>
        </tr>
        <tr>
          <td>
            <input type="hidden" name="on1" value="Team Name" />
            Team Name
          </td>
        </tr>
        <tr>
          <td>
            <input type="text" name="os1" maxLength="200" />
          </td>
        </tr>
        <tr>
          <td>
            <input type="hidden" name="on2" value="Contact Email" />
            Contact Email
          </td>
        </tr>
        <tr>
          <td>
            <input type="text" name="os2" maxLength="200" />
          </td>
        </tr>
      </tbody>
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
    <p>
      <Link to="/store/register">Register now</Link> and pay later
    </p>
  </form>
);
