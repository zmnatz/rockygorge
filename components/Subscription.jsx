export function Subscription({id, options, name, description, value = ''}) {
  return <>
    <h3>{name}</h3>
    <p>{description}</p>
    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
      <input type="hidden" name="cmd" value="_s-xclick"/>
      <input type="hidden" name="hosted_button_id" value={id}/>
      <input type="hidden" name="on0" value={value}/>
      <div>
        <select name="os0" title="Choose a subscription">
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select> 
      </div>
      <input type="hidden" name="currency_code" value="USD"/>
      <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"/>
      <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"/>
    </form>
    <br/>
  </>
}