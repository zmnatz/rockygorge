import React from 'react';

interface SubscriptionOption {
  label: string;
  value: string;
}

interface SubscriptionProps {
  id: string;
  options: SubscriptionOption[];
  name: string;
  description: string;
  value?: string;
}

export function Subscription({ id, options, name, description, value = '' }: SubscriptionProps): JSX.Element {
  return (
    <>
      <h3>{name}</h3>
      <p>{description}</p>
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value={id} />
        <table>
          <tr>
            <td>
              <input type="hidden" name="on0" value={value} />
            </td>
          </tr>
          <tr>
            <td>
              <select name="os0">
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        </table>
        <input type="hidden" name="currency_code" value="USD" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif"
          name="submit"
          alt="PayPal - The safer, easier way to pay online!"
        />
        <img
          alt=""
          src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif"
          width="1"
          height="1"
        />
      </form>
      <br />
    </>
  );
}