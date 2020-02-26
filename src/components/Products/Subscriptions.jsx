import React from "react";

export default () => {
  return (
    <div>
      <h2>Payment Plan</h2>
      <p>4 payments of $50, charged every 2 weeks</p>
      <form
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="CTS8KQZY829NC" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif"
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
      <h2>Old Boys: Netflix for Rugby</h2>
      <p>$35/month: the team will CIPP you. Come play whenever you want.</p>
      <p>Any time we order new warmup shirts, you get one</p>
      <form
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        target="_top"
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="EXCKEC58MFZKW" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif"
          border="0"
          name="Pay Dues"
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
