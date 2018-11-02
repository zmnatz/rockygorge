import React, { Component } from 'react';
import {Container, Header, Segment, List, Form} from 'semantic-ui-react'

class App extends Component {
  render() {
    return (
      <div className="App">
        <Container>
          <Segment
            inverted
            textAlign='center'
            style={{ minHeight: 700, padding: '1em 0em' }}
            vertical
          >
            <Header as="h1" inverted>Rocky Gorge Rugby</Header>
            <Header as="h2" inverted>Hall of Fame Banquet</Header>
            <img src="images/banquet.png" alt="Banquet Banner" width="400px"/>
            <Header as="h4" inverted>November 10 | @ Nottingham's</Header>
            <List>
              <List.Item>Cocktail Hour</List.Item>
              <List.Item>Dinner</List.Item>
              <List.Item>Hall of Fame Ceremony</List.Item>
              <List.Item>More Details to Come</List.Item>
            </List>
          
          
            <Header>Buy your tickets now!</Header>
            {/* <Form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
              <Form.Input type="hidden" name="cmd" value="_s-xclick"/>
              <Form.Input type="hidden" name="hosted_button_id" value="27RNPWEG2K8DJ"/>
              <Form.Input type="hidden" name="on0" value="Options"/>
              <Form.Dropdown name="os0" label="Options" options={['1 Person and 1 Date', '1 Person']}/>
              <Form.Input type="hidden" name="on1" value="Your Name:"/>
              <Form.Input name="os1" maxlength="200" label="Your Name"/>
              <Form.Input type="hidden" name="on2" value="Date Name:"/>
              <Form.Input name="os2" maxlength="200" label="Date Name"/>
              <Form.Input type="hidden" name="currency_code" value="USD"/>
              <Form.Input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"/>
              <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"/>
            </Form> */}
            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
              <input type="hidden" name="cmd" value="_s-xclick"/>
              <input type="hidden" name="hosted_button_id" value="27RNPWEG2K8DJ"/>
              <table width="100%">
                <tr><td>
                  <input type="hidden" name="on0" value="Options"/>Options
                </td></tr>
                <tr><td>
                  <select name="os0">
                    <option value="1 Person and 1 Date">1 Person and 1 Date $110.00 USD</option>
                    <option value="1 Person">1 Person $55.00 USD</option>
                  </select> 
                </td></tr>
                <tr><td>
                  <input type="hidden" name="on1" value="Your Name:"/>Your Name:
                </td></tr>
                <tr><td>
                  <input type="text" name="os1" maxlength="200"/>
                </td></tr>
                <tr><td>
                  <input type="hidden" name="on2" value="Date Name:"/>Date Name:
                </td></tr>
                <tr><td>
                  <input type="text" name="os2" maxlength="200"/>
                </td></tr>
              </table>
              <input type="hidden" name="currency_code" value="USD"/>
              <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"/>
              <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"/>
            </form>

          </Segment>
        </Container>
      </div>
    );
  }
}

export default App;