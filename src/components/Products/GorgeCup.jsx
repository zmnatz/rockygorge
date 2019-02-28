import React from 'react'
export default () => (
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_s-xclick" />
    <input type="hidden" name="hosted_button_id" value="M4JY8HCQ3LMAN" />
    <table>
      <tbody>
        <tr>
          <td>
            <input type="hidden" name="on0" value="Team Name" />
            Team Name
        </td>
        </tr>
        <tr>
          <td>
            <input type="text" name="os0" maxLength="200" />
          </td>
        </tr>
        <tr>
          <td>
            <input type="hidden" name="on1" value="Email Address" />
            Email Address
        </td>
        </tr>
        <tr>
          <td><input type="text" name="os1" maxLength="200" /></td>
        </tr>
      </tbody>
    </table>
    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_paynow_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!" />
    <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1" />
  </form>
)